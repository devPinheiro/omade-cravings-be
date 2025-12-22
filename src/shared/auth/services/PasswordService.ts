import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { IPasswordService, PasswordValidationConfig, PasswordValidationResult } from '../interfaces/IPasswordService';
import { AuthConfig } from '../config/AuthConfig';

export class PasswordService implements IPasswordService {
  private readonly config: PasswordValidationConfig;

  constructor() {
    this.config = AuthConfig.getInstance().getPasswordConfig();
  }

  public async hashPassword(password: string): Promise<string> {
    const validation = this.validatePasswordStrength(password);
    if (!validation.isValid) {
      throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
    }

    return await bcrypt.hash(password, this.config.saltRounds);
  }

  public async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      return false;
    }
  }

  public validatePasswordStrength(password: string): PasswordValidationResult {
    const errors: string[] = [];

    if (password.length < this.config.minLength) {
      errors.push(`Password must be at least ${this.config.minLength} characters`);
    }

    if (this.config.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (this.config.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (this.config.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (this.config.requireSpecialChars && !/[^a-zA-Z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common weak patterns
    if (this.isCommonPassword(password)) {
      errors.push('Password is too common or weak');
    }

    if (this.hasRepeatingPatterns(password)) {
      errors.push('Password contains too many repeating characters');
    }

    if (this.isSequential(password)) {
      errors.push('Password contains sequential characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  public generateSecurePassword(length: number = 16): string {
    const charset = {
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      numbers: '0123456789',
      symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    };

    const allChars = Object.values(charset).join('');
    let password = '';

    // Ensure at least one character from each required set
    if (this.config.requireUppercase) {
      password += this.getRandomChar(charset.uppercase);
    }
    if (this.config.requireLowercase) {
      password += this.getRandomChar(charset.lowercase);
    }
    if (this.config.requireNumbers) {
      password += this.getRandomChar(charset.numbers);
    }
    if (this.config.requireSpecialChars) {
      password += this.getRandomChar(charset.symbols);
    }

    // Fill the rest with random characters
    while (password.length < length) {
      password += this.getRandomChar(allChars);
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  private getRandomChar(charset: string): string {
    const randomIndex = crypto.randomInt(0, charset.length);
    return charset[randomIndex];
  }

  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', 'password123', '123456', '123456789', 'qwerty',
      'abc123', 'admin', 'letmein', 'welcome', 'monkey', '1234567890',
      'password1', 'qwerty123', 'admin123', 'welcome123'
    ];

    return commonPasswords.some(common => 
      password.toLowerCase() === common.toLowerCase()
    );
  }

  private hasRepeatingPatterns(password: string): boolean {
    // Check for more than 2 consecutive identical characters
    if (/(.)\1{2,}/.test(password)) {
      return true;
    }

    // Check for repeating patterns (e.g., "abcabc")
    for (let i = 2; i <= password.length / 2; i++) {
      const pattern = password.substring(0, i);
      const repeated = pattern.repeat(Math.floor(password.length / i));
      if (password.startsWith(repeated) && repeated.length >= password.length * 0.5) {
        return true;
      }
    }

    return false;
  }

  private isSequential(password: string): boolean {
    const sequences = [
      'abcdefghijklmnopqrstuvwxyz',
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      '01234567890',
      'qwertyuiop',
      'asdfghjkl',
      'zxcvbnm'
    ];

    // Only reject passwords with longer sequential patterns (4+ characters)
    // or if the sequential pattern makes up a significant portion of the password
    for (const sequence of sequences) {
      for (let i = 0; i <= sequence.length - 4; i++) {
        const subSeq = sequence.substring(i, i + 4);
        if (password.toLowerCase().includes(subSeq)) {
          return true;
        }
      }
    }

    // Also check if more than half the password is sequential
    for (const sequence of sequences) {
      for (let i = 0; i <= sequence.length - 3; i++) {
        const subSeq = sequence.substring(i, i + 3);
        if (password.toLowerCase().includes(subSeq) && subSeq.length >= password.length * 0.4) {
          return true;
        }
      }
    }

    return false;
  }
}