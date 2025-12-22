import { ProductService } from '../../products/services/ProductService';
import { getRedisClient } from '../../../config/redis';
import { v4 as uuidv4 } from 'uuid';

export interface CartItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  custom_cake_config?: CustomCakeConfig;
}

export interface CustomCakeConfig {
  flavor: string;
  size: string;
  frosting: string;
  message?: string;
  image_reference?: string;
  extra_details?: {
    layers?: number;
    decorations?: string[];
    allergens?: string[];
    dietary_restrictions?: string[];
    special_instructions?: string;
  };
}

export interface Cart {
  id: string; // Cart ID (user ID for authenticated, session ID for guests)
  user_id?: string; // Only present for authenticated users
  session_id?: string; // Only present for guest users
  items: CartItem[];
  total_amount: number;
  updated_at: string;
  expires_at?: string; // Only for guest carts
  guest_info?: GuestInfo;
}

export interface GuestInfo {
  email?: string;
  phone?: string;
  name?: string;
}

export interface CartIdentifier {
  user_id?: string;
  session_id?: string;
}

export class EnhancedCartService {
  private productService = new ProductService();
  private redisClient: any;

  // Fallback in-memory storage for when Redis is not available
  private memoryStorage = new Map<string, Cart>();

  constructor() {
    this.redisClient = getRedisClient();
  }

  /**
   * Generate a new session ID for guest users
   */
  generateSessionId(): string {
    return `guest_${uuidv4()}`;
  }

  /**
   * Get cart identifier key for Redis storage
   */
  private getCartKey(identifier: CartIdentifier): string {
    if (identifier.user_id) {
      return `cart:user:${identifier.user_id}`;
    } else if (identifier.session_id) {
      return `cart:session:${identifier.session_id}`;
    }
    throw new Error('Either user_id or session_id must be provided');
  }

  /**
   * Get cart from Redis or memory fallback
   */
  private async getStoredCart(key: string): Promise<Cart | null> {
    try {
      if (this.redisClient) {
        const cartData = await this.redisClient.get(key);
        return cartData ? JSON.parse(cartData) : null;
      } else {
        return this.memoryStorage.get(key) || null;
      }
    } catch (error) {
      console.error('Error getting cart from storage:', error);
      return this.memoryStorage.get(key) || null;
    }
  }

  /**
   * Save cart to Redis or memory fallback
   */
  private async saveCart(key: string, cart: Cart): Promise<void> {
    try {
      if (this.redisClient) {
        const expireTime = cart.expires_at ? Math.floor((new Date(cart.expires_at).getTime() - Date.now()) / 1000) : undefined;
        await this.redisClient.set(key, JSON.stringify(cart), expireTime ? { EX: expireTime } : undefined);
      } else {
        this.memoryStorage.set(key, cart);
      }
    } catch (error) {
      console.error('Error saving cart to storage:', error);
      this.memoryStorage.set(key, cart);
    }
  }

  /**
   * Delete cart from storage
   */
  private async deleteCart(key: string): Promise<void> {
    try {
      if (this.redisClient) {
        await this.redisClient.del(key);
      }
      this.memoryStorage.delete(key);
    } catch (error) {
      console.error('Error deleting cart from storage:', error);
      this.memoryStorage.delete(key);
    }
  }

  /**
   * Get cart for authenticated user or guest session
   */
  async getCart(identifier: CartIdentifier): Promise<Cart> {
    const key = this.getCartKey(identifier);
    let cart = await this.getStoredCart(key);
    
    if (!cart) {
      // Create new cart
      const cartId = identifier.user_id || identifier.session_id!;
      const isGuest = !identifier.user_id;
      
      cart = {
        id: cartId,
        user_id: identifier.user_id,
        session_id: identifier.session_id,
        items: [],
        total_amount: 0,
        updated_at: new Date().toISOString(),
        // Guest carts expire after 7 days
        expires_at: isGuest ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      };
      
      await this.saveCart(key, cart);
    }
    
    // Check if cart has expired (for guest carts)
    if (cart.expires_at && new Date(cart.expires_at) < new Date()) {
      await this.deleteCart(key);
      // Return new empty cart
      return this.getCart(identifier);
    }
    
    return cart;
  }

