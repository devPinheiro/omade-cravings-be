import { Router } from 'express';
import { LoyaltyController } from '../controllers/LoyaltyController';
import { authenticate } from '../../../shared/middleware/auth';

const router = Router();
const loyaltyController = new LoyaltyController();

/**
 * @swagger
 * /api/v1/loyalty:
 *   get:
 *     tags: [Loyalty]
 *     summary: Get user's loyalty points
 *     description: Retrieve the authenticated user's loyalty points balance and history
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Loyalty points retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     current_points:
 *                       type: integer
 *                       example: 250
 *                     total_earned:
 *                       type: integer
 *                       example: 1250
 *                     total_redeemed:
 *                       type: integer
 *                       example: 1000
 *                     points_value:
 *                       type: number
 *                       format: decimal
 *                       example: 2.50
 *                       description: Current points value in dollars
 *                     next_tier:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "Gold Member"
 *                         points_required:
 *                           type: integer
 *                           example: 500
 *                     history:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           transaction_type:
 *                             type: string
 *                             enum: [earned, redeemed, expired]
 *                             example: "earned"
 *                           points:
 *                             type: integer
 *                             example: 50
 *                           description:
 *                             type: string
 *                             example: "Points earned from order #ORD-20240101-001"
 *                           order_id:
 *                             type: string
 *                             format: uuid
 *                             nullable: true
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/',
  authenticate,
  loyaltyController.getLoyaltyPoints.bind(loyaltyController)
);

export { router as loyaltyRoutes };