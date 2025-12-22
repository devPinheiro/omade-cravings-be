import { NotificationService } from './NotificationService';
import { Order, OrderStatus } from '../../../models/Order';
import {
  NotificationRecipient,
  NotificationContext,
  NotificationEvent,
} from '../types/notificationTypes';

export class OrderNotificationService {
  private notificationService: NotificationService;

  constructor(notificationService?: NotificationService) {
    this.notificationService = notificationService || new NotificationService();
  }

  /**
   * Handle order status change and send appropriate notifications
   */
  async handleOrderStatusChange(
    order: Order,
    previousStatus?: OrderStatus
  ): Promise<void> {
    try {
      const recipient = this.buildRecipient(order);
      const context = await this.buildNotificationContext(order);

      switch (order.status) {
        case OrderStatus.CONFIRMED:
          if (previousStatus !== OrderStatus.CONFIRMED) {
            await this.notificationService.sendOrderConfirmation(recipient, context);
          }
          break;

        case OrderStatus.PREPARING:
          // Optional: Send "order is being prepared" notification
          // Most customers don't need this, but could be configurable
          break;

        case OrderStatus.READY:
          if (previousStatus !== OrderStatus.READY) {
            await this.notificationService.sendOrderReady(recipient, context);
            
            // Schedule pickup reminder for later
            await this.schedulePickupReminder(order, recipient, context);
          }
          break;

        case OrderStatus.CANCELLED:
          if (previousStatus !== OrderStatus.CANCELLED) {
            await this.notificationService.sendOrderCancellation(recipient, context);
          }
          break;

        case OrderStatus.NO_SHOW:
          // Could send a "missed pickup" notification
          break;

        default:
          // No notification needed for other statuses
          break;
      }
    } catch (error) {
      console.error(`Failed to send notification for order ${order.id}:`, error);
      // Don't throw error to avoid disrupting order processing
    }
  }

  /**
   * Send pickup reminder for orders that are ready
   */
  async sendPickupReminder(orderId: string): Promise<void> {
    try {
      // In a real implementation, you would fetch the order from database
      // For now, this is a placeholder for the reminder system
      console.log(`Sending pickup reminder for order ${orderId}`);
      
      // This would be called by a scheduled job or cron task
      // The actual implementation would:
      // 1. Fetch order details
      // 2. Check if order is still in READY status
      // 3. Calculate how long it's been ready
      // 4. Send appropriate reminder
    } catch (error) {
      console.error(`Failed to send pickup reminder for order ${orderId}:`, error);
    }
  }

  /**
   * Schedule pickup reminder notifications
   */
  private async schedulePickupReminder(
    order: Order,
    recipient: NotificationRecipient,
    context: NotificationContext
  ): Promise<void> {
    try {
      // Schedule reminder for 2 hours after order is ready
      const reminderDelayMinutes = 120;
      
      await this.notificationService.scheduleNotification(
        {
          recipient,
          event: NotificationEvent.PICKUP_REMINDER,
          context,
        },
        reminderDelayMinutes
      );

      console.log(`Scheduled pickup reminder for order ${order.order_number} in ${reminderDelayMinutes} minutes`);
    } catch (error) {
      console.error(`Failed to schedule pickup reminder for order ${order.id}:`, error);
    }
  }

  /**
   * Build notification recipient from order
   */
  private buildRecipient(order: Order): NotificationRecipient {
    return {
      email: order.guest_email || undefined,
      phone: order.guest_phone || undefined,
      name: order.guest_name || 'Customer',
    };
  }

  /**
   * Build notification context from order
   */
  private async buildNotificationContext(order: Order): Promise<NotificationContext> {
    // In a real implementation, you would fetch order items with product details
    // For now, we'll create a basic context
    
    const items = [
      {
        name: 'Custom Cake', // This would be fetched from order items
        quantity: 1,
        is_custom: true,
        custom_details: 'Vanilla cake with buttercream frosting',
      },
    ];

    return {
      order_id: order.id,
      order_number: order.order_number,
      customer_name: order.guest_name || 'Customer',
      total_amount: parseFloat(order.total_amount.toString()),
      pickup_date: order.preferred_pickup_date?.toISOString().split('T')[0],
      pickup_time: order.preferred_pickup_time || undefined,
      pickup_instructions: order.pickup_instructions || undefined,
      items,
      store_info: {
        name: 'Omade Cravings',
        phone: '+1 (555) 123-4567',
        address: '123 Baker Street, Sweet City, SC 12345',
        hours: 'Mon-Sat: 8AM-8PM, Sun: 10AM-6PM',
      },
    };
  }

  /**
   * Send test notification for order
   */
  async sendTestNotification(
    order: Order,
    event: NotificationEvent
  ): Promise<void> {
    try {
      const recipient = this.buildRecipient(order);
      const context = await this.buildNotificationContext(order);

      await this.notificationService.sendNotification({
        recipient,
        event,
        context,
      });

      console.log(`Test notification sent for order ${order.order_number}`);
    } catch (error) {
      console.error(`Failed to send test notification for order ${order.id}:`, error);
      throw error;
    }
  }

  /**
   * Get notification service for direct access
   */
  getNotificationService(): NotificationService {
    return this.notificationService;
  }
}