import bcrypt from 'bcrypt';
import axios from 'axios';
import { User, UserRole } from '../../../models/User';
import { LoyaltyPoints } from '../../../models/LoyaltyPoints';
import { JWTService, TokenPair } from '../../../shared/utils/jwt';
import { Op } from 'sequelize';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface SocialAuthData {
  provider: 'google' | 'apple' | 'facebook';
  access_token: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  provider?: string;
}

export class AuthService {
  private static readonly SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<{ user: User; tokens: TokenPair }> {
    const { name, email, password, phone } = data;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email: email.toLowerCase() },
          ...(phone ? [{ phone }] : [])
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        throw new Error('Email already registered');
      }
      if (existingUser.phone === phone) {
        throw new Error('Phone number already registered');
      }
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, AuthService.SALT_ROUNDS);

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password_hash,
      phone,
      role: UserRole.CUSTOMER, // Default role
    } as any);

    // Create loyalty points account
    await LoyaltyPoints.create({
      user_id: user.id,
      points: 0,
    } as any);

    // Generate tokens
    const tokens = await JWTService.generateTokenPair(user.id, user.email, user.role);

    // Remove password hash from response
    const userResponse = user.toJSON();
    delete userResponse.password_hash;

    return { user: userResponse as User, tokens };
  }

  /**
   * Login user with email and password
   */
  async login(data: LoginData): Promise<{ user: User; tokens: TokenPair }> {
    const { email, password } = data;

    // Find user by email
    const user = await User.findOne({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const tokens = await JWTService.generateTokenPair(user.id, user.email, user.role);

    // Remove password hash from response
    const userResponse = user.toJSON();
    delete userResponse.password_hash;

    return { user: userResponse as User, tokens };
  }

  /**
   * Social authentication (Google, Apple, Facebook)
   */
  async socialAuth(data: SocialAuthData): Promise<{ user: User; tokens: TokenPair; isNewUser: boolean }> {
    const { provider, access_token } = data;

    // Get user profile from social provider
    const profile = await this.getSocialProfile(provider, access_token);

    // Check if user exists
    let user = await User.findOne({
      where: { email: profile.email.toLowerCase() }
    });

    let isNewUser = false;

    if (!user) {
      // Create new user from social profile
      user = await User.create({
        name: profile.name,
        email: profile.email.toLowerCase(),
        password_hash: '', // No password for social login
        role: UserRole.CUSTOMER,
        social_provider: provider,
      } as any);

      // Create loyalty points account
      await LoyaltyPoints.create({
        user_id: user.id,
        points: 0,
      } as any);

      isNewUser = true;
    } else {
      // Update social provider if not set
      if (!user.social_provider) {
        await user.update({ social_provider: provider });
      }
    }

    // Generate tokens
    const tokens = await JWTService.generateTokenPair(user.id, user.email, user.role);

    // Remove password hash from response
    const userResponse = user.toJSON();
    delete userResponse.password_hash;

    return { user: userResponse as User, tokens, isNewUser };
  }

  /**
   * Refresh access token
   */
  async refresh(refreshToken: string): Promise<TokenPair> {
    return await JWTService.refreshAccessToken(refreshToken);
  }

  /**
   * Logout user (revoke refresh token)
   */
  async logout(userId: string): Promise<void> {
    await JWTService.revokeRefreshToken(userId);
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId: string): Promise<void> {
    await JWTService.revokeAllRefreshTokens(userId);
  }

  /**
   * Get user by ID for authentication middleware
   */
  async getUserById(userId: string): Promise<User | null> {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash'] }
    });
    return user;
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password (skip for social login users)
    if (user.password_hash) {
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, AuthService.SALT_ROUNDS);

    // Update password
    await user.update({ password_hash: newPasswordHash });

    // Logout from all devices for security
    await this.logoutAll(userId);
  }

  /**
   * Request password reset (generates reset token)
   */
  async requestPasswordReset(email: string): Promise<string> {
    const user = await User.findOne({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Don't reveal if email exists or not
      throw new Error('If this email is registered, you will receive reset instructions');
    }

    // Generate reset token (you would typically send this via email)
    const resetToken = JWTService.generateSecureToken();
    
    // In a real implementation, you would:
    // 1. Store the reset token in Redis with expiration
    // 2. Send email with reset link
    // 3. Return success message

    return resetToken;
  }

  /**
   * Get social profile from provider
   */
  private async getSocialProfile(provider: string, accessToken: string): Promise<UserProfile> {
    try {
      switch (provider) {
        case 'google':
          return await this.getGoogleProfile(accessToken);
        case 'facebook':
          return await this.getFacebookProfile(accessToken);
        case 'apple':
          return await this.getAppleProfile(accessToken);
        default:
          throw new Error(`Unsupported social provider: ${provider}`);
      }
    } catch (error) {
      throw new Error(`Failed to get ${provider} profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get Google user profile
   */
  private async getGoogleProfile(accessToken: string): Promise<UserProfile> {
    const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const { id, email, name } = response.data;

    return {
      id,
      email,
      name,
      provider: 'google',
    };
  }

  /**
   * Get Facebook user profile
   */
  private async getFacebookProfile(accessToken: string): Promise<UserProfile> {
    const response = await axios.get(`https://graph.facebook.com/me`, {
      params: {
        access_token: accessToken,
        fields: 'id,email,name',
      },
    });

    const { id, email, name } = response.data;

    return {
      id,
      email,
      name,
      provider: 'facebook',
    };
  }

  /**
   * Get Apple user profile
   */
  private async getAppleProfile(accessToken: string): Promise<UserProfile> {
    // Apple Sign-In is more complex and typically involves JWT token validation
    // This is a simplified version - in production, you'd validate the JWT token
    // and extract user information from it
    
    // For now, we'll throw an error indicating this needs implementation
    throw new Error('Apple Sign-In profile extraction not implemented. Requires JWT validation.');
  }

  /**
   * Verify email address
   */
  async verifyEmail(userId: string, verificationToken: string): Promise<void> {
    // In a real implementation, you would:
    // 1. Validate the verification token
    // 2. Mark user as verified
    // 3. Update user record

    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // This is a placeholder - implement actual email verification logic
    console.log(`Email verification for user ${userId} with token ${verificationToken}`);
  }
}