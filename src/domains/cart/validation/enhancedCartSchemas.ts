import * as yup from 'yup';

export const addEnhancedCartItemSchema = yup.object({
  body: yup.object({
    product_id: yup.string().uuid('Invalid product ID').required('Product ID is required'),
    quantity: yup
      .number()
      .integer('Quantity must be an integer')
      .min(1, 'Quantity must be at least 1')
      .max(50, 'Quantity cannot exceed 50')
      .required('Quantity is required'),
    custom_cake_config: yup
      .object({
        flavor: yup
          .string()
          .min(2, 'Flavor must be at least 2 characters')
          .max(100, 'Flavor name too long')
          .required('Flavor is required'),
        size: yup
          .string()
          .min(1, 'Size is required')
          .max(50, 'Size description too long')
          .required('Size is required'),
        frosting: yup
          .string()
          .min(2, 'Frosting type must be at least 2 characters')
          .max(100, 'Frosting type too long')
          .required('Frosting type is required'),
        message: yup.string().max(200, 'Message too long').optional(),
        image_reference: yup.string().url('Invalid image URL').optional(),
        extra_details: yup
          .object({
            layers: yup.number().integer().min(1).max(5).optional(),
            decorations: yup.array().of(yup.string().max(100)).optional(),
            allergens: yup.array().of(yup.string().max(50)).optional(),
            dietary_restrictions: yup.array().of(yup.string().max(50)).optional(),
            special_instructions: yup.string().max(500).optional(),
          })
          .optional(),
      })
      .optional(),
  }),
});

export const updateEnhancedCartItemSchema = yup.object({
  params: yup.object({
    productId: yup.string().uuid('Invalid product ID').required('Product ID is required'),
  }),
  body: yup.object({
    quantity: yup
      .number()
      .integer('Quantity must be an integer')
      .min(0, 'Quantity cannot be negative')
      .max(50, 'Quantity cannot exceed 50')
      .required('Quantity is required'),
    item_index: yup
      .number()
      .integer('Item index must be an integer')
      .min(0, 'Item index cannot be negative')
      .optional(),
  }),
});

export const removeEnhancedCartItemSchema = yup.object({
  params: yup.object({
    productId: yup.string().uuid('Invalid product ID').required('Product ID is required'),
  }),
  query: yup.object({
    item_index: yup
      .number()
      .integer('Item index must be an integer')
      .min(0, 'Item index cannot be negative')
      .optional(),
  }),
});

export const guestInfoSchema = yup.object({
  body: yup.object({
    email: yup.string().email('Invalid email format').optional(),
    phone: yup
      .string()
      .matches(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
      .optional(),
    name: yup.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long').optional(),
  }),
});

export const sessionIdHeaderSchema = yup.object({
  headers: yup.object({
    'x-session-id': yup
      .string()
      .matches(/^guest_[a-f0-9-]{36}$/, 'Invalid session ID format')
      .required('Session ID is required'),
  }),
});

export const optionalSessionIdHeaderSchema = yup.object({
  headers: yup.object({
    'x-session-id': yup
      .string()
      .matches(/^guest_[a-f0-9-]{36}$/, 'Invalid session ID format')
      .optional(),
  }),
});

export const cartValidationSchema = yup.object({
  query: yup.object({
    refresh: yup.boolean().optional(),
  }),
});

export const mergeCartSchema = yup.object({
  headers: yup.object({
    'x-session-id': yup
      .string()
      .matches(/^guest_[a-f0-9-]{36}$/, 'Invalid session ID format')
      .required('Session ID is required for cart merge'),
  }),
});

export const checkoutInitiationSchema = yup.object({
  body: yup.object({
    validate_inventory: yup.boolean().optional().default(true),
    refresh_prices: yup.boolean().optional().default(true),
  }),
});

// Custom cake options validation (for UI configuration)
export const customCakeOptionsSchema = yup.object({
  query: yup.object({
    size: yup.string().optional(),
    flavor: yup.string().optional(),
  }),
});

// Bulk cart operations
export const bulkCartUpdateSchema = yup.object({
  body: yup.object({
    operations: yup
      .array()
      .of(
        yup.object({
          type: yup.string().oneOf(['add', 'update', 'remove'], 'Invalid operation type').required(),
          product_id: yup.string().uuid('Invalid product ID').required(),
          quantity: yup
            .number()
            .integer('Quantity must be an integer')
            .min(0, 'Quantity cannot be negative')
            .when('type', {
              is: (type: string) => type === 'add' || type === 'update',
              then: (schema) => schema.required('Quantity is required for add/update operations'),
              otherwise: (schema) => schema.optional(),
            }),
          item_index: yup
            .number()
            .integer('Item index must be an integer')
            .min(0, 'Item index cannot be negative')
            .optional(),
          custom_cake_config: yup
            .object({
              flavor: yup.string().max(100).required(),
              size: yup.string().max(50).required(),
              frosting: yup.string().max(100).required(),
              message: yup.string().max(200).optional(),
              image_reference: yup.string().url().optional(),
              extra_details: yup.object().optional(),
            })
            .optional(),
        })
      )
      .min(1, 'At least one operation is required')
      .max(20, 'Too many operations in single request')
      .required('Operations array is required'),
  }),
});

// Cart export/import (for cart recovery or transfer)
export const cartImportSchema = yup.object({
  body: yup.object({
    cart_data: yup
      .object({
        items: yup
          .array()
          .of(
            yup.object({
              product_id: yup.string().uuid().required(),
              quantity: yup.number().integer().min(1).max(50).required(),
              custom_cake_config: yup.object().optional(),
            })
          )
          .required(),
        guest_info: yup
          .object({
            email: yup.string().email().optional(),
            phone: yup.string().optional(),
            name: yup.string().max(100).optional(),
          })
          .optional(),
      })
      .required('Cart data is required'),
    merge_strategy: yup
      .string()
      .oneOf(['replace', 'merge', 'skip_duplicates'], 'Invalid merge strategy')
      .optional()
      .default('merge'),
  }),
});