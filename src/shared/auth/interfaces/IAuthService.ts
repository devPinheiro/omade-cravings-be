import { User } from '../../../models/User';
import { TokenPair } from './ITokenService';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SocialAuthRequest {
  provider: 'google' | 'apple' | 'facebook';
  access_token: string;
}

export interface ChangePasswordRequest {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export interface AuthResult {
  user: Partial<User>;
  tokens: TokenPair;
}

export interface SocialAuthResult extends AuthResult {
  isNewUser: boolean;
}

export interface IAuthService {
  register(data: RegisterRequest): Promise<AuthResult>;
  login(data: LoginRequest): Promise<AuthResult>;
  socialAuth(data: SocialAuthRequest): Promise<SocialAuthResult>;
  refreshToken(refreshToken: string): Promise<TokenPair>;
  logout(userId: string): Promise<void>;
  changePassword(data: ChangePasswordRequest): Promise<void>;
  getCurrentUser(userId: string): Promise<Partial<User> | null>;
}