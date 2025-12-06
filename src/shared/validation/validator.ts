import * as yup from 'yup';
import { userRegistrationSchema } from './schemas';

export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: string[];
  error?: string;
}

export class Validator {
  /**
   * Validates data against a Yup schema
   */
  static async validate<T>(
    schema: yup.Schema<T>,
    data: unknown
  ): Promise<ValidationResult<T>> {
    try {
      // Check for empty payload
      if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        return {
          success: false,
          error: 'EMPTY_PAYLOAD',
          errors: ['Request payload cannot be empty'],
        };
      }

      // Sanitize input before validation
      const sanitizedData = this.sanitizeInput(data);

      // Validate against schema
      const validatedData = await schema.validate(sanitizedData, {
        abortEarly: false, // Return all validation errors
        stripUnknown: true, // Remove fields not in schema
      });

      return {
        success: true,
        data: validatedData,
      };
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          errors: error.errors,
        };
      }

      return {
        success: false,
        error: 'VALIDATION_ERROR',
        errors: ['Validation failed'],
      };
    }
  }

  /**
   * Sanitizes input data to prevent security issues and normalize data
   */
  private static sanitizeInput(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return {};
    }

    const sanitized: any = {};

    for (const [key, value] of Object.entries(data)) {
      // Handle null, undefined values
      if (value === null || value === undefined) {
        sanitized[key] = '';
        continue;
      }

      // Handle different value types
      let sanitizedValue = '';

      if (typeof value === 'string') {
        sanitizedValue = value;
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitizedValue = String(value);
      } else if (typeof value === 'object') {
        // Reject objects/arrays - set to empty string to trigger validation error
        sanitized[key] = '';
        continue;
      } else {
        sanitizedValue = String(value);
      }

      // Remove control characters and potentially dangerous characters
      sanitizedValue = sanitizedValue
        .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters
        .replace(/[<>]/g, '') // Remove angle brackets to prevent XSS
        .trim(); // Remove leading/trailing whitespace

      // Apply reasonable length limits to prevent DoS attacks
      const maxLengths: { [key: string]: number } = {
        firstName: 100,
        lastName: 100,
        email: 150,
        phoneNumber: 50,
        password: 200,
        name: 200,
        description: 2000,
        address: 500,
        cuisine: 100,
      };

      const maxLength = maxLengths[key] || 500; // Default max length
      if (sanitizedValue.length > maxLength) {
        sanitizedValue = sanitizedValue.substring(0, maxLength);
      }

      sanitized[key] = sanitizedValue;
    }

    return sanitized;
  }

  /**
   * Formats validation errors for consistent API responses
   */
  static formatValidationError(validationResult: ValidationResult): {
    success: false;
    message: string;
    error: string;
    errors?: string[];
  } {
    if (validationResult.error === 'EMPTY_PAYLOAD') {
      return {
        success: false,
        message: 'Request payload cannot be empty',
        error: 'EMPTY_PAYLOAD',
      };
    }

    return {
      success: false,
      message: 'Validation failed',
      error: 'VALIDATION_ERROR',
      errors: validationResult.errors || ['Validation failed'],
    };
  }
}

// Export commonly used validation functions
export const validateUserRegistration = (data: unknown) =>
  Validator.validate(userRegistrationSchema, data);