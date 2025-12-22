import * as yup from 'yup';

export const validatePromoSchema = yup.object({
  query: yup.object({
    code: yup.string().required('Promo code is required'),
  }),
  body: yup.object({
    order_amount: yup.number().required('Order amount is required').min(0, 'Order amount must be positive'),
  }),
});

export const createPromoSchema = yup.object({
  body: yup.object({
    code: yup.string().required('Promo code is required').min(3, 'Code must be at least 3 characters').uppercase(),
    discount_type: yup.string().oneOf(['percent', 'fixed'], 'Discount type must be "percent" or "fixed"').required('Discount type is required'),
    amount: yup.number().required('Amount is required').min(0, 'Amount must be positive'),
    valid_from: yup.date().required('Valid from date is required'),
    valid_to: yup.date().required('Valid to date is required').min(yup.ref('valid_from'), 'Valid to date must be after valid from date'),
    usage_limit: yup.number().min(1, 'Usage limit must be at least 1').integer('Usage limit must be an integer').optional(),
  }),
});

export const getPromosSchema = yup.object({
  query: yup.object({
    page: yup.number().min(1, 'Page must be at least 1').integer('Page must be an integer').optional(),
    limit: yup.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').integer('Limit must be an integer').optional(),
  }),
});

export const promoIdSchema = yup.object({
  params: yup.object({
    id: yup.string().uuid('Promo code ID must be a valid UUID').required('Promo code ID is required'),
  }),
});