export interface PasswordValidationConfig {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  saltRounds: number;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface IPasswordService {
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  validatePasswordStrength(password: string): PasswordValidationResult;
  generateSecurePassword(length?: number): string;
}