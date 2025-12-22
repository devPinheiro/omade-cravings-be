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
import { Product } from './Product';

@Table({
  tableName: 'order_items',
  timestamps: false,
})
export class OrderItem extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => Order)
  @AllowNull(false)
  @Column(DataType.UUID)
  order_id!: string;

  @ForeignKey(() => Product)
  @AllowNull(false)
  @Column(DataType.UUID)
  product_id!: string;

  @AllowNull(false)
  @Default(1)
  @Column(DataType.INTEGER)
  quantity!: number;

  @AllowNull(false)
  @Column(DataType.DECIMAL(8, 2))
  unit_price!: number;

  @AllowNull(false)
  @Column(DataType.DECIMAL(8, 2))
  subtotal!: number;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  @BelongsTo(() => Order, 'order_id')
  order!: Order;

  @BelongsTo(() => Product, 'product_id')
  product!: Product;
}