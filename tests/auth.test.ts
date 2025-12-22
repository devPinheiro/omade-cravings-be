import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../src/app';
import { User, UserRole } from '../src/models/User';
import { LoyaltyPoints } from '../src/models/LoyaltyPoints';
import { JWTService } from '../src/shared/utils/jwt';

describe('Authentication API', () => {
  let testUser: User;
  let testUserPassword = 'TestPassword123!';

  beforeEach(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash(testUserPassword, 12);
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password_hash: hashedPassword,
      role: UserRole.CUSTOMER,
      phone: '+1234567890',
    } as any);

    // Create loyalty points
    await LoyaltyPoints.create({
      user_id: testUser.id,
      points: 0,
    } as any);
  });

  describe('POST /api/v1/auth/register', () => {
    const validRegistrationData = {
      name: 'New User',
      email: 'newuser@example.com',
      password: 'NewPassword123!',
      phone: '+1234567891',
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validRegistrationData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user.email).toBe(validRegistrationData.email.toLowerCase());
      expect(response.body.data.user.name).toBe(validRegistrationData.name);
      expect(response.body.data.user.role).toBe(UserRole.CUSTOMER);
      expect(response.body.data.access_token).toBeDefined();
      expect(response.body.data.refresh_token).toBeDefined();
      expect(response.body.data.expires_in).toBeDefined();

      // Should not return password hash
      expect(response.body.data.user.password_hash).toBeUndefined();

      // Verify user was created in database
      const createdUser = await User.findOne({ where: { email: validRegistrationData.email.toLowerCase() } });
      expect(createdUser).toBeTruthy();

      // Verify loyalty points account was created
      const loyaltyPoints = await LoyaltyPoints.findOne({ where: { user_id: createdUser!.id } });
      expect(loyaltyPoints).toBeTruthy();
      expect(loyaltyPoints!.points).toBe(0);
    });

    it('should hash the password properly', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(validRegistrationData);

      const createdUser = await User.findOne({ where: { email: validRegistrationData.email.toLowerCase() } });
      const isPasswordValid = await bcrypt.compare(validRegistrationData.password, createdUser!.password_hash);
      expect(isPasswordValid).toBe(true);
    });

    it('should convert email to lowercase', async () => {
      const dataWithUppercaseEmail = {
        ...validRegistrationData,
        email: 'UPPERCASE@EXAMPLE.COM',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(dataWithUppercaseEmail);

      expect(response.status).toBe(201);
      expect(response.body.data.user.email).toBe('uppercase@example.com');
    });

    it('should reject duplicate email', async () => {
      const duplicateEmailData = {
        ...validRegistrationData,
        email: testUser.email,
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(duplicateEmailData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email already registered');
    });

    it('should reject duplicate phone', async () => {
      const duplicatePhoneData = {
        ...validRegistrationData,
        phone: testUser.phone,
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(duplicatePhoneData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Phone number already registered');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate password strength', async () => {
      const weakPasswordData = {
        ...validRegistrationData,
        password: 'weak',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(weakPasswordData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Password must be at least 8 characters');
    });

    it('should validate email format', async () => {
      const invalidEmailData = {
        ...validRegistrationData,
        email: 'invalid-email',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidEmailData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Invalid email format');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUserPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user.id).toBe(testUser.id);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.access_token).toBeDefined();
      expect(response.body.data.refresh_token).toBeDefined();

      // Should not return password hash
      expect(response.body.data.user.password_hash).toBeUndefined();
    });

    it('should handle case insensitive email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email.toUpperCase(),
          password: testUserPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUserPassword,
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid email or password');
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid email or password');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const tokens = await JWTService.generateTokenPair(testUser.id, testUser.email, testUser.role);
      refreshToken = tokens.refreshToken;
    });

    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refresh_token: refreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Token refreshed successfully');
      expect(response.body.data.access_token).toBeDefined();
      expect(response.body.data.refresh_token).toBeDefined();
      expect(response.body.data.expires_in).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refresh_token: 'invalid-token',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid refresh token');
    });

    it('should reject missing refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Refresh token is required');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let accessToken: string;

    beforeEach(async () => {
      const tokens = await JWTService.generateTokenPair(testUser.id, testUser.email, testUser.role);
      accessToken = tokens.accessToken;
    });

    it('should return current user information', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testUser.id);
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.name).toBe(testUser.name);

      // Should not return password hash
      expect(response.body.data.password_hash).toBeUndefined();
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authentication failed');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let accessToken: string;

    beforeEach(async () => {
      const tokens = await JWTService.generateTokenPair(testUser.id, testUser.email, testUser.role);
      accessToken = tokens.accessToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');

      // Note: Redis token storage removed - logout relies on token expiration
    });

    it('should reject unauthenticated logout', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authentication required');
    });
  });

  describe('PUT /api/v1/auth/change-password', () => {
    let accessToken: string;

    beforeEach(async () => {
      const tokens = await JWTService.generateTokenPair(testUser.id, testUser.email, testUser.role);
      accessToken = tokens.accessToken;
    });

    it('should change password successfully', async () => {
      const newPassword = 'NewPassword456!';
      
      const response = await request(app)
        .put('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          current_password: testUserPassword,
          new_password: newPassword,
          confirm_password: newPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password changed successfully. Please login again.');

      // Verify password was changed
      const updatedUser = await User.findByPk(testUser.id);
      const isNewPasswordValid = await bcrypt.compare(newPassword, updatedUser!.password_hash);
      expect(isNewPasswordValid).toBe(true);

      // Note: Redis token storage removed - logout relies on token expiration
    });

    it('should reject incorrect current password', async () => {
      const response = await request(app)
        .put('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          current_password: 'wrongpassword',
          new_password: 'NewPassword456!',
          confirm_password: 'NewPassword456!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Current password is incorrect');
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .put('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          current_password: testUserPassword,
          new_password: 'weak',
          confirm_password: 'weak',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/v1/auth/change-password')
        .send({
          current_password: testUserPassword,
          new_password: 'NewPassword456!',
          confirm_password: 'NewPassword456!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authentication required');
    });
  });

  describe('POST /api/v1/auth/social', () => {
    it('should handle unsupported provider', async () => {
      const response = await request(app)
        .post('/api/v1/auth/social')
        .send({
          provider: 'unsupported',
          access_token: 'test-token',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Invalid provider');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/social')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    // Note: Testing actual social auth would require mocking external APIs
    // or using test tokens, which is beyond the scope of this basic test
  });
});