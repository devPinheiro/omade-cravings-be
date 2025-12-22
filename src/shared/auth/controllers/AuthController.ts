import { Request, Response } from 'express';
import { IAuthService } from '../interfaces/IAuthService';
import { AuthError } from '../errors/AuthErrors';
import { AuthServiceFactory } from '../factories/AuthServiceFactory';

export class AuthController {
  private readonly authService: IAuthService;

  constructor(authService?: IAuthService) {
    this.authService = authService || AuthServiceFactory.createDefaultAuthService();
  }

  /**
   * POST /auth/register
   * Register a new user
   */
  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password, phone } = req.body;

      const result = await this.authService.register({
        name,
        email,
        password,
        phone,
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: result.user,
          access_token: result.tokens.accessToken,
          refresh_token: result.tokens.refreshToken,
          expires_in: result.tokens.expiresIn,
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * POST /auth/login
   * Login user with email and password
   */
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      const result = await this.authService.login({
        email,
        password,
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          access_token: result.tokens.accessToken,
          refresh_token: result.tokens.refreshToken,
          expires_in: result.tokens.expiresIn,
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * POST /auth/social
   * Social authentication (Google, Apple, Facebook)
   */
  public socialAuth = async (req: Request, res: Response): Promise<void> => {
    try {
      const { provider, access_token } = req.body;

      const result = await this.authService.socialAuth({
        provider,
        access_token,
      });

      const statusCode = result.isNewUser ? 201 : 200;
      const message = result.isNewUser ? 'Account created successfully' : 'Login successful';

      res.status(statusCode).json({
        success: true,
        message,
        data: {
          user: result.user,
          access_token: result.tokens.accessToken,
          refresh_token: result.tokens.refreshToken,
          expires_in: result.tokens.expiresIn,
          is_new_user: result.isNewUser,
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * POST /auth/refresh
   * Refresh access token using refresh token
   */
  public refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        throw AuthError.validationError(['Refresh token is required']);
      }

      const tokens = await this.authService.refreshToken(refresh_token);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          expires_in: tokens.expiresIn,
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * GET /auth/me
   * Get current user information
   */
  public getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.authContext) {
        throw AuthError.invalidToken('Authentication required');
      }

      const user = await this.authService.getCurrentUser(req.authContext.userId);
      
      if (!user) {
        throw AuthError.userNotFound('User not found');
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * POST /auth/logout
   * Logout user (revoke refresh token)
   */
  public logout = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.authContext) {
        throw AuthError.invalidToken('Authentication required');
      }

      await this.authService.logout(req.authContext.userId);

      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * POST /auth/logout-all
   * Logout from all devices
   */
  public logoutAll = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.authContext) {
        throw AuthError.invalidToken('Authentication required');
      }

      await this.authService.logout(req.authContext.userId);

      res.json({
        success: true,
        message: 'Logout from all devices successful',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * PUT /auth/change-password
   * Change user password
   */
  public changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.authContext) {
        throw AuthError.invalidToken('Authentication required');
      }

      const { current_password, new_password, confirm_password } = req.body;

      // Validate password confirmation
      if (new_password !== confirm_password) {
        throw AuthError.validationError(['New password and confirmation do not match']);
      }

      await this.authService.changePassword({
        userId: req.authContext.userId,
        currentPassword: current_password,
        newPassword: new_password,
      });

      res.json({
        success: true,
        message: 'Password changed successfully. Please login again.',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * POST /auth/forgot-password
   * Request password reset (placeholder implementation)
   */
  public forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        throw AuthError.validationError(['Email is required']);
      }

      // TODO: Implement password reset functionality
      // This would typically involve:
      // 1. Generating a secure reset token
      // 2. Storing it in database with expiration
      // 3. Sending email with reset link

      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * POST /auth/reset-password
   * Reset password using token (placeholder implementation)
   */
  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, new_password, confirm_password } = req.body;

      if (!token || !new_password || !confirm_password) {
        throw AuthError.validationError(['Token, new password, and confirmation are required']);
      }

      if (new_password !== confirm_password) {
        throw AuthError.validationError(['Passwords do not match']);
      }

      // TODO: Implement password reset functionality
      // This would typically involve:
      // 1. Verifying the reset token
      // 2. Checking if it's not expired
      // 3. Updating the user's password
      // 4. Invalidating the reset token

      res.json({
        success: true,
        message: 'Password reset successfully. Please login with your new password.',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  private handleError(error: any, res: Response): void {
    if (error instanceof AuthError) {
      res.status(error.statusCode).json(error.toResponse());
      return;
    }

    // Log unexpected errors
    console.error('Authentication error:', error);

    // Return generic error response
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}