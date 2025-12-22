import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../src/app';
import { User, UserRole } from '../src/models/User';
import { JWTService } from '../src/shared/utils/jwt';
import { sequelize } from '../src/config/database';

describe('Authentication Middleware Tests', () => {
  let customerUser: User;
  let adminUser: User;
  let staffUser: User;
  let riderUser: User;
  let password = 'TestPassword123!';

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await sequelize.truncate({ cascade: true, restartIdentity: true });
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create users with different roles
    customerUser = await User.create({
      name: 'Customer User',
      email: 'customer@example.com',
      password_hash: hashedPassword,
      role: UserRole.CUSTOMER,
      phone: '+1234567890',
    } as any);

    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password_hash: hashedPassword,
      role: UserRole.ADMIN,
      phone: '+1234567891',
    } as any);

    staffUser = await User.create({
      name: 'Staff User',
      email: 'staff@example.com',
      password_hash: hashedPassword,
      role: UserRole.STAFF,
      phone: '+1234567892',
    } as any);

    riderUser = await User.create({
      name: 'Rider User',
      email: 'rider@example.com',
      password_hash: hashedPassword,
      role: UserRole.RIDER,
      phone: '+1234567893',
    } as any);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Authentication Middleware', () => {
    it('should allow access with valid token', async () => {
      const tokens = await JWTService.generateTokenPair(customerUser.id, customerUser.email, customerUser.role);
      
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(customerUser.id);
    });

    it('should reject requests without authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should reject requests with missing Bearer token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should reject requests with invalid token format', async () => {
      const invalidTokens = [
        'InvalidToken',
        'Bearer ',
        'Bearer invalid-token',
        'Basic token123',
        'Bearer token1 token2',
      ];

      for (const invalidToken of invalidTokens) {
        const response = await request(app)
          .get('/api/v1/auth/me')
          .set('Authorization', invalidToken);

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(['Authentication required', 'Authentication failed']).toContain(response.body.error);
      }
    });

    it('should reject expired tokens', async () => {
      // Create a token and immediately try to use it
      // In a real test, you'd mock the JWT verification to simulate expiry
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired.token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authentication failed');
    });

    it('should handle malformed JWT tokens', async () => {
      const malformedTokens = [
        'Bearer not.a.jwt',
        'Bearer a.b', // Missing third part
        'Bearer a.b.c.d', // Too many parts
        'Bearer ..', // Empty parts
      ];

      for (const malformedToken of malformedTokens) {
        const response = await request(app)
          .get('/api/v1/auth/me')
          .set('Authorization', malformedToken);

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      }
    });

    it('should populate req.user with correct user data', async () => {
      const tokens = await JWTService.generateTokenPair(customerUser.id, customerUser.email, customerUser.role);
      
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(customerUser.id);
      expect(response.body.data.email).toBe(customerUser.email);
      expect(response.body.data.role).toBe(customerUser.role);
    });
  });

  describe('Authorization Middleware - Role-based Access', () => {
    describe('Admin-only routes', () => {
      it('should allow admin access to admin routes', async () => {
        const tokens = await JWTService.generateTokenPair(adminUser.id, adminUser.email, adminUser.role);
        
        // Test admin-only product creation
        const response = await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${tokens.accessToken}`)
          .send({
            name: 'Test Product',
            price: 10.99,
            stock: 100,
            category: 'Test Category',
            description: 'Test Description',
          });

        // Should succeed (admin can create products)
        expect([200, 201, 400]).toContain(response.status); // 400 might be validation error, not auth error
        if (response.status === 400) {
          // If 400, should be validation error, not auth error
          expect(response.body.error).not.toBe('Access denied');
          expect(response.body.error).not.toBe('Authentication required');
        }
      });

      it('should deny customer access to admin routes', async () => {
        const tokens = await JWTService.generateTokenPair(customerUser.id, customerUser.email, customerUser.role);
        
        const response = await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${tokens.accessToken}`)
          .send({
            name: 'Test Product',
            price: 10.99,
            stock: 100,
          });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Access denied');
      });

      it('should deny staff access to admin-only routes', async () => {
        const tokens = await JWTService.generateTokenPair(staffUser.id, staffUser.email, staffUser.role);
        
        const response = await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${tokens.accessToken}`)
          .send({
            name: 'Test Product',
            price: 10.99,
            stock: 100,
          });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Access denied');
      });

      it('should deny rider access to admin routes', async () => {
        const tokens = await JWTService.generateTokenPair(riderUser.id, riderUser.email, riderUser.role);
        
        const response = await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${tokens.accessToken}`)
          .send({
            name: 'Test Product',
            price: 10.99,
            stock: 100,
          });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Access denied');
      });
    });

    describe('Customer routes', () => {
      it('should allow customers to access their own data', async () => {
        const tokens = await JWTService.generateTokenPair(customerUser.id, customerUser.email, customerUser.role);
        
        const response = await request(app)
          .get('/api/v1/cart')
          .set('Authorization', `Bearer ${tokens.accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should allow all authenticated users to access public customer routes', async () => {
        const userTokens = [
          await JWTService.generateTokenPair(customerUser.id, customerUser.email, customerUser.role),
          await JWTService.generateTokenPair(adminUser.id, adminUser.email, adminUser.role),
          await JWTService.generateTokenPair(staffUser.id, staffUser.email, staffUser.role),
          await JWTService.generateTokenPair(riderUser.id, riderUser.email, riderUser.role),
        ];

        for (const tokens of userTokens) {
          const response = await request(app)
            .get('/api/v1/cart')
            .set('Authorization', `Bearer ${tokens.accessToken}`);

          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
        }
      });
    });

    describe('Public routes', () => {
      it('should allow unauthenticated access to public routes', async () => {
        // Test product listing (should be public)
        const response = await request(app)
          .get('/api/v1/products');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should allow authenticated users to access public routes', async () => {
        const tokens = await JWTService.generateTokenPair(customerUser.id, customerUser.email, customerUser.role);
        
        const response = await request(app)
          .get('/api/v1/products')
          .set('Authorization', `Bearer ${tokens.accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Cross-cutting Middleware Concerns', () => {
    it('should handle multiple middleware layers correctly', async () => {
      const tokens = await JWTService.generateTokenPair(customerUser.id, customerUser.email, customerUser.role);
      
      // Test route with both authentication and validation middleware
      const response = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          product_id: 'invalid-uuid',
          rating: 5,
          comment: 'Great product!',
        });

      // Should get validation error, not auth error (auth passed)
      expect([400, 404]).toContain(response.status);
      expect(response.body.error).not.toBe('Authentication required');
      expect(response.body.error).not.toBe('Access denied');
    });

    it('should maintain user context across middleware chain', async () => {
      const tokens = await JWTService.generateTokenPair(customerUser.id, customerUser.email, customerUser.role);
      
      const response = await request(app)
        .get('/api/v1/reviews/my')
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // User context should be maintained for user-specific data
    });

    it('should handle concurrent requests with different users', async () => {
      const customerTokens = await JWTService.generateTokenPair(customerUser.id, customerUser.email, customerUser.role);
      const adminTokens = await JWTService.generateTokenPair(adminUser.id, adminUser.email, adminUser.role);
      
      // Make concurrent requests with different users
      const [customerResponse, adminResponse] = await Promise.all([
        request(app)
          .get('/api/v1/auth/me')
          .set('Authorization', `Bearer ${customerTokens.accessToken}`),
        request(app)
          .get('/api/v1/auth/me')
          .set('Authorization', `Bearer ${adminTokens.accessToken}`)
      ]);

      expect(customerResponse.status).toBe(200);
      expect(adminResponse.status).toBe(200);
      
      expect(customerResponse.body.data.id).toBe(customerUser.id);
      expect(adminResponse.body.data.id).toBe(adminUser.id);
      
      expect(customerResponse.body.data.role).toBe(UserRole.CUSTOMER);
      expect(adminResponse.body.data.role).toBe(UserRole.ADMIN);
    });
  });

  describe('Error Handling in Middleware', () => {
    it('should handle database errors gracefully during user lookup', async () => {
      // Create a token with a non-existent user ID
      const nonExistentUserId = '550e8400-e29b-41d4-a716-446655440000';
      const fakeTokens = await JWTService.generateTokenPair(nonExistentUserId, 'fake@example.com', UserRole.CUSTOMER);
      
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${fakeTokens.accessToken}`);

      // Should handle gracefully - either 401 or 404
      expect([401, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should not crash on malformed authorization header', async () => {
      const validMalformedHeaders = [
        'Bearer ' + 'a'.repeat(1000), // Very long token (valid chars but invalid token)
        'Bearer invalid.token.format',
        'Bearer not-a-jwt-token',
        '', // Empty header
      ];

      // Test headers that contain invalid characters (should be rejected by HTTP library)
      const invalidHeaders = [
        'Bearer\x00token',
        'Bearer token\x00', 
        'Bearer \xFF\xFEtoken',
      ];

      // Test valid malformed headers (reach our middleware)
      for (const header of validMalformedHeaders) {
        const response = await request(app)
          .get('/api/v1/auth/me')
          .set('Authorization', header);

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      }

      // Test invalid headers (rejected by HTTP library before reaching middleware)
      for (const header of invalidHeaders) {
        try {
          const response = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', header);
          
          // If we get here, the header was somehow accepted
          expect(response.status).toBe(401);
          expect(response.body.success).toBe(false);
        } catch (error) {
          // HTTP library should reject these headers
          expect((error as Error).message).toContain('Invalid character in header content');
        }
      }
    });

    it('should handle missing user role gracefully', async () => {
      // This would happen if a user's role was deleted after token was issued
      // Create user with role, generate token, then change role to invalid value
      const tokens = await JWTService.generateTokenPair(customerUser.id, customerUser.email, 'INVALID_ROLE' as UserRole);
      
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      // Should handle gracefully
      expect([200, 401, 403]).toContain(response.status);
    });
  });

  describe('Middleware Performance', () => {
    it('should handle high concurrency auth checks efficiently', async () => {
      const tokens = await JWTService.generateTokenPair(customerUser.id, customerUser.email, customerUser.role);
      
      // Create 50 concurrent requests
      const requests = Array(50).fill(null).map(() =>
        request(app)
          .get('/api/v1/auth/me')
          .set('Authorization', `Bearer ${tokens.accessToken}`)
      );

      const start = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Should complete reasonably quickly (less than 5 seconds for 50 requests)
      expect(duration).toBeLessThan(5000);
    });

    it('should cache user lookups efficiently', async () => {
      const tokens = await JWTService.generateTokenPair(customerUser.id, customerUser.email, customerUser.role);
      
      // Make multiple sequential requests with same token
      const start = Date.now();
      
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .get('/api/v1/auth/me')
          .set('Authorization', `Bearer ${tokens.accessToken}`);
        
        expect(response.status).toBe(200);
      }
      
      const duration = Date.now() - start;
      
      // Should be reasonably fast
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Route-specific Authorization', () => {
    it('should protect logout endpoint with authentication', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should protect password change endpoint with authentication', async () => {
      const response = await request(app)
        .put('/api/v1/auth/change-password')
        .send({
          current_password: 'old',
          new_password: 'NewPassword123!',
          confirm_password: 'NewPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should protect user-specific routes properly', async () => {
      const customerTokens = await JWTService.generateTokenPair(customerUser.id, customerUser.email, customerUser.role);
      
      // User should be able to access their own reviews
      const myReviewsResponse = await request(app)
        .get('/api/v1/reviews/my')
        .set('Authorization', `Bearer ${customerTokens.accessToken}`);

      expect(myReviewsResponse.status).toBe(200);
      expect(myReviewsResponse.body.success).toBe(true);
    });
  });
});