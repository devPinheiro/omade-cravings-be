import 'reflect-metadata';
import dotenv from 'dotenv';

// Load environment-specific config first
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
} else if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: '.env.development' });
} else {
  dotenv.config();
}

import app from './app';
import { connectDB } from './config/database';
import { connectRedis } from './config/redis';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    
    // Try to connect to Redis, but don't fail if it's unavailable
    try {
      await connectRedis();
    } catch (error) {
      console.warn('Redis connection failed, continuing without Redis:', (error as Error).message);
    }
    
    app.listen(PORT, () => {
      console.log(`
    🍰 Omade Cravings Bakery API running on http://localhost:${PORT}
    `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();