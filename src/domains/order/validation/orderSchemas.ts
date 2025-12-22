import * as yup from 'yup';
import { OrderStatus, PaymentStatus, PaymentMethod } from '../../../models/Order';

export const createOrderSchema = yup.object({
  body: yup.object({
    // Guest information (required if not authenticated)
    guest_email: yup
      .string()
      .email('Invalid email format')
      .when('$isAuthenticated', {
        is: false,
        then: (schema) => schema.required('Guest email is required for guest orders'),
        otherwise: (schema) => schema.optional(),
      }),
    guest_phone: yup
      .string()
      .matches(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
      .when('$isAuthenticated', {
        is: false,
        then: (schema) => schema.when('guest_email', {
          is: (email: string) => !email,
          then: (schema) => schema.required('Either guest email or phone is required'),
          otherwise: (schema) => schema.optional(),
        }),
        otherwise: (schema) => schema.optional(),
      }),
    guest_name: yup
      .string()
      .min(2, 'Guest name must be at least 2 characters')
      .when('$isAuthenticated', {
        is: false,
        then: (schema) => schema.required('Guest name is required for guest orders'),
        otherwise: (schema) => schema.optional(),
      }),

    // Order details
    payment_method: yup
      .string()
      .oneOf(Object.values(PaymentMethod), 'Invalid payment method')
      .optional()
      .default(PaymentMethod.CASH),
    pickup_instructions: yup.string().max(500, 'Pickup instructions too long').optional(),
    preferred_pickup_date: yup
      .date()
      .min(new Date(), 'Pickup date must be in the future')
      .optional(),
    preferred_pickup_time: yup
      .string()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)')
      .optional(),
    promo_code: yup.string().max(50, 'Promo code too long').optional(),

    // Direct items (for creating order without cart)
    items: yup
      .array()
      .of(
        yup.object({
          product_id: yup.string().uuid('Invalid product ID').required('Product ID is required'),
          quantity: yup
            .number()
            .integer('Quantity must be an integer')
            .min(1, 'Quantity must be at least 1')
            .max(50, 'Quantity cannot exceed 50')
            .required('Quantity is required'),
          custom_cake_config: yup
            .object({
              flavor: yup.string().max(100, 'Flavor name too long').optional(),
              size: yup.string().max(50, 'Size too long').optional(),
              frosting: yup.string().max(100, 'Frosting type too long').optional(),
              message: yup.string().max(200, 'Message too long').optional(),
              image_reference: yup.string().url('Invalid image URL').optional(),
              extra_details: yup.object().optional(),
            })
            .optional(),
        })
      )
      .optional(),
  }),
});

export const createGuestOrderSchema = yup.object({
  body: yup.object({
    // Guest information (required for guest orders)
    guest_email: yup
      .string()
      .email('Invalid email format')
      .optional(),
    guest_phone: yup
      .string()
      .matches(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
      .optional(),
    guest_name: yup
      .string()
      .min(2, 'Guest name must be at least 2 characters')
      .required('Guest name is required'),

    // Order details
    payment_method: yup
      .string()
      .oneOf(Object.values(PaymentMethod), 'Invalid payment method')
      .optional()
      .default(PaymentMethod.CASH),
    pickup_instructions: yup.string().max(500, 'Pickup instructions too long').optional(),
    preferred_pickup_date: yup
      .date()
      .min(new Date(), 'Pickup date must be in the future')
      .optional(),
    preferred_pickup_time: yup
      .string()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)')
      .optional(),
    promo_code: yup.string().max(50, 'Promo code too long').optional(),

    // Items (required for guest orders since they don't have persistent carts)
    items: yup
      .array()
      .of(
        yup.object({
          product_id: yup.string().uuid('Invalid product ID').required('Product ID is required'),
          quantity: yup
            .number()
            .integer('Quantity must be an integer')
            .min(1, 'Quantity must be at least 1')
            .max(50, 'Quantity cannot exceed 50')
            .required('Quantity is required'),
          custom_cake_config: yup
            .object({
              flavor: yup.string().max(100, 'Flavor name too long').optional(),
              size: yup.string().max(50, 'Size too long').optional(),
              frosting: yup.string().max(100, 'Frosting type too long').optional(),
              message: yup.string().max(200, 'Message too long').optional(),
              image_reference: yup.string().url('Invalid image URL').optional(),
              extra_details: yup.object().optional(),
            })
            .optional(),
        })
      )
      .min(1, 'At least one item is required')
      .required('Items are required'),
  }).test(
    'contact-info',
    'Either guest_email or guest_phone is required',
    function(value) {
      return !!(value?.guest_email || value?.guest_phone);
    }
  ),
});

