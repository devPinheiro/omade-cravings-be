import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../../models/User';
import { ITokenService } from '../interfaces/ITokenService';
import { IAuthorizationService, AuthContext } from '../interfaces/IAuthorizationService';
import { AuthError } from '../errors/AuthErrors';
import { AuthServiceFactory } from '../factories/AuthServiceFactory';

// Extend Express Request type to include user information
declare global {
  namespace Express {
    interface Request {
      user?: AuthContext;
      authContext?: AuthContext;
    }
  }
}

export class AuthMiddleware {
  private readonly tokenService: ITokenService;
  private readonly authorizationService: IAuthorizationService;

  constructor() {
    this.tokenService = AuthServiceFactory.createDefaultTokenService();
    this.authorizationService = AuthServiceFactory.createDefaultAuthorizationService();
  }

  /**
   * Authentication middleware - Verifies JWT access token
   */
  public authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const token = this.tokenService.extractTokenFromHeader(authHeader);

      if (!token) {
        throw AuthError.invalidToken('Authentication required');
      }

      const payload = await this.tokenService.verifyAccessToken(token);
      
      // Create auth context
      const authContext: AuthContext = {
        id: payload.userId,
        userId: payload.userId,
        email: payload.email,
        role: payload.role as UserRole,
      };

      // Attach to request
      req.user = authContext;
      req.authContext = authContext;

      next();
    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  /**
   * Authorization middleware factory - Checks user roles
   */
  public authorize = (...allowedRoles: UserRole[]) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.authContext) {
          throw AuthError.invalidToken('Authentication required');
        }

        const hasRole = this.authorizationService.hasAnyRole(req.authContext, allowedRoles);
        
        if (!hasRole) {
          throw AuthError.insufficientPermissions('Access denied');
        }

        next();
      } catch (error) {
        this.handleAuthError(error, res);
      }
    };
  };

  /**
   * Permission-based authorization middleware
   */
  public requirePermission = (action: string, resource: string) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.authContext) {
          throw AuthError.invalidToken('Authentication required');
        }

        const hasPermission = this.authorizationService.hasPermission(req.authContext, {
          action,
          resource,
        });

        if (!hasPermission) {
          throw AuthError.insufficientPermissions(
            `Insufficient permissions for ${action} on ${resource}`
          );
        }

        next();
      } catch (error) {
        this.handleAuthError(error, res);
      }
    };
  };

  /**
   * Resource ownership middleware - Ensures user can only access their own resources
   */
  public requireResourceOwnership = (resourceIdParam: string = 'id') => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.authContext) {
          throw AuthError.invalidToken('Authentication required');
        }

        const resourceId = req.params[resourceIdParam];
        const ownerId = req.body.user_id || req.query.user_id || req.authContext.userId;

        // Admin can access any resource
        if (req.authContext.role === UserRole.ADMIN) {
          next();
          return;
        }

        // Check if user owns the resource
        if (ownerId !== req.authContext.userId) {
          throw AuthError.insufficientPermissions('Access denied - resource ownership required');
        }

        next();
      } catch (error) {
        this.handleAuthError(error, res);
      }
    };
  };

  /**
   * Optional authentication - Adds user context if token is present but doesn't require it
   */
  public optionalAuthenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const token = this.tokenService.extractTokenFromHeader(authHeader);

      if (token) {
        const payload = await this.tokenService.verifyAccessToken(token);
        
        const authContext: AuthContext = {
          id: payload.userId,
          userId: payload.userId,
          email: payload.email,
          role: payload.role as UserRole,
        };

        req.user = authContext;
        req.authContext = authContext;
      }

      next();
    } catch (error) {
      // For optional auth, we don't fail on invalid tokens
      next();
    }
  };

  /**
   * Rate limiting middleware by user
   */
  public rateLimit = (maxRequests: number, windowMs: number) => {
    const userRequests = new Map<string, { count: number; resetTime: number }>();

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userId = req.authContext?.userId || req.ip || 'anonymous';
        const now = Date.now();

        const userLimit = userRequests.get(userId);
        
        if (!userLimit || now > userLimit.resetTime) {
          // Reset or initialize
          userRequests.set(userId, {
            count: 1,
            resetTime: now + windowMs,
          });
          next();
          return;
        }

        if (userLimit.count >= maxRequests) {
          throw AuthError.rateLimitExceeded(
            `Rate limit exceeded. Try again in ${Math.ceil((userLimit.resetTime - now) / 1000)} seconds.`
          );
        }

        userLimit.count++;
        next();
      } catch (error) {
        this.handleAuthError(error, res);
      }
    };
  };

  private handleAuthError(error: any, res: Response): void {
    if (error instanceof AuthError) {
      res.status(error.statusCode).json(error.toResponse());
      return;
    }

    // Generic authentication error
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTHENTICATION_FAILED',
    });
  }
}

// Create singleton instance
const authMiddleware = new AuthMiddleware();

// Export middleware functions
export const authenticate = authMiddleware.authenticate;
export const authorize = authMiddleware.authorize;
export const requirePermission = authMiddleware.requirePermission;
export const requireResourceOwnership = authMiddleware.requireResourceOwnership;
export const optionalAuthenticate = authMiddleware.optionalAuthenticate;
export const rateLimit = authMiddleware.rateLimit;

// Convenience functions for common role checks
export const adminOnly = authorize(UserRole.ADMIN);
export const staffOnly = authorize(UserRole.ADMIN, UserRole.STAFF);
export const riderOnly = authorize(UserRole.ADMIN, UserRole.STAFF, UserRole.RIDER);
export const customerOnly = authorize(UserRole.ADMIN, UserRole.STAFF, UserRole.RIDER, UserRole.CUSTOMER);