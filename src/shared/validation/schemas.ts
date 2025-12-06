import * as yup from 'yup';

// Custom validation rules
const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
const phoneRegex = /^[\+]?[\d\-\s\(\)\.]{10,20}$/;
const strongPasswordRegex = {
  hasLowercase: /(?=.*[a-z])/,
  hasUppercase: /(?=.*[A-Z])/,
  hasNumber: /(?=.*\d)/,
  hasSpecialChar: /(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?])/,
};

// Common weak passwords to reject
const commonWeakPasswords = [
  'password',
  '123456789',
  'qwerty123',
  'admin123',
  'password123',
];

// User Registration Schema (for all user types)
export const userRegistrationSchema = yup.object().shape({
  firstName: yup
    .string()
    .required('First name is required and cannot be empty')
    .min(2, 'First name must be at least 2 characters long')
    .max(50, 'First name cannot exceed 50 characters')
    .matches(
      nameRegex,
      'First name can only contain letters, spaces, hyphens, and apostrophes'
    )
    .trim(),

  lastName: yup
    .string()
    .required('Last name is required and cannot be empty')
    .min(2, 'Last name must be at least 2 characters long')
    .max(50, 'Last name cannot exceed 50 characters')
    .matches(
      nameRegex,
      'Last name can only contain letters, spaces, hyphens, and apostrophes'
    )
    .trim(),

  email: yup
    .string()
    .required('Email is required and cannot be empty')
    .email('Please provide a valid email address')
    .test('strict-email', 'Please provide a valid email address', (value) =>
      value ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) : false
    )
    .max(100, 'Email cannot exceed 100 characters')
    .test(
      'no-consecutive-dots',
      'Email cannot contain consecutive dots',
      (value) => !value || !value.includes('..')
    )
    .lowercase()
    .trim(),

  phoneNumber: yup
    .string()
    .required('Phone number is required and cannot be empty')
    .test(
      'phone-digits-count',
      'Phone number must contain between 10 and 15 digits',
      (value) => {
        if (!value) return false;
        const digitsOnly = value.replace(/\D/g, '');
        return digitsOnly.length >= 10 && digitsOnly.length <= 15;
      }
    )
    .matches(phoneRegex, 'Please provide a valid phone number')
    .trim(),

  password: yup
    .string()
    .required('Password is required and cannot be empty')
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password cannot exceed 128 characters')
    .test(
      'has-lowercase',
      'Password must contain at least one lowercase letter',
      (value) => !value || strongPasswordRegex.hasLowercase.test(value)
    )
    .test(
      'has-uppercase',
      'Password must contain at least one uppercase letter',
      (value) => !value || strongPasswordRegex.hasUppercase.test(value)
    )
    .test(
      'has-number',
      'Password must contain at least one number',
      (value) => !value || strongPasswordRegex.hasNumber.test(value)
    )
    .test(
      'has-special-char',
      'Password must contain at least one special character',
      (value) => !value || strongPasswordRegex.hasSpecialChar.test(value)
    )
    .test(
      'not-common-password',
      'Please choose a stronger password',
      (value) => !value || !commonWeakPasswords.includes(value.toLowerCase())
    ),

  role: yup
    .string()
    .required('User role is required')
    .oneOf(
      ['customer', 'restaurant_owner', 'delivery_partner'],
      'Role must be one of: customer, restaurant_owner, delivery_partner'
    ),

  address: yup
    .string()
    .optional()
    .max(300, 'Address cannot exceed 300 characters')
    .trim(),

  latitude: yup
    .number()
    .optional()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),

  longitude: yup
    .number()
    .optional()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
});

