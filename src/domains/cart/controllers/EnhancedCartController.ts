import { Request, Response } from 'express';
import { EnhancedCartService, CartIdentifier, GuestInfo } from '../services/EnhancedCartService';
import { UserRole } from '../../../models/User';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    userId: string;
    email: string;
    role: UserRole;
  };
}

export class EnhancedCartController {
  private cartService = new EnhancedCartService();

  /**
   * Get cart identifier from request (user ID or session ID)
   */
  private getCartIdentifier(req: AuthenticatedRequest, sessionId?: string): CartIdentifier {
    if (req.user?.id) {
      return { user_id: req.user.id };
    } else if (sessionId) {
      return { session_id: sessionId };
    }
    throw new Error('Either authentication or session ID is required');
  }

  /**
   * Get cart for authenticated user or guest session
   */
  async getCart(req: AuthenticatedRequest, res: Response) {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const identifier = this.getCartIdentifier(req, sessionId);

      const cart = await this.cartService.getCart(identifier);
      
      res.json({
        success: true,
        data: cart,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch cart',
      });
    }
  }

  /**
   * Create new guest session
   */
  async createGuestSession(req: Request, res: Response) {
    try {
      const sessionId = this.cartService.generateSessionId();
      
      // Initialize empty cart for the session
      const cart = await this.cartService.getCart({ session_id: sessionId });
      
      res.json({
        success: true,
        data: {
          session_id: sessionId,
          cart,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create guest session',
      });
    }
  }

  /**
   * Add item to cart
   */
  async addItem(req: AuthenticatedRequest, res: Response) {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const identifier = this.getCartIdentifier(req, sessionId);
      
      const { product_id, quantity, custom_cake_config } = req.body;
      
      const cart = await this.cartService.addItem(identifier, product_id, quantity, custom_cake_config);

      res.json({
        success: true,
        data: cart,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add item to cart',
      });
    }
  }

  /**
   * Update item quantity in cart
   */
  async updateItem(req: AuthenticatedRequest, res: Response) {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const identifier = this.getCartIdentifier(req, sessionId);
      
      const { productId } = req.params;
      const { quantity, item_index } = req.body;

      const cart = await this.cartService.updateItemQuantity(
        identifier, 
        productId, 
        quantity, 
        item_index
      );

      res.json({
        success: true,
        data: cart,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update cart item',
      });
    }
  }

  /**
   * Remove item from cart
   */
  async removeItem(req: AuthenticatedRequest, res: Response) {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const identifier = this.getCartIdentifier(req, sessionId);
      
      const { productId } = req.params;
      const { item_index } = req.query;

      const cart = await this.cartService.removeItem(
        identifier, 
        productId, 
        item_index ? parseInt(item_index as string) : undefined
      );

      res.json({
        success: true,
        data: cart,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove cart item',
      });
    }
  }

  /**
   * Clear entire cart
   */
  async clearCart(req: AuthenticatedRequest, res: Response) {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const identifier = this.getCartIdentifier(req, sessionId);

      await this.cartService.clearCart(identifier);

      res.json({
        success: true,
        message: 'Cart cleared successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear cart',
      });
    }
  }

  /**
   * Get cart item count
   */
  async getCartItemCount(req: AuthenticatedRequest, res: Response) {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const identifier = this.getCartIdentifier(req, sessionId);

      const count = await this.cartService.getCartItemCount(identifier);

      res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get cart item count',
      });
    }
  }

  /**
   * Update guest information in cart
   */
  async updateGuestInfo(req: Request, res: Response) {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID is required for guest cart',
        });
      }

      const guestInfo: GuestInfo = req.body;
      const cart = await this.cartService.updateGuestInfo({ session_id: sessionId }, guestInfo);

      res.json({
        success: true,
        data: cart,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update guest information',
      });
    }
  }

  /**
   * Merge guest cart with user cart (called during login)
   */
  async mergeGuestCart(req: AuthenticatedRequest, res: Response) {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required',
        });
      }

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID is required to merge guest cart',
        });
      }

      const mergedCart = await this.cartService.mergeGuestCartWithUserCart(sessionId, userId);

      res.json({
        success: true,
        data: mergedCart,
        message: 'Guest cart merged successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to merge guest cart',
      });
    }
  }

  /**
   * Validate cart items against current product data
   */
  async validateCart(req: AuthenticatedRequest, res: Response) {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const identifier = this.getCartIdentifier(req, sessionId);

      const validation = await this.cartService.validateCartItems(identifier);

      res.json({
        success: true,
        data: validation,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate cart',
      });
    }
  }

  /**
   * Refresh cart with latest product prices and availability
   */
  async refreshCart(req: AuthenticatedRequest, res: Response) {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const identifier = this.getCartIdentifier(req, sessionId);

      const cart = await this.cartService.refreshCart(identifier);

      res.json({
        success: true,
        data: cart,
        message: 'Cart refreshed successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refresh cart',
      });
    }
  }

  /**
   * Convert cart to order (checkout initiation)
   */
  async initiateCheckout(req: AuthenticatedRequest, res: Response) {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const identifier = this.getCartIdentifier(req, sessionId);

      // Validate cart before checkout
      const validation = await this.cartService.validateCartItems(identifier);
      
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Cart validation failed',
          details: validation.issues,
        });
      }

      // Get fresh cart data
      const cart = await this.cartService.refreshCart(identifier);

      if (cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot checkout with empty cart',
        });
      }

      res.json({
        success: true,
        data: {
          cart,
          checkout_ready: true,
        },
        message: 'Cart is ready for checkout',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate checkout',
      });
    }
  }
}