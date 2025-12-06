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
import { Restaurant } from './Restaurant';
import { OrderItem } from './OrderItem';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
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
  @AllowNull(false)
  @Column(DataType.UUID)
  customerId!: string;

  @ForeignKey(() => Restaurant)
  @AllowNull(false)
  @Column(DataType.UUID)
  restaurantId!: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  deliveryPartnerId!: string;

  @AllowNull(false)
  @Default(OrderStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(OrderStatus)))
  status!: OrderStatus;

  @AllowNull(false)
  @Default(PaymentStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(PaymentStatus)))
  paymentStatus!: PaymentStatus;

  @AllowNull(false)
  @Column(DataType.DECIMAL(8, 2))
  subtotal!: number;

  @AllowNull(false)
  @Column(DataType.DECIMAL(5, 2))
  deliveryFee!: number;

  @Default(0)
  @Column(DataType.DECIMAL(5, 2))
  tip!: number;

  @Default(0)
  @Column(DataType.DECIMAL(5, 2))
  tax!: number;

  @AllowNull(false)
  @Column(DataType.DECIMAL(8, 2))
  totalAmount!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  deliveryAddress!: string;

  @Column(DataType.DECIMAL(10, 8))
  deliveryLatitude!: number;

  @Column(DataType.DECIMAL(11, 8))
  deliveryLongitude!: number;

  @Column(DataType.TEXT)
  specialInstructions!: string;

  @Column(DataType.INTEGER)
  estimatedDeliveryTime!: number;

  @Column(DataType.DATE)
  confirmedAt!: Date;

  @Column(DataType.DATE)
  deliveredAt!: Date;

  @Column(DataType.DATE)
  cancelledAt!: Date;

  @Column(DataType.TEXT)
  cancellationReason!: string;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  @BelongsTo(() => User, 'customerId')
  customer!: User;

  @BelongsTo(() => Restaurant, 'restaurantId')
  restaurant!: Restaurant;

  @BelongsTo(() => User, 'deliveryPartnerId')
  deliveryPartner!: User;

  @HasMany(() => OrderItem)
  orderItems!: OrderItem[];
}