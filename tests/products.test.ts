import request from 'supertest';
import app from '../src/app';
import { Product } from '../src/models/Product';
import { ProductService } from '../src/domains/products/services/ProductService';
import { User, UserRole } from '../src/models/User';
import { Review } from '../src/models/Review';
import bcrypt from 'bcrypt';

describe('Products API', () => {
  let productService: ProductService;
  let adminToken: string;
  let staffToken: string;
  let customerToken: string;

  beforeAll(async () => {
    productService = new ProductService();
    
    // Create admin user for authentication
    const hashedPassword = await bcrypt.hash('AdminPass123!', 12);
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@omade.com',
      password_hash: hashedPassword,
      role: UserRole.ADMIN,
      phone: '+1234567890',
    } as any);

    // Create staff user
    const staffUser = await User.create({
      name: 'Staff User',
      email: 'staff@omade.com',
      password_hash: hashedPassword,
      role: UserRole.STAFF,
      phone: '+1234567891',
    } as any);

    // Create customer user
    const customerUser = await User.create({
      name: 'Customer User',
      email: 'customer@omade.com',
      password_hash: hashedPassword,
      role: UserRole.CUSTOMER,
      phone: '+1234567892',
    } as any);

    // Get tokens
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@omade.com', password: 'AdminPass123!' });
    adminToken = adminLogin.body.data.access_token;

    const staffLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'staff@omade.com', password: 'AdminPass123!' });
    staffToken = staffLogin.body.data.access_token;

    const customerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@omade.com', password: 'AdminPass123!' });
    customerToken = customerLogin.body.data.access_token;
  });

  describe('GET /api/v1/products', () => {
    beforeEach(async () => {
      // Create test products
      await Product.bulkCreate([
        {
          name: 'Chocolate Cake',
          description: 'Rich chocolate cake',
          price: 25.99,
          category: 'cakes',
          stock: 10,
          image_url: 'https://example.com/chocolate-cake.jpg',
          is_customizable: true,
        },
        {
          name: 'Vanilla Cupcake',
          description: 'Sweet vanilla cupcake',
          price: 3.99,
          category: 'cupcakes',
          stock: 50,
          image_url: 'https://example.com/vanilla-cupcake.jpg',
          is_customizable: false,
        },
        {
          name: 'Red Velvet Cake',
          description: 'Classic red velvet cake',
          price: 28.99,
          category: 'cakes',
          stock: 5,
          image_url: 'https://example.com/red-velvet.jpg',
          is_customizable: true,
        },
      ] as any);
    });

    it('should return all products', async () => {
      const response = await request(app).get('/api/v1/products');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(3);
      expect(response.body.data.total).toBe(3);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(20);
    });

    it('should filter products by category', async () => {
      const response = await request(app).get('/api/v1/products?category=cakes');

      expect(response.status).toBe(200);
      expect(response.body.data.products).toHaveLength(2);
      expect(response.body.data.products.every((p: any) => p.category === 'cakes')).toBe(true);
    });

    it('should search products by name', async () => {
      const response = await request(app).get('/api/v1/products?search=chocolate');

      expect(response.status).toBe(200);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].name).toBe('Chocolate Cake');
    });

    it('should paginate results', async () => {
      const response = await request(app).get('/api/v1/products?page=1&limit=2');

      expect(response.status).toBe(200);
      expect(response.body.data.products).toHaveLength(2);
      expect(response.body.data.totalPages).toBe(2);
    });

    it('should filter by price range', async () => {
      const response = await request(app).get('/api/v1/products?minPrice=20&maxPrice=30');

      expect(response.status).toBe(200);
      expect(response.body.data.products).toHaveLength(2); // Chocolate and Red Velvet
      response.body.data.products.forEach((product: any) => {
        expect(parseFloat(product.price)).toBeGreaterThanOrEqual(20);
        expect(parseFloat(product.price)).toBeLessThanOrEqual(30);
      });
    });

    it('should filter by stock availability', async () => {
      const response = await request(app).get('/api/v1/products?inStock=true');

      expect(response.status).toBe(200);
      expect(response.body.data.products).toHaveLength(3);
      response.body.data.products.forEach((product: any) => {
        expect(product.stock).toBeGreaterThan(0);
      });
    });

    it('should sort products by name ascending', async () => {
      const response = await request(app).get('/api/v1/products?sortBy=name&sortOrder=ASC');

      expect(response.status).toBe(200);
      const products = response.body.data.products;
      expect(products[0].name).toBe('Chocolate Cake');
      expect(products[1].name).toBe('Red Velvet Cake');
      expect(products[2].name).toBe('Vanilla Cupcake');
    });

    it('should sort products by price descending', async () => {
      const response = await request(app).get('/api/v1/products?sortBy=price&sortOrder=DESC');

      expect(response.status).toBe(200);
      const products = response.body.data.products;
      const prices = products.map((p: any) => parseFloat(p.price));
      expect(prices[0]).toBeGreaterThanOrEqual(prices[1]);
      expect(prices[1]).toBeGreaterThanOrEqual(prices[2]);
    });

    it('should combine multiple filters', async () => {
      const response = await request(app).get('/api/v1/products?category=cakes&minPrice=25&sortBy=price&sortOrder=ASC');

      expect(response.status).toBe(200);
      const products = response.body.data.products;
      expect(products).toHaveLength(2);
      products.forEach((product: any) => {
        expect(product.category).toBe('cakes');
        expect(parseFloat(product.price)).toBeGreaterThanOrEqual(25);
      });
      expect(parseFloat(products[0].price)).toBeLessThanOrEqual(parseFloat(products[1].price));
    });

    it('should include rating data', async () => {
      const response = await request(app).get('/api/v1/products');
      
      expect(response.status).toBe(200);
      response.body.data.products.forEach((product: any) => {
        expect(product).toHaveProperty('avg_rating');
        expect(product).toHaveProperty('review_count');
      });
    });
  });

  describe('GET /api/v1/products/:id', () => {
    let productId: string;

    beforeEach(async () => {
      const product = await Product.create({
        name: 'Test Product',
        description: 'Test description',
        price: 10.99,
        category: 'test',
        stock: 1,
        is_customizable: false,
      } as any);
      productId = product.id;
    });

    it('should return a specific product', async () => {
      const response = await request(app).get(`/api/v1/products/${productId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(productId);
      expect(response.body.data.name).toBe('Test Product');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app).get('/api/v1/products/550e8400-e29b-41d4-a716-446655440000');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(app).get('/api/v1/products/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should include review data when requested', async () => {
      // Create test users for reviews
      const hashedPassword = await bcrypt.hash('password123', 12);
      const user1 = await User.create({
        name: 'Test User 1',
        email: 'user1@test.com',
        password_hash: hashedPassword,
        role: UserRole.CUSTOMER,
        phone: '+1234567893',
      } as any);

      const user2 = await User.create({
        name: 'Test User 2',
        email: 'user2@test.com',
        password_hash: hashedPassword,
        role: UserRole.CUSTOMER,
        phone: '+1234567894',
      } as any);

      // First create some reviews for the product
      await Review.bulkCreate([
        { product_id: productId, user_id: user1.id, rating: 5, comment: 'Great!' },
        { product_id: productId, user_id: user2.id, rating: 4, comment: 'Good!' }
      ] as any);

      const response = await request(app).get(`/api/v1/products/${productId}?includeReviews=true`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('avg_rating');
      expect(response.body.data).toHaveProperty('review_count');
      expect(parseFloat(response.body.data.avg_rating)).toBe(4.5);
      expect(parseInt(response.body.data.review_count)).toBe(2);
    });
  });

  describe('POST /api/v1/products', () => {
    const validProduct = {
      name: 'New Product',
      description: 'New description',
      price: 15.99,
      category: 'new',
      stock: 20,
      image_url: 'https://example.com/new-product.jpg',
      is_customizable: true,
    };

    it('should create a new product', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validProduct);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(validProduct.name);
      expect(parseFloat(response.body.data.price)).toBe(validProduct.price);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate price is positive', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validProduct, price: -1 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate stock is non-negative integer', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validProduct, stock: -1 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/products/categories', () => {
    beforeEach(async () => {
      await Product.bulkCreate([
        { name: 'Cake 1', category: 'cakes', price: 20, stock: 5 },
        { name: 'Cupcake 1', category: 'cupcakes', price: 5, stock: 10 },
        { name: 'Cookie 1', category: 'cookies', price: 3, stock: 15 },
        { name: 'Cake 2', category: 'cakes', price: 25, stock: 3 },
      ] as any);
    });

    it('should return unique categories', async () => {
      const response = await request(app).get('/api/v1/products/categories');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(expect.arrayContaining(['cakes', 'cookies', 'cupcakes']));
      expect(response.body.data).toHaveLength(3);
    });
  });

  describe('GET /api/v1/products/low-stock', () => {
    beforeEach(async () => {
      await Product.bulkCreate([
        { name: 'Low Stock 1', price: 10, stock: 2 },
        { name: 'Low Stock 2', price: 15, stock: 4 },
        { name: 'High Stock', price: 20, stock: 50 },
      ] as any);
    });

    it('should return low stock products for admin', async () => {
      const response = await request(app)
        .get('/api/v1/products/low-stock?threshold=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      response.body.data.forEach((product: any) => {
        expect(product.stock).toBeLessThanOrEqual(5);
      });
    });

    it('should return low stock products for staff', async () => {
      const response = await request(app)
        .get('/api/v1/products/low-stock')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
    });

    it('should deny access for customers', async () => {
      const response = await request(app)
        .get('/api/v1/products/low-stock')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/v1/products/low-stock');
      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/products/:id/stock', () => {
    let productId: string;

    beforeEach(async () => {
      const product = await Product.create({
        name: 'Stock Test Product',
        price: 10.99,
        stock: 10,
      } as any);
      productId = product.id;
    });

    it('should update stock for admin', async () => {
      const response = await request(app)
        .patch(`/api/v1/products/${productId}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ stockChange: 5 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.stock).toBe(15);
    });

    it('should update stock for staff', async () => {
      const response = await request(app)
        .patch(`/api/v1/products/${productId}/stock`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ stockChange: -3 });

      expect(response.status).toBe(200);
      expect(response.body.data.stock).toBe(7);
    });

    it('should deny access for customers', async () => {
      const response = await request(app)
        .patch(`/api/v1/products/${productId}/stock`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ stockChange: 5 });

      expect(response.status).toBe(403);
    });

    it('should return error for insufficient stock', async () => {
      const response = await request(app)
        .patch(`/api/v1/products/${productId}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ stockChange: -15 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Insufficient stock');
    });

    it('should validate stock change is a number', async () => {
      const response = await request(app)
        .patch(`/api/v1/products/${productId}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ stockChange: 'invalid' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/products/bulk-stock', () => {
    let product1Id: string;
    let product2Id: string;

    beforeEach(async () => {
      const products = await Product.bulkCreate([
        { name: 'Product 1', price: 10, stock: 10 },
        { name: 'Product 2', price: 15, stock: 20 },
      ] as any);
      product1Id = products[0].id;
      product2Id = products[1].id;
    });

    it('should bulk update stock for admin', async () => {
      const updates = [
        { id: product1Id, stock: 15 },
        { id: product2Id, stock: 25 },
      ];

      const response = await request(app)
        .post('/api/v1/products/bulk-stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ updates });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify updates
      const product1 = await Product.findByPk(product1Id);
      const product2 = await Product.findByPk(product2Id);
      expect(product1!.stock).toBe(15);
      expect(product2!.stock).toBe(25);
    });

    it('should deny access for staff', async () => {
      const response = await request(app)
        .post('/api/v1/products/bulk-stock')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ updates: [{ id: product1Id, stock: 15 }] });

      expect(response.status).toBe(403);
    });

    it('should validate updates array', async () => {
      const response = await request(app)
        .post('/api/v1/products/bulk-stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ updates: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('array');
    });
  });

  describe('ProductService', () => {
    describe('updateStock', () => {
      let product: Product;

      beforeEach(async () => {
        product = await Product.create({
          name: 'Stock Test Product',
          price: 10.99,
          stock: 10,
        } as any);
      });

      it('should increase stock', async () => {
        const updatedProduct = await productService.updateStock(product.id, 5);

        expect(updatedProduct).toBeDefined();
        expect(updatedProduct!.stock).toBe(15);
      });

      it('should decrease stock', async () => {
        const updatedProduct = await productService.updateStock(product.id, -3);

        expect(updatedProduct).toBeDefined();
        expect(updatedProduct!.stock).toBe(7);
      });

      it('should throw error for insufficient stock', async () => {
        await expect(productService.updateStock(product.id, -15)).rejects.toThrow('Insufficient stock');
      });

      it('should return null for non-existent product', async () => {
        const result = await productService.updateStock('550e8400-e29b-41d4-a716-446655440000', 5);
        expect(result).toBeNull();
      });
    });

    describe('getCategories', () => {
      beforeEach(async () => {
        await Product.bulkCreate([
          { name: 'Cake 1', category: 'cakes', price: 20, stock: 5 },
          { name: 'Cupcake 1', category: 'cupcakes', price: 5, stock: 10 },
          { name: 'Cake 2', category: 'cakes', price: 25, stock: 3 },
          { name: 'No Category', price: 15, stock: 8 },
        ] as any);
      });

      it('should return unique categories excluding null', async () => {
        const categories = await productService.getCategories();

        expect(categories).toEqual(expect.arrayContaining(['cakes', 'cupcakes']));
        expect(categories).toHaveLength(2);
        expect(categories).not.toContain(null);
        expect(categories).not.toContain(undefined);
      });
    });

    describe('getLowStockProducts', () => {
      beforeEach(async () => {
        await Product.bulkCreate([
          { name: 'Low Stock 1', price: 10, stock: 2 },
          { name: 'Low Stock 2', price: 15, stock: 4 },
          { name: 'Medium Stock', price: 20, stock: 8 },
          { name: 'High Stock', price: 25, stock: 50 },
        ] as any);
      });

      it('should return products below threshold', async () => {
        const products = await productService.getLowStockProducts(5);

        expect(products).toHaveLength(2);
        products.forEach(product => {
          expect(product.stock).toBeLessThanOrEqual(5);
        });
      });

      it('should use default threshold of 5', async () => {
        const products = await productService.getLowStockProducts();

        expect(products).toHaveLength(2);
      });

      it('should sort by stock ascending', async () => {
        const products = await productService.getLowStockProducts(10);

        expect(products).toHaveLength(3);
        expect(products[0].stock).toBeLessThanOrEqual(products[1].stock);
        expect(products[1].stock).toBeLessThanOrEqual(products[2].stock);
      });
    });

    describe('bulkUpdateStock', () => {
      let product1: Product;
      let product2: Product;

      beforeEach(async () => {
        const products = await Product.bulkCreate([
          { name: 'Product 1', price: 10, stock: 10 },
          { name: 'Product 2', price: 15, stock: 20 },
        ] as any);
        product1 = products[0];
        product2 = products[1];
      });

      it('should update multiple products', async () => {
        const updates = [
          { id: product1.id, stock: 15 },
          { id: product2.id, stock: 25 },
        ];

        await productService.bulkUpdateStock(updates);

        await product1.reload();
        await product2.reload();
        expect(product1.stock).toBe(15);
        expect(product2.stock).toBe(25);
      });

      it('should rollback on error', async () => {
        const updates = [
          { id: product1.id, stock: 15 },
          { id: 'invalid-id', stock: 25 }, // This will cause an error
        ];

        await expect(productService.bulkUpdateStock(updates)).rejects.toThrow();

        // Verify rollback - stock should remain unchanged
        await product1.reload();
        expect(product1.stock).toBe(10);
      });
    });

    describe('getProductWithReviews', () => {
      let product: Product;

      beforeEach(async () => {
        product = await Product.create({
          name: 'Test Product',
          price: 10.99,
          stock: 5,
        } as any);

        // Create test users for reviews
        const hashedPassword = await bcrypt.hash('password123', 12);
        const user1 = await User.create({
          name: 'Review User 1',
          email: 'review1@test.com',
          password_hash: hashedPassword,
          role: UserRole.CUSTOMER,
          phone: '+1234567895',
        } as any);

        const user2 = await User.create({
          name: 'Review User 2',
          email: 'review2@test.com',
          password_hash: hashedPassword,
          role: UserRole.CUSTOMER,
          phone: '+1234567896',
        } as any);

        const user3 = await User.create({
          name: 'Review User 3',
          email: 'review3@test.com',
          password_hash: hashedPassword,
          role: UserRole.CUSTOMER,
          phone: '+1234567897',
        } as any);

        await Review.bulkCreate([
          { product_id: product.id, user_id: user1.id, rating: 5, comment: 'Excellent!' },
          { product_id: product.id, user_id: user2.id, rating: 4, comment: 'Very good!' },
          { product_id: product.id, user_id: user3.id, rating: 3, comment: 'Average' },
        ] as any);
      });

      it('should include average rating and review count', async () => {
        const result = await productService.getProductWithReviews(product.id);

        expect(result).toBeDefined();
        expect(result!.dataValues).toHaveProperty('avg_rating');
        expect(result!.dataValues).toHaveProperty('review_count');
        expect(parseFloat(result!.dataValues.avg_rating)).toBe(4);
        expect(parseInt(result!.dataValues.review_count)).toBe(3);
      });

      it('should handle products with no reviews', async () => {
        const newProduct = await Product.create({
          name: 'No Reviews Product',
          price: 15.99,
          stock: 10,
        } as any);

        const result = await productService.getProductWithReviews(newProduct.id);

        expect(result).toBeDefined();
        expect(parseFloat(result!.dataValues.avg_rating)).toBe(0);
        expect(parseInt(result!.dataValues.review_count)).toBe(0);
      });
    });
  });
});