import { Request, Response } from 'express';
import { OrderService } from '../services/OrderService';
import { OrderStatus, PaymentStatus, PaymentMethod } from '../../../models/Order';
import { UserRole } from '../../../models/User';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    userId: string;
    email: string;
    role: UserRole;
  };
}

export class OrderController {
  private orderService = new OrderService();

  async createOrder(req: AuthenticatedRequest, res: Response) {
    try {
      const orderData = {
        ...req.body,
        user_id: req.user?.id, // Will be undefined for guest users
      };

      const order = await this.orderService.createOrder(orderData);
      
      res.status(201).json({
        success: true,
        data: order,
        message: 'Order created successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order',
      });
    }
  }

  async createGuestOrder(req: Request, res: Response) {
    try {
      // Ensure no user_id is passed for guest orders
      const orderData = {
        ...req.body,
        user_id: undefined,
      };

      const order = await this.orderService.createOrder(orderData);
      
      res.status(201).json({
        success: true,
        data: order,
        message: 'Guest order created successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create guest order',
      });
    }
  }

  async getOrders(req: AuthenticatedRequest, res: Response) {
    try {
      const filters = {
        ...req.query,
        user_id: req.user?.id, // Only show user's own orders for customers
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      };

      const result = await this.orderService.getOrders(filters);
      
      res.json({
        success: true,
        data: result.orders,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch orders',
      });
    }
  }

  async getAllOrders(req: AuthenticatedRequest, res: Response) {
    try {
      // Admin/Staff endpoint - can see all orders
      const filters = {
        ...req.query,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      };

      const result = await this.orderService.getOrders(filters);
      
      res.json({
        success: true,
        data: result.orders,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch orders',
      });
    }
  }

  async getOrder(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const order = await this.orderService.getOrderById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
        });
      }

      // Check if user owns the order (unless admin/staff)
      if (req.user && req.user.role === 'customer') {
        if (order.user_id !== req.user.id) {
          return res.status(403).json({
            success: false,
            error: 'Access denied',
          });
        }
      }

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch order',
      });
    }
  }

  async updateOrderStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const order = await this.orderService.updateOrder(id, updateData);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
        });
      }

      res.json({
        success: true,
        data: order,
        message: 'Order updated successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update order',
      });
    }
  }

  async cancelOrder(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const order = await this.orderService.getOrderById(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
        });
      }

      // Check if user owns the order (unless admin/staff)
      if (req.user && req.user.role === 'customer') {
        if (order.user_id !== req.user.id) {
          return res.status(403).json({
            success: false,
            error: 'Access denied',
          });
        }
      }

      const cancelledOrder = await this.orderService.cancelOrder(id, reason);

      res.json({
        success: true,
        data: cancelledOrder,
        message: 'Order cancelled successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel order',
      });
    }
  }

  async trackOrder(req: Request, res: Response) {
    try {
      const { order_number } = req.params;
      const { email, phone } = req.query;

      if (!email && !phone) {
        return res.status(400).json({
          success: false,
          error: 'Email or phone number is required to track order',
        });
      }

      const order = await this.orderService.trackOrder(order_number, {
        email: email as string,
        phone: phone as string,
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found or contact information does not match',
        });
      }

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to track order',
      });
    }
  }

  async getOrdersByStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { status } = req.params;
      
      if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid order status',
        });
      }

      const orders = await this.orderService.getOrdersByStatus(status as OrderStatus);
      
      res.json({
        success: true,
        data: orders,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch orders',
      });
    }
  }

  async getOrderStatistics(req: AuthenticatedRequest, res: Response) {
    try {
      const { date_from, date_to } = req.query;
      
      // Get orders by status
      const statusCounts = await Promise.all(
        Object.values(OrderStatus).map(async (status) => {
          const orders = await this.orderService.getOrders({
            status,
            date_from: date_from ? new Date(date_from as string) : undefined,
            date_to: date_to ? new Date(date_to as string) : undefined,
          });
          return { status, count: orders.total };
        })
      );

      // Get payment status counts
      const paymentStatusCounts = await Promise.all(
        Object.values(PaymentStatus).map(async (paymentStatus) => {
          const orders = await this.orderService.getOrders({
            payment_status: paymentStatus,
            date_from: date_from ? new Date(date_from as string) : undefined,
            date_to: date_to ? new Date(date_to as string) : undefined,
          });
          return { payment_status: paymentStatus, count: orders.total };
        })
      );

      // Get recent orders
      const recentOrders = await this.orderService.getOrders({
        limit: 10,
        page: 1,
      });

      res.json({
        success: true,
        data: {
          status_counts: statusCounts,
          payment_status_counts: paymentStatusCounts,
          recent_orders: recentOrders.orders,
          total_orders: recentOrders.total,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch order statistics',
      });
    }
  }

  async updatePaymentStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { payment_status, payment_reference, payment_method } = req.body;

      const updateData: any = {};
      if (payment_status) updateData.payment_status = payment_status;
      if (payment_reference) updateData.payment_reference = payment_reference;
      if (payment_method) updateData.payment_method = payment_method;

      // Auto-update order status based on payment status
      if (payment_status === PaymentStatus.MANUAL_CONFIRMED || 
          payment_status === PaymentStatus.PAID_ON_PICKUP ||
          payment_status === PaymentStatus.BANK_TRANSFER_RECEIVED) {
        updateData.status = OrderStatus.CONFIRMED;
      }

      const order = await this.orderService.updateOrder(id, updateData);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
        });
      }

      res.json({
        success: true,
        data: order,
        message: 'Payment status updated successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update payment status',
      });
    }
  }
}