  /**
   * Add item to cart (supports both regular products and custom cakes)
   */
  async addItem(
    identifier: CartIdentifier, 
    productId: string, 
    quantity: number, 
    customCakeConfig?: CustomCakeConfig
  ): Promise<Cart> {
    // Get product details
    const product = await this.productService.getProductById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // For regular products, check stock
    if (!customCakeConfig && product.stock <= 0) {
      throw new Error('Product is out of stock');
    }

    // Get current cart
    const cart = await this.getCart(identifier);

    // For custom cakes, create unique item identifier
    const itemKey = customCakeConfig 
      ? `${productId}_${JSON.stringify(customCakeConfig)}` 
      : productId;

    // Check if item already exists in cart (for regular products only)
    const existingItemIndex = cart.items.findIndex(item => {
      if (customCakeConfig) {
        return item.product_id === productId && 
               JSON.stringify(item.custom_cake_config) === JSON.stringify(customCakeConfig);
      }
      return item.product_id === productId && !item.custom_cake_config;
    });

    if (existingItemIndex !== -1) {
      // For custom cakes, always create new item instead of updating quantity
      if (customCakeConfig) {
        const newItem: CartItem = {
          product_id: productId,
          quantity,
          unit_price: product.price,
          subtotal: quantity * product.price,
          custom_cake_config: customCakeConfig,
        };
        cart.items.push(newItem);
      } else {
        // Update existing regular product
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;
        if (newQuantity > product.stock) {
          throw new Error('Insufficient stock for requested quantity');
        }
        cart.items[existingItemIndex].quantity = newQuantity;
        cart.items[existingItemIndex].subtotal = 
          cart.items[existingItemIndex].quantity * cart.items[existingItemIndex].unit_price;
      }
    } else {
      // Check stock for regular products
      if (!customCakeConfig && quantity > product.stock) {
        throw new Error('Insufficient stock');
      }

      // Add new item
      const newItem: CartItem = {
        product_id: productId,
        quantity,
        unit_price: product.price,
        subtotal: quantity * product.price,
        custom_cake_config: customCakeConfig,
      };
      cart.items.push(newItem);
    }

    // Update cart totals and timestamp
    await this.updateCartTotals(cart);
    
    const key = this.getCartKey(identifier);
    await this.saveCart(key, cart);

    return cart;
  }

  /**
   * Update item quantity in cart
   */
  async updateItemQuantity(identifier: CartIdentifier, productId: string, quantity: number, itemIndex?: number): Promise<Cart> {
    if (quantity <= 0) {
      return await this.removeItem(identifier, productId, itemIndex);
    }

    const cart = await this.getCart(identifier);

    // Find item (use itemIndex for custom cakes, productId for regular items)
    let targetIndex = -1;
    if (itemIndex !== undefined) {
      targetIndex = itemIndex;
    } else {
      targetIndex = cart.items.findIndex(item => item.product_id === productId && !item.custom_cake_config);
    }

    if (targetIndex === -1) {
      throw new Error('Item not found in cart');
    }

    // Get product to check stock (skip for custom cakes)
    if (!cart.items[targetIndex].custom_cake_config) {
      const product = await this.productService.getProductById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      if (quantity > product.stock) {
        throw new Error('Insufficient stock');
      }
    }

    // Update quantity and subtotal
    cart.items[targetIndex].quantity = quantity;
    cart.items[targetIndex].subtotal = quantity * cart.items[targetIndex].unit_price;

    // Update cart totals
    await this.updateCartTotals(cart);
    
    const key = this.getCartKey(identifier);
    await this.saveCart(key, cart);

    return cart;
  }

  /**
   * Remove item from cart
   */
  async removeItem(identifier: CartIdentifier, productId: string, itemIndex?: number): Promise<Cart> {
    const cart = await this.getCart(identifier);

    // Find item to remove
    if (itemIndex !== undefined) {
      // Remove by index (useful for custom cakes)
      if (itemIndex >= 0 && itemIndex < cart.items.length) {
        cart.items.splice(itemIndex, 1);
      }
    } else {
      // Remove regular product (first occurrence without custom config)
      cart.items = cart.items.filter((item, index) => {
        if (index === cart.items.findIndex(i => i.product_id === productId && !i.custom_cake_config)) {
          return false;
        }
        return true;
      });
    }

    // Update cart totals
    await this.updateCartTotals(cart);
    
    const key = this.getCartKey(identifier);
    await this.saveCart(key, cart);

    return cart;
  }

