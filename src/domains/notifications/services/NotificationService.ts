import { EmailService } from './EmailService';
import { SmsService } from './SmsService';
import {
  NotificationType,
  NotificationEvent,
  NotificationRequest,
  NotificationResult,
  NotificationRecipient,
  NotificationContext,
  NotificationSettings,
} from '../types/notificationTypes';

export class NotificationService {
  private emailService: EmailService;
  private smsService: SmsService;
  private settings: NotificationSettings;

  constructor(emailService?: EmailService, smsService?: SmsService) {
    this.emailService = emailService || new EmailService();
    this.smsService = smsService || new SmsService();
    this.settings = this.getDefaultSettings();
  }

  /**
   * Send notification based on event and recipient preferences
   */
  async sendNotification(request: NotificationRequest): Promise<NotificationResult> {
    if (!this.settings.enabled) {
      return {
        success: false,
        error: 'Notifications are disabled',
      };
    }

    try {
      // Determine notification type
      const notificationType = request.type || this.getDefaultNotificationType(request.recipient);
      
      // Add store information to context if not present
      const contextWithStore = this.enrichContext(request.context);

      let emailResult: NotificationResult | null = null;
      let smsResult: NotificationResult | null = null;

      // Send email if enabled and recipient has email
      if (
        this.settings.email_enabled &&
        (notificationType === NotificationType.EMAIL || notificationType === NotificationType.BOTH) &&
        request.recipient.email
      ) {
        emailResult = await this.sendEmailNotification(
          request.recipient.email,
          request.event,
          contextWithStore
        );
      }

      // Send SMS if enabled and recipient has phone
      if (
        this.settings.sms_enabled &&
        (notificationType === NotificationType.SMS || notificationType === NotificationType.BOTH) &&
        request.recipient.phone
      ) {
        // Format phone number
        const formattedPhone = this.smsService.formatPhoneNumber(request.recipient.phone);
        smsResult = await this.sendSmsNotification(
          formattedPhone,
          request.event,
          contextWithStore
        );
      }

      // Combine results
      return this.combineResults(emailResult, smsResult);
    } catch (error) {
      console.error('Notification sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Notification sending failed',
      };
    }
  }

  /**
   * Send order confirmation notification
   */
  async sendOrderConfirmation(
    recipient: NotificationRecipient,
    context: NotificationContext
  ): Promise<NotificationResult> {
    return this.sendNotification({
      recipient,
      event: NotificationEvent.ORDER_CONFIRMED,
      context,
      type: NotificationType.BOTH,
    });
  }

  /**
   * Send order ready notification
   */
  async sendOrderReady(
    recipient: NotificationRecipient,
    context: NotificationContext
  ): Promise<NotificationResult> {
    return this.sendNotification({
      recipient,
      event: NotificationEvent.ORDER_READY,
      context,
      type: NotificationType.BOTH,
    });
  }

  /**
   * Send pickup reminder notification
   */
  async sendPickupReminder(
    recipient: NotificationRecipient,
    context: NotificationContext
  ): Promise<NotificationResult> {
    return this.sendNotification({
      recipient,
      event: NotificationEvent.PICKUP_REMINDER,
      context,
      type: NotificationType.SMS, // SMS is more immediate for reminders
    });
  }

  /**
   * Send order cancellation notification
   */
  async sendOrderCancellation(
    recipient: NotificationRecipient,
    context: NotificationContext
  ): Promise<NotificationResult> {
    return this.sendNotification({
      recipient,
      event: NotificationEvent.ORDER_CANCELLED,
      context,
      type: NotificationType.BOTH,
    });
  }

  /**
   * Send custom cake approval notification
   */
  async sendCustomCakeApproval(
    recipient: NotificationRecipient,
    context: NotificationContext
  ): Promise<NotificationResult> {
    return this.sendNotification({
      recipient,
      event: NotificationEvent.CUSTOM_CAKE_APPROVED,
      context,
      type: NotificationType.EMAIL, // Email for detailed custom cake info
    });
  }

  /**
   * Schedule delayed notification
   */
  async scheduleNotification(
    request: NotificationRequest,
    delayMinutes: number
  ): Promise<{ scheduled: boolean; scheduleId?: string }> {
    try {
      // In a production environment, you would use a job queue like Bull, Agenda, or AWS SQS
      // For now, we'll use setTimeout (not persistent across restarts)
      
      const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      setTimeout(async () => {
        try {
          await this.sendNotification(request);
          console.log(`Scheduled notification sent: ${scheduleId}`);
        } catch (error) {
          console.error(`Failed to send scheduled notification ${scheduleId}:`, error);
        }
      }, delayMinutes * 60 * 1000);

      return { scheduled: true, scheduleId };
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return { scheduled: false };
    }
  }

