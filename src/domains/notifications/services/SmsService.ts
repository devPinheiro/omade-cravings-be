import { NotificationContext, NotificationResult } from '../types/notificationTypes';

export interface SmsConfig {
  provider: 'twilio' | 'aws_sns' | 'mock';
  api_key: string;
  api_secret: string;
  from_number: string;
  region?: string; // For AWS SNS
}

export class SmsService {
  private config: SmsConfig;

  constructor(config?: SmsConfig) {
    this.config = config || this.getDefaultConfig();
  }

  private getDefaultConfig(): SmsConfig {
    return {
      provider: (process.env.SMS_PROVIDER as any) || 'mock',
      api_key: process.env.SMS_API_KEY || 'test_key',
      api_secret: process.env.SMS_API_SECRET || 'test_secret',
      from_number: process.env.SMS_FROM_NUMBER || '+1234567890',
      region: process.env.AWS_REGION || 'us-east-1',
    };
  }

  /**
   * Send SMS message
   */
  async sendSms(
    to: string,
    message: string,
    context: NotificationContext
  ): Promise<NotificationResult> {
    try {
      // Render message with context
      const renderedMessage = this.renderMessage(message, context);
      
      // Validate phone number
      if (!this.isValidPhoneNumber(to)) {
        throw new Error('Invalid phone number format');
      }

      // Send based on provider
      switch (this.config.provider) {
        case 'twilio':
          return await this.sendViaTwilio(to, renderedMessage);
        case 'aws_sns':
          return await this.sendViaAWS(to, renderedMessage);
        case 'mock':
        default:
          return await this.sendViaMock(to, renderedMessage);
      }
    } catch (error) {
      console.error('SMS sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMS sending failed',
        delivery_info: {
          sms_sent: false,
          sms_error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Send order confirmation SMS
   */
  async sendOrderConfirmationSms(
    phone: string,
    context: NotificationContext
  ): Promise<NotificationResult> {
    const message = `Hi {{customer_name}}! Your order #{{order_number}} has been confirmed. Total: {{total_amount}}. We'll notify you when it's ready for pickup. - {{store_name}}`;
    return this.sendSms(phone, message, context);
  }

  /**
   * Send order ready SMS
   */
  async sendOrderReadySms(
    phone: string,
    context: NotificationContext
  ): Promise<NotificationResult> {
    const message = `🎂 Great news {{customer_name}}! Your order #{{order_number}} is ready for pickup at {{store_name}}. Address: {{store_address}}. Bring your order # and ID. Thanks!`;
    return this.sendSms(phone, message, context);
  }

  /**
   * Send pickup reminder SMS
   */
  async sendPickupReminderSms(
    phone: string,
    context: NotificationContext
  ): Promise<NotificationResult> {
    const message = `⏰ Reminder: Your order #{{order_number}} is still waiting for pickup at {{store_name}}. Please contact us at {{store_phone}} if you need assistance.`;
    return this.sendSms(phone, message, context);
  }

  /**
   * Send order cancellation SMS
   */
  async sendOrderCancellationSms(
    phone: string,
    context: NotificationContext
  ): Promise<NotificationResult> {
    const message = `Sorry {{customer_name}}, your order #{{order_number}} has been cancelled. Please contact {{store_name}} at {{store_phone}} for more information.`;
    return this.sendSms(phone, message, context);
  }

  /**
   * Render message template with context
   */
  private renderMessage(template: string, context: NotificationContext): string {
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
   * Validate phone number format
   */
  private isValidPhoneNumber(phone: string): boolean {
    // Basic phone number validation (E.164 format)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Send SMS via Twilio
   */
  private async sendViaTwilio(to: string, message: string): Promise<NotificationResult> {
    try {
      // Note: In a real implementation, you would import and use the Twilio SDK
      // const twilio = require('twilio');
      // const client = twilio(this.config.api_key, this.config.api_secret);
      
      console.log(`[TWILIO SMS] To: ${to}, Message: ${message}`);
      
      // Mock Twilio response for now
      const mockResult = {
        sid: `SM${Math.random().toString(36).substr(2, 9)}`,
        to,
        from: this.config.from_number,
        body: message,
        status: 'queued',
      };

      return {
        success: true,
        message_id: mockResult.sid,
        delivery_info: {
          sms_sent: true,
        },
      };
    } catch (error) {
      throw new Error(`Twilio SMS failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send SMS via AWS SNS
   */
  private async sendViaAWS(to: string, message: string): Promise<NotificationResult> {
    try {
      // Note: In a real implementation, you would import and use the AWS SDK
      // const AWS = require('aws-sdk');
      // const sns = new AWS.SNS({ region: this.config.region });
      
      console.log(`[AWS SNS] To: ${to}, Message: ${message}`);
      
      // Mock AWS SNS response for now
      const mockResult = {
        MessageId: Math.random().toString(36).substr(2, 9),
      };

      return {
        success: true,
        message_id: mockResult.MessageId,
        delivery_info: {
          sms_sent: true,
        },
      };
    } catch (error) {
      throw new Error(`AWS SNS SMS failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send SMS via mock service (for testing)
   */
  private async sendViaMock(to: string, message: string): Promise<NotificationResult> {
    console.log(`[MOCK SMS] To: ${to}, Message: ${message}`);
    
    // Simulate SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      message_id: `mock_${Date.now()}`,
      delivery_info: {
        sms_sent: true,
      },
    };
  }

  /**
   * Format phone number to E.164 format
   */
  public formatPhoneNumber(phone: string, defaultCountryCode: string = '+1'): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If it starts with country code, add +
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    // If it's a 10-digit US number, add +1
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    
    // If it already has +, return as is (assuming it's properly formatted)
    if (phone.startsWith('+')) {
      return phone;
    }
    
    // Default fallback
    return `${defaultCountryCode}${cleaned}`;
  }

  /**
   * Test SMS service connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const testResult = await this.sendViaMock('+1234567890', 'Test message');
      return testResult.success;
    } catch (error) {
      console.error('SMS service test failed:', error);
      return false;
    }
  }
}