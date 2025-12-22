import { Sequelize } from 'sequelize-typescript';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { Review } from '../models/Review';
import { LoyaltyPoints } from '../models/LoyaltyPoints';
import { PromoCode } from '../models/PromoCode';
import { CustomCakeConfiguration } from '../models/CustomCakeConfiguration';
import { DeliverySchedule } from '../models/DeliverySchedule';

// Initialize Sequelize (deferred until connectDB is called)
let _sequelize: Sequelize;

const initializeSequelize = () => {
  if (_sequelize) return _sequelize; // Already initialized

  if (process.env.NODE_ENV === 'test') {
    // Use test database for tests
    const { testSequelize } = require('./testDatabase');
    _sequelize = testSequelize;
  } else {
    // Use production/development database
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    _sequelize = new Sequelize(process.env.DATABASE_URL as string, {
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
  
  return _sequelize;
};

// Getter for sequelize instance
const getSequelize = () => {
  if (!_sequelize) {
    initializeSequelize();
  }
  return _sequelize;
};

// Test Connection Function
const connectDB = async () => {
  try {
    const db = initializeSequelize();
    await db.authenticate();
    console.log('Database connection established successfully.');

    // Sync models in development
    if (process.env.NODE_ENV === 'development') {
      await db.sync({ alter: true });
      console.log('Database models synchronized.');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

// Export the sequelize instance directly (will be initialized on first access)
export const sequelize = new Proxy({} as Sequelize, {
  get(target, prop) {
    const instance = getSequelize();
    const value = (instance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});

export { connectDB };