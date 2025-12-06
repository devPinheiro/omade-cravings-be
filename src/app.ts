import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app: Application = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json()); // Parse JSON bodies

// Health Check Endpoint (For your DevOps pipeline)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Omade Cravings API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Root Route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Omade Cravings API v1',
    version: '1.0.0',
    description: 'Food delivery and restaurant management platform',
    endpoints: {
      auth: '/api/v1/auth',
      restaurants: '/api/v1/restaurants',
      menu: '/api/v1/menu',
      orders: '/api/v1/orders',
      health: '/health',
    },
  });
});

// API Routes - will be added as domains are implemented
// app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/restaurants', restaurantRoutes);
// app.use('/api/v1/menu', menuRoutes);
// app.use('/api/v1/orders', orderRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

export default app;