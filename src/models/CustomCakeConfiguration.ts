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
} from 'sequelize-typescript';
import { Order } from './Order';

@Table({
  tableName: 'custom_cake_configurations',
  timestamps: false,
})
export class CustomCakeConfiguration extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => Order)
  @AllowNull(false)
  @Column(DataType.UUID)
  order_id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  flavor!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  size!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  frosting!: string;

  @Column(DataType.STRING)
  message!: string;

  @Column(DataType.STRING)
  image_reference!: string;

  @Column(DataType.JSONB)
  extra_details!: object;

  @BelongsTo(() => Order, 'order_id')
  order!: Order;
}