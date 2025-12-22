import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validate } from '../../../shared/validation/validator';
import { authenticate } from '../../../shared/middleware/auth';
import { authRateLimit, strictRateLimit } from '../../../shared/middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  socialAuthSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
} from '../validation/authSchemas';

const router = Router();
const authController = new AuthController();

// Public routes (no authentication required)

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     description: Create a new user account with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: SecurePassword123!
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               phone:
 *                 type: string
 *                 example: +1234567890
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *                   example: User registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                         refreshToken:
 *                           type: string
 *                           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: User already exists
 *               error: A user with this email already exists
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/register',
  authRateLimit,
  validate(registerSchema),
  authController.register.bind(authController)
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: User login
 *     description: Authenticate user with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: SecurePassword123!
 *               rememberMe:
 *                 type: boolean
 *                 example: true
 *                 description: Keep user logged in for extended period
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                         refreshToken:
 *                           type: string
 *                           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: Invalid credentials
 *               error: Email or password is incorrect
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/login',
  authRateLimit,
  validate(loginSchema),
  authController.login.bind(authController)
);

/**
 * POST /auth/social
 * Social authentication (Google, Apple, Facebook)
 */
router.post(
  '/social',
  authRateLimit,
  validate(socialAuthSchema),
  authController.socialAuth.bind(authController)
);

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  '/refresh',
  authRateLimit,
  validate(refreshTokenSchema),
  authController.refresh.bind(authController)
);

/**
 * POST /auth/forgot-password
 * Request password reset
 */
router.post(
  '/forgot-password',
  strictRateLimit, // Very limited for password reset
  validate(forgotPasswordSchema),
  authController.forgotPassword.bind(authController)
);

// Protected routes (authentication required)

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Get current user profile
 *     description: Retrieve the current authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
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
 *                   example: User profile retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/me',
  authenticate,
  authController.getCurrentUser.bind(authController)
);

/**
 * POST /auth/logout
 * Logout user (revoke refresh token)
 */
router.post(
  '/logout',
  authenticate,
  authController.logout.bind(authController)
);

/**
 * POST /auth/logout-all
 * Logout from all devices
 */
router.post(
  '/logout-all',
  authenticate,
  authController.logoutAll.bind(authController)
);

/**
 * PUT /auth/change-password
 * Change user password
 */
router.put(
  '/change-password',
  strictRateLimit, // Strict limit for password changes
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword.bind(authController)
);

export { router as authRoutes };