  /**
   * Clear entire cart
   */
  async clearCart(identifier: CartIdentifier): Promise<void> {
    const key = this.getCartKey(identifier);
    await this.deleteCart(key);
  }

  /**
   * Get total item count in cart
   */
  async getCartItemCount(identifier: CartIdentifier): Promise<number> {
    const cart = await this.getCart(identifier);
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * Update guest information in cart
   */
  async updateGuestInfo(identifier: CartIdentifier, guestInfo: GuestInfo): Promise<Cart> {
    if (identifier.user_id) {
      throw new Error('Cannot update guest info for authenticated user cart');
    }

    const cart = await this.getCart(identifier);
    cart.guest_info = { ...cart.guest_info, ...guestInfo };
    cart.updated_at = new Date().toISOString();

    const key = this.getCartKey(identifier);
    await this.saveCart(key, cart);

    return cart;
  }

  /**
   * Merge guest cart with user cart when user logs in
   */
  async mergeGuestCartWithUserCart(sessionId: string, userId: string): Promise<Cart> {
    const guestCart = await this.getCart({ session_id: sessionId });
    const userCart = await this.getCart({ user_id: userId });

    // Merge items from guest cart to user cart
    for (const guestItem of guestCart.items) {
      await this.addItem(
        { user_id: userId }, 
        guestItem.product_id, 
        guestItem.quantity, 
        guestItem.custom_cake_config
      );
    }

    // Clear guest cart
    await this.clearCart({ session_id: sessionId });

    // Return updated user cart
    return await this.getCart({ user_id: userId });
  }

  /**
   * Calculate and update cart totals
   */
  private async updateCartTotals(cart: Cart): Promise<void> {
    cart.total_amount = cart.items.reduce((total, item) => total + item.subtotal, 0);
    cart.updated_at = new Date().toISOString();
  }

  /**
   * Validate cart items against current product data
   */
  async validateCartItems(identifier: CartIdentifier): Promise<{ valid: boolean; issues: string[] }> {
    const cart = await this.getCart(identifier);
    const issues: string[] = [];

    for (const item of cart.items) {
      const product = await this.productService.getProductById(item.product_id);
      
      if (!product) {
        issues.push(`Product ${item.product_id} is no longer available`);
        continue;
      }

      // Check if price has changed
      if (item.unit_price !== product.price) {
        issues.push(`Price for ${product.name} has changed from $${item.unit_price} to $${product.price}`);
      }

      // Check stock for regular products
      if (!item.custom_cake_config && item.quantity > product.stock) {
        issues.push(`Insufficient stock for ${product.name}. Available: ${product.stock}, In cart: ${item.quantity}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Refresh cart prices and availability
   */
  async refreshCart(identifier: CartIdentifier): Promise<Cart> {
    const cart = await this.getCart(identifier);
    let hasChanges = false;

    // Update prices and check availability
    for (let i = cart.items.length - 1; i >= 0; i--) {
      const item = cart.items[i];
      const product = await this.productService.getProductById(item.product_id);
      
      if (!product) {
        // Remove unavailable products
        cart.items.splice(i, 1);
        hasChanges = true;
        continue;
      }

      // Update price if changed
      if (item.unit_price !== product.price) {
        item.unit_price = product.price;
        item.subtotal = item.quantity * product.price;
        hasChanges = true;
      }

      // Adjust quantity if insufficient stock (regular products only)
      if (!item.custom_cake_config && item.quantity > product.stock) {
        if (product.stock > 0) {
          item.quantity = product.stock;
          item.subtotal = item.quantity * product.price;
          hasChanges = true;
        } else {
          // Remove out of stock items
          cart.items.splice(i, 1);
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      await this.updateCartTotals(cart);
      const key = this.getCartKey(identifier);
      await this.saveCart(key, cart);
    }

    return cart;
  }
}