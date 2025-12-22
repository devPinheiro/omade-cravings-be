import * as yup from 'yup';

export const categorySchema = yup.object({
  body: yup.object({
    name: yup.string().required('Category name is required').min(2, 'Category name must be at least 2 characters'),
    description: yup.string().optional(),
  }),
});

export const createProductSchema = yup.object({
  body: yup.object({
    name: yup.string().required('Product name is required').min(2, 'Name must be at least 2 characters'),
    description: yup.string().optional(),
    price: yup.number().required('Price is required').min(0, 'Price must be positive'),
    category: yup.string().optional(),
    stock: yup.number().required('Stock is required').min(0, 'Stock cannot be negative').integer('Stock must be an integer'),
    image_url: yup.string().url('Image URL must be valid').optional(),
    is_customizable: yup.boolean().optional().default(false),
  }),
});

export const updateProductSchema = yup.object({
  body: yup.object({
    name: yup.string().min(2, 'Name must be at least 2 characters').optional(),
    description: yup.string().optional(),
    price: yup.number().min(0, 'Price must be positive').optional(),
    category: yup.string().optional(),
    stock: yup.number().min(0, 'Stock cannot be negative').integer('Stock must be an integer').optional(),
    image_url: yup.string().url('Image URL must be valid').optional(),
    is_customizable: yup.boolean().optional(),
  }),
});

export const getProductsSchema = yup.object({
  query: yup.object({
    category: yup.string().optional(),
    search: yup.string().optional(),
    page: yup.number().min(1, 'Page must be at least 1').integer('Page must be an integer').optional(),
    limit: yup.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').integer('Limit must be an integer').optional(),
    minPrice: yup.number().min(0, 'Minimum price must be positive').optional(),
    maxPrice: yup.number().min(0, 'Maximum price must be positive').optional(),
    inStock: yup.boolean().optional(),
    sortBy: yup.string().oneOf(['name', 'price', 'createdAt', 'rating'], 'Invalid sort field').optional(),
    sortOrder: yup.string().oneOf(['ASC', 'DESC'], 'Invalid sort order').optional(),
    includeReviews: yup.boolean().optional(),
  }).optional().default({}),
});

export const productIdSchema = yup.object({
  params: yup.object({
    id: yup.string().uuid('Product ID must be a valid UUID').required('Product ID is required'),
  }),
});

export const updateStockSchema = yup.object({
  body: yup.object({
    stockChange: yup.number().integer('Stock change must be an integer').required('Stock change is required'),
  }),
});

export const bulkStockUpdateSchema = yup.object({
  body: yup.object({
    updates: yup.array().of(
      yup.object({
        id: yup.string().uuid('Product ID must be a valid UUID').required(),
        stock: yup.number().min(0, 'Stock cannot be negative').integer('Stock must be an integer').required(),
      })
    ).min(1, 'At least one update is required').required('Updates array is required'),
  }),
});

export const lowStockQuerySchema = yup.object({
  query: yup.object({
    threshold: yup.number().min(0, 'Threshold must be positive').integer('Threshold must be an integer').optional(),
  }).optional().default({}),
});