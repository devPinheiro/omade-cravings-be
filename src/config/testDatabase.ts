import { Sequelize } from 'sequelize-typescript';
import path from 'path';

// In-memory SQLite database for testing
export const testSequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:', // In-memory database
  logging: false, // Disable SQL logging in tests
  models: [path.join(__dirname, '../models/**/*.ts')],
  sync: { force: true },
});

/**
 * Initialize test database
 */
export async function initializeTestDatabase(): Promise<void> {
  try {
    await testSequelize.authenticate();
    await testSequelize.sync({ force: true });
    console.log('Test database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize test database:', error);
    throw error;
  }
}

/**
 * Close test database connection
 */
export async function closeTestDatabase(): Promise<void> {
  try {
    await testSequelize.close();
    console.log('Test database connection closed');
  } catch (error) {
    // Silently ignore "already closed" errors
    if (!error || !error.toString().includes('Database is closed')) {
      console.log('Test database connection already closed or error ignored');
    }
  }
}

/**
 * Clean all test database tables
 */
export async function cleanTestDatabase(): Promise<void> {
  try {
    await testSequelize.truncate({ cascade: true, restartIdentity: true });
  } catch (error) {
    console.error('Error cleaning test database:', error);
    throw error;
  }
}

/**
 * Seed test database with sample data
 */
export async function seedTestDatabase(): Promise<{
  users: any[];
  products: any[];
  promoCodes: any[];
}> {
  try {
    // Get models from test database
    const User = testSequelize.models.User;
    const Product = testSequelize.models.Product;
    const PromoCode = testSequelize.models.PromoCode;
    const LoyaltyPoints = testSequelize.models.LoyaltyPoints;

    // Create test users
    const users = await User.bulkCreate([
      {
        id: 'user-1',
        email: 'customer@test.com',
        name: 'Test Customer',
        password_hash: '$2b$10$hash1', // Mock hash
        role: 'customer',
        phone: '+1234567890',
      },
      {
        id: 'user-2', 
        email: 'admin@test.com',
        name: 'Test Admin',
        password_hash: '$2b$10$hash2', // Mock hash
        role: 'admin',
        phone: '+1234567891',
      },
      {
        id: 'user-3',
        email: 'staff@test.com', 
        name: 'Test Staff',
        password_hash: '$2b$10$hash3', // Mock hash
        role: 'staff',
        phone: '+1234567892',
      }
    ]);

    // Create test products
    const products = await Product.bulkCreate([
      {
        id: 'product-1',
        name: 'Chocolate Cake',
        description: 'Rich chocolate cake',
        price: 25.99,
        category: 'cakes',
        stock: 10,
        is_available: true,
      },
      {
        id: 'product-2',
        name: 'Vanilla Cupcakes',
        description: 'Classic vanilla cupcakes (pack of 6)',
        price: 15.99,
        category: 'cupcakes', 
        stock: 20,
        is_available: true,
      },
      {
        id: 'product-3',
        name: 'Custom Wedding Cake',
        description: 'Custom designed wedding cake',
        price: 150.00,
        category: 'custom',
        stock: 100, // High stock for custom items
        is_available: true,
      },
      {
        id: 'product-4',
        name: 'Out of Stock Item',
        description: 'This item is out of stock',
        price: 10.00,
        category: 'other',
        stock: 0,
        is_available: false,
      }
    ]);

    // Create test promo codes
    const promoCodes = await PromoCode.bulkCreate([
      {
        id: 'promo-1',
        code: 'SAVE10',
        description: '10% off your order',
        discount_type: 'percentage',
        amount: 10.00,
        minimum_order_amount: 25.00,
        usage_limit: 100,
        used_count: 5,
        valid_from: new Date('2024-01-01'),
        valid_to: new Date('2024-12-31'),
        is_active: true,
      },
      {
        id: 'promo-2',
        code: 'FIXED5',
        description: '$5 off your order',
        discount_type: 'fixed',
        amount: 5.00,
        minimum_order_amount: 20.00,
        usage_limit: 50,
        used_count: 10,
        valid_from: new Date('2024-01-01'),
        valid_to: new Date('2024-12-31'),
        is_active: true,
      },
      {
        id: 'promo-3',
        code: 'EXPIRED',
        description: 'Expired promo code',
        discount_type: 'percentage',
        amount: 20.00,
        minimum_order_amount: 0,
        usage_limit: 10,
        used_count: 2,
        valid_from: new Date('2023-01-01'),
        valid_to: new Date('2023-12-31'),
        is_active: false,
      }
    ]);

    // Create loyalty points for users
    await LoyaltyPoints.bulkCreate([
      {
        id: 'loyalty-1',
        user_id: 'user-1',
        total_points: 150,
        available_points: 150,
        lifetime_points: 150,
      },
      {
        id: 'loyalty-2', 
        user_id: 'user-3',
        total_points: 50,
        available_points: 50,
        lifetime_points: 50,
      }
    ]);

    return { users, products, promoCodes };
  } catch (error) {
    console.error('Error seeding test database:', error);
    throw error;
  }
}