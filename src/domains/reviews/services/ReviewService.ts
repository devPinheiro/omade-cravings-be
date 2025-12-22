import { Review } from '../../../models/Review';
import { Product } from '../../../models/Product';
import { User } from '../../../models/User';

export interface CreateReviewData {
  user_id: string;
  product_id: string;
  rating: number;
  comment?: string;
}

export interface GetReviewsFilters {
  product_id: string;
  page?: number;
  limit?: number;
}

export class ReviewService {
  async createReview(data: CreateReviewData): Promise<Review> {
    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      where: {
        user_id: data.user_id,
        product_id: data.product_id,
      },
    });

    if (existingReview) {
      throw new Error('You have already reviewed this product');
    }

    // Verify product exists
    const product = await Product.findByPk(data.product_id);
    if (!product) {
      throw new Error('Product not found');
    }

    return await Review.create(data as any);
  }

  async getProductReviews(filters: GetReviewsFilters) {
    const { product_id, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const { rows: reviews, count: total } = await Review.findAndCountAll({
      where: { product_id },
      include: [
        {
          model: User,
          attributes: ['id', 'name'],
        },
      ],
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    });

    return {
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserReviews(userId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const { rows: reviews, count: total } = await Review.findAndCountAll({
      where: { user_id: userId },
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'image_url'],
        },
      ],
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    });

    return {
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProductAverageRating(productId: string): Promise<{ average: number; count: number }> {
    const reviews = await Review.findAll({
      where: { product_id: productId },
      attributes: ['rating'],
    });

    if (reviews.length === 0) {
      return { average: 0, count: 0 };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const average = totalRating / reviews.length;

    return {
      average: Math.round(average * 10) / 10, // Round to 1 decimal place
      count: reviews.length,
    };
  }

  async deleteReview(reviewId: string, userId: string): Promise<boolean> {
    const review = await Review.findOne({
      where: {
        id: reviewId,
        user_id: userId,
      },
    });

    if (!review) {
      return false;
    }

    await review.destroy();
    return true;
  }
}