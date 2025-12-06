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
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Order } from './Order';
import { MenuItem } from './MenuItem';

@Table({
  tableName: 'order_items',
  timestamps: true,
})
export class OrderItem extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => Order)
  @AllowNull(false)
  @Column(DataType.UUID)
  orderId!: string;

  @ForeignKey(() => MenuItem)
  @AllowNull(false)
  @Column(DataType.UUID)
  menuItemId!: string;

  @AllowNull(false)
  @Default(1)
  @Column(DataType.INTEGER)
  quantity!: number;

  @AllowNull(false)
  @Column(DataType.DECIMAL(8, 2))
  unitPrice!: number;

  @AllowNull(false)
  @Column(DataType.DECIMAL(8, 2))
  totalPrice!: number;

  @Column(DataType.TEXT)
  specialRequests!: string;

  @Column(DataType.JSON)
  customizations!: object;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  @BelongsTo(() => Order, 'orderId')
  order!: Order;

  @BelongsTo(() => MenuItem, 'menuItemId')
  menuItem!: MenuItem;
}