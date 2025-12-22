import { Request, Response } from 'express';
import { CartService } from '../services/CartService';

const cartService = new CartService();

export class CartController {
  async getCart(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required',
        });
      }

      const cart = await cartService.getCart(userId);
      res.json({
        success: true,
        data: cart,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch cart',
      });
    }
  }

  async addItem(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required',
        });
      }

      const { product_id, quantity } = req.body;
      const cart = await cartService.addItem(userId, product_id, quantity);

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

  async updateItem(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required',
        });
      }

      const { productId } = req.params;
      const { quantity } = req.body;

      const cart = await cartService.updateItemQuantity(userId, productId, quantity);

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

  async removeItem(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required',
        });
      }

      const { productId } = req.params;
      const cart = await cartService.removeItem(userId, productId);

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
}