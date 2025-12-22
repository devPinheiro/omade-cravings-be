export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  tokenType: 'access' | 'refresh';
  nonce?: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenTtl: string;
  refreshTokenTtl: string;
}

export interface ITokenService {
  generateTokenPair(userId: string, email: string, role: string): Promise<TokenPair>;
  verifyAccessToken(token: string): Promise<TokenPayload>;
  verifyRefreshToken(token: string): Promise<TokenPayload>;
  refreshAccessToken(refreshToken: string): Promise<TokenPair>;
  revokeToken(userId: string): Promise<void>;
  revokeAllTokens(userId: string): Promise<void>;
  extractTokenFromHeader(authHeader?: string): string | null;
}