import { getRedisClient } from '../../../config/redis';

export class CartCleanupService {
  private redisClient: any;

  constructor() {
    this.redisClient = getRedisClient();
  }

  /**
   * Clean up expired guest carts
   * This can be run as a scheduled job
   */
  async cleanupExpiredGuestCarts(): Promise<{ cleaned: number; errors: number }> {
    let cleaned = 0;
    let errors = 0;

    try {
      if (!this.redisClient) {
        console.log('Redis not available, skipping cart cleanup');
        return { cleaned: 0, errors: 0 };
      }

      // Get all cart keys for guest sessions
      const guestCartKeys = await this.redisClient.keys('cart:session:guest_*');
      
      for (const key of guestCartKeys) {
        try {
          const cartData = await this.redisClient.get(key);
          
          if (cartData) {
            const cart = JSON.parse(cartData);
            
            // Check if cart has expired
            if (cart.expires_at && new Date(cart.expires_at) < new Date()) {
              await this.redisClient.del(key);
              cleaned++;
              console.log(`Cleaned expired guest cart: ${key}`);
            }
          } else {
            // Key exists but no data, clean it up
            await this.redisClient.del(key);
            cleaned++;
          }
        } catch (error) {
          console.error(`Error cleaning cart ${key}:`, error);
          errors++;
        }
      }

      console.log(`Cart cleanup completed. Cleaned: ${cleaned}, Errors: ${errors}`);
    } catch (error) {
      console.error('Error during cart cleanup:', error);
      errors++;
    }

    return { cleaned, errors };
  }

  /**
   * Get statistics about cart usage
   */
  async getCartStatistics(): Promise<{
    total_user_carts: number;
    total_guest_carts: number;
    expired_guest_carts: number;
  }> {
    try {
      if (!this.redisClient) {
        return { total_user_carts: 0, total_guest_carts: 0, expired_guest_carts: 0 };
      }

      const userCartKeys = await this.redisClient.keys('cart:user:*');
      const guestCartKeys = await this.redisClient.keys('cart:session:guest_*');
      
      let expiredGuestCarts = 0;
      
      for (const key of guestCartKeys) {
        try {
          const cartData = await this.redisClient.get(key);
          if (cartData) {
            const cart = JSON.parse(cartData);
            if (cart.expires_at && new Date(cart.expires_at) < new Date()) {
              expiredGuestCarts++;
            }
          }
        } catch (error) {
          // Ignore parsing errors for statistics
        }
      }

      return {
        total_user_carts: userCartKeys.length,
        total_guest_carts: guestCartKeys.length,
        expired_guest_carts: expiredGuestCarts,
      };
    } catch (error) {
      console.error('Error getting cart statistics:', error);
      return { total_user_carts: 0, total_guest_carts: 0, expired_guest_carts: 0 };
    }
  }

  /**
   * Force expire a specific guest cart
   */
  async expireGuestCart(sessionId: string): Promise<boolean> {
    try {
      if (!this.redisClient) {
        return false;
      }

      const key = `cart:session:${sessionId}`;
      const deleted = await this.redisClient.del(key);
      return deleted > 0;
    } catch (error) {
      console.error(`Error expiring cart ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Extend guest cart expiration time
   */
  async extendGuestCartExpiration(sessionId: string, additionalDays: number = 7): Promise<boolean> {
    try {
      if (!this.redisClient) {
        return false;
      }

      const key = `cart:session:${sessionId}`;
      const cartData = await this.redisClient.get(key);
      
      if (!cartData) {
        return false;
      }

      const cart = JSON.parse(cartData);
      const newExpiryDate = new Date(Date.now() + additionalDays * 24 * 60 * 60 * 1000);
      cart.expires_at = newExpiryDate.toISOString();

      const expireTime = Math.floor((newExpiryDate.getTime() - Date.now()) / 1000);
      await this.redisClient.set(key, JSON.stringify(cart), { EX: expireTime });
      
      return true;
    } catch (error) {
      console.error(`Error extending cart expiration ${sessionId}:`, error);
      return false;
    }
  }
}