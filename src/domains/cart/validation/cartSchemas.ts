import * as yup from 'yup';

export const addCartItemSchema = yup.object({
  body: yup.object({
    product_id: yup.string().uuid('Product ID must be a valid UUID').required('Product ID is required'),
    quantity: yup.number().required('Quantity is required').min(1, 'Quantity must be at least 1').integer('Quantity must be an integer'),
  }),
});

export const updateCartItemSchema = yup.object({
  params: yup.object({
    productId: yup.string().uuid('Product ID must be a valid UUID').required('Product ID is required'),
  }),
  body: yup.object({
    quantity: yup.number().required('Quantity is required').min(0, 'Quantity cannot be negative').integer('Quantity must be an integer'),
  }),
});

export const cartItemParamsSchema = yup.object({
  params: yup.object({
    productId: yup.string().uuid('Product ID must be a valid UUID').required('Product ID is required'),
  }),
});