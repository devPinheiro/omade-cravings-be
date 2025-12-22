import { Router } from 'express';
import { LoyaltyController } from '../controllers/LoyaltyController';
import { authenticate } from '../../../shared/middleware/auth';

const router = Router();
const loyaltyController = new LoyaltyController();

// GET /loyalty - Get user's loyalty points
router.get(
  '/',
  authenticate,
  loyaltyController.getLoyaltyPoints.bind(loyaltyController)
);

export { router as loyaltyRoutes };