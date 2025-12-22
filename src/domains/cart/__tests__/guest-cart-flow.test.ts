import { EnhancedCartService } from '../services/EnhancedCartService';
import { ProductService } from '../../products/services/ProductService';

// Mock the dependencies
const mockProductService = {
  getProductById: jest.fn(),
};

jest.mock('../../products/services/ProductService', () => {
  return {
    ProductService: jest.fn().mockImplementation(() => mockProductService)
  };
});

jest.mock('../../../config/redis', () => ({
  getRedisClient: () => null, // This will use memory storage for testing
}));

describe('Guest Cart Flow', () => {
  let cartService: EnhancedCartService;

  beforeEach(() => {
    jest.clearAllMocks();
    cartService = new EnhancedCartService();
  });

  describe('Session Management', () => {
    it('should generate unique session IDs', () => {
      const sessionId1 = cartService.generateSessionId();
      const sessionId2 = cartService.generateSessionId();
      
      expect(sessionId1).toMatch(/^guest_mock-uuid-\d{8}-4444-4444-4444-123456789abc$/);
      expect(sessionId2).toMatch(/^guest_mock-uuid-\d{8}-4444-4444-4444-123456789abc$/);
      expect(sessionId1).not.toBe(sessionId2);
    });

    it('should create empty cart for new session', async () => {
      const sessionId = cartService.generateSessionId();
      const cart = await cartService.getCart({ session_id: sessionId });
      
      expect(cart.session_id).toBe(sessionId);
      expect(cart.user_id).toBeUndefined();
      expect(cart.items).toEqual([]);
      expect(cart.total_amount).toBe(0);
      expect(cart.expires_at).toBeDefined();
    });
  });

  describe('Guest Cart Operations', () => {
    let sessionId: string;

    beforeEach(() => {
      sessionId = cartService.generateSessionId();
      
      // Mock product service responses
      mockProductService.getProductById.mockImplementation((id: string) => {
        const mockProducts: any = {
          'product-1': { id: 'product-1', name: 'Chocolate Cake', price: 25.99, stock: 10 },
          'product-2': { id: 'product-2', name: 'Vanilla Cupcake', price: 3.99, stock: 50 },
        };
        return Promise.resolve(mockProducts[id] || null);
      });
    });

    it('should add regular item to guest cart', async () => {
      const cart = await cartService.addItem({ session_id: sessionId }, 'product-1', 2);
      
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].product_id).toBe('product-1');
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.items[0].unit_price).toBe(25.99);
      expect(cart.items[0].subtotal).toBe(51.98);
      expect(cart.total_amount).toBe(51.98);
    });

    it('should add custom cake to guest cart', async () => {
      const customConfig = {
        flavor: 'Chocolate',
        size: '8 inch',
        frosting: 'Buttercream',
        message: 'Happy Birthday!',
      };

      const cart = await cartService.addItem(
        { session_id: sessionId }, 
        'product-1', 
        1, 
        customConfig
      );
      
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].custom_cake_config).toEqual(customConfig);
    });

    it('should update guest information', async () => {
      const guestInfo = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      };

      const cart = await cartService.updateGuestInfo({ session_id: sessionId }, guestInfo);
      
      expect(cart.guest_info).toEqual(guestInfo);
    });

    it('should validate cart items', async () => {
      // Add item first
      await cartService.addItem({ session_id: sessionId }, 'product-1', 2);
      
      const validation = await cartService.validateCartItems({ session_id: sessionId });
      
      expect(validation.valid).toBe(true);
      expect(validation.issues).toEqual([]);
    });
  });

  describe('Cart to Order Integration', () => {
    it('should prepare cart data for order creation', async () => {
      const sessionId = cartService.generateSessionId();
      
      // Add items to cart
      await cartService.addItem({ session_id: sessionId }, 'product-1', 1);
      await cartService.addItem({ session_id: sessionId }, 'product-2', 3);
      
      // Update guest info
      await cartService.updateGuestInfo({ session_id: sessionId }, {
        name: 'Jane Doe',
        email: 'jane@example.com',
      });
      
      const cart = await cartService.getCart({ session_id: sessionId });
      
      // Verify cart is ready for order creation
      expect(cart.items).toHaveLength(2);
      expect(cart.guest_info?.name).toBe('Jane Doe');
      expect(cart.guest_info?.email).toBe('jane@example.com');
      expect(cart.total_amount).toBeGreaterThan(0);
    });
  });
});