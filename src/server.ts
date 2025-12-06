import 'reflect-metadata';
import app from './app';
import dotenv from 'dotenv';
import { connectDB } from './config/database';

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`
    🍽️ Omade Cravings API running on http://localhost:${PORT}
    `);
  });
};

startServer();