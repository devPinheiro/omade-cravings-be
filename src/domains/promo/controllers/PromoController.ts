import { Request, Response } from 'express';
import { PromoService } from '../services/PromoService';

const promoService = new PromoService();

export class PromoController {
  async validatePromoCode(req: Request, res: Response) {
    try {
      const { code } = req.query;
      const { order_amount } = req.body;

      if (!code || typeof code !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Promo code is required',
        });
      }

      if (!order_amount || typeof order_amount !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'Order amount is required',
        });
      }

      const result = await promoService.validatePromoCode(code, order_amount);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate promo code',
      });
    }
  }

  async createPromoCode(req: Request, res: Response) {
    try {
      const promo = await promoService.createPromoCode(req.body);

      res.status(201).json({
        success: true,
        data: promo,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create promo code',
      });
    }
  }

  async getPromoCodes(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await promoService.getPromoCodes(page, limit);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch promo codes',
      });
    }
  }

  async getActivePromoCodes(req: Request, res: Response) {
    try {
      const promoCodes = await promoService.getActivePromoCodes();

      res.json({
        success: true,
        data: promoCodes,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch active promo codes',
      });
    }
  }

  async deletePromoCode(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await promoService.deletePromoCode(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Promo code not found',
        });
      }

      res.json({
        success: true,
        message: 'Promo code deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete promo code',
      });
    }
  }
}