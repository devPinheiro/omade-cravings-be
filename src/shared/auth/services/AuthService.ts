import { User, UserRole } from '../../../models/User';
import { LoyaltyPoints } from '../../../models/LoyaltyPoints';
import { 
  IAuthService, 
  RegisterRequest, 
  LoginRequest, 
  SocialAuthRequest, 
  ChangePasswordRequest, 
  AuthResult, 
  SocialAuthResult 
} from '../interfaces/IAuthService';
import { ITokenService, TokenPair } from '../interfaces/ITokenService';
import { IPasswordService } from '../interfaces/IPasswordService';
import { AuthError, AuthErrorCode } from '../errors/AuthErrors';
import { AuthConfig } from '../config/AuthConfig';

export class AuthService implements IAuthService {
  constructor(
    private readonly tokenService: ITokenService,
    private readonly passwordService: IPasswordService
  ) {}

  public async register(data: RegisterRequest): Promise<AuthResult> {
    try {
      // Validate input
      this.validateRegistrationData(data);

      // Check if user already exists
      const existingUser = await User.findOne({
        where: { email: data.email.toLowerCase() }
      });

      if (existingUser) {
        throw AuthError.userAlreadyExists('Email already registered');
      }

      // Check phone uniqueness if provided
      if (data.phone) {
        const existingPhone = await User.findOne({
          where: { phone: data.phone }
        });

        if (existingPhone) {
          throw AuthError.userAlreadyExists('Phone number already registered');
        }
      }

      // Hash password
      const hashedPassword = await this.passwordService.hashPassword(data.password);

      // Create user with sanitized input
      const user = await User.create({
        name: this.sanitizeInput(data.name.trim()),
        email: data.email.toLowerCase().trim(),
        password_hash: hashedPassword,
        role: UserRole.CUSTOMER,
        phone: data.phone?.trim(),
      } as any);

      // Create loyalty points account
      await LoyaltyPoints.create({
        user_id: user.id,
        points: 0,
      } as any);

      // Generate tokens
      const tokens = await this.tokenService.generateTokenPair(
        user.id,
        user.email,
        user.role
      );

      return {
        user: this.sanitizeUser(user),
        tokens,
      };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(AuthErrorCode.REGISTRATION_FAILED, 'Registration failed', 500, { originalError: error instanceof Error ? error.message : String(error) });
    }
  }

  public async login(data: LoginRequest): Promise<AuthResult> {
    try {
      // Validate input
      this.validateLoginData(data);

      // Find user
      const user = await User.findOne({
        where: { email: data.email.toLowerCase() }
      });

      if (!user) {
        throw AuthError.invalidCredentials();
      }

      // Verify password
      const isPasswordValid = await this.passwordService.verifyPassword(
        data.password,
        user.password_hash
      );

      if (!isPasswordValid) {
        throw AuthError.invalidCredentials();
      }

      // Generate tokens
      const tokens = await this.tokenService.generateTokenPair(
        user.id,
        user.email,
        user.role
      );

      return {
        user: this.sanitizeUser(user),
        tokens,
      };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(AuthErrorCode.LOGIN_FAILED, 'Login failed', 500, { originalError: error instanceof Error ? error.message : String(error) });
    }
  }

  public async socialAuth(data: SocialAuthRequest): Promise<SocialAuthResult> {
    try {
      // Validate provider
      if (!['google', 'apple', 'facebook'].includes(data.provider)) {
        throw AuthError.socialAuthFailed('Invalid provider');
      }

      // Get user profile from social provider
      const socialProfile = await this.getSocialProfile(data.provider, data.access_token);
      
      // Check if user exists
      let user = await User.findOne({
        where: { email: socialProfile.email.toLowerCase() }
      });

      let isNewUser = false;

      if (!user) {
        // Create new user
        user = await User.create({
          name: socialProfile.name,
          email: socialProfile.email.toLowerCase(),
          password_hash: await this.passwordService.hashPassword(
            this.passwordService.generateSecurePassword()
          ),
          role: UserRole.CUSTOMER,
          phone: socialProfile.phone,
        } as any);

        // Create loyalty points account
        await LoyaltyPoints.create({
          user_id: user.id,
          points: 0,
        } as any);

        isNewUser = true;
      }

      // Generate tokens
      const tokens = await this.tokenService.generateTokenPair(
        user.id,
        user.email,
        user.role
      );

      return {
        user: this.sanitizeUser(user),
        tokens,
        isNewUser,
      };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw AuthError.socialAuthFailed(data.provider, { originalError: error instanceof Error ? error.message : String(error) });
    }
  }

