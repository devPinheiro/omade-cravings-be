import { LoyaltyPoints } from '../../../models/LoyaltyPoints';
import { User } from '../../../models/User';

export class LoyaltyService {
  async getUserLoyaltyPoints(userId: string): Promise<LoyaltyPoints | null> {
    let loyaltyPoints = await LoyaltyPoints.findOne({
      where: { user_id: userId },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    // Create loyalty points record if it doesn't exist
    if (!loyaltyPoints) {
      loyaltyPoints = await LoyaltyPoints.create({
        user_id: userId,
        points: 0,
      });

      // Reload with user data
      loyaltyPoints = await LoyaltyPoints.findOne({
        where: { user_id: userId },
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email'],
          },
        ],
      });
    }

    return loyaltyPoints;
  }

  async addPoints(userId: string, pointsToAdd: number): Promise<LoyaltyPoints> {
    let loyaltyPoints = await LoyaltyPoints.findOne({
      where: { user_id: userId },
    });

    if (!loyaltyPoints) {
      loyaltyPoints = await LoyaltyPoints.create({
        user_id: userId,
        points: pointsToAdd,
      });
    } else {
      await loyaltyPoints.update({
        points: loyaltyPoints.points + pointsToAdd,
      });
      await loyaltyPoints.reload();
    }

    return loyaltyPoints;
  }

  async deductPoints(userId: string, pointsToDeduct: number): Promise<LoyaltyPoints> {
    const loyaltyPoints = await LoyaltyPoints.findOne({
      where: { user_id: userId },
    });

    if (!loyaltyPoints) {
      throw new Error('Loyalty points record not found');
    }

    if (loyaltyPoints.points < pointsToDeduct) {
      throw new Error('Insufficient loyalty points');
    }

    await loyaltyPoints.update({
      points: loyaltyPoints.points - pointsToDeduct,
    });
    await loyaltyPoints.reload();

    return loyaltyPoints;
  }

  calculateOrderPoints(orderAmount: number): number {
    // Award 1 point for every $1 spent
    return Math.floor(orderAmount);
  }

  async processOrderPoints(userId: string, orderAmount: number): Promise<LoyaltyPoints> {
    const pointsToAdd = this.calculateOrderPoints(orderAmount);
    return await this.addPoints(userId, pointsToAdd);
  }
}