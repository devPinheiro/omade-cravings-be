import { TokenConfig } from '../interfaces/ITokenService';
import { PasswordValidationConfig } from '../interfaces/IPasswordService';

export class AuthConfig {
  private static instance: AuthConfig;
  
  private constructor() {}
  
  public static getInstance(): AuthConfig {
    if (!AuthConfig.instance) {
      AuthConfig.instance = new AuthConfig();
    }
    return AuthConfig.instance;
  }

  public getTokenConfig(): TokenConfig {
    return {
      accessTokenSecret: process.env.JWT_SECRET || 'fallback-access-secret',
      refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
      accessTokenTtl: process.env.JWT_EXPIRES_IN || '24h',
      refreshTokenTtl: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    };
  }

  public getPasswordConfig(): PasswordValidationConfig {
    return {
      minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
      requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
      requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
      requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
      requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false',
      saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),
    };
  }

  public getSocialAuthConfig() {
    return {
      google: {
        clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
        clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      },
      apple: {
        clientId: process.env.APPLE_OAUTH_CLIENT_ID,
        clientSecret: process.env.APPLE_OAUTH_CLIENT_SECRET,
      },
      facebook: {
        clientId: process.env.FACEBOOK_OAUTH_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_OAUTH_CLIENT_SECRET,
      },
    };
  }

  public getRateLimitingConfig() {
    return {
      login: {
        windowMs: parseInt(process.env.LOGIN_RATE_WINDOW_MS || '900000'), // 15 minutes
        maxAttempts: parseInt(process.env.LOGIN_RATE_MAX_ATTEMPTS || '5'),
      },
      registration: {
        windowMs: parseInt(process.env.REGISTER_RATE_WINDOW_MS || '3600000'), // 1 hour
        maxAttempts: parseInt(process.env.REGISTER_RATE_MAX_ATTEMPTS || '3'),
      },
    };
  }
}