import { Resend } from 'resend';
import { NotificationContext, NotificationResult } from '../types/notificationTypes';

export interface EmailConfig {
  apiKey: string;
  from: {
    name: string;
    email: string;
  };
}

export class EmailService {
  private resend: Resend;
  private config: EmailConfig;

  constructor(config?: EmailConfig) {
    this.config = config || this.getDefaultConfig();
    this.resend = new Resend(this.config.apiKey);
  }

  private getDefaultConfig(): EmailConfig {
    return {
      apiKey: process.env.RESEND_API_KEY || '',
      from: {
        name: process.env.RESEND_FROM_NAME || process.env.SMTP_FROM_NAME || 'Omade Cravings',
        email: process.env.RESEND_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || 'onboarding@resend.dev',
      },
    };
  }

  /**
   * Send email with template rendering
   */
  async sendEmail(
    to: string,
    subject: string,
    template: string,
    context: NotificationContext,
    attachments?: Array<{
      filename: string;
      content: Buffer;
      contentType: string;
    }>
  ): Promise<NotificationResult> {
    try {
      const htmlContent = this.renderTemplate(template, context);
      const textContent = this.stripHtml(htmlContent);
      const from = `${this.config.from.name} <${this.config.from.email}>`;

      const resendAttachments = attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
      }));

      const { data, error } = await this.resend.emails.send({
        from,
        to: [to],
        subject: this.renderTemplate(subject, context),
        html: htmlContent,
        text: textContent,
        attachments: resendAttachments,
      });

      if (error) {
        console.error('Email sending failed:', error);
        return {
          success: false,
          error: error.message,
          delivery_info: {
            email_sent: false,
            email_error: error.message,
          },
        };
      }

      return {
        success: true,
        message_id: data?.id ?? undefined,
        delivery_info: {
          email_sent: true,
        },
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email sending failed',
        delivery_info: {
          email_sent: false,
          email_error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(
    email: string,
    context: NotificationContext
  ): Promise<NotificationResult> {
    const subject = 'Order Confirmation - Order #{{order_number}}';
    const template = this.getOrderConfirmationTemplate();
    return this.sendEmail(email, subject, template, context);
  }

  /**
   * Send order ready notification
   */
  async sendOrderReady(
    email: string,
    context: NotificationContext
  ): Promise<NotificationResult> {
    const subject = 'Your Order is Ready for Pickup! - Order #{{order_number}}';
    const template = this.getOrderReadyTemplate();
    return this.sendEmail(email, subject, template, context);
  }

  /**
   * Send order preparation started notification
   */
  async sendOrderPreparing(
    email: string,
    context: NotificationContext
  ): Promise<NotificationResult> {
    const subject = 'Your Order is Being Prepared! - Order #{{order_number}}';
    const template = this.getOrderPreparingTemplate();
    return this.sendEmail(email, subject, template, context);
  }

  /**
   * Send pickup reminder
   */
  async sendPickupReminder(
    email: string,
    context: NotificationContext
  ): Promise<NotificationResult> {
    const subject = 'Pickup Reminder - Order #{{order_number}}';
    const template = this.getPickupReminderTemplate();
    return this.sendEmail(email, subject, template, context);
  }

  /**
   * Send payment confirmation notification
   */
  async sendPaymentConfirmation(
    email: string,
    context: NotificationContext
  ): Promise<NotificationResult> {
    const subject = 'Payment Confirmed - Order #{{order_number}}';
    const template = this.getPaymentConfirmationTemplate();
    return this.sendEmail(email, subject, template, context);
  }

  /**
   * Send order cancellation notification
   */
  async sendOrderCancellation(
    email: string,
    context: NotificationContext
  ): Promise<NotificationResult> {
    const subject = 'Order Cancelled - Order #{{order_number}}';
    const template = this.getOrderCancellationTemplate();
    return this.sendEmail(email, subject, template, context);
  }

  /**
   * Send new order notification to admin (e.g. after payment verification)
   */
  async sendNewOrderNotificationToAdmin(
    email: string,
    context: NotificationContext
  ): Promise<NotificationResult> {
    const subject = 'New Order Received - Order #{{order_number}}';
    const template = this.getNewOrderAdminTemplate();
    return this.sendEmail(email, subject, template, context);
  }

  /**
   * Render template with context variables
   */
  private renderTemplate(template: string, context: NotificationContext): string {
    let rendered = template;

    // Replace context variables
    rendered = rendered.replace(/\{\{order_number\}\}/g, context.order_number);
    rendered = rendered.replace(/\{\{customer_name\}\}/g, context.customer_name);
    rendered = rendered.replace(/\{\{total_amount\}\}/g, `$${context.total_amount.toFixed(2)}`);
    rendered = rendered.replace(/\{\{pickup_date\}\}/g, context.pickup_date || 'TBD');
    rendered = rendered.replace(/\{\{pickup_time\}\}/g, context.pickup_time || 'TBD');
    rendered = rendered.replace(/\{\{store_name\}\}/g, context.store_info.name);
    rendered = rendered.replace(/\{\{store_phone\}\}/g, context.store_info.phone);
    rendered = rendered.replace(/\{\{store_address\}\}/g, context.store_info.address);
    rendered = rendered.replace(/\{\{store_hours\}\}/g, context.store_info.hours);

    // Replace payment-related variables
    rendered = rendered.replace(/\{\{payment_method\}\}/g, context.additional_data?.payment_method || 'N/A');
    rendered = rendered.replace(/\{\{payment_reference\}\}/g, context.additional_data?.payment_reference || 'N/A');

    // Replace item list
    const itemsHtml = context.items
      .map(
        (item) =>
          `<li>${item.quantity}x ${item.name}${
            item.is_custom ? ` (Custom: ${item.custom_details})` : ''
          }</li>`
      )
      .join('');
    rendered = rendered.replace(/\{\{items_list\}\}/g, itemsHtml);

    // Replace any additional data
    if (context.additional_data) {
      Object.entries(context.additional_data).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        rendered = rendered.replace(regex, String(value));
      });
    }

    return rendered;
  }

  /**
   * Strip HTML tags for text version
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Order confirmation email template
   */
  private getOrderConfirmationTemplate(): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #8B4513; color: white; padding: 20px; text-align: center;">
          <h1>{{store_name}}</h1>
          <h2>Order Confirmation</h2>
        </div>
        
        <div style="padding: 20px;">
          <p>Dear {{customer_name}},</p>
          
          <p>Thank you for your order! We've received your order and will begin preparing it shortly.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h3>Order Details</h3>
            <p><strong>Order Number:</strong> {{order_number}}</p>
            <p><strong>Total Amount:</strong> {{total_amount}}</p>
            ${this.getPickupDetailsSection()}
          </div>
          
          <div style="margin: 20px 0;">
            <h3>Items Ordered</h3>
            <ul>{{items_list}}</ul>
          </div>
          
          ${this.getStoreInfoSection()}
          
          <p>We'll notify you when your order is ready for pickup!</p>
          
          <p>Thank you for choosing {{store_name}}!</p>
        </div>
        
        ${this.getFooterSection()}
      </div>
    `;
  }

  /**
   * Order ready email template
   */
  private getOrderReadyTemplate(): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #228B22; color: white; padding: 20px; text-align: center;">
          <h1>{{store_name}}</h1>
          <h2>🎂 Your Order is Ready!</h2>
        </div>
        
        <div style="padding: 20px;">
          <p>Dear {{customer_name}},</p>
          
          <p><strong>Great news! Your order is ready for pickup!</strong></p>
          
          <div style="background-color: #f0f8ff; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #228B22;">
            <h3>Pickup Information</h3>
            <p><strong>Order Number:</strong> {{order_number}}</p>
            ${this.getPickupDetailsSection()}
            <p><strong>Total Amount:</strong> {{total_amount}}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3>Your Items</h3>
            <ul>{{items_list}}</ul>
          </div>
          
          ${this.getStoreInfoSection()}
          
          <div style="background-color: #fff3cd; padding: 10px; margin: 20px 0; border-radius: 5px;">
            <p><strong>Please bring:</strong> Your order number ({{order_number}}) and valid ID for pickup.</p>
          </div>
          
          <p>We look forward to seeing you soon!</p>
        </div>
        
        ${this.getFooterSection()}
      </div>
    `;
  }

  /**
   * Pickup reminder email template
   */
  private getPickupReminderTemplate(): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #FF8C00; color: white; padding: 20px; text-align: center;">
          <h1>{{store_name}}</h1>
          <h2>⏰ Pickup Reminder</h2>
        </div>
        
        <div style="padding: 20px;">
          <p>Dear {{customer_name}},</p>
          
          <p>This is a friendly reminder that your order is still waiting for pickup.</p>
          
          <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h3>Order Information</h3>
            <p><strong>Order Number:</strong> {{order_number}}</p>
            ${this.getPickupDetailsSection()}
            <p><strong>Total Amount:</strong> {{total_amount}}</p>
          </div>
          
          ${this.getStoreInfoSection()}
          
          <p>If you're unable to pick up your order, please contact us as soon as possible.</p>
          
          <p>Thank you!</p>
        </div>
        
        ${this.getFooterSection()}
      </div>
    `;
  }

  /**
   * Order preparation started email template
   */
  private getOrderPreparingTemplate(): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4682B4; color: white; padding: 20px; text-align: center;">
          <h1>{{store_name}}</h1>
          <h2>👩‍🍳 We're Preparing Your Order!</h2>
        </div>
        
        <div style="padding: 20px;">
          <p>Dear {{customer_name}},</p>
          
          <p>Great news! Our talented bakers have started working on your order and it's now being prepared with care.</p>
          
          <div style="background-color: #f0f8ff; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #4682B4;">
            <h3>Order In Progress</h3>
            <p><strong>Order Number:</strong> {{order_number}}</p>
            <p><strong>Total Amount:</strong> {{total_amount}}</p>
            ${this.getPickupDetailsSection()}
          </div>
          
          <div style="margin: 20px 0;">
            <h3>What We're Making For You</h3>
            <ul>{{items_list}}</ul>
          </div>
          
          <div style="background-color: #e7f3ff; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p><strong>📱 We'll notify you as soon as your order is ready for pickup!</strong></p>
            <p>Estimated completion time will be shared once we get closer to finishing.</p>
          </div>
          
          ${this.getStoreInfoSection()}
          
          <p>Thank you for your patience while we create something delicious for you!</p>
        </div>
        
        ${this.getFooterSection()}
      </div>
    `;
  }

  /**
   * Payment confirmation email template
   */
  private getPaymentConfirmationTemplate(): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;">
          <h1>{{store_name}}</h1>
          <h2>💳 Payment Confirmed!</h2>
        </div>
        
        <div style="padding: 20px;">
          <p>Dear {{customer_name}},</p>
          
          <p>Your payment has been successfully processed and confirmed!</p>
          
          <div style="background-color: #d4edda; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #28a745;">
            <h3>Payment Details</h3>
            <p><strong>Order Number:</strong> {{order_number}}</p>
            <p><strong>Amount Paid:</strong> {{total_amount}}</p>
            <p><strong>Payment Method:</strong> {{payment_method}}</p>
            <p><strong>Payment Reference:</strong> {{payment_reference}}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3>Order Summary</h3>
            <ul>{{items_list}}</ul>
          </div>
          
          <div style="background-color: #fff3cd; padding: 10px; margin: 20px 0; border-radius: 5px;">
            <p><strong>Next Steps:</strong> We'll start preparing your order and notify you when it's ready for pickup!</p>
          </div>
          
          ${this.getStoreInfoSection()}
          
          <p>Thank you for your payment and for choosing {{store_name}}!</p>
        </div>
        
        ${this.getFooterSection()}
      </div>
    `;
  }

  /**
   * New order notification to admin (order summary for staff)
   */
  private getNewOrderAdminTemplate(): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2c3e50; color: white; padding: 20px; text-align: center;">
          <h1>{{store_name}}</h1>
          <h2>📦 New Order Received</h2>
        </div>
        
        <div style="padding: 20px;">
          <p>A new order has been placed and payment has been confirmed.</p>
          
          <div style="background-color: #ecf0f1; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #2c3e50;">
            <h3>Order Details</h3>
            <p><strong>Order Number:</strong> {{order_number}}</p>
            <p><strong>Customer:</strong> {{customer_name}}</p>
            <p><strong>Total Amount:</strong> {{total_amount}}</p>
            <p><strong>Payment Method:</strong> {{payment_method}}</p>
            <p><strong>Payment Reference:</strong> {{payment_reference}}</p>
            <p><strong>Pickup Date:</strong> {{pickup_date}}</p>
            <p><strong>Pickup Time:</strong> {{pickup_time}}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3>Items</h3>
            <ul>{{items_list}}</ul>
          </div>
          
          <p style="color: #7f8c8d; font-size: 12px;">This is an automated notification from {{store_name}}.</p>
        </div>
        
        ${this.getFooterSection()}
      </div>
    `;
  }

  /**
   * Order cancellation email template
   */
  private getOrderCancellationTemplate(): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #DC143C; color: white; padding: 20px; text-align: center;">
          <h1>{{store_name}}</h1>
          <h2>Order Cancelled</h2>
        </div>
        
        <div style="padding: 20px;">
          <p>Dear {{customer_name}},</p>
          
          <p>We're sorry to inform you that your order has been cancelled.</p>
          
          <div style="background-color: #f8d7da; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h3>Cancelled Order Details</h3>
            <p><strong>Order Number:</strong> {{order_number}}</p>
            <p><strong>Total Amount:</strong> {{total_amount}}</p>
          </div>
          
          <p>If you have any questions about this cancellation, please contact us.</p>
          
          ${this.getStoreInfoSection()}
          
          <p>We apologize for any inconvenience and hope to serve you again soon.</p>
        </div>
        
        ${this.getFooterSection()}
      </div>
    `;
  }

  /**
   * Pickup details section helper
   */
  private getPickupDetailsSection(): string {
    return `
      <p><strong>Pickup Date:</strong> {{pickup_date}}</p>
      <p><strong>Pickup Time:</strong> {{pickup_time}}</p>
    `;
  }

  /**
   * Store information section helper
   */
  private getStoreInfoSection(): string {
    return `
      <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <h3>Store Information</h3>
        <p><strong>{{store_name}}</strong></p>
        <p>📍 {{store_address}}</p>
        <p>📞 {{store_phone}}</p>
        <p>🕒 {{store_hours}}</p>
      </div>
    `;
  }

  /**
   * Footer section helper
   */
  private getFooterSection(): string {
    return `
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
        <p>This email was sent from {{store_name}} regarding your order.</p>
        <p>If you have any questions, please contact us at {{store_phone}}.</p>
      </div>
    `;
  }

  /**
   * Test connection (Resend uses API key; we verify it is configured)
   */
  async testConnection(): Promise<boolean> {
    if (!this.config.apiKey) {
      console.error('Email service: RESEND_API_KEY is not set');
      return false;
    }
    return true;
  }
}
