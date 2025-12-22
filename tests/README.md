# 🧪 Omade Cravings Bakery Platform - Test Suite

This directory contains comprehensive tests for the bakery platform backend.

## Test Structure

```
tests/
├── README.md              # This file
├── setup.ts               # Test setup and teardown
├── globalSetup.ts         # Global test configuration
├── products.test.ts       # Products domain tests
├── cart.test.ts           # Cart/Redis functionality tests
├── reviews.test.ts        # Reviews and ratings tests
├── promo.test.ts          # Promo codes validation tests
├── loyalty.test.ts        # Loyalty points system tests
└── integration.test.ts    # API endpoint integration tests
```

## Test Coverage

### 🍰 **Products Domain**
- ✅ Product CRUD operations
- ✅ Product filtering and search
- ✅ Pagination
- ✅ Stock management
- ✅ Validation rules
- ✅ Error handling

### 🛒 **Cart Domain**
- ✅ Redis cart persistence
- ✅ Add/update/remove items
- ✅ Stock validation
- ✅ Cart calculations
- ✅ Multiple products handling
- ✅ User isolation

### ⭐ **Reviews Domain**
- ✅ Review creation and validation
- ✅ Rating calculations
- ✅ User and product associations
- ✅ Duplicate prevention
- ✅ Review deletion
- ✅ Pagination and ordering

### 🎟️ **Promo Codes Domain**
- ✅ Promo code creation
- ✅ Validation logic (expiry, usage limits)
- ✅ Discount calculations (percent/fixed)
- ✅ Case-insensitive validation
- ✅ Usage tracking
- ✅ Active promo filtering

### 🏆 **Loyalty Points Domain**
- ✅ Points account creation
- ✅ Points earning from orders
- ✅ Points redemption
- ✅ Balance tracking
- ✅ Insufficient funds handling
- ✅ Concurrent operations

### 🌐 **Integration Tests**
- ✅ API endpoint accessibility
- ✅ HTTP methods support
- ✅ Request/response formatting
- ✅ Error handling consistency
- ✅ CORS and security headers
- ✅ Query parameter validation

## Prerequisites

Before running tests, ensure you have:

1. **PostgreSQL** running with a test database
2. **Redis** server running
3. **Node.js** and npm installed

## Setup Test Environment

1. **Create Test Database:**
   ```sql
   CREATE DATABASE omade_cravings_test;
   CREATE USER test WITH PASSWORD 'test';
   GRANT ALL PRIVILEGES ON DATABASE omade_cravings_test TO test;
   ```

2. **Configure Environment:**
   ```bash
   cp .env.example .env.test
   # Edit .env.test with your test database credentials
   ```

3. **Install Dependencies:**
   ```bash
   npm install
   ```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Specific Test Files
```bash
# Products tests only
npm test -- products.test.ts

# Cart tests only
npm test -- cart.test.ts

# Integration tests only
npm test -- integration.test.ts
```

### Run Tests for CI/CD
```bash
npm run test:ci
```

## Test Configuration

### Jest Configuration
- **Environment:** Node.js
- **Test Runner:** Jest with ts-jest
- **Timeout:** 10 seconds per test
- **Workers:** 1 (sequential execution for database consistency)
- **Setup:** Automatic database sync and cleanup

### Database Handling
- **Before All Tests:** Database connection and schema sync
- **Before Each Test:** Database truncation (clean slate)
- **After All Tests:** Database cleanup and connection closure

### Redis Handling
- **Test Isolation:** Different Redis database (DB 1)
- **Cleanup:** Automatic cart data cleanup between tests

## Test Patterns

### Service Layer Testing
```typescript
describe('ProductService', () => {
  let productService: ProductService;

  beforeAll(() => {
    productService = new ProductService();
  });

  it('should create a product', async () => {
    const product = await productService.createProduct(validData);
    expect(product.name).toBe(validData.name);
  });
});
```

### API Endpoint Testing
```typescript
describe('GET /api/v1/products', () => {
  it('should return all products', async () => {
    const response = await request(app).get('/api/v1/products');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### Error Testing
```typescript
it('should throw error for insufficient stock', async () => {
  await expect(
    cartService.addItem(userId, productId, 150)
  ).rejects.toThrow('Insufficient stock');
});
```

## Mock Data Patterns

### User Creation
```typescript
const testUser = await User.create({
  name: 'Test User',
  email: 'test@example.com',
  password_hash: 'hashedpassword',
  role: UserRole.CUSTOMER,
} as any);
```

### Product Creation
```typescript
const testProduct = await Product.create({
  name: 'Test Product',
  description: 'Test description',
  price: 10.50,
  category: 'test',
  stock: 100,
  is_customizable: false,
} as any);
```

## Coverage Goals

- **Statements:** > 90%
- **Branches:** > 85%
- **Functions:** > 90%
- **Lines:** > 90%

## Debugging Tests

### Verbose Output
```bash
npm test -- --verbose
```

### Debug Specific Test
```bash
npm test -- --testNamePattern="should create a product"
```

### Database Debug
```bash
# Check test database state
psql -d omade_cravings_test -U test
\dt  # List tables
SELECT * FROM products;
```

## Common Issues

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env.test
- Verify test user permissions

### Redis Connection Issues
- Ensure Redis server is running
- Check REDIS_URL configuration
- Verify Redis DB 1 is available

### Test Timeout Issues
- Increase Jest timeout if needed
- Check for hanging database connections
- Verify Redis cleanup

## Contributing

When adding new tests:

1. Follow existing patterns
2. Include both success and error scenarios
3. Test edge cases
4. Maintain database cleanup
5. Update this README if adding new test files

## Performance Considerations

- Tests run sequentially to avoid database conflicts
- Database is truncated between tests (fast operation)
- Redis uses separate database for isolation
- Connection pooling is optimized for test environment