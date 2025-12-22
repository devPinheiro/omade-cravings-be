import { Request, Response } from 'express';
import { NotificationService } from '../services/NotificationService';
import { OrderNotificationService } from '../services/OrderNotificationService';
import { UserRole } from '../../../models/User';
import {
  NotificationEvent,
  NotificationType,
  NotificationRecipient,
  NotificationContext,
} from '../types/notificationTypes';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    userId: string;
    email: string;
    role: UserRole;
  };
}

export class NotificationController {
  private notificationService = new NotificationService();
  private orderNotificationService = new OrderNotificationService(this.notificationService);

  /**
   * Send test notification (Admin only)
   */
  async sendTestNotification(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        recipient_email,
        recipient_phone,
        recipient_name,
        event,
        type,
      } = req.body;

      if (!recipient_email && !recipient_phone) {
        return res.status(400).json({
          success: false,
          error: 'Either email or phone is required',
        });
      }

      const recipient: NotificationRecipient = {
        email: recipient_email,
        phone: recipient_phone,
        name: recipient_name || 'Test Customer',
      };

      const context: NotificationContext = {
        order_id: 'test-order-id',
        order_number: 'TEST001',
        customer_name: recipient_name || 'Test Customer',
        total_amount: 45.99,
        pickup_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        pickup_time: '14:30',
        pickup_instructions: 'Please call when you arrive',
        items: [
          {
            name: 'Custom Chocolate Cake',
            quantity: 1,
            is_custom: true,
            custom_details: '8-inch round, chocolate cake with vanilla buttercream',
          },
          {
            name: 'Birthday Candles',
            quantity: 10,
            is_custom: false,
          },
        ],
        store_info: {
          name: 'Omade Cravings',
          phone: '+1 (555) 123-4567',
          address: '123 Baker Street, Sweet City, SC 12345',
          hours: 'Mon-Sat: 8AM-8PM, Sun: 10AM-6PM',
        },
      };

      const result = await this.notificationService.sendNotification({
        recipient,
        event: event || NotificationEvent.ORDER_CONFIRMED,
        context,
        type: type || NotificationType.BOTH,
      });

      res.json({
        success: true,
        data: result,
        message: 'Test notification sent',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send test notification',
      });
    }
  }

  /**
   * Get notification settings (Admin only)
   */
  async getSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const settings = this.notificationService.getSettings();
      
      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get settings',
      });
    }
  }

  /**
   * Update notification settings (Admin only)
   */
  async updateSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        enabled,
        email_enabled,
        sms_enabled,
        retry_attempts,
      } = req.body;

      this.notificationService.updateSettings({
        enabled,
        email_enabled,
        sms_enabled,
        retry_attempts,
      });

      const updatedSettings = this.notificationService.getSettings();

      res.json({
        success: true,
        data: updatedSettings,
        message: 'Settings updated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update settings',
      });
    }
  }

  /**
   * Test notification service connections (Admin only)
   */
  async testConnections(req: AuthenticatedRequest, res: Response) {
    try {
      const testResults = await this.notificationService.testServices();
      
      res.json({
        success: true,
        data: {
          email_service: {
            connected: testResults.email,
            status: testResults.email ? 'Connected' : 'Failed to connect',
          },
          sms_service: {
            connected: testResults.sms,
            status: testResults.sms ? 'Connected' : 'Failed to connect',
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to test connections',
      });
    }
  }

  /**
   * Send notification for specific order (Admin only)
   */
  async sendOrderNotification(req: AuthenticatedRequest, res: Response) {
    try {
      const { order_id, event } = req.body;

      if (!order_id || !event) {
        return res.status(400).json({
          success: false,
          error: 'Order ID and event are required',
        });
      }

      // In a real implementation, you would fetch the order from database
      // For now, we'll create a mock order
      const mockOrder = {
        id: order_id,
        order_number: `ORD${Date.now()}`,
        guest_name: 'John Doe',
        guest_email: 'john@example.com',
        guest_phone: '+1234567890',
        total_amount: 75.50,
        status: 'confirmed',
        preferred_pickup_date: new Date(),
        preferred_pickup_time: '15:00',
        pickup_instructions: 'Call when ready',
      } as any;

      await this.orderNotificationService.sendTestNotification(mockOrder, event);

      res.json({
        success: true,
        message: `Notification sent for order ${order_id}`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send order notification',
      });
    }
  }

  /**
   * Get available notification events and types
   */
  async getNotificationOptions(req: AuthenticatedRequest, res: Response) {
    try {
      res.json({
        success: true,
        data: {
          events: Object.values(NotificationEvent),
          types: Object.values(NotificationType),
          event_descriptions: {
            [NotificationEvent.ORDER_CONFIRMED]: 'Sent when order is confirmed',
            [NotificationEvent.ORDER_PREPARING]: 'Sent when order preparation begins',
            [NotificationEvent.ORDER_READY]: 'Sent when order is ready for pickup',
            [NotificationEvent.ORDER_CANCELLED]: 'Sent when order is cancelled',
            [NotificationEvent.ORDER_NO_SHOW]: 'Sent when customer doesn\'t pick up order',
            [NotificationEvent.PICKUP_REMINDER]: 'Reminder to pick up ready order',
            [NotificationEvent.CUSTOM_CAKE_APPROVED]: 'Custom cake design approved',
            [NotificationEvent.CUSTOM_CAKE_REJECTED]: 'Custom cake design rejected',
          },
          type_descriptions: {
            [NotificationType.EMAIL]: 'Email notification only',
            [NotificationType.SMS]: 'SMS notification only',
            [NotificationType.BOTH]: 'Both email and SMS notifications',
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get notification options',
      });
    }
  }
}