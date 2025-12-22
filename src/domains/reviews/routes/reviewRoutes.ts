import { Router } from 'express';
import { ReviewController } from '../controllers/ReviewController';
import { validate } from '../../../shared/validation/validator';
import { authenticate } from '../../../shared/middleware/auth';
import {
  createReviewSchema,
  getReviewsSchema,
  deleteReviewSchema,
} from '../validation/reviewSchemas';

const router = Router();
const reviewController = new ReviewController();

// POST /reviews - Create a new review
router.post(
  '/',
  authenticate,
  validate(createReviewSchema),
  reviewController.createReview.bind(reviewController)
);

// GET /reviews/product/:id - Get reviews for a specific product
router.get(
  '/product/:id',
  validate(getReviewsSchema),
  reviewController.getProductReviews.bind(reviewController)
);

// GET /reviews/my - Get current user's reviews
router.get(
  '/my',
  authenticate,
  reviewController.getUserReviews.bind(reviewController)
);

// DELETE /reviews/:reviewId - Delete a review
router.delete(
  '/:reviewId',
  authenticate,
  validate(deleteReviewSchema),
  reviewController.deleteReview.bind(reviewController)
);

export { router as reviewRoutes };