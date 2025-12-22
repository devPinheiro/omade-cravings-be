export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  BOTH = 'both',
}

export enum NotificationEvent {
  ORDER_CONFIRMED = 'order_confirmed',
  ORDER_PREPARING = 'order_preparing',
  ORDER_READY = 'order_ready',
  ORDER_CANCELLED = 'order_cancelled',
  ORDER_NO_SHOW = 'order_no_show',
  PICKUP_REMINDER = 'pickup_reminder',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  CUSTOM_CAKE_APPROVED = 'custom_cake_approved',
  CUSTOM_CAKE_REJECTED = 'custom_cake_rejected',
}

export interface NotificationRecipient {
  email?: string;
  phone?: string;
  name: string;
}

export interface NotificationContext {
  order_id: string;
  order_number: string;
  customer_name: string;
  total_amount: number;
  pickup_date?: string;
  pickup_time?: string;
  pickup_instructions?: string;
  items: Array<{
    name: string;
    quantity: number;
    is_custom: boolean;
    custom_details?: string;
  }>;
  store_info: {
    name: string;
    phone: string;
    address: string;
    hours: string;
  };
  additional_data?: Record<string, any>;
}

export interface NotificationTemplate {
  id: string;
  event: NotificationEvent;
  type: NotificationType;
  subject?: string; // For email
  template: string;
  variables: string[];
  is_active: boolean;
}

export interface NotificationRequest {
  recipient: NotificationRecipient;
  event: NotificationEvent;
  context: NotificationContext;
  type?: NotificationType;
  priority?: 'low' | 'normal' | 'high';
  delay_minutes?: number;
}

export interface NotificationResult {
  success: boolean;
  message_id?: string;
  error?: string;
  delivery_info?: {
    email_sent?: boolean;
    sms_sent?: boolean;
    email_error?: string;
    sms_error?: string;
  };
}

export interface NotificationLog {
  id: string;
  recipient: NotificationRecipient;
  event: NotificationEvent;
  type: NotificationType;
  status: 'pending' | 'sent' | 'failed' | 'delivered' | 'bounced';
  sent_at?: Date;
  delivered_at?: Date;
  error_message?: string;
  context: NotificationContext;
  template_id: string;
  retry_count: number;
  max_retries: number;
  next_retry_at?: Date;
}

export interface NotificationSettings {
  enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  default_from_email: string;
  default_from_name: string;
  default_sms_sender: string;
  retry_attempts: number;
  retry_delay_minutes: number[];
  bounce_handling: boolean;
  unsubscribe_enabled: boolean;
}