import * as yup from 'yup';

// Password validation rules
const passwordSchema = yup
  .string()
  .min(8, 'Password must be at least 8 characters')
  .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
  .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .matches(/[0-9]/, 'Password must contain at least one number')
  .matches(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

// Email validation
const emailSchema = yup
  .string()
  .email('Invalid email format')
  .required('Email is required')
  .transform((value) => value?.toLowerCase());

// Phone validation (optional)
const phoneSchema = yup
  .string()
  .matches(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .optional();

export const registerSchema = yup.object({
  body: yup.object({
    name: yup
      .string()
      .required('Name is required')
      .min(2, 'Name must be at least 2 characters')
      .max(1000, 'Name cannot exceed 1000 characters')
      .trim(),
    
    email: emailSchema,
    
    password: passwordSchema.required('Password is required'),
    
    phone: phoneSchema,
  }),
});

export const loginSchema = yup.object({
  body: yup.object({
    email: emailSchema,
    
    password: yup
      .string()
      .required('Password is required'),
  }),
});

export const socialAuthSchema = yup.object({
  body: yup.object({
    provider: yup
      .string()
      .required('Provider is required')
      .oneOf(['google', 'apple', 'facebook'], 'Invalid provider'),
    
    access_token: yup
      .string()
      .required('Access token is required'),
  }),
});

export const refreshTokenSchema = yup.object({
  body: yup.object({
    refresh_token: yup
      .string()
      .required('Refresh token is required'),
  }),
});

export const changePasswordSchema = yup.object({
  body: yup.object({
    current_password: yup
      .string()
      .required('Current password is required'),
    
    new_password: passwordSchema.required('New password is required'),
    
    confirm_password: yup
      .string()
      .required('Password confirmation is required')
      .oneOf([yup.ref('new_password')], 'Passwords must match'),
  }),
});

export const forgotPasswordSchema = yup.object({
  body: yup.object({
    email: emailSchema,
  }),
});

export const resetPasswordSchema = yup.object({
  body: yup.object({
    token: yup
      .string()
      .required('Reset token is required'),
    
    new_password: passwordSchema.required('New password is required'),
    
    confirm_password: yup
      .string()
      .required('Password confirmation is required')
      .oneOf([yup.ref('new_password')], 'Passwords must match'),
  }),
});

export const verifyEmailSchema = yup.object({
  body: yup.object({
    token: yup
      .string()
      .required('Verification token is required'),
  }),
});