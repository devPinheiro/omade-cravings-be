import { Router } from 'express';
import { CartController } from '../controllers/CartController';
import { validate } from '../../../shared/validation/validator';
import { authenticate } from '../../../shared/middleware/auth';
import { cartRateLimit } from '../../../shared/middleware/rateLimiter';
import {
  addCartItemSchema,
  updateCartItemSchema,
  cartItemParamsSchema,
} from '../validation/cartSchemas';

const router = Router();
const cartController = new CartController();

/**
 * @swagger
 * /api/v1/cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get user's cart
 *     description: Retrieve the authenticated user's shopping cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
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
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CartItem'
 *                     total_amount:
 *                       type: number
 *                       format: decimal
 *                       example: 45.98
 *                     items_count:
 *                       type: integer
 *                       example: 3
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/',
  cartRateLimit,
  authenticate,
  cartController.getCart.bind(cartController)
);

/**
 * @swagger
 * /api/v1/cart/items:
 *   post:
 *     tags: [Cart]
 *     summary: Add item to cart
 *     description: Add a product to the authenticated user's cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - quantity
 *             properties:
 *               product_id:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *               custom_cake_config:
 *                 type: object
 *                 properties:
 *                   flavor:
 *                     type: string
 *                     example: "Vanilla"
 *                   size:
 *                     type: string
 *                     example: "8 inch"
 *                   frosting:
 *                     type: string
 *                     example: "Buttercream"
 *                   message:
 *                     type: string
 *                     example: "Happy Birthday!"
 *     responses:
 *       201:
 *         description: Item added to cart successfully
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
 *                   example: "Item added to cart"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/items',
  cartRateLimit,
  authenticate,
  validate(addCartItemSchema),
  cartController.addItem.bind(cartController)
);

/**
 * @swagger
 * /api/v1/cart/items/{productId}:
 *   patch:
 *     tags: [Cart]
 *     summary: Update cart item quantity
 *     description: Update the quantity of an item in the user's cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 3
 *     responses:
 *       200:
 *         description: Cart item updated successfully
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
 *                   example: "Cart item updated"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   delete:
 *     tags: [Cart]
 *     summary: Remove item from cart
 *     description: Remove a product from the user's cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID to remove
 *     responses:
 *       200:
 *         description: Item removed from cart successfully
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
 *                   example: "Item removed from cart"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch(
  '/items/:productId',
  cartRateLimit,
  authenticate,
  validate(updateCartItemSchema),
  cartController.updateItem.bind(cartController)
);

router.delete(
  '/items/:productId',
  cartRateLimit,
  authenticate,
  validate(cartItemParamsSchema),
  cartController.removeItem.bind(cartController)
);

export { router as cartRoutes };