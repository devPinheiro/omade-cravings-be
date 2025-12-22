# Email Notification System

## Overview

The Omade Cravings API includes a comprehensive email notification system that automatically sends beautifully formatted emails to customers throughout their order lifecycle. The system is built with Nodemailer and provides reusable, template-based email services.

## Features

- ✅ **Automated Order Notifications**: Sends emails when orders change status
- ✅ **Payment Confirmations**: Notifies customers when payments are processed
- ✅ **Beautiful HTML Templates**: Responsive email designs with store branding
- ✅ **Template Variables**: Dynamic content based on order data
- ✅ **Error Handling**: Robust error handling that doesn't break order processing
- ✅ **Configurable SMTP**: Easy setup with any SMTP provider

## Email Types

### 1. Order Confirmation
**Trigger**: When order status changes to `CONFIRMED`
**Template**: Professional confirmation with order details, pickup information, and store contact

### 2. Order Preparation Started  
**Trigger**: When order status changes to `PREPARING`
**Template**: Friendly notification that baking has started with estimated completion updates

### 3. Order Ready for Pickup
**Trigger**: When order status changes to `READY`
**Template**: Urgent notification with pickup instructions and reminder to bring ID

### 4. Payment Confirmation
**Trigger**: When payment status changes to `MANUAL_CONFIRMED` or `BANK_TRANSFER_RECEIVED`
**Template**: Payment receipt with transaction details and next steps

### 5. Pickup Reminder
**Trigger**: 2 hours after order becomes ready (automatically scheduled)
**Template**: Gentle reminder for pending pickups

### 6. Order Cancellation
**Trigger**: When order status changes to `CANCELLED`
**Template**: Cancellation notice with apology and contact information

## Configuration

### Environment Variables

```bash
# SMTP Configuration
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@domain.com
SMTP_PASS=your-app-password

# From Address
SMTP_FROM_EMAIL=noreply@omadecravings.com
SMTP_FROM_NAME=Omade Cravings

# Notification Controls
NOTIFICATIONS_ENABLED=true
EMAIL_NOTIFICATIONS_ENABLED=true
```

### Popular SMTP Providers

#### Gmail
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Use App Password, not regular password
```

#### SendGrid
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### Mailgun
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

## Usage

### Automatic Integration

The email system is automatically integrated into the order workflow. No additional code is needed - emails are sent automatically when:

```typescript
// Creating an order
const order = await orderService.createOrder(orderData);
// → Automatically sends order confirmation email

// Updating order status
await orderService.updateOrder(orderId, { status: OrderStatus.PREPARING });
// → Automatically sends "order preparing" email

// Updating payment status
await orderService.updateOrder(orderId, { payment_status: PaymentStatus.MANUAL_CONFIRMED });
// → Automatically sends payment confirmation email
```

### Manual Email Sending

```typescript
import { EmailService } from './domains/notifications/services/EmailService';
import { NotificationContext } from './domains/notifications/types/notificationTypes';

const emailService = new EmailService();

const context: NotificationContext = {
  order_id: 'order-123',
  order_number: 'ORD20240106001',
  customer_name: 'John Doe',
  total_amount: 45.99,
  pickup_date: '2024-01-08',
  pickup_time: '2:00 PM',
  items: [/* order items */],
  store_info: {
    name: 'Omade Cravings',
    phone: '+1 (555) 123-4567',
    address: '123 Baker Street, Sweet City, SC 12345',
    hours: 'Mon-Sat: 8AM-8PM, Sun: 10AM-6PM',
  },
};

// Send specific email type
await emailService.sendOrderConfirmation('customer@email.com', context);
await emailService.sendOrderReady('customer@email.com', context);
await emailService.sendPaymentConfirmation('customer@email.com', context);
```

## Email Template Structure

All templates include:

- **Header**: Store branding with appropriate color coding
- **Greeting**: Personalized customer name
- **Order Information**: Order number, amount, pickup details
- **Item List**: What was ordered (including custom details)
- **Store Information**: Contact details and hours
- **Footer**: Consistent branding and contact info

### Template Variables

Templates support these variables:
- `{{order_number}}` - Order reference number
- `{{customer_name}}` - Customer's name
- `{{total_amount}}` - Formatted total (e.g., "$45.99")
- `{{pickup_date}}` - Pickup date
- `{{pickup_time}}` - Pickup time
- `{{store_name}}` - Store name
- `{{store_phone}}` - Store phone number
- `{{store_address}}` - Store address
- `{{store_hours}}` - Store operating hours
- `{{items_list}}` - HTML formatted list of ordered items
- `{{payment_method}}` - Payment method (formatted)
- `{{payment_reference}}` - Payment reference number

## Testing

### Test Email Service

```bash
# Run the email service test
npx ts-node src/domains/notifications/test-email.ts
```

This will test all email templates with sample data and verify:
- SMTP connection
- Template rendering
- Error handling

### Test in Development

1. Set up a test SMTP service (like Mailtrap or Gmail)
2. Configure environment variables
3. Create test orders and observe email notifications

## Architecture

### Service Structure

```
src/domains/notifications/
├── services/
│   ├── EmailService.ts          # Core email sending service
│   ├── NotificationService.ts   # High-level notification orchestrator
│   └── OrderNotificationService.ts # Order-specific notification logic
├── types/
│   └── notificationTypes.ts     # TypeScript interfaces
└── test-email.ts               # Email testing utility
```

### Integration Points

1. **OrderService** → Calls `OrderNotificationService` on status changes
2. **OrderNotificationService** → Orchestrates when to send notifications
3. **NotificationService** → Determines email vs SMS and handles delivery
4. **EmailService** → Handles SMTP connection and template rendering

## Error Handling

The system is designed to be fault-tolerant:

- **Non-blocking**: Email failures won't prevent order processing
- **Graceful degradation**: Orders complete successfully even if emails fail
- **Detailed logging**: All email errors are logged for debugging
- **Connection testing**: Test SMTP connectivity before sending

## Customization

### Adding New Email Templates

1. Add new method to `EmailService`:
```typescript
async sendCustomTemplate(email: string, context: NotificationContext) {
  const subject = 'Custom Subject - Order #{{order_number}}';
  const template = this.getCustomTemplate();
  return this.sendEmail(email, subject, template, context);
}

private getCustomTemplate(): string {
  return `<!-- Your custom HTML template -->`;
}
```

2. Add new event to `NotificationEvent` enum
3. Update `NotificationService` to handle new event
4. Call from appropriate service when needed

### Modifying Store Information

Update default store information in `NotificationService.enrichContext()`:

```typescript
const defaultStoreInfo = {
  name: 'Your Store Name',
  phone: '+1 (555) 123-4567',
  address: 'Your Store Address',
  hours: 'Your Store Hours',
};
```

## Best Practices

1. **Always test** email templates before deploying
2. **Use environment variables** for SMTP configuration
3. **Monitor email delivery** in production
4. **Keep templates mobile-friendly** with responsive design
5. **Include unsubscribe links** for compliance (future feature)
6. **Use transactional email services** for production (SendGrid, Mailgun, etc.)

## Troubleshooting

### Common Issues

1. **Connection Refused**: Check SMTP host and port
2. **Authentication Failed**: Verify SMTP username and password
3. **Emails in Spam**: Use proper SPF/DKIM records and established domains
4. **Template Variables Not Rendering**: Check variable names match exactly

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

This will log detailed email sending information to the console.