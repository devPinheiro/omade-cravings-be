import { ProductService } from '../../products/services/ProductService';

export interface CartItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Cart {
  user_id: string;
  items: CartItem[];
  total_amount: number;
  updated_at: string;
}

const productService = new ProductService();

// In-memory cart storage (replace with database in production)
const cartStorage = new Map<string, Cart>();

export class CartService {
  async getCart(userId: string): Promise<Cart> {
    let cart = cartStorage.get(userId);
    
    if (!cart) {
      // Create empty cart
      cart = {
        user_id: userId,
        items: [],
        total_amount: 0,
        updated_at: new Date().toISOString(),
      };
      cartStorage.set(userId, cart);
    }
    
    return cart;
  }

  async addItem(userId: string, productId: string, quantity: number): Promise<Cart> {
    // Get product details
    const product = await productService.getProductById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (product.stock <= 0) {
      throw new Error('Product is out of stock');
    }

    // Get current cart
    let cart = await this.getCart(userId);

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(item => item.product_id === productId);

    if (existingItemIndex !== -1) {
      // Check if adding to existing quantity exceeds stock
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      if (newQuantity > product.stock) {
        throw new Error('Insufficient stock for requested quantity');
      }
      // Update quantity
      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].subtotal = 
        cart.items[existingItemIndex].quantity * cart.items[existingItemIndex].unit_price;
    } else {
      // Check if requested quantity exceeds stock for new item
      if (quantity > product.stock) {
        throw new Error('Insufficient stock');
      }
      // Add new item
      const newItem: CartItem = {
        product_id: productId,
        quantity,
        unit_price: product.price,
        subtotal: quantity * product.price,
      };
      cart.items.push(newItem);
    }

    // Update cart totals
    cart.total_amount = cart.items.reduce((total, item) => total + item.subtotal, 0);
    cart.updated_at = new Date().toISOString();

    // Save cart
    cartStorage.set(userId, cart);

    return cart;
  }

  async updateItemQuantity(userId: string, productId: string, quantity: number): Promise<Cart> {
    if (quantity <= 0) {
      return await this.removeItem(userId, productId);
    }

    // Get current cart
    let cart = await this.getCart(userId);

    // Find item
    const itemIndex = cart.items.findIndex(item => item.product_id === productId);
    if (itemIndex === -1) {
      throw new Error('Item not found in cart');
    }

    // Get product to check stock
    const product = await productService.getProductById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Check if requested quantity exceeds stock
    if (quantity > product.stock) {
      throw new Error('Insufficient stock');
    }

    // Update quantity and subtotal
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].subtotal = quantity * cart.items[itemIndex].unit_price;

    // Update cart totals
    cart.total_amount = cart.items.reduce((total, item) => total + item.subtotal, 0);
    cart.updated_at = new Date().toISOString();

    // Save cart
    cartStorage.set(userId, cart);

    return cart;
  }

  async removeItem(userId: string, productId: string): Promise<Cart> {
    // Get current cart
    let cart = await this.getCart(userId);

    // Remove item
    cart.items = cart.items.filter(item => item.product_id !== productId);

    // Update cart totals
    cart.total_amount = cart.items.reduce((total, item) => total + item.subtotal, 0);
    cart.updated_at = new Date().toISOString();

    // Save cart
    cartStorage.set(userId, cart);

    return cart;
  }

  async clearCart(userId: string): Promise<void> {
    cartStorage.delete(userId);
  }

  async getCartItemCount(userId: string): Promise<number> {
    const cart = await this.getCart(userId);
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }
}