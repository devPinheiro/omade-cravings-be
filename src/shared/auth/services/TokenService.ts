import jwt from 'jsonwebtoken';
import { ITokenService, TokenPayload, TokenPair, TokenConfig } from '../interfaces/ITokenService';
import { AuthConfig } from '../config/AuthConfig';
import { AuthError } from '../errors/AuthErrors';

export class TokenService implements ITokenService {
  private readonly config: TokenConfig;

  constructor() {
    this.config = AuthConfig.getInstance().getTokenConfig();
  }

  public async generateTokenPair(userId: string, email: string, role: string): Promise<TokenPair> {
    try {
      const nonce = Math.random().toString(36).substring(2, 15);
      
      const accessTokenPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
        userId,
        email,
        role,
        tokenType: 'access',
        nonce: nonce + '_access',
      };

      const refreshTokenPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
        userId,
        email,
        role,
        tokenType: 'refresh',
        nonce: nonce + '_refresh',
      };

      const accessToken = this.signToken(accessTokenPayload, this.config.accessTokenSecret, {
        expiresIn: this.config.accessTokenTtl,
      });

      const refreshToken = this.signToken(refreshTokenPayload, this.config.refreshTokenSecret, {
        expiresIn: this.config.refreshTokenTtl,
      });

      // Calculate expiration time for access token
      const decodedAccessToken = jwt.decode(accessToken) as any;
      const expiresIn = decodedAccessToken.exp;

      return {
        accessToken,
        refreshToken,
        expiresIn,
      };
    } catch (error) {
      throw AuthError.invalidToken('Failed to generate token pair');
    }
  }

  public async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const payload = this.verifyToken(token, this.config.accessTokenSecret) as TokenPayload;

      if (payload.tokenType !== 'access') {
        throw AuthError.invalidToken('Invalid token type');
      }

      return payload;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      
      if (error instanceof jwt.TokenExpiredError) {
        throw AuthError.tokenExpired('Access token has expired');
      }

      throw AuthError.invalidToken('Authentication failed');
    }
  }

  public async verifyRefreshToken(token: string): Promise<TokenPayload> {
    try {
      const payload = this.verifyToken(token, this.config.refreshTokenSecret) as TokenPayload;

      if (payload.tokenType !== 'refresh') {
        throw AuthError.invalidToken('Invalid token type');
      }

      return payload;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }

      if (error instanceof jwt.TokenExpiredError) {
        throw AuthError.tokenExpired('Refresh token has expired');
      }

      throw AuthError.invalidToken('Invalid refresh token');
    }
  }

  public async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    const payload = await this.verifyRefreshToken(refreshToken);
    return await this.generateTokenPair(payload.userId, payload.email, payload.role);
  }

  public async revokeToken(userId: string): Promise<void> {
    // In production, implement token blacklisting in database or cache
    console.log(`Token revoked for user ${userId} - token will expire naturally`);
  }

  public async revokeAllTokens(userId: string): Promise<void> {
    // In production, implement token blacklisting in database or cache
    console.log(`All tokens revoked for user ${userId} - tokens will expire naturally`);
  }

  public extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  private signToken(
    payload: object,
    secret: string,
    options: { expiresIn: string }
  ): string {
    return jwt.sign(payload, secret, options as any);
  }

  private verifyToken(token: string, secret: string): jwt.JwtPayload {
    return jwt.verify(token, secret) as jwt.JwtPayload;
  }

  /**
   * Generate a secure random token for password reset, email verification, etc.
   */
  public generateSecureToken(expiresIn: string = '1h'): string {
    const payload = {
      randomValue: Math.random().toString(36),
      timestamp: Date.now(),
    };

    return this.signToken(payload, this.config.accessTokenSecret, { expiresIn });
  }

  /**
   * Get token TTL in seconds from string format (e.g., "7d", "24h", "60m")
   */
  public getTokenTTLInSeconds(duration: string): number {
    const units: { [key: string]: number } = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error('Invalid duration format');
    }

    const [, value, unit] = match;
    return parseInt(value) * units[unit];
  }
}