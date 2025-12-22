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
  Min,
  Max,
} from 'sequelize-typescript';
import { User } from './User';
import { Product } from './Product';

@Table({
  tableName: 'reviews',
  timestamps: true,
})
export class Review extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  user_id!: string;

  @ForeignKey(() => Product)
  @AllowNull(false)
  @Column(DataType.UUID)
  product_id!: string;

  @AllowNull(false)
  @Min(1)
  @Max(5)
  @Column(DataType.INTEGER)
  rating!: number;

  @Column(DataType.TEXT)
  comment!: string;

  @CreatedAt
  createdAt!: Date;

  @BelongsTo(() => User, 'user_id')
  user!: User;

  @BelongsTo(() => Product, 'product_id')
  product!: Product;
}