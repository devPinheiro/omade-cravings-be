import { ReviewService } from '../src/domains/reviews/services/ReviewService';
import { Product } from '../src/models/Product';
import { User, UserRole } from '../src/models/User';
import { Review } from '../src/models/Review';

describe('ReviewService', () => {
  let reviewService: ReviewService;
  let testUser: User;
  let testProduct: Product;

  beforeAll(() => {
    reviewService = new ReviewService();
  });

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password_hash: 'hashedpassword',
      role: UserRole.CUSTOMER,
      phone: '+1234567890',
    } as any);

    // Create test product
    testProduct = await Product.create({
      name: 'Test Product',
      description: 'Test description',
      price: 25.99,
      category: 'test',
      stock: 10,
      is_customizable: false,
    } as any);
  });

  describe('createReview', () => {
    const validReviewData = {
      user_id: '',
      product_id: '',
      rating: 5,
      comment: 'Excellent product!',
    };

    beforeEach(() => {
      validReviewData.user_id = testUser.id;
      validReviewData.product_id = testProduct.id;
    });

    it('should create a new review', async () => {
      const review = await reviewService.createReview(validReviewData);

      expect(review.user_id).toBe(testUser.id);
      expect(review.product_id).toBe(testProduct.id);
      expect(review.rating).toBe(5);
      expect(review.comment).toBe('Excellent product!');
      expect(review.createdAt).toBeDefined();
    });

    it('should create review without comment', async () => {
      const reviewData = { ...validReviewData };
      delete (reviewData as any).comment;

      const review = await reviewService.createReview(reviewData);

      expect(review.rating).toBe(5);
      expect(review.comment).toBeNull();
    });

    it('should throw error for duplicate review', async () => {
      await reviewService.createReview(validReviewData);

      await expect(
        reviewService.createReview(validReviewData)
      ).rejects.toThrow('You have already reviewed this product');
    });

    it('should throw error for non-existent product', async () => {
      const reviewData = {
        ...validReviewData,
        product_id: '550e8400-e29b-41d4-a716-446655440000',
      };

      await expect(
        reviewService.createReview(reviewData)
      ).rejects.toThrow('Product not found');
    });
  });

  describe('getProductReviews', () => {
    beforeEach(async () => {
      // Create multiple reviews
      const users = await User.bulkCreate([
        {
          name: 'User 1',
          email: 'user1@example.com',
          password_hash: 'hash1',
          role: UserRole.CUSTOMER,
        },
        {
          name: 'User 2',
          email: 'user2@example.com',
          password_hash: 'hash2',
          role: UserRole.CUSTOMER,
        },
        {
          name: 'User 3',
          email: 'user3@example.com',
          password_hash: 'hash3',
          role: UserRole.CUSTOMER,
        },
      ] as any);

      await Review.bulkCreate([
        {
          user_id: users[0].id,
          product_id: testProduct.id,
          rating: 5,
          comment: 'Great product!',
        },
        {
          user_id: users[1].id,
          product_id: testProduct.id,
          rating: 4,
          comment: 'Good quality',
        },
        {
          user_id: users[2].id,
          product_id: testProduct.id,
          rating: 3,
          comment: 'Average',
        },
      ] as any);
    });

    it('should return product reviews with user info', async () => {
      const result = await reviewService.getProductReviews({
        product_id: testProduct.id,
      });

      expect(result.reviews).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);

      // Check user information is included
      expect(result.reviews[0].user).toBeDefined();
      expect(result.reviews[0].user.name).toBeDefined();
      expect(result.reviews[0].user.id).toBeDefined();
    });

    it('should paginate reviews', async () => {
      const result = await reviewService.getProductReviews({
        product_id: testProduct.id,
        page: 1,
        limit: 2,
      });

      expect(result.reviews).toHaveLength(2);
      expect(result.totalPages).toBe(2);
    });

    it('should return empty result for product with no reviews', async () => {
      const anotherProduct = await Product.create({
        name: 'Another Product',
        price: 10.99,
        stock: 5,
      } as any);

      const result = await reviewService.getProductReviews({
        product_id: anotherProduct.id,
      });

      expect(result.reviews).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should order reviews by creation date (newest first)', async () => {
      const result = await reviewService.getProductReviews({
        product_id: testProduct.id,
      });

      const dates = result.reviews.map((r: any) => new Date(r.createdAt));
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i-1] >= dates[i]).toBe(true);
      }
    });
  });

  describe('getUserReviews', () => {
    beforeEach(async () => {
      const products = await Product.bulkCreate([
        { name: 'Product 1', price: 10.99, stock: 5 },
        { name: 'Product 2', price: 15.99, stock: 3 },
      ] as any);

      await Review.bulkCreate([
        {
          user_id: testUser.id,
          product_id: products[0].id,
          rating: 5,
          comment: 'Love it!',
        },
        {
          user_id: testUser.id,
          product_id: products[1].id,
          rating: 4,
          comment: 'Pretty good',
        },
      ] as any);
    });

    it('should return user reviews with product info', async () => {
      const result = await reviewService.getUserReviews(testUser.id);

      expect(result.reviews).toHaveLength(2);
      expect(result.total).toBe(2);

      // Check product information is included
      expect(result.reviews[0].product).toBeDefined();
      expect(result.reviews[0].product.name).toBeDefined();
      expect(result.reviews[0].product.image_url).toBeDefined();
    });

    it('should paginate user reviews', async () => {
      const result = await reviewService.getUserReviews(testUser.id, 1, 1);

      expect(result.reviews).toHaveLength(1);
      expect(result.totalPages).toBe(2);
    });
  });

  describe('getProductAverageRating', () => {
    it('should return 0 for product with no reviews', async () => {
      const result = await reviewService.getProductAverageRating(testProduct.id);

      expect(result.average).toBe(0);
      expect(result.count).toBe(0);
    });

    it('should calculate correct average rating', async () => {
      const users = await User.bulkCreate([
        { name: 'User 1', email: 'u1@test.com', password_hash: 'hash', role: UserRole.CUSTOMER },
        { name: 'User 2', email: 'u2@test.com', password_hash: 'hash', role: UserRole.CUSTOMER },
        { name: 'User 3', email: 'u3@test.com', password_hash: 'hash', role: UserRole.CUSTOMER },
      ] as any);

      await Review.bulkCreate([
        { user_id: users[0].id, product_id: testProduct.id, rating: 5 },
        { user_id: users[1].id, product_id: testProduct.id, rating: 4 },
        { user_id: users[2].id, product_id: testProduct.id, rating: 3 },
      ] as any);

      const result = await reviewService.getProductAverageRating(testProduct.id);

      expect(result.average).toBe(4.0); // (5 + 4 + 3) / 3 = 4.0
      expect(result.count).toBe(3);
    });

    it('should round average to 1 decimal place', async () => {
      const users = await User.bulkCreate([
        { name: 'User 1', email: 'u1@test.com', password_hash: 'hash', role: UserRole.CUSTOMER },
        { name: 'User 2', email: 'u2@test.com', password_hash: 'hash', role: UserRole.CUSTOMER },
      ] as any);

      await Review.bulkCreate([
        { user_id: users[0].id, product_id: testProduct.id, rating: 5 },
        { user_id: users[1].id, product_id: testProduct.id, rating: 4 },
      ] as any);

      const result = await reviewService.getProductAverageRating(testProduct.id);

      expect(result.average).toBe(4.5); // (5 + 4) / 2 = 4.5
      expect(result.count).toBe(2);
    });
  });

  describe('deleteReview', () => {
    let review: Review;

    beforeEach(async () => {
      review = await Review.create({
        user_id: testUser.id,
        product_id: testProduct.id,
        rating: 5,
        comment: 'Great!',
      } as any);
    });

    it('should delete user\'s own review', async () => {
      const result = await reviewService.deleteReview(review.id, testUser.id);

      expect(result).toBe(true);

      const deletedReview = await Review.findByPk(review.id);
      expect(deletedReview).toBeNull();
    });

    it('should return false for non-existent review', async () => {
      const result = await reviewService.deleteReview('550e8400-e29b-41d4-a716-446655440000', testUser.id);

      expect(result).toBe(false);
    });

    it('should return false when trying to delete another user\'s review', async () => {
      const anotherUser = await User.create({
        name: 'Another User',
        email: 'another@example.com',
        password_hash: 'hash',
        role: UserRole.CUSTOMER,
      } as any);

      const result = await reviewService.deleteReview(review.id, anotherUser.id);

      expect(result).toBe(false);

      // Review should still exist
      const existingReview = await Review.findByPk(review.id);
      expect(existingReview).not.toBeNull();
    });
  });
});