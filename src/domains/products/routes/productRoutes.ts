import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { validate } from '../../../shared/validation/validator';
import { authenticate, authorize } from '../../../shared/middleware/auth';
import { searchRateLimit, generalRateLimit, uploadRateLimit, adminRateLimit } from '../../../shared/middleware/rateLimiter';
import { UserRole } from '../../../models/User';
import { upload } from '../../../config/cloudinary';
import {
  createProductSchema,
  updateProductSchema,
  getProductsSchema,
  productIdSchema,
} from '../validation/productSchemas';

const router = Router();
const productController = new ProductController();

/**
 * @swagger
 * /api/v1/products/categories:
 *   get:
 *     tags: [Products]
 *     summary: Get all product categories
 *     description: Retrieve a list of all available product categories
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
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
 *                   example: Categories retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: CAKES
 *                           displayName:
 *                             type: string
 *                             example: Cakes
 *                           description:
 *                             type: string
 *                             example: Delicious homemade cakes
 *                           subcategories:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: [CHOCOLATE, VANILLA, RED_VELVET]
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/categories',
  productController.getCategories.bind(productController)
);

// GET /products/low-stock - Get low stock products (admin/staff only)
router.get(
  '/low-stock',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF),
  productController.getLowStockProducts.bind(productController)
);

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     tags: [Products]
 *     summary: Get products with filtering
 *     description: Retrieve products with optional filtering by category, price, etc.
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
 *         description: Number of products per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by product category
 *         example: CAKES
 *       - in: query
 *         name: subcategory
 *         schema:
 *           type: string
 *         description: Filter by product subcategory
 *         example: CHOCOLATE
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *         example: 10.00
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *         example: 50.00
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search products by name or description
 *         example: chocolate cake
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, price, createdAt, popularity]
 *           default: name
 *         description: Sort products by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by product tags
 *         example: [sweet, popular]
 *     responses:
 *       200:
 *         description: Products retrieved successfully
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
 *                   example: Products retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
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
 *                         itemsPerPage:
 *                           type: integer
 *                           example: 20
 *                         hasNextPage:
 *                           type: boolean
 *                           example: true
 *                         hasPrevPage:
 *                           type: boolean
 *                           example: false
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/',
  validate(getProductsSchema),
  productController.getProducts.bind(productController)
);

/**
 * @swagger
 * /api/v1/products/stats:
 *   get:
 *     tags: [Products]
 *     summary: Get product statistics
 *     description: Get comprehensive statistics about products including categories, stock levels, ratings, and pricing analytics (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product statistics retrieved successfully
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
 *                         total_products:
 *                           type: integer
 *                           example: 125
 *                         low_stock_products:
 *                           type: integer
 *                           example: 8
 *                         out_of_stock_products:
 *                           type: integer
 *                           example: 3
 *                         customizable_products:
 *                           type: integer
 *                           example: 15
 *                         products_without_image:
 *                           type: integer
 *                           example: 5
 *                         total_inventory_value:
 *                           type: number
 *                           format: decimal
 *                           example: 45750.50
 *                     categories:
 *                       type: object
 *                       properties:
 *                         distribution:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               category:
 *                                 type: string
 *                                 example: "Cakes"
 *                               count:
 *                                 type: integer
 *                                 example: 25
 *                         pricing:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               category:
 *                                 type: string
 *                                 example: "Cakes"
 *                               average_price:
 *                                 type: number
 *                                 format: decimal
 *                                 example: 35.99
 *                               product_count:
 *                                 type: integer
 *                                 example: 25
 *                     top_rated_products:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                             example: "Chocolate Birthday Cake"
 *                           category:
 *                             type: string
 *                             example: "Cakes"
 *                           price:
 *                             type: number
 *                             format: decimal
 *                             example: 45.99
 *                           avg_rating:
 *                             type: number
 *                             format: decimal
 *                             example: 4.8
 *                           review_count:
 *                             type: integer
 *                             example: 24
 *                     recent_products:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                             example: "Red Velvet Cupcakes"
 *                           category:
 *                             type: string
 *                             example: "Cupcakes"
 *                           price:
 *                             type: number
 *                             format: decimal
 *                             example: 24.99
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                     stock_analysis:
 *                       type: object
 *                       properties:
 *                         low_stock_threshold:
 *                           type: integer
 *                           example: 5
 *                         products_needing_restock:
 *                           type: integer
 *                           example: 8
 *                         out_of_stock:
 *                           type: integer
 *                           example: 3
 *                         total_inventory_value:
 *                           type: number
 *                           format: decimal
 *                           example: 45750.50
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
  productController.getProductStats.bind(productController)
);

// GET /products/:id - Get product by ID
router.get(
  '/:id',
  validate(productIdSchema),
  productController.getProduct.bind(productController)
);

// POST /products - Create new product (admin only)
router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  upload.single('image'),
  validate(createProductSchema),
  productController.createProduct.bind(productController)
);

// PATCH /products/:id - Update product (admin only)
router.patch(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(productIdSchema),
  validate(updateProductSchema),
  productController.updateProduct.bind(productController)
);

// PATCH /products/:id/stock - Update product stock (admin/staff only)
router.patch(
  '/:id/stock',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(productIdSchema),
  productController.updateStock.bind(productController)
);

// DELETE /products/:id - Delete product (admin only)
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(productIdSchema),
  productController.deleteProduct.bind(productController)
);

// POST /products/bulk-stock - Bulk update product stock (admin only)
router.post(
  '/bulk-stock',
  authenticate,
  authorize(UserRole.ADMIN),
  productController.bulkUpdateStock.bind(productController)
);

export { router as productRoutes };