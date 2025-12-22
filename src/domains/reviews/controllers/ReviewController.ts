import { Request, Response } from 'express';
import { ReviewService } from '../services/ReviewService';

const reviewService = new ReviewService();

export class ReviewController {
  async createReview(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required',
        });
      }

      const { product_id, rating, comment } = req.body;
      
      const review = await reviewService.createReview({
        user_id: userId,
        product_id,
        rating,
        comment,
      });

      res.status(201).json({
        success: true,
        data: review,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create review',
      });
    }
  }

  async getProductReviews(req: Request, res: Response) {
    try {
      const { id: product_id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await reviewService.getProductReviews({
        product_id,
        page,
        limit,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch reviews',
      });
    }
  }

  async getUserReviews(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required',
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await reviewService.getUserReviews(userId, page, limit);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user reviews',
      });
    }
  }

  async deleteReview(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required',
        });
      }

      const { reviewId } = req.params;
      const deleted = await reviewService.deleteReview(reviewId, userId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Review not found or unauthorized',
        });
      }

      res.json({
        success: true,
        message: 'Review deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete review',
      });
    }
  }
}