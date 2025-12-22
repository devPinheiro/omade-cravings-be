import { PromoCode, DiscountType } from '../../../models/PromoCode';
import { Op } from 'sequelize';

export interface CreatePromoCodeData {
  code: string;
  discount_type: DiscountType;
  amount: number;
  valid_from: Date;
  valid_to: Date;
  usage_limit?: number;
}

export interface ValidatePromoResult {
  valid: boolean;
  promo?: PromoCode;
  discount_amount?: number;
  error?: string;
}

export class PromoService {
  async createPromoCode(data: CreatePromoCodeData): Promise<PromoCode> {
    // Check if code already exists
    const existingPromo = await PromoCode.findOne({
      where: { code: data.code },
    });

    if (existingPromo) {
      throw new Error('Promo code already exists');
    }

    return await PromoCode.create(data as any);
  }

  async validatePromoCode(code: string, orderAmount: number): Promise<ValidatePromoResult> {
    const promo = await PromoCode.findOne({
      where: { code: code.toUpperCase() },
    });

    if (!promo) {
      return {
        valid: false,
        error: 'Invalid promo code',
      };
    }

    const now = new Date();

    // Check if promo is within valid date range
    if (now < promo.valid_from || now > promo.valid_to) {
      return {
        valid: false,
        error: 'Promo code has expired',
      };
    }

    // Check usage limit
    if (promo.usage_limit && promo.used_count >= promo.usage_limit) {
      return {
        valid: false,
        error: 'Promo code usage limit reached',
      };
    }

    // Calculate discount
    let discount_amount = 0;
    if (promo.discount_type === DiscountType.PERCENT) {
      discount_amount = (orderAmount * promo.amount) / 100;
    } else {
      discount_amount = promo.amount;
    }

    // Ensure discount doesn't exceed order amount
    discount_amount = Math.min(discount_amount, orderAmount);

    return {
      valid: true,
      promo,
      discount_amount,
    };
  }

  async usePromoCode(promoId: string): Promise<void> {
    await PromoCode.increment('used_count', {
      where: { id: promoId },
    });
  }

  async getPromoCodes(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const { rows: promoCodes, count: total } = await PromoCode.findAndCountAll({
      offset,
      limit,
      order: [['valid_to', 'DESC']],
    });

    return {
      promoCodes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getActivePromoCodes() {
    const now = new Date();

    return await PromoCode.findAll({
      where: {
        valid_from: { [Op.lte]: now },
        valid_to: { [Op.gte]: now },
        [Op.or]: [
          { usage_limit: null },
          { used_count: { [Op.lt]: require('sequelize').col('usage_limit') } },
        ],
      },
      order: [['valid_to', 'ASC']],
    });
  }

  async deletePromoCode(id: string): Promise<boolean> {
    const deleted = await PromoCode.destroy({
      where: { id },
    });
    return deleted > 0;
  }
}