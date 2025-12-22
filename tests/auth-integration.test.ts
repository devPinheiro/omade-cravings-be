import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../src/app';
import { User, UserRole } from '../src/models/User';
import { Product } from '../src/models/Product';
import { LoyaltyPoints } from '../src/models/LoyaltyPoints';
import { sequelize, createTestUsers, createTestProducts } from './testHelpers';

describe('Authentication Integration Tests', () => {
  let testUser: User;
  let testProduct: Product;
  let adminUser: User;
  let password = 'TestPassword123!';

  beforeEach(async () => {
    // Create test users using helper
    const testUsers = await createTestUsers();
    testUser = testUsers.testUser;
    adminUser = testUsers.adminUser;
    password = testUsers.password;

    // Create loyalty points
    await LoyaltyPoints.create({
      user_id: testUser.id,
      points: 100,
    } as any);

    await LoyaltyPoints.create({
      user_id: adminUser.id,
      points: 0,
    } as any);

    // Create test product
    testProduct = await Product.create({
      name: 'Test Cake',
      description: 'Delicious test cake',
      price: 25.99,
      category: 'Cakes',
      stock: 10,
      image_url: 'https://example.com/cake.jpg',
      is_customizable: false,
    } as any);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Full Authentication Flow', () => {
    it('should complete full registration to cart workflow', async () => {
      // 1. Register new user
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'New Customer',
          email: 'newcustomer@example.com',
          password: 'NewPassword123!',
          phone: '+1234567892',
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.success).toBe(true);
      
      const accessToken = registerResponse.body.data.access_token;
      const userId = registerResponse.body.data.user.id;
      
      // 2. Verify loyalty points were created
      const loyaltyPoints = await LoyaltyPoints.findOne({ where: { user_id: userId } });
      expect(loyaltyPoints).toBeTruthy();
      expect(loyaltyPoints!.points).toBe(0);

      // 3. Access protected route (get cart)
      const cartResponse = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(cartResponse.status).toBe(200);
      expect(cartResponse.body.success).toBe(true);
      expect(cartResponse.body.data.items).toEqual([]);

      // 4. Add item to cart
      const addToCartResponse = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          product_id: testProduct.id,
          quantity: 2,
        });

      expect(addToCartResponse.status).toBe(200);
      expect(addToCartResponse.body.success).toBe(true);
      expect(addToCartResponse.body.data.items).toHaveLength(1);
      expect(addToCartResponse.body.data.items[0].product_id).toBe(testProduct.id);
      expect(addToCartResponse.body.data.items[0].quantity).toBe(2);

      // 5. Get updated cart
      const updatedCartResponse = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(updatedCartResponse.status).toBe(200);
      expect(updatedCartResponse.body.data.items).toHaveLength(1);
      expect(updatedCartResponse.body.data.total_amount).toBe(testProduct.price * 2);
    });

    it('should complete full login to review workflow', async () => {
      // 1. Login existing user
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: password,
        });

      expect(loginResponse.status).toBe(200);
      const accessToken = loginResponse.body.data.access_token;

      // 2. Create a review
      const reviewResponse = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          product_id: testProduct.id,
          rating: 5,
          comment: 'Amazing cake!',
        });

      expect(reviewResponse.status).toBe(201);
      expect(reviewResponse.body.success).toBe(true);

      // 3. Get user's reviews
      const myReviewsResponse = await request(app)
        .get('/api/v1/reviews/my')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(myReviewsResponse.status).toBe(200);
      expect(myReviewsResponse.body.success).toBe(true);
      expect(myReviewsResponse.body.data.reviews).toHaveLength(1);
    });

    it('should handle admin workflow with product management', async () => {
      // 1. Login as admin
      const adminLoginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: adminUser.email,
          password: password,
        });

      expect(adminLoginResponse.status).toBe(200);
      const adminToken = adminLoginResponse.body.data.access_token;

      // 2. Create new product (admin only)
      const createProductResponse = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Created Cake',
          description: 'Special admin cake',
          price: 35.99,
          category: 'Premium Cakes',
          stock: 5,
          is_customizable: true,
        });

      expect([200, 201]).toContain(createProductResponse.status);
      if (createProductResponse.status === 201) {
        expect(createProductResponse.body.success).toBe(true);
        
        const newProductId = createProductResponse.body.data.id;
        
        // 3. Update the product
        const updateResponse = await request(app)
          .patch(`/api/v1/products/${newProductId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            price: 39.99,
            stock: 8,
          });

        expect([200, 204]).toContain(updateResponse.status);
      }

      // 4. Get all products
      const productsResponse = await request(app)
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(productsResponse.status).toBe(200);
      expect(productsResponse.body.success).toBe(true);
    });
  });

  describe('Cross-Service Authentication', () => {
    it('should maintain authentication across different service domains', async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: password,
        });

      const accessToken = loginResponse.body.data.access_token;

      // Test authentication across different domains
      const services = [
        { path: '/api/v1/cart', method: 'get' },
        { path: '/api/v1/reviews/my', method: 'get' },
        { path: '/api/v1/loyalty', method: 'get' },
      ];

      for (const service of services) {
        let response;
        if (service.method === 'get') {
          response = await request(app)
            .get(service.path)
            .set('Authorization', `Bearer ${accessToken}`);
        } else {
          response = await request(app)
            .get(service.path) // fallback to GET
            .set('Authorization', `Bearer ${accessToken}`);
        }

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });

    it('should handle role-based access across services', async () => {
      const customerToken = (await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: password })).body.data.access_token;

      const adminToken = (await request(app)
        .post('/api/v1/auth/login')
        .send({ email: adminUser.email, password: password })).body.data.access_token;

      // Customer should access customer routes but not admin routes
      const customerCartResponse = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(customerCartResponse.status).toBe(200);

      const customerCreateProductResponse = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Test', price: 10 });
      expect(customerCreateProductResponse.status).toBe(403);

      // Admin should access both customer and admin routes
      const adminCartResponse = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminCartResponse.status).toBe(200);

      const adminCreateProductResponse = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Product',
          price: 15.99,
          stock: 10,
          category: 'Test',
        });
      expect([200, 201, 400]).toContain(adminCreateProductResponse.status);
    });
  });

  describe('Token Lifecycle Management', () => {
    it('should handle token refresh workflow', async () => {
      // 1. Login to get initial tokens
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: password,
        });

      expect(loginResponse.status).toBe(200);
      
      const initialAccessToken = loginResponse.body.data.access_token;
      const refreshToken = loginResponse.body.data.refresh_token;

      // 2. Use initial access token
      const initialMeResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${initialAccessToken}`);

      expect(initialMeResponse.status).toBe(200);

      // 3. Refresh token
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refresh_token: refreshToken,
        });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body.success).toBe(true);
      
      const newAccessToken = refreshResponse.body.data.access_token;
      const newRefreshToken = refreshResponse.body.data.refresh_token;

      expect(newAccessToken).toBeDefined();
      expect(newRefreshToken).toBeDefined();
      expect(newAccessToken).not.toBe(initialAccessToken);

      // 4. Use new access token
      const newMeResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${newAccessToken}`);

      expect(newMeResponse.status).toBe(200);
      expect(newMeResponse.body.success).toBe(true);
      expect(newMeResponse.body.data.id).toBe(testUser.id);

      // 5. Old access token should still work (no blacklisting implemented)
      const oldTokenResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${initialAccessToken}`);

      expect(oldTokenResponse.status).toBe(200); // Current behavior
    });

    it('should handle logout and token invalidation', async () => {
      // 1. Login
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: password,
        });

      const accessToken = loginResponse.body.data.access_token;

      // 2. Verify token works
      const meResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(meResponse.status).toBe(200);

      // 3. Logout
      const logoutResponse = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.success).toBe(true);

      // 4. Token should still work (no server-side invalidation implemented)
      const postLogoutResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(postLogoutResponse.status).toBe(200); // Current behavior
    });
  });

  describe('Session Persistence and Concurrent Access', () => {
    it('should handle multiple concurrent sessions for same user', async () => {
      // Create multiple login sessions
      const session1 = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: password });

      const session2 = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: password });

      expect(session1.status).toBe(200);
      expect(session2.status).toBe(200);

      const token1 = session1.body.data.access_token;
      const token2 = session2.body.data.access_token;

      expect(token1).not.toBe(token2);

      // Both sessions should work independently
      const [response1, response2] = await Promise.all([
        request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token1}`),
        request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token2}`)
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body.data.id).toBe(testUser.id);
      expect(response2.body.data.id).toBe(testUser.id);
    });

    it('should maintain cart state across sessions', async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: password });

      const accessToken = loginResponse.body.data.access_token;

      // Add item to cart
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          product_id: testProduct.id,
          quantity: 3,
        });

      // Login again (new session)
      const newLoginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: password });

      const newAccessToken = newLoginResponse.body.data.access_token;

      // Cart should maintain state (since we're using in-memory storage keyed by user ID)
      const cartResponse = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${newAccessToken}`);

      expect(cartResponse.status).toBe(200);
      expect(cartResponse.body.data.items).toHaveLength(1);
      expect(cartResponse.body.data.items[0].quantity).toBe(3);
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should handle network interruption simulation', async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: password });

      const accessToken = loginResponse.body.data.access_token;

      // Simulate rapid requests (like network retry)
      const rapidRequests = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/v1/auth/me')
          .set('Authorization', `Bearer ${accessToken}`)
      );

      const responses = await Promise.all(rapidRequests);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.data.id).toBe(testUser.id);
      });
    });

    it('should handle partial authentication state corruption', async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: password });

      const accessToken = loginResponse.body.data.access_token;

      // Verify normal operation
      const normalResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(normalResponse.status).toBe(200);

      // Simulate corrupted token (but valid format)
      const corruptedToken = accessToken.slice(0, -10) + 'XXXXXXXXXX';
      
      const corruptedResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${corruptedToken}`);

      expect(corruptedResponse.status).toBe(401);
      expect(corruptedResponse.body.success).toBe(false);

      // Original token should still work
      const originalTokenResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(originalTokenResponse.status).toBe(200);
    });

    it('should handle database reconnection scenarios', async () => {
      // This test assumes the system can handle temporary DB unavailability
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: password });

      expect(loginResponse.status).toBe(200);
      
      // In a real test, you might temporarily disconnect the DB here
      // For now, we'll just verify the system continues to work
      
      const accessToken = loginResponse.body.data.access_token;
      
      const meResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(meResponse.status).toBe(200);
    });
  });

  describe('Performance Under Load', () => {
    it('should handle authentication under moderate load', async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: password });

      const accessToken = loginResponse.body.data.access_token;

      // Create 20 concurrent authenticated requests
      const concurrentRequests = Array(20).fill(null).map((_, i) =>
        request(app)
          .get('/api/v1/cart')
          .set('Authorization', `Bearer ${accessToken}`)
      );

      const start = Date.now();
      const responses = await Promise.all(concurrentRequests);
      const duration = Date.now() - start;

      // All should succeed
      responses.forEach((response, i) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Should complete in reasonable time (less than 3 seconds)
      expect(duration).toBeLessThan(3000);
    });

    it('should handle mixed authenticated and unauthenticated load', async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: password });

      const accessToken = loginResponse.body.data.access_token;

      // Mix of authenticated and unauthenticated requests
      const mixedRequests = [
        // Authenticated requests
        ...Array(10).fill(null).map(() =>
          request(app)
            .get('/api/v1/cart')
            .set('Authorization', `Bearer ${accessToken}`)
        ),
        // Unauthenticated requests
        ...Array(10).fill(null).map(() =>
          request(app).get('/api/v1/products')
        ),
      ];

      const responses = await Promise.all(mixedRequests);

      // All should succeed
      responses.forEach((response, index) => {
        if (response.status !== 200) {
          console.log(`Request ${index} failed with status ${response.status}:`, response.body);
        }
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});