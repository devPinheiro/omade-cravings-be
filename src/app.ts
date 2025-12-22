import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { generalRateLimit } from './shared/middleware/rateLimiter';

// Import routes
import healthRoutes from './routes/health';
import { cloudinaryRoutes } from './routes/cloudinaryRoutes';
import { authRoutes } from './domains/auth/routes/authRoutes';
import { productRoutes } from './domains/products/routes/productRoutes';
import { cartRoutes } from './domains/cart/routes/cartRoutes';
import { enhancedCartRoutes } from './domains/cart/routes/enhancedCartRoutes';
import { reviewRoutes } from './domains/reviews/routes/reviewRoutes';
import { loyaltyRoutes } from './domains/loyalty/routes/loyaltyRoutes';
import { promoRoutes } from './domains/promo/routes/promoRoutes';
import { orderRoutes } from './domains/order/routes/orderRoutes';
import { customCakeRoutes } from './domains/custom-cake/routes/customCakeRoutes';
import { notificationRoutes } from './domains/notifications/routes/notificationRoutes';
import { customerRoutes } from './domains/customers/routes/customerRoutes';

const app: Application = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json()); // Parse JSON bodies

// Apply general rate limiting to all API routes
// app.use('/api', generalRateLimit); // Temporarily disabled for testing

// Health Check Routes
app.use('/api', healthRoutes);

// Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Omade Cravings API Documentation',
}));

// Root Route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Omade Cravings API v1',
    version: '1.0.0',
    description: 'Food delivery and restaurant management platform',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/v1/auth',
      products: '/api/v1/products',
      cart: '/api/v1/cart (legacy)',
      enhanced_cart: '/api/v2/cart',
      orders: '/api/v1/orders',
      reviews: '/api/v1/reviews',
      loyalty: '/api/v1/loyalty',
      promo: '/api/v1/promo',
      custom_cakes: '/api/v1/custom-cakes',
      notifications: '/api/v1/notifications',
      customers: '/api/v1/customers',
      cloudinary: '/api/cloudinary',
      health: '/health',
    },
  });
});

// API Routes
app.use('/api/cloudinary', cloudinaryRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/cart', cartRoutes); // Legacy cart routes (authenticated users only)
app.use('/api/v2/cart', enhancedCartRoutes); // Enhanced cart routes (supports guests)
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/loyalty', loyaltyRoutes);
app.use('/api/v1/promo', promoRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/custom-cakes', customCakeRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/customers', customerRoutes);

// TODO: Implement remaining routes
// app.use('/api/v1/delivery', deliveryRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

export default app;