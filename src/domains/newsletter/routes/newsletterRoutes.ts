import { Router } from 'express';
import { NewsletterController } from '../controllers/NewsletterController';
import { validate } from '../../../shared/validation/validator';
import { subscribeNewsletterSchema } from '../validation/newsletterSchemas';
import { generalRateLimit } from '../../../shared/middleware/rateLimiter';

const router = Router();
const controller = new NewsletterController();

/**
 * @swagger
 * /api/v1/newsletter/subscribe:
 *   post:
 *     tags: [Newsletter]
 *     summary: Subscribe to newsletter
 *     description: Add an email to the newsletter list (public endpoint). Idempotent for existing emails.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "customer@example.com"
 *     responses:
 *       201:
 *         description: Subscribed successfully (or already subscribed)
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     subscribed:
 *                       type: boolean
 *                       example: true
 *                     alreadySubscribed:
 *                       type: boolean
 *       400:
 *         description: Validation error or invalid email
 *       500:
 *         description: Server error
 */
router.post(
  '/subscribe',
  generalRateLimit,
  validate(subscribeNewsletterSchema),
  controller.subscribe.bind(controller)
);

export { router as newsletterRoutes };
