import { Router } from 'express';
import { EnhancedCartController } from '../controllers/EnhancedCartController';
import { validate } from '../../../shared/validation/validator';
import { authenticate, optionalAuthenticate } from '../../../shared/middleware/auth';
import {
  addEnhancedCartItemSchema,
  updateEnhancedCartItemSchema,
  removeEnhancedCartItemSchema,
  guestInfoSchema,
  sessionIdHeaderSchema,
  optionalSessionIdHeaderSchema,
  cartValidationSchema,
  mergeCartSchema,
  checkoutInitiationSchema,
  customCakeOptionsSchema,
  bulkCartUpdateSchema,
  cartImportSchema,
} from '../validation/enhancedCartSchemas';

const router = Router();
const cartController = new EnhancedCartController();

// Public routes (no authentication required)

/**
 * @swagger
 * /api/v2/cart/guest/session:
 *   post:
 *     tags: [Enhanced Cart]
 *     summary: Create guest session
 *     description: Create a new guest session for cart operations (for non-authenticated users)
 *     responses:
 *       201:
 *         description: Guest session created successfully
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
 *                   example: Guest session created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                       format: uuid
 *                       example: 123e4567-e89b-12d3-a456-426614174000
 *                       description: Use this session ID in x-session-id header for subsequent requests
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-01-01T12:00:00.000Z
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/guest/session',
  cartController.createGuestSession.bind(cartController)
);

/**
 * @swagger
 * /api/v2/cart:
 *   get:
 *     tags: [Enhanced Cart]
 *     summary: Get cart contents
 *     description: Retrieve cart contents for authenticated users or guest sessions
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - {}
 *     parameters:
 *       - in: header
 *         name: x-session-id
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Guest session ID (required for guest users, optional for authenticated users)
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
 *                 message:
 *                   type: string
 *                   example: Cart retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     cart:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         userId:
 *                           type: string
 *                           format: uuid
 *                           nullable: true
 *                         sessionId:
 *                           type: string
 *                           format: uuid
 *                           nullable: true
 *                         items:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               productId:
 *                                 type: string
 *                                 format: uuid
 *                               product:
 *                                 $ref: '#/components/schemas/Product'
 *                               quantity:
 *                                 type: integer
 *                               unitPrice:
 *                                 type: number
 *                               totalPrice:
 *                                 type: number
 *                               customCakeConfig:
 *                                 type: object
 *                                 nullable: true
 *                               specialInstructions:
 *                                 type: string
 *                                 nullable: true
 *                         subtotal:
 *                           type: number
 *                           example: 45.98
 *                         tax:
 *                           type: number
 *                           example: 3.68
 *                         total:
 *                           type: number
 *                           example: 49.66
 *                         itemCount:
 *                           type: integer
 *                           example: 3
 *                         guestInfo:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             name:
 *                               type: string
 *                             email:
 *                               type: string
 *                             phone:
 *                               type: string
 *       400:
 *         description: Invalid session or authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Cart not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/',
  optionalAuthenticate, // Optional auth - supports both authenticated and guest users
  cartController.getCart.bind(cartController)
);

// Get cart item count
router.get(
  '/count',
  optionalAuthenticate,
  cartController.getCartItemCount.bind(cartController)
);

/**
 * @swagger
 * /api/v2/cart/items:
 *   post:
 *     tags: [Enhanced Cart]
 *     summary: Add item to cart
 *     description: Add a product to cart with optional custom cake configuration
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - {}
 *     parameters:
 *       - in: header
 *         name: x-session-id
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Guest session ID (required for guest users)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/CartItem'
 *           examples:
 *             regularProduct:
 *               summary: Regular product
 *               value:
 *                 productId: 123e4567-e89b-12d3-a456-426614174000
 *                 quantity: 2
 *                 specialInstructions: "Please make it extra sweet"
 *             customCake:
 *               summary: Custom cake
 *               value:
 *                 productId: 123e4567-e89b-12d3-a456-426614174000
 *                 quantity: 1
 *                 customCakeConfig:
 *                   flavor: "Chocolate"
 *                   size: "8 inch"
 *                   frosting: "Buttercream"
 *                   message: "Happy Birthday!"
 *                   extraDetails:
 *                     decorations: ["Fresh Flowers", "Chocolate Drip"]
 *                     layers: 2
 *                 specialInstructions: "Please write in blue frosting"
 *     responses:
 *       201:
 *         description: Item added to cart successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Item added to cart successfully
 *               data:
 *                 cartItem:
 *                   productId: 123e4567-e89b-12d3-a456-426614174000
 *                   quantity: 2
 *                   unitPrice: 25.99
 *                   totalPrice: 51.98
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/items',
  optionalAuthenticate,
  validate(addEnhancedCartItemSchema),
  cartController.addItem.bind(cartController)
);

// Update item quantity in cart
router.patch(
  '/items/:productId',
  optionalAuthenticate,
  validate(updateEnhancedCartItemSchema),
  cartController.updateItem.bind(cartController)
);

// Remove item from cart
router.delete(
  '/items/:productId',
  optionalAuthenticate,
  validate(removeEnhancedCartItemSchema),
  cartController.removeItem.bind(cartController)
);

// Clear entire cart
router.delete(
  '/',
  optionalAuthenticate,
  cartController.clearCart.bind(cartController)
);

// Guest-specific routes

// Update guest information in cart
router.patch(
  '/guest/info',
  validate(sessionIdHeaderSchema),
  validate(guestInfoSchema),
  cartController.updateGuestInfo.bind(cartController)
);

// Authenticated user routes

// Merge guest cart with user cart (called after login)
router.post(
  '/merge',
  authenticate,
  validate(mergeCartSchema),
  cartController.mergeGuestCart.bind(cartController)
);

// Cart management routes

// Validate cart items against current product data
router.get(
  '/validate',
  optionalAuthenticate,
  validate(cartValidationSchema),
  cartController.validateCart.bind(cartController)
);

// Refresh cart with latest prices and availability
router.post(
  '/refresh',
  optionalAuthenticate,
  cartController.refreshCart.bind(cartController)
);

// Initiate checkout (validates cart and prepares for order creation)
router.post(
  '/checkout',
  optionalAuthenticate,
  validate(checkoutInitiationSchema),
  cartController.initiateCheckout.bind(cartController)
);

// Advanced cart operations (optional features)

// Bulk cart operations
router.post(
  '/bulk',
  optionalAuthenticate,
  validate(bulkCartUpdateSchema),
  async (req: any, res: any) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const identifier = req.user?.id ? { user_id: req.user.id } : { session_id: sessionId };
      
      if (!identifier.user_id && !identifier.session_id) {
        return res.status(400).json({
          success: false,
          error: 'Either authentication or session ID is required',
        });
      }

      // This would need to be implemented in the controller
      res.status(501).json({
        success: false,
        error: 'Bulk operations not yet implemented',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Bulk operation failed',
      });
    }
  }
);

// Export cart data (for backup or transfer)
router.get(
  '/export',
  optionalAuthenticate,
  async (req: any, res: any) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const identifier = req.user?.id ? { user_id: req.user.id } : { session_id: sessionId };
      
      // This would need to be implemented in the service
      res.status(501).json({
        success: false,
        error: 'Cart export not yet implemented',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Cart export failed',
      });
    }
  }
);

// Import cart data (for recovery or transfer)
router.post(
  '/import',
  optionalAuthenticate,
  validate(cartImportSchema),
  async (req: any, res: any) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const identifier = req.user?.id ? { user_id: req.user.id } : { session_id: sessionId };
      
      // This would need to be implemented in the service
      res.status(501).json({
        success: false,
        error: 'Cart import not yet implemented',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Cart import failed',
      });
    }
  }
);

// Custom cake configuration helper routes

// Get available custom cake options
router.get(
  '/custom-cake/options',
  validate(customCakeOptionsSchema),
  async (req: any, res: any) => {
    try {
      // This would typically come from a configuration service or database
      const options = {
        flavors: [
          'Vanilla',
          'Chocolate',
          'Red Velvet',
          'Lemon',
          'Strawberry',
          'Carrot',
          'Funfetti',
          'Coconut',
        ],
        sizes: [
          { name: '6 inch', serves: '4-6 people', price_multiplier: 1.0 },
          { name: '8 inch', serves: '8-10 people', price_multiplier: 1.5 },
          { name: '10 inch', serves: '12-15 people', price_multiplier: 2.0 },
          { name: '12 inch', serves: '20-25 people', price_multiplier: 3.0 },
        ],
        frostings: [
          'Buttercream',
          'Cream Cheese',
          'Chocolate Ganache',
          'Whipped Cream',
          'Fondant',
          'Royal Icing',
        ],
        decorations: [
          'Fresh Flowers',
          'Chocolate Drip',
          'Sprinkles',
          'Edible Pearls',
          'Custom Writing',
          'Themed Toppers',
        ],
        dietary_options: [
          'Gluten Free',
          'Vegan',
          'Sugar Free',
          'Nut Free',
          'Dairy Free',
        ],
      };

      res.json({
        success: true,
        data: options,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch custom cake options',
      });
    }
  }
);

// Calculate custom cake price
router.post(
  '/custom-cake/calculate-price',
  validate(addEnhancedCartItemSchema),
  async (req: any, res: any) => {
    try {
      const { quantity, custom_cake_config } = req.body;
      
      if (!custom_cake_config) {
        return res.status(400).json({
          success: false,
          error: 'Custom cake configuration is required',
        });
      }

      // Basic pricing calculation (this would be more sophisticated in production)
      let basePrice = 25.00; // Base price for custom cake
      
      // Size multiplier
      const sizeMultipliers: { [key: string]: number } = {
        '6 inch': 1.0,
        '8 inch': 1.5,
        '10 inch': 2.0,
        '12 inch': 3.0,
      };
      
      const sizeMultiplier = sizeMultipliers[custom_cake_config.size] || 1.0;
      
      // Additional costs
      let additionalCosts = 0;
      if (custom_cake_config.message) additionalCosts += 5.00;
      if (custom_cake_config.extra_details?.decorations?.length) {
        additionalCosts += custom_cake_config.extra_details.decorations.length * 3.00;
      }
      if (custom_cake_config.extra_details?.layers && custom_cake_config.extra_details.layers > 1) {
        additionalCosts += (custom_cake_config.extra_details.layers - 1) * 8.00;
      }
      
      const unitPrice = (basePrice * sizeMultiplier) + additionalCosts;
      const totalPrice = unitPrice * quantity;

      res.json({
        success: true,
        data: {
          unit_price: unitPrice,
          total_price: totalPrice,
          price_breakdown: {
            base_price: basePrice,
            size_multiplier: sizeMultiplier,
            additional_costs: additionalCosts,
            quantity: quantity,
          },
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate custom cake price',
      });
    }
  }
);

export { router as enhancedCartRoutes };