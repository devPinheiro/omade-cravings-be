// This file now delegates to the modular auth system
export * from '../auth/middleware/AuthMiddleware';

// Maintain backward compatibility for existing imports
import { 
  authenticate as authMiddleware, 
  authorize as authorizeMiddleware,
  adminOnly as adminOnlyMiddleware,
  optionalAuthenticate as optionalAuthMiddleware
} from '../auth/middleware/AuthMiddleware';

export const authenticate = authMiddleware;
export const authorize = authorizeMiddleware;
export const adminOnly = adminOnlyMiddleware;
export const optionalAuthenticate = optionalAuthMiddleware;