  /**
   * Send email notification based on event
   */
  private async sendEmailNotification(
    email: string,
    event: NotificationEvent,
    context: NotificationContext
  ): Promise<NotificationResult> {
    switch (event) {
      case NotificationEvent.ORDER_CONFIRMED:
        return this.emailService.sendOrderConfirmation(email, context);
      case NotificationEvent.ORDER_READY:
        return this.emailService.sendOrderReady(email, context);
      case NotificationEvent.PICKUP_REMINDER:
        return this.emailService.sendPickupReminder(email, context);
      case NotificationEvent.ORDER_CANCELLED:
        return this.emailService.sendOrderCancellation(email, context);
      default:
        throw new Error(`Unsupported email notification event: ${event}`);
    }
  }

  /**
   * Send SMS notification based on event
   */
  private async sendSmsNotification(
    phone: string,
    event: NotificationEvent,
    context: NotificationContext
  ): Promise<NotificationResult> {
    switch (event) {
      case NotificationEvent.ORDER_CONFIRMED:
        return this.smsService.sendOrderConfirmationSms(phone, context);
      case NotificationEvent.ORDER_READY:
        return this.smsService.sendOrderReadySms(phone, context);
      case NotificationEvent.PICKUP_REMINDER:
        return this.smsService.sendPickupReminderSms(phone, context);
      case NotificationEvent.ORDER_CANCELLED:
        return this.smsService.sendOrderCancellationSms(phone, context);
      default:
        throw new Error(`Unsupported SMS notification event: ${event}`);
    }
  }

  /**
   * Determine default notification type based on recipient
   */
  private getDefaultNotificationType(recipient: NotificationRecipient): NotificationType {
    if (recipient.email && recipient.phone) {
      return NotificationType.BOTH;
    } else if (recipient.email) {
      return NotificationType.EMAIL;
    } else if (recipient.phone) {
      return NotificationType.SMS;
    }
    return NotificationType.EMAIL; // Default fallback
  }

  /**
   * Enrich context with default store information
   */
  private enrichContext(context: NotificationContext): NotificationContext {
    const defaultStoreInfo = {
      name: 'Omade Cravings',
      phone: '+1 (555) 123-4567',
      address: '123 Baker Street, Sweet City, SC 12345',
      hours: 'Mon-Sat: 8AM-8PM, Sun: 10AM-6PM',
    };
    
    return {
      ...context,
      store_info: {
        ...defaultStoreInfo,
        ...context.store_info,
      },
    };
  }

  /**
   * Combine email and SMS results
   */
  private combineResults(
    emailResult: NotificationResult | null,
    smsResult: NotificationResult | null
  ): NotificationResult {
    const hasEmail = emailResult !== null;
    const hasSms = smsResult !== null;
    
    if (!hasEmail && !hasSms) {
      return {
        success: false,
        error: 'No notification methods available',
      };
    }

    const emailSuccess = emailResult?.success ?? true; // If not sent, consider it successful
    const smsSuccess = smsResult?.success ?? true; // If not sent, consider it successful

    const overallSuccess = emailSuccess && smsSuccess;

    return {
      success: overallSuccess,
      message_id: emailResult?.message_id || smsResult?.message_id,
      error: overallSuccess ? undefined : 'Some notifications failed',
      delivery_info: {
        email_sent: emailResult?.delivery_info?.email_sent ?? false,
        sms_sent: smsResult?.delivery_info?.sms_sent ?? false,
        email_error: emailResult?.delivery_info?.email_error,
        sms_error: smsResult?.delivery_info?.sms_error,
      },
    };
  }

  /**
   * Get default notification settings
   */
  private getDefaultSettings(): NotificationSettings {
    return {
      enabled: process.env.NOTIFICATIONS_ENABLED !== 'false',
      email_enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED !== 'false',
      sms_enabled: process.env.SMS_NOTIFICATIONS_ENABLED !== 'false',
      default_from_email: process.env.SMTP_FROM_EMAIL || 'noreply@omadecravings.com',
      default_from_name: process.env.SMTP_FROM_NAME || 'Omade Cravings',
      default_sms_sender: process.env.SMS_FROM_NUMBER || '+1234567890',
      retry_attempts: parseInt(process.env.NOTIFICATION_RETRY_ATTEMPTS || '3'),
      retry_delay_minutes: [1, 5, 15], // Retry after 1min, 5min, 15min
      bounce_handling: process.env.BOUNCE_HANDLING_ENABLED === 'true',
      unsubscribe_enabled: process.env.UNSUBSCRIBE_ENABLED === 'true',
    };
  }

  /**
   * Update notification settings
   */
  updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Get current settings
   */
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  /**
   * Test notification services
   */
  async testServices(): Promise<{ email: boolean; sms: boolean }> {
    const emailTest = await this.emailService.testConnection();
    const smsTest = await this.smsService.testConnection();

    return {
      email: emailTest,
      sms: smsTest,
    };
  }
}