export const updateOrderStatusSchema = yup.object({
  body: yup.object({
    status: yup
      .string()
      .oneOf(Object.values(OrderStatus), 'Invalid order status')
      .optional(),
    payment_status: yup
      .string()
      .oneOf(Object.values(PaymentStatus), 'Invalid payment status')
      .optional(),
    payment_method: yup
      .string()
      .oneOf(Object.values(PaymentMethod), 'Invalid payment method')
      .optional(),
    payment_reference: yup.string().max(200, 'Payment reference too long').optional(),
    pickup_instructions: yup.string().max(500, 'Pickup instructions too long').optional(),
    preferred_pickup_date: yup.date().optional(),
    preferred_pickup_time: yup
      .string()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)')
      .optional(),
    staff_notes: yup.string().max(1000, 'Staff notes too long').optional(),
  }),
});

export const updatePaymentStatusSchema = yup.object({
  body: yup.object({
    payment_status: yup
      .string()
      .oneOf(Object.values(PaymentStatus), 'Invalid payment status')
      .required('Payment status is required'),
    payment_reference: yup.string().max(200, 'Payment reference too long').optional(),
    payment_method: yup
      .string()
      .oneOf(Object.values(PaymentMethod), 'Invalid payment method')
      .optional(),
  }),
});

export const getOrdersSchema = yup.object({
  query: yup.object({
    status: yup.string().oneOf(Object.values(OrderStatus), 'Invalid order status').optional(),
    payment_status: yup
      .string()
      .oneOf(Object.values(PaymentStatus), 'Invalid payment status')
      .optional(),
    payment_method: yup
      .string()
      .oneOf(Object.values(PaymentMethod), 'Invalid payment method')
      .optional(),
    date_from: yup.date().optional(),
    date_to: yup.date().optional(),
    order_number: yup.string().max(50, 'Order number too long').optional(),
    guest_email: yup.string().email('Invalid email format').optional(),
    guest_phone: yup
      .string()
      .matches(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
      .optional(),
    page: yup
      .number()
      .integer('Page must be an integer')
      .min(1, 'Page must be at least 1')
      .optional(),
    limit: yup
      .number()
      .integer('Limit must be an integer')
      .min(1, 'Limit must be at least 1')
      .max(100, 'Limit cannot exceed 100')
      .optional(),
  }),
});

export const orderIdSchema = yup.object({
  params: yup.object({
    id: yup.string().uuid('Invalid order ID').required('Order ID is required'),
  }),
});

export const orderNumberSchema = yup.object({
  params: yup.object({
    order_number: yup
      .string()
      .matches(/^ORD\d{8}\d{3}$/, 'Invalid order number format')
      .required('Order number is required'),
  }),
});

export const orderStatusSchema = yup.object({
  params: yup.object({
    status: yup
      .string()
      .oneOf(Object.values(OrderStatus), 'Invalid order status')
      .required('Order status is required'),
  }),
});

export const trackOrderSchema = yup.object({
  params: yup.object({
    order_number: yup
      .string()
      .matches(/^ORD\d{8}\d{3}$/, 'Invalid order number format')
      .required('Order number is required'),
  }),
  query: yup.object({
    email: yup.string().email('Invalid email format').optional(),
    phone: yup
      .string()
      .matches(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
      .optional(),
  }),
});

export const cancelOrderSchema = yup.object({
  body: yup.object({
    reason: yup.string().max(500, 'Cancellation reason too long').optional(),
  }),
});

export const customCakeConfigSchema = yup.object({
  body: yup.object({
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
    extra_details: yup.object({
      layers: yup.number().integer().min(1).max(5).optional(),
      decorations: yup.array().of(yup.string()).optional(),
      allergens: yup.array().of(yup.string()).optional(),
      dietary_restrictions: yup.array().of(yup.string()).optional(),
      special_instructions: yup.string().max(500).optional(),
    }).optional(),
  }),
});

// Validation for order statistics date range
export const orderStatisticsSchema = yup.object({
  query: yup.object({
    date_from: yup.date().optional(),
    date_to: yup
      .date()
      .when('date_from', {
        is: (date_from: Date) => !!date_from,
        then: (schema) => schema.min(yup.ref('date_from'), 'End date must be after start date'),
        otherwise: (schema) => schema.optional(),
      })
      .optional(),
  }),
});