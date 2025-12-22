import { IAuthService } from '../interfaces/IAuthService';
import { ITokenService } from '../interfaces/ITokenService';
import { IPasswordService } from '../interfaces/IPasswordService';
import { IAuthorizationService } from '../interfaces/IAuthorizationService';

import { AuthService } from '../services/AuthService';
import { TokenService } from '../services/TokenService';
import { PasswordService } from '../services/PasswordService';
import { AuthorizationService } from '../services/AuthorizationService';

import { AuthContainer, TYPES } from '../container/AuthContainer';

export class AuthServiceFactory {
  private static instance: AuthServiceFactory;

  private constructor() {}

  public static getInstance(): AuthServiceFactory {
    if (!AuthServiceFactory.instance) {
      AuthServiceFactory.instance = new AuthServiceFactory();
    }
    return AuthServiceFactory.instance;
  }

  public createAuthService(): IAuthService {
    const container = AuthContainer.getInstance();
    
    // Register AuthService factory if not already registered
    if (!this.isServiceRegistered(TYPES.AuthService)) {
      container.register(TYPES.AuthService, () => {
        const tokenService = container.get<ITokenService>(TYPES.TokenService);
        const passwordService = container.get<IPasswordService>(TYPES.PasswordService);
        
        return new AuthService(tokenService, passwordService);
      });
    }

    return container.get<IAuthService>(TYPES.AuthService);
  }

  public createTokenService(): ITokenService {
    return AuthContainer.getInstance().get<ITokenService>(TYPES.TokenService);
  }

  public createPasswordService(): IPasswordService {
    return AuthContainer.getInstance().get<IPasswordService>(TYPES.PasswordService);
  }

  public createAuthorizationService(): IAuthorizationService {
    return AuthContainer.getInstance().get<IAuthorizationService>(TYPES.AuthorizationService);
  }

  public createCustomAuthService(
    tokenService?: ITokenService,
    passwordService?: IPasswordService
  ): IAuthService {
    const container = AuthContainer.getInstance();
    
    const finalTokenService = tokenService || container.get<ITokenService>(TYPES.TokenService);
    const finalPasswordService = passwordService || container.get<IPasswordService>(TYPES.PasswordService);
    
    return new AuthService(finalTokenService, finalPasswordService);
  }

  public registerCustomServices(services: {
    tokenService?: () => ITokenService;
    passwordService?: () => IPasswordService;
    authService?: () => IAuthService;
    authorizationService?: () => IAuthorizationService;
  }): void {
    const container = AuthContainer.getInstance();

    if (services.tokenService) {
      container.register(TYPES.TokenService, services.tokenService);
    }

    if (services.passwordService) {
      container.register(TYPES.PasswordService, services.passwordService);
    }

    if (services.authService) {
      container.register(TYPES.AuthService, services.authService);
    }

    if (services.authorizationService) {
      container.register(TYPES.AuthorizationService, services.authorizationService);
    }
  }

  private isServiceRegistered(identifier: symbol): boolean {
    try {
      AuthContainer.getInstance().get(identifier);
      return true;
    } catch {
      return false;
    }
  }

  public static createDefaultAuthService(): IAuthService {
    return AuthServiceFactory.getInstance().createAuthService();
  }

  public static createDefaultTokenService(): ITokenService {
    return AuthServiceFactory.getInstance().createTokenService();
  }

  public static createDefaultPasswordService(): IPasswordService {
    return AuthServiceFactory.getInstance().createPasswordService();
  }

  public static createDefaultAuthorizationService(): IAuthorizationService {
    return AuthServiceFactory.getInstance().createAuthorizationService();
  }
}