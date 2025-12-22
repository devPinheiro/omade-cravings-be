// Main authentication module export
// This file provides a clean API for the entire authentication system

// Interfaces
export * from './interfaces/IAuthService';
export * from './interfaces/ITokenService';
export * from './interfaces/IPasswordService';
export * from './interfaces/IAuthorizationService';

// Services
export { AuthService } from './services/AuthService';
export { TokenService } from './services/TokenService';
export { PasswordService } from './services/PasswordService';
export { AuthorizationService } from './services/AuthorizationService';

// Controllers
export { AuthController } from './controllers/AuthController';

// Middleware
export * from './middleware/AuthMiddleware';

// Factories
export { AuthServiceFactory } from './factories/AuthServiceFactory';

// Container
export * from './container/AuthContainer';

// Configuration
export { AuthConfig } from './config/AuthConfig';

// Errors
export * from './errors/AuthErrors';

// Convenience factory functions for easy usage
import { AuthServiceFactory } from './factories/AuthServiceFactory';

/**
 * Create a complete authentication system with default configuration
 */
export function createAuthSystem() {
  const factory = AuthServiceFactory.getInstance();
  
  return {
    authService: factory.createAuthService(),
    tokenService: factory.createTokenService(),
    passwordService: factory.createPasswordService(),
    authorizationService: factory.createAuthorizationService(),
  };
}

/**
 * Create authentication controller with default services
 */
export function createAuthController() {
  const { AuthController } = require('./controllers/AuthController');
  return new AuthController();
}

/**
 * Get authentication middleware with default services
 */
export function getAuthMiddleware() {
  return require('./middleware/AuthMiddleware');
}