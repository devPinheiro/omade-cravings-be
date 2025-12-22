import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { Review } from '../models/Review';
import { LoyaltyPoints } from '../models/LoyaltyPoints';
import { PromoCode } from '../models/PromoCode';
import { CustomCakeConfiguration } from '../models/CustomCakeConfiguration';
import { DeliverySchedule } from '../models/DeliverySchedule';

// Load environment-specific config
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
} else if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: '.env.development' });
} else {
  dotenv.config();
}

// Initialize Sequelize
let sequelize: Sequelize;

if (process.env.NODE_ENV === 'test') {
  // Use test database for tests
  const { testSequelize } = require('./testDatabase');
  sequelize = testSequelize;
} else {
  // Use production/development database
  sequelize = new Sequelize(process.env.DATABASE_URL as string, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    models: [
      User,
      Product,
      Order,
      OrderItem,
      Review,
      LoyaltyPoints,
      PromoCode,
      CustomCakeConfiguration,
      DeliverySchedule,
    ],
    dialectOptions:
      process.env.NODE_ENV === 'production'
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
          }
        : {},
  });
}

export { sequelize };

// Test Connection Function
export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Sync models in development
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Database models synchronized.');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};