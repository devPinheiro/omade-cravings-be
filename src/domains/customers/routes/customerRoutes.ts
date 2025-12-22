import { Router } from 'express';
import { CustomerController } from '../controllers/CustomerController';
import { authenticate, authorize } from '../../../shared/middleware/auth';
import { UserRole } from '../../../models/User';

const router = Router();
const customerController = new CustomerController();

/**
 * @swagger
 * /api/v1/customers:
 *   get:
 *     tags: [Customers]
 *     summary: Get all customers with filtering and pagination
 *     description: Retrieve a paginated list of all customers (both registered and guest) with optional filtering (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of customers per page
 *       - in: query
 *         name: customerType
 *         schema:
 *           type: string
 *           enum: [registered, guest]
 *         description: Filter by customer type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search customers by name or email
 *       - in: query
 *         name: minSpent
 *         schema:
 *           type: number
 *         description: Filter customers with minimum total spending
 *       - in: query
 *         name: maxSpent
 *         schema:
 *           type: number
 *         description: Filter customers with maximum total spending
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, totalSpent, totalOrders, lastOrder]
 *           default: totalSpent
 *         description: Sort customers by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
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
 *                     customers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                             example: "John Doe"
 *                           email:
 *                             type: string
 *                             example: "john@example.com"
 *                           customer_type:
 *                             type: string
 *                             enum: [registered, guest]
 *                           total_orders:
 *                             type: integer
 *                             example: 5
 *                           total_spent:
 *                             type: number
 *                             format: decimal
 *                             example: 250.00
 *                           last_order_date:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 *                         totalItems:
 *                           type: integer
 *                           example: 100
 *                         hasNextPage:
 *                           type: boolean
 *                           example: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  customerController.getAllCustomers.bind(customerController)
);

/**
 * @swagger
 * /api/v1/customers/stats:
 *   get:
 *     tags: [Customers]
 *     summary: Get comprehensive customer statistics
 *     description: Get detailed customer analytics including customer counts, retention, segments, and top customers (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer statistics retrieved successfully
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
 *                     overview:
 *                       type: object
 *                       properties:
 *                         total_customers:
 *                           type: integer
 *                           example: 250
 *                         registered_customers:
 *                           type: integer
 *                           example: 180
 *                         guest_customers:
 *                           type: integer
 *                           example: 70
 *                         customers_with_orders:
 *                           type: integer
 *                           example: 220
 *                         customers_with_multiple_orders:
 *                           type: integer
 *                           example: 85
 *                         average_order_value:
 *                           type: number
 *                           format: decimal
 *                           example: 45.75
 *                         total_customer_value:
 *                           type: number
 *                           format: decimal
 *                           example: 15250.50
 *                     top_customers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                             example: "John Doe"
 *                           email:
 *                             type: string
 *                             example: "john@example.com"
 *                           customer_type:
 *                             type: string
 *                             enum: [registered, guest]
 *                           total_orders:
 *                             type: integer
 *                             example: 15
 *                           total_spent:
 *                             type: number
 *                             format: decimal
 *                             example: 850.00
 *                           avg_order_value:
 *                             type: number
 *                             format: decimal
 *                             example: 56.67
 *                     customer_retention:
 *                       type: object
 *                       properties:
 *                         new_customers_this_month:
 *                           type: integer
 *                           example: 25
 *                         returning_customers_this_month:
 *                           type: integer
 *                           example: 40
 *                         retention_rate:
 *                           type: number
 *                           format: decimal
 *                           example: 61.54
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/stats',
  authenticate,
  authorize(UserRole.ADMIN),
  customerController.getCustomerStats.bind(customerController)
);

/**
 * @swagger
 * /api/v1/customers/top:
 *   get:
 *     tags: [Customers]
 *     summary: Get top customers by spending
 *     description: Retrieve top customers ranked by total spending (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of top customers to return
 *     responses:
 *       200:
 *         description: Top customers retrieved successfully
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
 *                     customers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                             example: "John Doe"
 *                           email:
 *                             type: string
 *                             example: "john@example.com"
 *                           customer_type:
 *                             type: string
 *                             enum: [registered, guest]
 *                           total_orders:
 *                             type: integer
 *                             example: 15
 *                           total_spent:
 *                             type: number
 *                             format: decimal
 *                             example: 850.00
 *                     total:
 *                       type: integer
 *                       example: 20
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/top',
  authenticate,
  authorize(UserRole.ADMIN),
  customerController.getTopCustomers.bind(customerController)
);

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   get:
 *     tags: [Customers]
 *     summary: Get customer details with order history
 *     description: Retrieve detailed customer information including complete order history (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID or 'guest' for guest customer lookup
 *       - in: query
 *         name: guestEmail
 *         schema:
 *           type: string
 *         description: Guest customer email (required if id is 'guest')
 *       - in: query
 *         name: guestPhone
 *         schema:
 *           type: string
 *         description: Guest customer phone (required if id is 'guest')
 *     responses:
 *       200:
 *         description: Customer details retrieved successfully
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
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       example: "john@example.com"
 *                     customer_type:
 *                       type: string
 *                       enum: [registered, guest]
 *                     total_orders:
 *                       type: integer
 *                       example: 15
 *                     total_spent:
 *                       type: number
 *                       format: decimal
 *                       example: 850.00
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *       400:
 *         description: Bad request - missing required parameters
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Customer not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  customerController.getCustomerDetails.bind(customerController)
);

/**
 * @swagger
 * /api/v1/customers/analytics/retention:
 *   get:
 *     tags: [Customers]
 *     summary: Get customer retention analytics
 *     description: Retrieve customer retention metrics for current month (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer retention data retrieved successfully
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
 *                     new_customers_this_month:
 *                       type: integer
 *                       example: 25
 *                     returning_customers_this_month:
 *                       type: integer
 *                       example: 40
 *                     retention_rate:
 *                       type: number
 *                       format: decimal
 *                       example: 61.54
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/analytics/retention',
  authenticate,
  authorize(UserRole.ADMIN),
  customerController.getCustomerRetention.bind(customerController)
);

/**
 * @swagger
 * /api/v1/customers/analytics/order-frequency:
 *   get:
 *     tags: [Customers]
 *     summary: Get order frequency distribution
 *     description: Retrieve distribution of customers by order frequency ranges (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order frequency distribution retrieved successfully
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
 *                       range:
 *                         type: string
 *                         example: "2-5 orders"
 *                       customer_count:
 *                         type: integer
 *                         example: 45
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/analytics/order-frequency',
  authenticate,
  authorize(UserRole.ADMIN),
  customerController.getOrderFrequencyDistribution.bind(customerController)
);

/**
 * @swagger
 * /api/v1/customers/analytics/segments:
 *   get:
 *     tags: [Customers]
 *     summary: Get customer segments
 *     description: Retrieve customer segmentation based on spending patterns (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer segments retrieved successfully
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
 *                       segment:
 *                         type: string
 *                         example: "High Value"
 *                       customer_count:
 *                         type: integer
 *                         example: 35
 *                       avg_order_value:
 *                         type: number
 *                         format: decimal
 *                         example: 75.50
 *                       total_revenue:
 *                         type: number
 *                         format: decimal
 *                         example: 8950.00
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/analytics/segments',
  authenticate,
  authorize(UserRole.ADMIN),
  customerController.getCustomerSegments.bind(customerController)
);

export { router as customerRoutes };