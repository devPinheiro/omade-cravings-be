import { Router } from 'express';
import { PromoController } from '../controllers/PromoController';
import { validate } from '../../../shared/validation/validator';
import { adminOnly } from '../../../shared/middleware/auth';
import {
  validatePromoSchema,
  createPromoSchema,
  getPromosSchema,
  promoIdSchema,
} from '../validation/promoSchemas';

const router = Router();
const promoController = new PromoController();

/**
 * @swagger
 * /api/v1/promo/validate:
 *   get:
 *     tags: [Promotions]
 *     summary: Validate promo code
 *     description: Check if a promo code is valid and get discount information
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           example: "SAVE10"
 *         description: Promo code to validate
 *       - in: query
 *         name: order_total
 *         schema:
 *           type: number
 *           format: decimal
 *           example: 50.00
 *         description: Order total for validation (optional)
 *     responses:
 *       200:
 *         description: Promo code validation result
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
 *                     valid:
 *                       type: boolean
 *                       example: true
 *                     code:
 *                       type: string
 *                       example: "SAVE10"
 *                     discount_type:
 *                       type: string
 *                       enum: [percent, fixed]
 *                       example: "percent"
 *                     discount_amount:
 *                       type: number
 *                       format: decimal
 *                       example: 10.00
 *                     minimum_order:
 *                       type: number
 *                       format: decimal
 *                       example: 25.00
 *                     maximum_discount:
 *                       type: number
 *                       format: decimal
 *                       example: 50.00
 *                     usage_limit:
 *                       type: integer
 *                       example: 100
 *                     used_count:
 *                       type: integer
 *                       example: 25
 *                     valid_from:
 *                       type: string
 *                       format: date-time
 *                     valid_to:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         description: Promo code not found or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Promo code not found or expired"
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/validate',
  validate(validatePromoSchema),
  promoController.validatePromoCode.bind(promoController)
);

/**
 * @swagger
 * /api/v1/promo:
 *   get:
 *     tags: [Promotions]
 *     summary: Get all promo codes
 *     description: Retrieve all promo codes (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, expired, disabled]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Promo codes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       code:
 *                         type: string
 *                         example: "SAVE10"
 *                       discount_type:
 *                         type: string
 *                         enum: [percent, fixed]
 *                       discount_amount:
 *                         type: number
 *                         format: decimal
 *                       valid_from:
 *                         type: string
 *                         format: date-time
 *                       valid_to:
 *                         type: string
 *                         format: date-time
 *                       usage_limit:
 *                         type: integer
 *                       used_count:
 *                         type: integer
 *                       status:
 *                         type: string
 *                         enum: [active, expired, disabled]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/',
  adminOnly,
  validate(getPromosSchema),
  promoController.getPromoCodes.bind(promoController)
);

// GET /promo/active - Get active promo codes (admin only)
router.get(
  '/active',
  adminOnly,
  promoController.getActivePromoCodes.bind(promoController)
);

/**
 * @swagger
 * /api/v1/promo:
 *   post:
 *     tags: [Promotions]
 *     summary: Create promo code
 *     description: Create a new promotional code (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - discount_type
 *               - discount_amount
 *               - valid_from
 *               - valid_to
 *             properties:
 *               code:
 *                 type: string
 *                 example: "SAVE15"
 *                 description: Unique promo code
 *               discount_type:
 *                 type: string
 *                 enum: [percent, fixed]
 *                 example: "percent"
 *               discount_amount:
 *                 type: number
 *                 format: decimal
 *                 example: 15.00
 *                 description: Discount amount (percentage or fixed dollar amount)
 *               minimum_order:
 *                 type: number
 *                 format: decimal
 *                 example: 30.00
 *                 description: Minimum order amount required
 *               maximum_discount:
 *                 type: number
 *                 format: decimal
 *                 example: 100.00
 *                 description: Maximum discount amount (for percentage discounts)
 *               usage_limit:
 *                 type: integer
 *                 example: 50
 *                 description: Maximum number of times this code can be used
 *               valid_from:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-01T00:00:00.000Z"
 *               valid_to:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-12-31T23:59:59.000Z"
 *               description:
 *                 type: string
 *                 example: "New Year special discount"
 *     responses:
 *       201:
 *         description: Promo code created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Promo code created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     code:
 *                       type: string
 *                       example: "SAVE15"
 *                     discount_type:
 *                       type: string
 *                     discount_amount:
 *                       type: number
 *                       format: decimal
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       409:
 *         description: Promo code already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Promo code already exists"
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/',
  adminOnly,
  validate(createPromoSchema),
  promoController.createPromoCode.bind(promoController)
);

// DELETE /promo/:id - Delete promo code (admin only)
router.delete(
  '/:id',
  adminOnly,
  validate(promoIdSchema),
  promoController.deletePromoCode.bind(promoController)
);

export { router as promoRoutes };