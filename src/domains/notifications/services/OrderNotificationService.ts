import {
  NotificationContext,
  NotificationEvent,
  NotificationRecipient,
} from '../types/notificationTypes';
import { Order, OrderStatus, PaymentStatus } from '../../../models/Order';

import { NotificationService } from './NotificationService';

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
          if (previousStatus !== OrderStatus.PREPARING) {
            await this.notificationService.sendOrderPreparing(recipient, context);
          }
          break;

        case OrderStatus.READY:
          if (previousStatus !== OrderStatus.READY) {
            // Notify customer (email + SMS if enabled) when order is ready for pickup
            if (recipient.email) {
              await this.notificationService.sendOrderReady(recipient, context);
            } else {
              console.warn(`Order ${order.order_number}: cannot send "order ready" notification — no customer email`);
            }
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
   * Handle payment status change and send appropriate notifications
   */
  async handlePaymentStatusChange(
    order: Order,
    previousPaymentStatus?: PaymentStatus
  ): Promise<void> {
    try {
      const recipient = this.buildRecipient(order);
      const context = await this.buildNotificationContext(order);
      
      // Add payment information to context
      context.additional_data = {
        ...context.additional_data,
        payment_method: this.formatPaymentMethod(order.payment_method),
        payment_reference: order.payment_reference || 'N/A',
      };

      switch (order.payment_status) {
        case PaymentStatus.MANUAL_CONFIRMED:
        case PaymentStatus.BANK_TRANSFER_RECEIVED:
          if (previousPaymentStatus !== order.payment_status) {
            // Email customer: payment confirmed + order summary
            await this.notificationService.sendPaymentConfirmation(recipient, context);
            // Email admin: new order notification
            await this.notificationService.sendNewOrderNotificationToAdmin(context);
          }
          break;

        default:
          // No notification needed for other payment statuses
          break;
      }
    } catch (error) {
      console.error(`Failed to send payment notification for order ${order.id}:`, error);
      // Don't throw error to avoid disrupting payment processing
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
   * Build notification recipient from order (guest or authenticated user)
   */
  private buildRecipient(order: Order): NotificationRecipient {
    const user = (order as Order & { user?: { email?: string; phone?: string; name?: string } }).user;
    return {
      email: order.guest_email || user?.email || undefined,
      phone: order.guest_phone || user?.phone || undefined,
      name: order.guest_name || user?.name || 'Customer',
    };
  }

  /**
   * Build notification context from order (with real order items)
   */
  private async buildNotificationContext(order: Order): Promise<NotificationContext> {
    const orderWithItems = order as Order & {
      orderItems?: Array<{ quantity: number; product?: { name: string }; product_id?: string }>;
      customCakeConfigurations?: Array<{ flavor?: string; size?: string; message?: string }>;
    };
    const user = (order as Order & { user?: { name?: string } }).user;

    type ContextItem = NotificationContext['items'][number];
    const items: ContextItem[] =
      orderWithItems.orderItems?.map((oi): ContextItem => ({
        name: oi.product?.name ?? 'Item',
        quantity: oi.quantity,
        is_custom: false,
        custom_details: undefined,
      })) ?? [];

    // If order has custom cake configs, append a summary line
    const customConfigs = orderWithItems.customCakeConfigurations;
    if (customConfigs?.length) {
      for (const c of customConfigs) {
        items.push({
          name: 'Custom Cake',
          quantity: 1,
          is_custom: true,
          custom_details: [c.flavor, c.size, c.message].filter(Boolean).join(', ') || 'Custom cake',
        });
      }
    }

    if (items.length === 0) {
      items.push({ name: 'Order items', quantity: 1, is_custom: false, custom_details: undefined });
    }

    const pickupDate =
      order.preferred_pickup_date instanceof Date
        ? order.preferred_pickup_date.toISOString().split('T')[0]
        : (order.preferred_pickup_date as string)?.toString?.()?.split?.('T')?.[0];

    const context: NotificationContext = {
      order_id: order.id,
      order_number: order.order_number,
      customer_name: order.guest_name || user?.name || 'Customer',
      total_amount: parseFloat(order.total_amount.toString()),
      pickup_date: pickupDate,
      pickup_time: order.preferred_pickup_time || undefined,
      pickup_instructions: order.pickup_instructions || undefined,
      items,
      store_info: {
        name: 'Omade Cravings',
        phone: '+1 (555) 123-4567',
        address: '123 Baker Street, Sweet City, SC 12345',
        hours: 'Mon-Sat: 8AM-8PM',
      },
    };
    return context;
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

  /**
   * Format payment method for display
   */
  private formatPaymentMethod(paymentMethod: string): string {
    switch (paymentMethod) {
      case 'cash':
        return 'Cash on Pickup';
      case 'card_on_pickup':
        return 'Card on Pickup';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'manual_entry':
        return 'Manual Payment';
      default:
        return paymentMethod;
    }
  }
}