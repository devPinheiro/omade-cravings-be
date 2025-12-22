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

// GET /promo/validate - Validate promo code
router.get(
  '/validate',
  validate(validatePromoSchema),
  promoController.validatePromoCode.bind(promoController)
);

// GET /promo - Get all promo codes (admin only)
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

// POST /promo - Create new promo code (admin only)
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