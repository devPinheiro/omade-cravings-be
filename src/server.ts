import 'reflect-metadata';
import app from './app';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { connectRedis } from './config/redis';

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();
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