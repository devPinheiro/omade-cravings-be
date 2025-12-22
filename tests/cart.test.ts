import { CartService } from '../src/domains/cart/services/CartService';
import { Product } from '../src/models/Product';
import { getRedisClient } from '../src/config/redis';

describe('CartService', () => {
  let cartService: CartService;
  let testUserId: string;
  let testProduct: Product;

  beforeAll(() => {
    cartService = new CartService();
    testUserId = '550e8400-e29b-41d4-a716-446655440001';
  });

  beforeEach(async () => {
    // Create test product
    testProduct = await Product.create({
      name: 'Test Product',
      description: 'Test description',
      price: 10.50,
      category: 'test',
      stock: 100,
      is_customizable: false,
    } as any);

    // Clear cart for the test user
    await cartService.clearCart(testUserId);

    // Clear Redis cart (if used)
    const redisClient = getRedisClient();
    if (redisClient) {
      await redisClient.del(`cart:${testUserId}`);
    }
  });

  describe('getCart', () => {
    it('should return empty cart for new user', async () => {
      const cart = await cartService.getCart(testUserId);

      expect(cart.user_id).toBe(testUserId);
      expect(cart.items).toHaveLength(0);
      expect(cart.total_amount).toBe(0);
      expect(cart.updated_at).toBeDefined();
    });

    it('should return existing cart', async () => {
      // Add item first
      await cartService.addItem(testUserId, testProduct.id, 2);

      const cart = await cartService.getCart(testUserId);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].product_id).toBe(testProduct.id);
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.total_amount).toBe(21.00);
    });
  });

  describe('addItem', () => {
    it('should add new item to cart', async () => {
      const cart = await cartService.addItem(testUserId, testProduct.id, 3);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].product_id).toBe(testProduct.id);
      expect(cart.items[0].quantity).toBe(3);
      expect(cart.items[0].unit_price).toBe(testProduct.price);
      expect(cart.items[0].subtotal).toBe(31.50);
      expect(cart.total_amount).toBe(31.50);
    });

    it('should update quantity for existing item', async () => {
      // Add item first time
      await cartService.addItem(testUserId, testProduct.id, 2);
      
      // Add same item again
      const cart = await cartService.addItem(testUserId, testProduct.id, 1);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(3);
      expect(cart.total_amount).toBe(31.50);
    });

    it('should throw error for non-existent product', async () => {
      await expect(
        cartService.addItem(testUserId, '550e8400-e29b-41d4-a716-446655440000', 1)
      ).rejects.toThrow('Product not found');
    });

    it('should throw error for insufficient stock', async () => {
      await expect(
        cartService.addItem(testUserId, testProduct.id, 150)
      ).rejects.toThrow('Insufficient stock');
    });

    it('should throw error when adding to existing item exceeds stock', async () => {
      // Add 50 items first
      await cartService.addItem(testUserId, testProduct.id, 50);
      
      // Try to add 60 more (total would be 110, but stock is 100)
      await expect(
        cartService.addItem(testUserId, testProduct.id, 60)
      ).rejects.toThrow('Insufficient stock for requested quantity');
    });
  });

  describe('updateItemQuantity', () => {
    beforeEach(async () => {
      await cartService.addItem(testUserId, testProduct.id, 5);
    });

    it('should update item quantity', async () => {
      const cart = await cartService.updateItemQuantity(testUserId, testProduct.id, 3);

      expect(cart.items[0].quantity).toBe(3);
      expect(cart.items[0].subtotal).toBe(31.50);
      expect(cart.total_amount).toBe(31.50);
    });

    it('should remove item when quantity is 0', async () => {
      const cart = await cartService.updateItemQuantity(testUserId, testProduct.id, 0);

      expect(cart.items).toHaveLength(0);
      expect(cart.total_amount).toBe(0);
    });

    it('should remove item when quantity is negative', async () => {
      const cart = await cartService.updateItemQuantity(testUserId, testProduct.id, -1);

      expect(cart.items).toHaveLength(0);
      expect(cart.total_amount).toBe(0);
    });

    it('should throw error for insufficient stock', async () => {
      await expect(
        cartService.updateItemQuantity(testUserId, testProduct.id, 150)
      ).rejects.toThrow('Insufficient stock');
    });

    it('should throw error for non-existent item', async () => {
      const anotherProduct = await Product.create({
        name: 'Another Product',
        price: 5.99,
        stock: 10,
      } as any);

      await expect(
        cartService.updateItemQuantity(testUserId, anotherProduct.id, 1)
      ).rejects.toThrow('Item not found in cart');
    });
  });

  describe('removeItem', () => {
    beforeEach(async () => {
      await cartService.addItem(testUserId, testProduct.id, 3);
    });

    it('should remove item from cart', async () => {
      const cart = await cartService.removeItem(testUserId, testProduct.id);

      expect(cart.items).toHaveLength(0);
      expect(cart.total_amount).toBe(0);
    });

    it('should not throw error for non-existent item', async () => {
      const cart = await cartService.removeItem(testUserId, '550e8400-e29b-41d4-a716-446655440000');

      expect(cart.items).toHaveLength(1); // Original item still there
    });
  });

  describe('clearCart', () => {
    beforeEach(async () => {
      await cartService.addItem(testUserId, testProduct.id, 2);
    });

    it('should clear entire cart', async () => {
      await cartService.clearCart(testUserId);

      const cart = await cartService.getCart(testUserId);
      expect(cart.items).toHaveLength(0);
      expect(cart.total_amount).toBe(0);
    });
  });

  describe('multiple products in cart', () => {
    let product2: Product;

    beforeEach(async () => {
      product2 = await Product.create({
        name: 'Test Product 2',
        price: 15.75,
        stock: 50,
      } as any);
    });

    it('should handle multiple products correctly', async () => {
      await cartService.addItem(testUserId, testProduct.id, 2);
      const cart = await cartService.addItem(testUserId, product2.id, 1);

      expect(cart.items).toHaveLength(2);
      expect(cart.total_amount).toBe(36.75); // (10.50 * 2) + (15.75 * 1)
    });

    it('should update total when removing one product', async () => {
      await cartService.addItem(testUserId, testProduct.id, 2);
      await cartService.addItem(testUserId, product2.id, 1);
      
      const cart = await cartService.removeItem(testUserId, testProduct.id);

      expect(cart.items).toHaveLength(1);
      expect(cart.total_amount).toBe(15.75);
    });
  });
});