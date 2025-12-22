import { NotificationService } from '../services/NotificationService';
import { EmailService } from '../services/EmailService';
import { SmsService } from '../services/SmsService';
import {
  NotificationType,
  NotificationEvent,
  NotificationRecipient,
  NotificationContext,
} from '../types/notificationTypes';

// Mock the email and SMS services
jest.mock('../services/EmailService');
jest.mock('../services/SmsService');

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockEmailService: jest.Mocked<EmailService>;
  let mockSmsService: jest.Mocked<SmsService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockEmailService = new EmailService() as jest.Mocked<EmailService>;
    mockSmsService = new SmsService() as jest.Mocked<SmsService>;
    
    // Mock successful responses
    mockEmailService.sendOrderConfirmation.mockResolvedValue({
      success: true,
      message_id: 'email_123',
      delivery_info: { email_sent: true },
    });
    
    mockSmsService.sendOrderConfirmationSms.mockResolvedValue({
      success: true,
      message_id: 'sms_123',
      delivery_info: { sms_sent: true },
    });
    
    mockSmsService.formatPhoneNumber.mockImplementation((phone) => 
      phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`
    );
    
    notificationService = new NotificationService(mockEmailService, mockSmsService);
  });

  describe('Order Confirmation Notifications', () => {
    const recipient: NotificationRecipient = {
      email: 'customer@example.com',
      phone: '+1234567890',
      name: 'John Doe',
    };

    const context: NotificationContext = {
      order_id: 'order-123',
      order_number: 'ORD001',
      customer_name: 'John Doe',
      total_amount: 45.99,
      pickup_date: '2024-01-15',
      pickup_time: '14:30',
      items: [
        {
          name: 'Custom Chocolate Cake',
          quantity: 1,
          is_custom: true,
          custom_details: '8-inch round with vanilla buttercream',
        },
      ],
      store_info: {
        name: 'Omade Cravings',
        phone: '+1555123456',
        address: '123 Baker Street',
        hours: '9AM-6PM',
      },
    };

    it('should send order confirmation via both email and SMS', async () => {
      const result = await notificationService.sendOrderConfirmation(recipient, context);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendOrderConfirmation).toHaveBeenCalledWith(
        recipient.email,
        context
      );
      expect(mockSmsService.sendOrderConfirmationSms).toHaveBeenCalledWith(
        recipient.phone,
        context
      );
    });

    it('should send email only when no phone provided', async () => {
      const emailOnlyRecipient = { ...recipient, phone: undefined };
      
      const result = await notificationService.sendOrderConfirmation(
        emailOnlyRecipient,
        context
      );

      expect(result.success).toBe(true);
      expect(mockEmailService.sendOrderConfirmation).toHaveBeenCalled();
      expect(mockSmsService.sendOrderConfirmationSms).not.toHaveBeenCalled();
    });

    it('should send SMS only when no email provided', async () => {
      const smsOnlyRecipient = { ...recipient, email: undefined };
      
      const result = await notificationService.sendOrderConfirmation(
        smsOnlyRecipient,
        context
      );

      expect(result.success).toBe(true);
      expect(mockSmsService.sendOrderConfirmationSms).toHaveBeenCalled();
      expect(mockEmailService.sendOrderConfirmation).not.toHaveBeenCalled();
    });
  });

  describe('Order Ready Notifications', () => {
    const recipient: NotificationRecipient = {
      email: 'customer@example.com',
      phone: '+1234567890',
      name: 'Jane Smith',
    };

    const context: NotificationContext = {
      order_id: 'order-456',
      order_number: 'ORD002',
      customer_name: 'Jane Smith',
      total_amount: 75.50,
      items: [],
      store_info: {
        name: 'Omade Cravings',
        phone: '+1555123456',
        address: '123 Baker Street',
        hours: '9AM-6PM',
      },
    };

    it('should send order ready notification', async () => {
      mockEmailService.sendOrderReady.mockResolvedValue({
        success: true,
        message_id: 'email_ready_123',
        delivery_info: { email_sent: true },
      });

      mockSmsService.sendOrderReadySms.mockResolvedValue({
        success: true,
        message_id: 'sms_ready_123',
        delivery_info: { sms_sent: true },
      });

      const result = await notificationService.sendOrderReady(recipient, context);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendOrderReady).toHaveBeenCalledWith(
        recipient.email,
        context
      );
      expect(mockSmsService.sendOrderReadySms).toHaveBeenCalledWith(
        recipient.phone,
        context
      );
    });
  });

  describe('Pickup Reminder Notifications', () => {
    const recipient: NotificationRecipient = {
      email: 'customer@example.com',
      phone: '+1234567890',
      name: 'Bob Johnson',
    };

    const context: NotificationContext = {
      order_id: 'order-789',
      order_number: 'ORD003',
      customer_name: 'Bob Johnson',
      total_amount: 30.00,
      items: [],
      store_info: {
        name: 'Omade Cravings',
        phone: '+1555123456',
        address: '123 Baker Street',
        hours: '9AM-6PM',
      },
    };

    it('should send pickup reminder via SMS only by default', async () => {
      mockSmsService.sendPickupReminderSms.mockResolvedValue({
        success: true,
        message_id: 'sms_reminder_123',
        delivery_info: { sms_sent: true },
      });

      const result = await notificationService.sendPickupReminder(recipient, context);

      expect(result.success).toBe(true);
      expect(mockSmsService.sendPickupReminderSms).toHaveBeenCalledWith(
        recipient.phone,
        context
      );
      expect(mockEmailService.sendPickupReminder).not.toHaveBeenCalled();
    });
  });

  describe('Order Cancellation Notifications', () => {
    const recipient: NotificationRecipient = {
      email: 'customer@example.com',
      phone: '+1234567890',
      name: 'Alice Williams',
    };

    const context: NotificationContext = {
      order_id: 'order-cancelled',
      order_number: 'ORD004',
      customer_name: 'Alice Williams',
      total_amount: 55.25,
      items: [],
      store_info: {
        name: 'Omade Cravings',
        phone: '+1555123456',
        address: '123 Baker Street',
        hours: '9AM-6PM',
      },
    };

    it('should send cancellation notification via both channels', async () => {
      mockEmailService.sendOrderCancellation.mockResolvedValue({
        success: true,
        message_id: 'email_cancel_123',
        delivery_info: { email_sent: true },
      });

      mockSmsService.sendOrderCancellationSms.mockResolvedValue({
        success: true,
        message_id: 'sms_cancel_123',
        delivery_info: { sms_sent: true },
      });

      const result = await notificationService.sendOrderCancellation(recipient, context);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendOrderCancellation).toHaveBeenCalledWith(
        recipient.email,
        context
      );
      expect(mockSmsService.sendOrderCancellationSms).toHaveBeenCalledWith(
        recipient.phone,
        context
      );
    });
  });

  describe('Error Handling', () => {
    const recipient: NotificationRecipient = {
      email: 'error@example.com',
      phone: '+1234567890',
      name: 'Error Test',
    };

    const context: NotificationContext = {
      order_id: 'order-error',
      order_number: 'ERR001',
      customer_name: 'Error Test',
      total_amount: 25.00,
      items: [],
      store_info: {
        name: 'Omade Cravings',
        phone: '+1555123456',
        address: '123 Baker Street',
        hours: '9AM-6PM',
      },
    };

    it('should handle email service failures gracefully', async () => {
      mockEmailService.sendOrderConfirmation.mockResolvedValue({
        success: false,
        error: 'SMTP connection failed',
        delivery_info: { email_sent: false, email_error: 'SMTP connection failed' },
      });

      const result = await notificationService.sendOrderConfirmation(recipient, context);

      expect(result.success).toBe(false);
      expect(result.delivery_info?.email_error).toBe('SMTP connection failed');
      expect(result.delivery_info?.sms_sent).toBe(true); // SMS should still work
    });

    it('should handle SMS service failures gracefully', async () => {
      mockSmsService.sendOrderConfirmationSms.mockResolvedValue({
        success: false,
        error: 'Invalid phone number',
        delivery_info: { sms_sent: false, sms_error: 'Invalid phone number' },
      });

      const result = await notificationService.sendOrderConfirmation(recipient, context);

      expect(result.success).toBe(false);
      expect(result.delivery_info?.sms_error).toBe('Invalid phone number');
      expect(result.delivery_info?.email_sent).toBe(true); // Email should still work
    });
  });

  describe('Phone Number Formatting', () => {
    it('should format phone numbers before sending SMS', async () => {
      const recipient: NotificationRecipient = {
        email: 'test@example.com',
        phone: '2345678901', // US number without country code
        name: 'Format Test',
      };

      const context: NotificationContext = {
        order_id: 'format-test',
        order_number: 'FMT001',
        customer_name: 'Format Test',
        total_amount: 20.00,
        items: [],
        store_info: {
          name: 'Omade Cravings',
          phone: '+1555123456',
          address: '123 Baker Street',
          hours: '9AM-6PM',
        },
      };

      await notificationService.sendOrderConfirmation(recipient, context);

      expect(mockSmsService.formatPhoneNumber).toHaveBeenCalledWith('2345678901');
      expect(mockSmsService.sendOrderConfirmationSms).toHaveBeenCalledWith(
        '+12345678901', // Should be formatted
        context
      );
    });
  });
});