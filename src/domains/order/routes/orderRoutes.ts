import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';
import { validate } from '../../../shared/validation/validator';
import { authenticate, authorize, optionalAuthenticate } from '../../../shared/middleware/auth';
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

// Track order by order number (public endpoint)
router.get(
  '/track/:order_number',
  validate(trackOrderSchema),
  orderController.trackOrder.bind(orderController)
);

// Create guest order (no authentication required)
router.post(
  '/guest',
  validate(createGuestOrderSchema),
  orderController.createGuestOrder.bind(orderController)
);

// Routes that work for both authenticated and guest users

// Create order (authenticated users use cart, guests provide items directly)
router.post(
  '/',
  optionalAuthenticate, // Allow both authenticated and unauthenticated requests
  validate(createOrderSchema),
  orderController.createOrder.bind(orderController)
);

// Authenticated user routes

// Get user's own orders
router.get(
  '/',
  authenticate,
  validate(getOrdersSchema),
  orderController.getOrders.bind(orderController)
);

// Get specific order (user can only see their own orders unless admin/staff)
router.get(
  '/:id',
  authenticate,
  validate(orderIdSchema),
  orderController.getOrder.bind(orderController)
);

// Cancel order (user can cancel their own orders, staff/admin can cancel any)
router.post(
  '/:id/cancel',
  authenticate,
  validate(orderIdSchema),
  validate(cancelOrderSchema),
  orderController.cancelOrder.bind(orderController)
);

// Staff and Admin routes

// Get all orders (admin/staff only)
router.get(
  '/admin/all',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(getOrdersSchema),
  orderController.getAllOrders.bind(orderController)
);

// Get orders by status (admin/staff only)
router.get(
  '/admin/status/:status',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(orderStatusSchema),
  orderController.getOrdersByStatus.bind(orderController)
);

// Get order statistics (admin only)
router.get(
  '/admin/statistics',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(orderStatisticsSchema),
  orderController.getOrderStatistics.bind(orderController)
);

// Update order status (staff/admin only)
router.patch(
  '/:id/status',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(orderIdSchema),
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus.bind(orderController)
);

// Update payment status (staff/admin only)
router.patch(
  '/:id/payment',
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
  authenticate,
  authorize(UserRole.ADMIN),
  validate(orderIdSchema),
  validate(cancelOrderSchema),
  orderController.cancelOrder.bind(orderController)
);

export { router as orderRoutes };