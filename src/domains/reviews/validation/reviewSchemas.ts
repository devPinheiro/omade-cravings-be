import * as yup from 'yup';

export const createReviewSchema = yup.object({
  body: yup.object({
    product_id: yup.string().uuid('Product ID must be a valid UUID').required('Product ID is required'),
    rating: yup.number().required('Rating is required').min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5').integer('Rating must be an integer'),
    comment: yup.string().max(1000, 'Comment cannot exceed 1000 characters').optional(),
  }),
});

export const getReviewsSchema = yup.object({
  params: yup.object({
    id: yup.string().uuid('Product ID must be a valid UUID').required('Product ID is required'),
  }),
  query: yup.object({
    page: yup.number().min(1, 'Page must be at least 1').integer('Page must be an integer').optional(),
    limit: yup.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').integer('Limit must be an integer').optional(),
  }),
});

export const deleteReviewSchema = yup.object({
  params: yup.object({
    reviewId: yup.string().uuid('Review ID must be a valid UUID').required('Review ID is required'),
  }),
});