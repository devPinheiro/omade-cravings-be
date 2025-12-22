// This file now delegates to the modular auth system
import { TokenService, AuthServiceFactory } from '../auth';

// Maintain backward compatibility
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  tokenType: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Create singleton token service for backward compatibility
const tokenService = AuthServiceFactory.createDefaultTokenService();

export class JWTService {
  static async generateTokenPair(userId: string, email: string, role: string): Promise<TokenPair> {
    return tokenService.generateTokenPair(userId, email, role);
  }

  static verifyAccessToken(token: string): JWTPayload {
    // Note: This is synchronous for backward compatibility
    // The underlying service is async, but we'll handle it synchronously here
    try {
      // For now, we'll use the jwt library directly to maintain sync behavior
      const jwt = require('jsonwebtoken');
      const config = require('../auth/config/AuthConfig').AuthConfig.getInstance().getTokenConfig();
      const payload = jwt.verify(token, config.accessTokenSecret);
      
      if (payload.tokenType !== 'access') {
        throw new Error('Invalid token type');
      }

      return payload as JWTPayload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  static async verifyRefreshToken(token: string): Promise<JWTPayload> {
    const result = await tokenService.verifyRefreshToken(token);
    return result as any; // Type compatibility
  }

  static async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    return tokenService.refreshAccessToken(refreshToken);
  }

  static async revokeRefreshToken(userId: string): Promise<void> {
    return tokenService.revokeToken(userId);
  }

  static async revokeAllRefreshTokens(userId: string): Promise<void> {
    return tokenService.revokeAllTokens(userId);
  }

  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    return tokenService.extractTokenFromHeader(authHeader);
  }

  static generateSecureToken(): string {
    if ('generateSecureToken' in tokenService) {
      return (tokenService as any).generateSecureToken();
    }
    throw new Error('generateSecureToken not available in current token service implementation');
  }
}