  public async refreshToken(refreshToken: string): Promise<TokenPair> {
    return await this.tokenService.refreshAccessToken(refreshToken);
  }

  public async logout(userId: string): Promise<void> {
    await this.tokenService.revokeToken(userId);
  }

  public async changePassword(data: ChangePasswordRequest): Promise<void> {
    try {
      // Find user
      const user = await User.findByPk(data.userId);
      if (!user) {
        throw AuthError.userNotFound();
      }

      // Verify current password
      const isCurrentPasswordValid = await this.passwordService.verifyPassword(
        data.currentPassword,
        user.password_hash
      );

      if (!isCurrentPasswordValid) {
        throw AuthError.passwordChangeFailed('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await this.passwordService.hashPassword(data.newPassword);

      // Update password
      await user.update({ password_hash: hashedNewPassword });

      // Revoke all existing tokens
      await this.tokenService.revokeAllTokens(data.userId);
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw AuthError.passwordChangeFailed('Failed to change password');
    }
  }

  public async getCurrentUser(userId: string): Promise<Partial<User> | null> {
    const user = await User.findByPk(userId);
    return user ? this.sanitizeUser(user) : null;
  }

  private validateRegistrationData(data: RegisterRequest): void {
    const errors: string[] = [];

    if (!data.name?.trim()) {
      errors.push('Name is required');
    }

    if (!data.email?.trim()) {
      errors.push('Email is required');
    } else if (!this.isValidEmail(data.email)) {
      errors.push('Invalid email format');
    } else if (data.email.length > 255) {
      errors.push('Email must be less than 255 characters');
    }

    if (!data.password) {
      errors.push('Password is required');
    } else {
      const passwordValidation = this.passwordService.validatePasswordStrength(data.password);
      if (!passwordValidation.isValid) {
        errors.push(...passwordValidation.errors);
      }
    }

    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.push('Invalid phone number format');
    }

    if (errors.length > 0) {
      throw AuthError.validationError(errors);
    }
  }

  private validateLoginData(data: LoginRequest): void {
    const errors: string[] = [];

    if (!data.email?.trim()) {
      errors.push('Email is required');
    }

    if (!data.password) {
      errors.push('Password is required');
    }

    if (errors.length > 0) {
      throw AuthError.validationError(errors);
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    // Phone validation - accept with or without + and allow formatting characters
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const digitsOnly = phone.replace(/\D/g, '');
    return phoneRegex.test(phone) && digitsOnly.length >= 10 && digitsOnly.length <= 15;
  }

  private sanitizeInput(input: string): string {
    if (!input) return input;
    
    // Remove potential XSS and SQL injection characters
    return input
      .replace(/[<>]/g, '')  // Remove angle brackets for XSS
      .replace(/'/g, '')     // Remove single quotes for SQL injection
      .trim()
      .substring(0, 255); // Limit length
  }

  private sanitizeUser(user: User): Partial<User> {
    const { password_hash, ...sanitizedUser } = user.toJSON() as any;
    return sanitizedUser;
  }

  private async getSocialProfile(provider: string, accessToken: string): Promise<any> {
    // In a real implementation, this would make API calls to social providers
    // For now, return mock data
    const config = AuthConfig.getInstance().getSocialAuthConfig();
    
    switch (provider) {
      case 'google':
        // Mock Google profile
        return {
          name: 'Google User',
          email: 'googleuser@example.com',
          phone: null,
        };
      case 'apple':
        // Mock Apple profile
        return {
          name: 'Apple User',
          email: 'appleuser@example.com',
          phone: null,
        };
      case 'facebook':
        // Mock Facebook profile
        return {
          name: 'Facebook User',
          email: 'facebookuser@example.com',
          phone: null,
        };
      default:
        throw AuthError.socialAuthFailed(`Unsupported provider: ${provider}`);
    }
  }
}