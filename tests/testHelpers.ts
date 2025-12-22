import { testSequelize, seedTestDatabase } from '../src/config/testDatabase';

// Export test database instance for tests to use
export { testSequelize as sequelize };

// Helper function to get seeded test data
export const getTestData = seedTestDatabase;

// Helper function to create test users for auth tests
export async function createTestUsers() {
  const bcrypt = await import('bcrypt');
  
  // Import User type for proper typing
  const { User } = await import('../src/models/User');
  
  const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
  
  const testUser = await User.create({
    id: 'test-user-auth',
    name: 'Test User',
    email: 'test@example.com',
    password_hash: hashedPassword,
    role: 'customer',
    phone: '+1234567890',
  } as any);

  const adminUser = await User.create({
    id: 'admin-user-auth',
    name: 'Admin User',
    email: 'admin@example.com',
    password_hash: hashedPassword,
    role: 'admin',
    phone: '+1234567891',
  } as any);

  const staffUser = await User.create({
    id: 'staff-user-auth',
    name: 'Staff User',
    email: 'staff@example.com',
    password_hash: hashedPassword,
    role: 'staff',
    phone: '+1234567892',
  } as any);

  return { testUser, adminUser, staffUser, password: 'TestPassword123!' };
}

// Helper function to create test products
export async function createTestProducts() {
  // Get Product model from test database
  const Product = testSequelize.models.Product;
  
  const products = await Product.bulkCreate([
    {
      id: 'test-product-1',
      name: 'Test Cake',
      description: 'A test cake',
      price: 25.99,
      category: 'cakes',
      stock: 10,
      is_available: true,
    },
    {
      id: 'test-product-2',
      name: 'Test Cupcakes',
      description: 'Test cupcakes pack of 6',
      price: 15.99,
      category: 'cupcakes',
      stock: 20,
      is_available: true,
    },
  ]);

  return products;
}