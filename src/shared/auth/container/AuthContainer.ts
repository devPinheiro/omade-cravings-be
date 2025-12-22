import { ITokenService } from '../interfaces/ITokenService';
import { IPasswordService } from '../interfaces/IPasswordService';
import { IAuthService } from '../interfaces/IAuthService';
import { IAuthorizationService } from '../interfaces/IAuthorizationService';

import { TokenService } from '../services/TokenService';
import { PasswordService } from '../services/PasswordService';
import { AuthorizationService } from '../services/AuthorizationService';

// Service identifiers
export const TYPES = {
  TokenService: Symbol('TokenService'),
  PasswordService: Symbol('PasswordService'),
  AuthService: Symbol('AuthService'),
  AuthorizationService: Symbol('AuthorizationService'),
} as const;

// Simple dependency injection container
export class AuthContainer {
  private static instance: AuthContainer;
  private services: Map<symbol, any> = new Map();
  private factories: Map<symbol, () => any> = new Map();

  private constructor() {
    this.registerDefaults();
  }

  public static getInstance(): AuthContainer {
    if (!AuthContainer.instance) {
      AuthContainer.instance = new AuthContainer();
    }
    return AuthContainer.instance;
  }

  public register<T>(identifier: symbol, factory: () => T): void {
    this.factories.set(identifier, factory);
  }

  public registerSingleton<T>(identifier: symbol, factory: () => T): void {
    this.factories.set(identifier, () => {
      if (!this.services.has(identifier)) {
        this.services.set(identifier, factory());
      }
      return this.services.get(identifier);
    });
  }

  public get<T>(identifier: symbol): T {
    const factory = this.factories.get(identifier);
    if (!factory) {
      throw new Error(`Service not registered: ${identifier.toString()}`);
    }
    return factory();
  }

  public reset(): void {
    this.services.clear();
    this.factories.clear();
    this.registerDefaults();
  }

  private registerDefaults(): void {
    // Register core services as singletons
    this.registerSingleton(TYPES.TokenService, () => new TokenService());
    this.registerSingleton(TYPES.PasswordService, () => new PasswordService());
    this.registerSingleton(TYPES.AuthorizationService, () => new AuthorizationService());
    
    // AuthService will be registered by the factory
  }
}

// Convenience functions for getting services
export function getTokenService(): ITokenService {
  return AuthContainer.getInstance().get<ITokenService>(TYPES.TokenService);
}

export function getPasswordService(): IPasswordService {
  return AuthContainer.getInstance().get<IPasswordService>(TYPES.PasswordService);
}

export function getAuthService(): IAuthService {
  return AuthContainer.getInstance().get<IAuthService>(TYPES.AuthService);
}

export function getAuthorizationService(): IAuthorizationService {
  return AuthContainer.getInstance().get<IAuthorizationService>(TYPES.AuthorizationService);
}