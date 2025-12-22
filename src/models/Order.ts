import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo,
  HasMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from './User';
import { OrderItem } from './OrderItem';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  PICKED_UP = 'picked_up',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD_ON_PICKUP = 'card_on_pickup',
  BANK_TRANSFER = 'bank_transfer',
  MANUAL_ENTRY = 'manual_entry',
}

export enum PaymentStatus {
  PENDING = 'pending',
  MANUAL_CONFIRMED = 'manual_confirmed',
  PAID_ON_PICKUP = 'paid_on_pickup',
  BANK_TRANSFER_RECEIVED = 'bank_transfer_received',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Table({
  tableName: 'orders',
  timestamps: true,
})
export class Order extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  user_id!: string;

  // Guest user fields (for unauthenticated orders)
  @Column(DataType.STRING)
  guest_email!: string;

  @Column(DataType.STRING)
  guest_phone!: string;

  @Column(DataType.STRING)
  guest_name!: string;

  @AllowNull(false)
  @Default(OrderStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(OrderStatus)))
  status!: OrderStatus;

  @AllowNull(false)
  @Default(PaymentStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(PaymentStatus)))
  payment_status!: PaymentStatus;

  @AllowNull(false)
  @Default(PaymentMethod.CASH)
  @Column(DataType.ENUM(...Object.values(PaymentMethod)))
  payment_method!: PaymentMethod;

  @Column(DataType.STRING)
  payment_reference!: string;

  @AllowNull(false)
  @Column(DataType.DECIMAL(8, 2))
  total_amount!: number;

  @Column(DataType.DECIMAL(8, 2))
  discount_amount!: number;

  @Column(DataType.STRING)
  promo_code!: string;

  // Pickup information
  @Column(DataType.TEXT)
  pickup_instructions!: string;

  @Column(DataType.DATEONLY)
  preferred_pickup_date!: Date;

  @Column(DataType.STRING)
  preferred_pickup_time!: string;

  // Order tracking
  @Column(DataType.STRING)
  order_number!: string;

  @Column(DataType.TEXT)
  staff_notes!: string;


  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  @BelongsTo(() => User, 'user_id')
  user!: User;

  // Helper method to check if order is from guest
  get isGuestOrder(): boolean {
    return !this.user_id && !!(this.guest_email || this.guest_phone);
  }

  // Helper method to get customer info
  get customerInfo(): { name: string; email?: string; phone?: string } {
    if (this.isGuestOrder) {
      return {
        name: this.guest_name || 'Guest Customer',
        email: this.guest_email,
        phone: this.guest_phone,
      };
    }
    return {
      name: this.user?.name || 'Unknown',
      email: this.user?.email,
      phone: this.user?.phone,
    };
  }

  @HasMany(() => OrderItem)
  orderItems!: OrderItem[];
}