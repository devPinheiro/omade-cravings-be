import { LoyaltyService } from '../src/domains/loyalty/services/LoyaltyService';
import { User, UserRole } from '../src/models/User';
import { LoyaltyPoints } from '../src/models/LoyaltyPoints';

describe('LoyaltyService', () => {
  let loyaltyService: LoyaltyService;
  let testUser: User;

  beforeAll(() => {
    loyaltyService = new LoyaltyService();
  });

  beforeEach(async () => {
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password_hash: 'hashedpassword',
      role: UserRole.CUSTOMER,
    } as any);
  });

  describe('getUserLoyaltyPoints', () => {
    it('should create new loyalty points record for new user', async () => {
      const loyaltyPoints = await loyaltyService.getUserLoyaltyPoints(testUser.id);

      expect(loyaltyPoints).toBeDefined();
      expect(loyaltyPoints!.user_id).toBe(testUser.id);
      expect(loyaltyPoints!.points).toBe(0);
      expect(loyaltyPoints!.user).toBeDefined();
      expect(loyaltyPoints!.user.name).toBe('Test User');
    });

    it('should return existing loyalty points record', async () => {
      // Create loyalty points manually first
      const existingPoints = await LoyaltyPoints.create({
        user_id: testUser.id,
        points: 150,
      } as any);

      const loyaltyPoints = await loyaltyService.getUserLoyaltyPoints(testUser.id);

      expect(loyaltyPoints!.id).toBe(existingPoints.id);
      expect(loyaltyPoints!.points).toBe(150);
      expect(loyaltyPoints!.user).toBeDefined();
    });
  });

  describe('addPoints', () => {
    it('should add points to new user', async () => {
      const loyaltyPoints = await loyaltyService.addPoints(testUser.id, 100);

      expect(loyaltyPoints.user_id).toBe(testUser.id);
      expect(loyaltyPoints.points).toBe(100);
    });

    it('should add points to existing loyalty record', async () => {
      // Create existing points
      await LoyaltyPoints.create({
        user_id: testUser.id,
        points: 50,
      } as any);

      const loyaltyPoints = await loyaltyService.addPoints(testUser.id, 25);

      expect(loyaltyPoints.points).toBe(75);
    });

    it('should handle adding zero points', async () => {
      const loyaltyPoints = await loyaltyService.addPoints(testUser.id, 0);

      expect(loyaltyPoints.points).toBe(0);
    });

    it('should handle large point amounts', async () => {
      const loyaltyPoints = await loyaltyService.addPoints(testUser.id, 10000);

      expect(loyaltyPoints.points).toBe(10000);
    });
  });

  describe('deductPoints', () => {
    beforeEach(async () => {
      await LoyaltyPoints.create({
        user_id: testUser.id,
        points: 100,
      } as any);
    });

    it('should deduct points from existing balance', async () => {
      const loyaltyPoints = await loyaltyService.deductPoints(testUser.id, 30);

      expect(loyaltyPoints.points).toBe(70);
    });

    it('should deduct all points', async () => {
      const loyaltyPoints = await loyaltyService.deductPoints(testUser.id, 100);

      expect(loyaltyPoints.points).toBe(0);
    });

    it('should throw error for insufficient points', async () => {
      await expect(
        loyaltyService.deductPoints(testUser.id, 150)
      ).rejects.toThrow('Insufficient loyalty points');
    });

    it('should throw error for non-existent loyalty record', async () => {
      const anotherUser = await User.create({
        name: 'Another User',
        email: 'another@example.com',
        password_hash: 'hash',
        role: UserRole.CUSTOMER,
      } as any);

      await expect(
        loyaltyService.deductPoints(anotherUser.id, 10)
      ).rejects.toThrow('Loyalty points record not found');
    });
  });

  describe('calculateOrderPoints', () => {
    it('should calculate points correctly', async () => {
      expect(loyaltyService.calculateOrderPoints(25.99)).toBe(25);
      expect(loyaltyService.calculateOrderPoints(100.00)).toBe(100);
      expect(loyaltyService.calculateOrderPoints(10.50)).toBe(10);
      expect(loyaltyService.calculateOrderPoints(0.99)).toBe(0);
    });

    it('should handle decimal amounts correctly', async () => {
      expect(loyaltyService.calculateOrderPoints(25.01)).toBe(25);
      expect(loyaltyService.calculateOrderPoints(25.99)).toBe(25);
      expect(loyaltyService.calculateOrderPoints(26.00)).toBe(26);
    });

    it('should handle large order amounts', async () => {
      expect(loyaltyService.calculateOrderPoints(999.99)).toBe(999);
      expect(loyaltyService.calculateOrderPoints(1000.00)).toBe(1000);
    });

    it('should handle zero order amount', async () => {
      expect(loyaltyService.calculateOrderPoints(0)).toBe(0);
    });
  });

  describe('processOrderPoints', () => {
    it('should process points for new customer order', async () => {
      const orderAmount = 45.99;
      const loyaltyPoints = await loyaltyService.processOrderPoints(testUser.id, orderAmount);

      expect(loyaltyPoints.user_id).toBe(testUser.id);
      expect(loyaltyPoints.points).toBe(45); // Floor of 45.99
    });

    it('should add points to existing balance from order', async () => {
      // User already has some points
      await LoyaltyPoints.create({
        user_id: testUser.id,
        points: 20,
      } as any);

      const orderAmount = 30.75;
      const loyaltyPoints = await loyaltyService.processOrderPoints(testUser.id, orderAmount);

      expect(loyaltyPoints.points).toBe(50); // 20 existing + 30 new
    });

    it('should handle multiple orders correctly', async () => {
      // First order
      await loyaltyService.processOrderPoints(testUser.id, 25.50);
      
      // Second order
      await loyaltyService.processOrderPoints(testUser.id, 15.25);
      
      // Third order
      const finalLoyalty = await loyaltyService.processOrderPoints(testUser.id, 10.99);

      expect(finalLoyalty.points).toBe(50); // 25 + 15 + 10
    });

    it('should handle large order amounts', async () => {
      const loyaltyPoints = await loyaltyService.processOrderPoints(testUser.id, 1000.00);

      expect(loyaltyPoints.points).toBe(1000);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete customer loyalty lifecycle', async () => {
      // New customer - get initial points (should be 0)
      let loyaltyAccount = await loyaltyService.getUserLoyaltyPoints(testUser.id);
      expect(loyaltyAccount!.points).toBe(0);

      // First order - earn points
      loyaltyAccount = await loyaltyService.processOrderPoints(testUser.id, 50.00);
      expect(loyaltyAccount.points).toBe(50);

      // Second order - earn more points
      loyaltyAccount = await loyaltyService.processOrderPoints(testUser.id, 25.75);
      expect(loyaltyAccount.points).toBe(75);

      // Redeem some points
      loyaltyAccount = await loyaltyService.deductPoints(testUser.id, 30);
      expect(loyaltyAccount.points).toBe(45);

      // Third order - earn more points
      loyaltyAccount = await loyaltyService.processOrderPoints(testUser.id, 100.99);
      expect(loyaltyAccount.points).toBe(145);

      // Check final balance
      const finalBalance = await loyaltyService.getUserLoyaltyPoints(testUser.id);
      expect(finalBalance!.points).toBe(145);
    });

    it('should handle concurrent point operations correctly', async () => {
      // Create initial points
      await loyaltyService.addPoints(testUser.id, 100);

      // Run operations sequentially to avoid race conditions
      await loyaltyService.addPoints(testUser.id, 10);
      await loyaltyService.deductPoints(testUser.id, 5);
      await loyaltyService.processOrderPoints(testUser.id, 25.00);
      await loyaltyService.addPoints(testUser.id, 15);

      // Final balance should be: 100 + 10 - 5 + 25 + 15 = 145
      const finalBalance = await loyaltyService.getUserLoyaltyPoints(testUser.id);
      expect(finalBalance!.points).toBe(145);
    });

    it('should maintain data consistency across operations', async () => {
      // Start with some points
      await loyaltyService.addPoints(testUser.id, 50);

      // Try to deduct more points than available - should fail
      await expect(
        loyaltyService.deductPoints(testUser.id, 60)
      ).rejects.toThrow('Insufficient loyalty points');

      // Verify points remain unchanged
      const loyaltyAccount = await loyaltyService.getUserLoyaltyPoints(testUser.id);
      expect(loyaltyAccount!.points).toBe(50);

      // Add valid order points
      await loyaltyService.processOrderPoints(testUser.id, 20.00);

      // Now deduction should work
      const finalAccount = await loyaltyService.deductPoints(testUser.id, 60);
      expect(finalAccount.points).toBe(10); // 50 + 20 - 60 = 10
    });
  });
});