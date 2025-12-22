import { Router } from 'express';
import { CustomCakeController } from '../controllers/CustomCakeController';
import { authenticate } from '../../../shared/middleware/auth';
import { validateRole } from '../../../shared/middleware/roleValidation';
import { UserRole } from '../../../models/User';

const router = Router();
const controller = new CustomCakeController();

/**
 * Public Routes - Available to all users (authenticated and guests)
 */

/**
 * @swagger
 * /api/v1/custom-cake/options:
 *   get:
 *     tags: [Custom Cakes]
 *     summary: Get cake configuration options
 *     description: Get available sizes, flavors, frostings, and decoration options for custom cakes
 *     responses:
 *       200:
 *         description: Configuration options retrieved successfully
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
 *                     sizes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "6-inch"
 *                           name:
 *                             type: string
 *                             example: "6 inch round"
 *                           serves:
 *                             type: integer
 *                             example: 8
 *                           base_price:
 *                             type: number
 *                             format: decimal
 *                             example: 25.00
 *                     flavors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "chocolate"
 *                           name:
 *                             type: string
 *                             example: "Rich Chocolate"
 *                           price_modifier:
 *                             type: number
 *                             format: decimal
 *                             example: 0.00
 *                           popular:
 *                             type: boolean
 *                             example: true
 *                     frostings:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "buttercream"
 *                           name:
 *                             type: string
 *                             example: "Vanilla Buttercream"
 *                           price_modifier:
 *                             type: number
 *                             format: decimal
 *                             example: 5.00
 *                     decorations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "fresh-flowers"
 *                           name:
 *                             type: string
 *                             example: "Fresh Flowers"
 *                           price:
 *                             type: number
 *                             format: decimal
 *                             example: 15.00
 *                           category:
 *                             type: string
 *                             example: "premium"
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/options', controller.getConfigurationOptions.bind(controller));

// Get cake templates with optional filtering
router.get('/templates', controller.getTemplates.bind(controller));

// Get specific template by ID
router.get('/templates/:id', controller.getTemplateById.bind(controller));

/**
 * @swagger
 * /api/v1/custom-cake/estimate:
 *   get:
 *     tags: [Custom Cakes]
 *     summary: Get quick price estimate
 *     description: Get a quick price estimate for a custom cake configuration
 *     parameters:
 *       - in: query
 *         name: size
 *         required: true
 *         schema:
 *           type: string
 *           example: "8-inch"
 *         description: Cake size
 *       - in: query
 *         name: flavor
 *         schema:
 *           type: string
 *           example: "chocolate"
 *         description: Cake flavor
 *       - in: query
 *         name: frosting
 *         schema:
 *           type: string
 *           example: "buttercream"
 *         description: Frosting type
 *       - in: query
 *         name: decorations
 *         schema:
 *           type: string
 *           example: "fresh-flowers,chocolate-drip"
 *         description: Comma-separated decoration IDs
 *       - in: query
 *         name: layers
 *         schema:
 *           type: integer
 *           example: 2
 *         description: Number of layers
 *     responses:
 *       200:
 *         description: Price estimate calculated successfully
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
 *                     base_price:
 *                       type: number
 *                       format: decimal
 *                       example: 35.00
 *                     decoration_cost:
 *                       type: number
 *                       format: decimal
 *                       example: 15.00
 *                     flavor_modifier:
 *                       type: number
 *                       format: decimal
 *                       example: 5.00
 *                     frosting_modifier:
 *                       type: number
 *                       format: decimal
 *                       example: 10.00
 *                     total_estimate:
 *                       type: number
 *                       format: decimal
 *                       example: 65.00
 *                     preparation_time:
 *                       type: string
 *                       example: "2-3 business days"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/estimate', controller.getQuickPriceEstimate.bind(controller));

// Get validation constraints and options
router.get('/validation-options', controller.getValidationOptions.bind(controller));

// Get recommendations based on criteria
router.get('/recommendations', controller.getRecommendations.bind(controller));

/**
 * Configuration and Pricing Routes
 */

/**
 * @swagger
 * /api/v1/custom-cake/calculate-pricing:
 *   post:
 *     tags: [Custom Cakes]
 *     summary: Calculate detailed pricing
 *     description: Calculate detailed pricing for a complete custom cake configuration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - size
 *               - flavor
 *               - frosting
 *             properties:
 *               size:
 *                 type: string
 *                 example: "8-inch"
 *               flavor:
 *                 type: string
 *                 example: "chocolate"
 *               frosting:
 *                 type: string
 *                 example: "buttercream"
 *               layers:
 *                 type: integer
 *                 example: 2
 *               decorations:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["fresh-flowers", "chocolate-drip"]
 *               message:
 *                 type: string
 *                 example: "Happy Birthday!"
 *               delivery_date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               special_requests:
 *                 type: string
 *                 example: "Sugar-free option"
 *     responses:
 *       200:
 *         description: Detailed pricing calculated successfully
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
 *                     breakdown:
 *                       type: object
 *                       properties:
 *                         base_price:
 *                           type: number
 *                           format: decimal
 *                           example: 35.00
 *                         size_modifier:
 *                           type: number
 *                           format: decimal
 *                           example: 0.00
 *                         flavor_modifier:
 *                           type: number
 *                           format: decimal
 *                           example: 5.00
 *                         frosting_cost:
 *                           type: number
 *                           format: decimal
 *                           example: 10.00
 *                         decoration_costs:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                                 example: "Fresh Flowers"
 *                               cost:
 *                                 type: number
 *                                 format: decimal
 *                                 example: 15.00
 *                         rush_fee:
 *                           type: number
 *                           format: decimal
 *                           example: 0.00
 *                     total_price:
 *                       type: number
 *                       format: decimal
 *                       example: 65.00
 *                     estimated_preparation_time:
 *                       type: string
 *                       example: "2-3 business days"
 *                     earliest_pickup_date:
 *                       type: string
 *                       format: date
 *                       example: "2024-01-17"
 *                     configuration_valid:
 *                       type: boolean
 *                       example: true
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/calculate-pricing', controller.calculatePricing.bind(controller));

/**
 * @swagger
 * /api/v1/custom-cake/validate:
 *   post:
 *     tags: [Custom Cakes]
 *     summary: Validate cake configuration
 *     description: Validate if a custom cake configuration is possible and meets requirements
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - size
 *               - flavor
 *               - frosting
 *             properties:
 *               size:
 *                 type: string
 *                 example: "8-inch"
 *               flavor:
 *                 type: string
 *                 example: "red-velvet"
 *               frosting:
 *                 type: string
 *                 example: "cream-cheese"
 *               layers:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 4
 *                 example: 3
 *               decorations:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["gold-leaf", "sugar-flowers"]
 *               delivery_date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-20"
 *     responses:
 *       200:
 *         description: Configuration validation completed
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
 *                     issues:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: []
 *                     warnings:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Gold leaf decoration requires 3-day notice"]
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Consider vanilla buttercream as an alternative"]
 *                     estimated_time:
 *                       type: string
 *                       example: "3-4 business days"
 *                     can_rush:
 *                       type: boolean
 *                       example: false
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/validate', controller.validateConfiguration.bind(controller));

// Check availability for specific date
router.post('/check-availability', controller.checkAvailability.bind(controller));

/**
 * Protected Admin Routes
 */

// Get configuration analytics (admin only)
router.get('/analytics', 
  authenticate,
  validateRole([UserRole.ADMIN]),
  controller.getConfigurationAnalytics.bind(controller)
);

export { router as customCakeRoutes };