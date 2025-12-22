export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SOCIAL_AUTH_FAILED = 'SOCIAL_AUTH_FAILED',
  PASSWORD_CHANGE_FAILED = 'PASSWORD_CHANGE_FAILED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  REGISTRATION_FAILED = 'REGISTRATION_FAILED',
  LOGIN_FAILED = 'LOGIN_FAILED',
}

export class AuthError extends Error {
  public readonly code: AuthErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;

  constructor(
    code: AuthErrorCode,
    message: string,
    statusCode: number = 400,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthError);
    }
  }

  public static invalidCredentials(message: string = 'Invalid email or password'): AuthError {
    return new AuthError(AuthErrorCode.INVALID_CREDENTIALS, message, 401);
  }

  public static userNotFound(message: string = 'User not found'): AuthError {
    return new AuthError(AuthErrorCode.USER_NOT_FOUND, message, 404);
  }

  public static userAlreadyExists(message: string = 'User already exists'): AuthError {
    return new AuthError(AuthErrorCode.USER_ALREADY_EXISTS, message, 400);
  }

  public static weakPassword(errors: string[]): AuthError {
    return new AuthError(
      AuthErrorCode.WEAK_PASSWORD,
      'Password does not meet security requirements',
      400,
      { errors }
    );
  }

  public static invalidToken(message: string = 'Invalid or expired token'): AuthError {
    return new AuthError(AuthErrorCode.INVALID_TOKEN, message, 401);
  }

  public static tokenExpired(message: string = 'Token has expired'): AuthError {
    return new AuthError(AuthErrorCode.TOKEN_EXPIRED, message, 401);
  }

  public static insufficientPermissions(message: string = 'Insufficient permissions'): AuthError {
    return new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, message, 403);
  }

  public static rateLimitExceeded(message: string = 'Rate limit exceeded'): AuthError {
    return new AuthError(AuthErrorCode.RATE_LIMIT_EXCEEDED, message, 429);
  }

  public static socialAuthFailed(provider: string, details?: any): AuthError {
    return new AuthError(
      AuthErrorCode.SOCIAL_AUTH_FAILED,
      `Social authentication failed for ${provider}`,
      400,
      details
    );
  }

  public static passwordChangeFailed(message: string = 'Password change failed'): AuthError {
    return new AuthError(AuthErrorCode.PASSWORD_CHANGE_FAILED, message, 400);
  }

  public static validationError(errors: string[]): AuthError {
    return new AuthError(
      AuthErrorCode.VALIDATION_ERROR,
      'Validation failed',
      400,
      { errors }
    );
  }

  public toResponse() {
    return {
      success: false,
      error: this.message,
      code: this.code,
      ...(this.details && { details: this.details }),
    };
  }
}