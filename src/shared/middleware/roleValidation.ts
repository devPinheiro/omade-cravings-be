import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../models/User';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    userId: string;
    email: string;
    role: UserRole;
  };
}

/**
 * Middleware to validate user roles
 * @param allowedRoles Array of roles that are allowed to access the route
 */
export const validateRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required_roles: allowedRoles,
        user_role: req.user.role,
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = validateRole([UserRole.ADMIN]);

/**
 * Middleware to check if user has admin or staff role
 */
export const requireStaff = validateRole([UserRole.ADMIN, UserRole.STAFF]);