// Restaurant Registration Schema
export const restaurantRegistrationSchema = yup.object().shape({
  name: yup
    .string()
    .required('Restaurant name is required')
    .min(2, 'Restaurant name must be at least 2 characters long')
    .max(100, 'Restaurant name cannot exceed 100 characters')
    .trim(),

  description: yup
    .string()
    .optional()
    .max(1000, 'Description cannot exceed 1000 characters')
    .trim(),

  address: yup
    .string()
    .required('Address is required')
    .min(5, 'Address must be at least 5 characters long')
    .max(300, 'Address cannot exceed 300 characters')
    .trim(),

  latitude: yup
    .number()
    .optional()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),

  longitude: yup
    .number()
    .optional()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),

  phoneNumber: yup
    .string()
    .required('Phone number is required')
    .matches(phoneRegex, 'Please provide a valid phone number')
    .trim(),

  email: yup
    .string()
    .optional()
    .email('Please provide a valid email address')
    .max(100, 'Email cannot exceed 100 characters')
    .trim(),

  cuisine: yup
    .string()
    .optional()
    .max(50, 'Cuisine type cannot exceed 50 characters')
    .trim(),

  openingTime: yup
    .string()
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time format (HH:MM)'),

  closingTime: yup
    .string()
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time format (HH:MM)'),

  deliveryTime: yup
    .number()
    .optional()
    .min(5, 'Delivery time must be at least 5 minutes')
    .max(120, 'Delivery time cannot exceed 120 minutes'),

  deliveryFee: yup
    .number()
    .optional()
    .min(0, 'Delivery fee cannot be negative')
    .max(50, 'Delivery fee cannot exceed $50'),

  minimumOrder: yup
    .number()
    .optional()
    .min(0, 'Minimum order cannot be negative')
    .max(100, 'Minimum order cannot exceed $100'),
});

// Menu Item Schema
export const menuItemSchema = yup.object().shape({
  name: yup
    .string()
    .required('Item name is required')
    .min(2, 'Item name must be at least 2 characters long')
    .max(100, 'Item name cannot exceed 100 characters')
    .trim(),

  description: yup
    .string()
    .optional()
    .max(500, 'Description cannot exceed 500 characters')
    .trim(),

  price: yup
    .number()
    .required('Price is required')
    .positive('Price must be a positive number')
    .max(500, 'Price cannot exceed $500')
    .test(
      'decimal-places',
      'Price cannot have more than 2 decimal places',
      (value) => !value || Math.round(value * 100) / 100 === value
    ),

  category: yup
    .string()
    .optional()
    .max(50, 'Category cannot exceed 50 characters')
    .trim(),

  preparationTime: yup
    .number()
    .optional()
    .min(1, 'Preparation time must be at least 1 minute')
    .max(120, 'Preparation time cannot exceed 120 minutes'),

  calories: yup
    .number()
    .optional()
    .min(0, 'Calories cannot be negative')
    .max(5000, 'Calories cannot exceed 5000'),

  allergens: yup
    .array()
    .optional()
    .of(yup.string().trim())
    .max(10, 'Cannot have more than 10 allergens'),

  ingredients: yup
    .array()
    .optional()
    .of(yup.string().trim())
    .max(20, 'Cannot have more than 20 ingredients'),
});

// Order Schema
export const orderSchema = yup.object().shape({
  restaurantId: yup
    .string()
    .required('Restaurant ID is required')
    .uuid('Restaurant ID must be a valid UUID'),

  deliveryAddress: yup
    .string()
    .required('Delivery address is required')
    .min(5, 'Delivery address must be at least 5 characters long')
    .max(300, 'Delivery address cannot exceed 300 characters')
    .trim(),

  deliveryLatitude: yup
    .number()
    .optional()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),

  deliveryLongitude: yup
    .number()
    .optional()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),

  specialInstructions: yup
    .string()
    .optional()
    .max(500, 'Special instructions cannot exceed 500 characters')
    .trim(),

  tip: yup
    .number()
    .optional()
    .min(0, 'Tip cannot be negative')
    .max(100, 'Tip cannot exceed $100'),

  orderItems: yup
    .array()
    .required('Order items are required')
    .min(1, 'At least one item is required')
    .of(
      yup.object().shape({
        menuItemId: yup
          .string()
          .required('Menu item ID is required')
          .uuid('Menu item ID must be a valid UUID'),
        quantity: yup
          .number()
          .required('Quantity is required')
          .integer('Quantity must be a whole number')
          .min(1, 'Quantity must be at least 1')
          .max(10, 'Quantity cannot exceed 10'),
        specialRequests: yup
          .string()
          .optional()
          .max(200, 'Special requests cannot exceed 200 characters')
          .trim(),
      })
    ),
});

// Type inference for better TypeScript support
export type UserRegistrationData = yup.InferType<typeof userRegistrationSchema>;
export type RestaurantRegistrationData = yup.InferType<typeof restaurantRegistrationSchema>;
export type MenuItemData = yup.InferType<typeof menuItemSchema>;
export type OrderData = yup.InferType<typeof orderSchema>;