import { PromoService } from '../src/domains/promo/services/PromoService';
import { PromoCode, DiscountType } from '../src/models/PromoCode';

describe('PromoService', () => {
  let promoService: PromoService;

  beforeAll(() => {
    promoService = new PromoService();
  });

  describe('createPromoCode', () => {
    const validPromoData = {
      code: 'TEST10',
      discount_type: DiscountType.PERCENT,
      amount: 10,
      valid_from: new Date('2024-01-01'),
      valid_to: new Date('2024-12-31'),
      usage_limit: 100,
    };

    it('should create a new promo code', async () => {
      const promo = await promoService.createPromoCode(validPromoData);

      expect(promo.code).toBe('TEST10');
      expect(promo.discount_type).toBe(DiscountType.PERCENT);
      expect(parseFloat(promo.amount as any)).toBe(10);
      expect(promo.usage_limit).toBe(100);
      expect(promo.used_count).toBe(0);
    });

    it('should create promo code without usage limit', async () => {
      const promoData = { ...validPromoData, code: 'UNLIMITED' };
      delete (promoData as any).usage_limit;

      const promo = await promoService.createPromoCode(promoData);

      expect(promo.code).toBe('UNLIMITED');
      expect(promo.usage_limit).toBeNull();
    });

    it('should throw error for duplicate code', async () => {
      await promoService.createPromoCode(validPromoData);

      await expect(
        promoService.createPromoCode(validPromoData)
      ).rejects.toThrow('Promo code already exists');
    });

    it('should create fixed amount promo code', async () => {
      const fixedPromoData = {
        ...validPromoData,
        code: 'FIXED5',
        discount_type: DiscountType.FIXED,
        amount: 5.99,
      };

      const promo = await promoService.createPromoCode(fixedPromoData);

      expect(promo.discount_type).toBe(DiscountType.FIXED);
      expect(parseFloat(promo.amount as any)).toBe(5.99);
    });
  });

  describe('validatePromoCode', () => {
    let activePromo: PromoCode;
    let expiredPromo: PromoCode;
    let limitedPromo: PromoCode;

    beforeEach(async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Active promo
      activePromo = await PromoCode.create({
        code: 'ACTIVE10',
        discount_type: DiscountType.PERCENT,
        amount: 10,
        valid_from: yesterday,
        valid_to: tomorrow,
        usage_limit: 100,
        used_count: 0,
      } as any);

      // Expired promo
      expiredPromo = await PromoCode.create({
        code: 'EXPIRED',
        discount_type: DiscountType.PERCENT,
        amount: 15,
        valid_from: new Date('2023-01-01'),
        valid_to: new Date('2023-12-31'),
        usage_limit: 100,
        used_count: 0,
      } as any);

      // Usage limit reached
      limitedPromo = await PromoCode.create({
        code: 'LIMITED',
        discount_type: DiscountType.FIXED,
        amount: 5,
        valid_from: yesterday,
        valid_to: tomorrow,
        usage_limit: 10,
        used_count: 10,
      } as any);
    });

    it('should validate active percentage promo code', async () => {
      const orderAmount = 50;
      const result = await promoService.validatePromoCode('ACTIVE10', orderAmount);

      expect(result.valid).toBe(true);
      expect(result.promo).toBeDefined();
      expect(result.discount_amount).toBe(5); // 10% of 50
      expect(result.error).toBeUndefined();
    });

    it('should validate active fixed amount promo code', async () => {
      const fixedPromo = await PromoCode.create({
        code: 'FIXED15',
        discount_type: DiscountType.FIXED,
        amount: 15,
        valid_from: new Date(Date.now() - 24 * 60 * 60 * 1000),
        valid_to: new Date(Date.now() + 24 * 60 * 60 * 1000),
      } as any);

      const result = await promoService.validatePromoCode('FIXED15', 100);

      expect(result.valid).toBe(true);
      expect(result.discount_amount).toBe(15);
    });

    it('should not exceed order amount for fixed discount', async () => {
      const fixedPromo = await PromoCode.create({
        code: 'BIG50',
        discount_type: DiscountType.FIXED,
        amount: 50,
        valid_from: new Date(Date.now() - 24 * 60 * 60 * 1000),
        valid_to: new Date(Date.now() + 24 * 60 * 60 * 1000),
      } as any);

      const result = await promoService.validatePromoCode('BIG50', 30);

      expect(result.valid).toBe(true);
      expect(result.discount_amount).toBe(30); // Limited to order amount
    });

    it('should handle case-insensitive code validation', async () => {
      const result = await promoService.validatePromoCode('active10', 50);

      expect(result.valid).toBe(true);
      expect(result.discount_amount).toBe(5);
    });

    it('should reject invalid promo code', async () => {
      const result = await promoService.validatePromoCode('INVALID', 50);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid promo code');
      expect(result.discount_amount).toBeUndefined();
    });

    it('should reject expired promo code', async () => {
      const result = await promoService.validatePromoCode('EXPIRED', 50);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Promo code has expired');
    });

    it('should reject promo code with usage limit reached', async () => {
      const result = await promoService.validatePromoCode('LIMITED', 50);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Promo code usage limit reached');
    });
  });

  describe('usePromoCode', () => {
    let promo: PromoCode;

    beforeEach(async () => {
      promo = await PromoCode.create({
        code: 'USE_ME',
        discount_type: DiscountType.PERCENT,
        amount: 10,
        valid_from: new Date(Date.now() - 24 * 60 * 60 * 1000),
        valid_to: new Date(Date.now() + 24 * 60 * 60 * 1000),
        usage_limit: 5,
        used_count: 2,
      } as any);
    });

    it('should increment used_count', async () => {
      await promoService.usePromoCode(promo.id);

      const updatedPromo = await PromoCode.findByPk(promo.id);
      expect(updatedPromo!.used_count).toBe(3);
    });
  });

  describe('getPromoCodes', () => {
    beforeEach(async () => {
      await PromoCode.bulkCreate([
        {
          code: 'PROMO1',
          discount_type: DiscountType.PERCENT,
          amount: 10,
          valid_from: new Date('2024-01-01'),
          valid_to: new Date('2024-06-30'),
        },
        {
          code: 'PROMO2',
          discount_type: DiscountType.FIXED,
          amount: 15,
          valid_from: new Date('2024-01-01'),
          valid_to: new Date('2024-12-31'),
        },
        {
          code: 'PROMO3',
          discount_type: DiscountType.PERCENT,
          amount: 20,
          valid_from: new Date('2024-01-01'),
          valid_to: new Date('2024-03-31'),
        },
      ] as any);
    });

    it('should return paginated promo codes', async () => {
      const result = await promoService.getPromoCodes(1, 2);

      expect(result.promoCodes).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
      expect(result.totalPages).toBe(2);
    });

    it('should order by valid_to date descending', async () => {
      const result = await promoService.getPromoCodes();

      const validToDates = result.promoCodes.map((p: any) => new Date(p.valid_to));
      for (let i = 1; i < validToDates.length; i++) {
        expect(validToDates[i-1] >= validToDates[i]).toBe(true);
      }
    });
  });

  describe('getActivePromoCodes', () => {
    beforeEach(async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      await PromoCode.bulkCreate([
        {
          code: 'ACTIVE1',
          discount_type: DiscountType.PERCENT,
          amount: 10,
          valid_from: yesterday,
          valid_to: tomorrow,
          usage_limit: 100,
          used_count: 50,
        },
        {
          code: 'ACTIVE2',
          discount_type: DiscountType.FIXED,
          amount: 5,
          valid_from: yesterday,
          valid_to: nextWeek,
          usage_limit: null, // No limit
          used_count: 0,
        },
        {
          code: 'EXPIRED',
          discount_type: DiscountType.PERCENT,
          amount: 15,
          valid_from: new Date('2023-01-01'),
          valid_to: new Date('2023-12-31'),
        },
        {
          code: 'EXHAUSTED',
          discount_type: DiscountType.PERCENT,
          amount: 20,
          valid_from: yesterday,
          valid_to: tomorrow,
          usage_limit: 10,
          used_count: 10,
        },
      ] as any);
    });

    it('should return only active promo codes', async () => {
      const activePromos = await promoService.getActivePromoCodes();

      expect(activePromos).toHaveLength(2);
      expect(activePromos.map((p: any) => p.code)).toEqual(
        expect.arrayContaining(['ACTIVE1', 'ACTIVE2'])
      );
    });

    it('should order by valid_to date ascending', async () => {
      const activePromos = await promoService.getActivePromoCodes();

      const validToDates = activePromos.map((p: any) => new Date(p.valid_to));
      for (let i = 1; i < validToDates.length; i++) {
        expect(validToDates[i-1] <= validToDates[i]).toBe(true);
      }
    });
  });

  describe('deletePromoCode', () => {
    let promo: PromoCode;

    beforeEach(async () => {
      promo = await PromoCode.create({
        code: 'DELETE_ME',
        discount_type: DiscountType.PERCENT,
        amount: 10,
        valid_from: new Date('2024-01-01'),
        valid_to: new Date('2024-12-31'),
      } as any);
    });

    it('should delete existing promo code', async () => {
      const result = await promoService.deletePromoCode(promo.id);

      expect(result).toBe(true);

      const deletedPromo = await PromoCode.findByPk(promo.id);
      expect(deletedPromo).toBeNull();
    });

    it('should return false for non-existent promo code', async () => {
      const result = await promoService.deletePromoCode('550e8400-e29b-41d4-a716-446655440000');

      expect(result).toBe(false);
    });
  });
});