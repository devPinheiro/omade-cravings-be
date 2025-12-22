import { Request, Response } from 'express';
import { LoyaltyService } from '../services/LoyaltyService';

const loyaltyService = new LoyaltyService();

export class LoyaltyController {
  async getLoyaltyPoints(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required',
        });
      }

      const loyaltyPoints = await loyaltyService.getUserLoyaltyPoints(userId);

      res.json({
        success: true,
        data: loyaltyPoints,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch loyalty points',
      });
    }
  }
}