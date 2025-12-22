import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../src/app';
import { User, UserRole } from '../src/models/User';
import { LoyaltyPoints } from '../src/models/LoyaltyPoints';
import { sequelize } from '../src/config/database';

// Mock Redis for testing
jest.mock('../src/config/redis', () => ({
  getRedisClient: () => null,
  connectRedis: async () => null,
  disconnectRedis: async () => {},
}));

describe('Authentication API (Simple)', () => {
  let testUser: User;
  let testUserPassword = 'TestPassword123!';

  beforeAll(async () => {
    // Connect to test database
    await sequelize.authenticate();
    // Sync models
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // Clean all tables before each test
    await sequelize.truncate({ cascade: true, restartIdentity: true });

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

  afterAll(async () => {
    // Close database connection
    await sequelize.close();
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
  });
});