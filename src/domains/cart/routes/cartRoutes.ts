import { Router } from 'express';
import { CartController } from '../controllers/CartController';
import { validate } from '../../../shared/validation/validator';
import { authenticate } from '../../../shared/middleware/auth';
import {
  addCartItemSchema,
  updateCartItemSchema,
  cartItemParamsSchema,
} from '../validation/cartSchemas';

const router = Router();
const cartController = new CartController();

// GET /cart - Get user's cart
router.get(
  '/',
  authenticate,
  cartController.getCart.bind(cartController)
);

// POST /cart/items - Add item to cart
router.post(
  '/items',
  authenticate,
  validate(addCartItemSchema),
  cartController.addItem.bind(cartController)
);

// PATCH /cart/items/:productId - Update item quantity in cart
router.patch(
  '/items/:productId',
  authenticate,
  validate(updateCartItemSchema),
  cartController.updateItem.bind(cartController)
);

// DELETE /cart/items/:productId - Remove item from cart
router.delete(
  '/items/:productId',
  authenticate,
  validate(cartItemParamsSchema),
  cartController.removeItem.bind(cartController)
);

export { router as cartRoutes };