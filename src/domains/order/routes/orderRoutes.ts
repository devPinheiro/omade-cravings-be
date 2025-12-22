import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';
import { validate } from '../../../shared/validation/validator';
import { authenticate, authorize, optionalAuthenticate } from '../../../shared/middleware/auth';
import { orderCreationRateLimit, dynamicRateLimit, adminRateLimit, generalRateLimit } from '../../../shared/middleware/rateLimiter';
import { UserRole } from '../../../models/User';
import {
  createOrderSchema,
  createGuestOrderSchema,
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
  getOrdersSchema,
  orderIdSchema,
  orderNumberSchema,
  orderStatusSchema,
  trackOrderSchema,
  cancelOrderSchema,
  orderStatisticsSchema,
} from '../validation/orderSchemas';

const router = Router();
const orderController = new OrderController();

// Public routes (no authentication required)

/**
 * @swagger
 * /api/v1/orders/track/{order_number}:
 *   get:
 *     tags: [Orders]
 *     summary: Track order by order number
 *     description: Track an order's status using the order number (public endpoint)
 *     parameters:
 *       - in: path
 *         name: order_number
 *         required: true
 *         schema:
 *           type: string
 *           example: "ORD-20240101-001"
 *     responses:
 *       200:
 *         description: Order tracking information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/track/:order_number',
  generalRateLimit,
  validate(trackOrderSchema),
  orderController.trackOrder.bind(orderController)
);

/**
 * @swagger
 * /api/v1/orders/guest:
 *   post:
 *     tags: [Orders]
 *     summary: Create guest order
 *     description: Create an order without authentication (for guest users)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - guest_email
 *               - guest_name
 *               - guest_phone
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CartItem'
 *               guest_email:
 *                 type: string
 *                 format: email
 *                 example: "guest@example.com"
 *               guest_name:
 *                 type: string
 *                 example: "John Doe"
 *               guest_phone:
 *                 type: string
 *                 example: "+1234567890"
 *               pickup_instructions:
 *                 type: string
 *                 example: "Call when ready"
 *               preferred_pickup_date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               preferred_pickup_time:
 *                 type: string
 *                 example: "14:30"
 *     responses:
 *       201:
 *         description: Guest order created successfully
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
 *                   example: "Order created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/guest',
  orderCreationRateLimit,
  validate(createGuestOrderSchema),
  orderController.createGuestOrder.bind(orderController)
);

// Routes that work for both authenticated and guest users

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create order
 *     description: Create an order (authenticated users use cart, guests provide items directly)
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payment_method:
 *                 type: string
 *                 enum: [cash, card_on_pickup, bank_transfer]
 *                 example: "cash"
 *               pickup_instructions:
 *                 type: string
 *                 example: "Call when ready"
 *               preferred_pickup_date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               preferred_pickup_time:
 *                 type: string
 *                 example: "14:30"
 *               promo_code:
 *                 type: string
 *                 example: "SAVE10"
 *     responses:
 *       201:
 *         description: Order created successfully
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
 *                   example: "Order created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   get:
 *     tags: [Orders]
 *     summary: Get user orders
 *     description: Get authenticated user's orders
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
 *           enum: [pending, confirmed, preparing, ready, picked_up, cancelled]
 *         description: Filter by order status
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
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
 *                     $ref: '#/components/schemas/Order'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     pages:
 *                       type: integer
 *                       example: 3
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/',
  orderCreationRateLimit,
  optionalAuthenticate, // Allow both authenticated and unauthenticated requests
  validate(createOrderSchema),
  orderController.createOrder.bind(orderController)
);

// Authenticated user routes

// Get order statistics (admin only) - moved here to avoid conflict with /:id route
router.get(
  '/stats',
  adminRateLimit,
  authenticate,
  authorize(UserRole.ADMIN),
  validate(orderStatisticsSchema),
  orderController.getOrderStatistics.bind(orderController)
);

// Get user's own orders
router.get(
  '/',
  dynamicRateLimit,
  authenticate,
  validate(getOrdersSchema),
  orderController.getOrders.bind(orderController)
);

// Get specific order (user can only see their own orders unless admin/staff)
router.get(
  '/:id',
  dynamicRateLimit,
  authenticate,
  validate(orderIdSchema),
  orderController.getOrder.bind(orderController)
);

// Cancel order (user can cancel their own orders, staff/admin can cancel any)
router.post(
  '/:id/cancel',
  generalRateLimit,
  authenticate,
  validate(orderIdSchema),
  validate(cancelOrderSchema),
  orderController.cancelOrder.bind(orderController)
);

// Staff and Admin routes

// Get all orders (admin/staff only)
router.get(
  '/admin/all',
  adminRateLimit,
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(getOrdersSchema),
  orderController.getAllOrders.bind(orderController)
);

// Get orders by status (admin/staff only)
router.get(
  '/admin/status/:status',
  adminRateLimit,
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(orderStatusSchema),
  orderController.getOrdersByStatus.bind(orderController)
);

// Get order statistics (admin only)
router.get(
  '/admin/statistics',
  adminRateLimit,
  authenticate,
  authorize(UserRole.ADMIN),
  validate(orderStatisticsSchema),
  orderController.getOrderStatistics.bind(orderController)
);

// Update order status (staff/admin only)
router.patch(
  '/:id/status',
  adminRateLimit,
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(orderIdSchema),
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus.bind(orderController)
);

// Update payment status (staff/admin only)
router.patch(
  '/:id/payment',
  adminRateLimit,
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(orderIdSchema),
  validate(updatePaymentStatusSchema),
  orderController.updatePaymentStatus.bind(orderController)
);

// Admin-only routes

// Cancel any order (admin only)
router.post(
  '/:id/admin-cancel',
  adminRateLimit,
  authenticate,
  authorize(UserRole.ADMIN),
  validate(orderIdSchema),
  validate(cancelOrderSchema),
  orderController.cancelOrder.bind(orderController)
);

export { router as orderRoutes };