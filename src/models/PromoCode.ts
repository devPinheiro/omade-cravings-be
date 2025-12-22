import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  Unique,
} from 'sequelize-typescript';

export enum DiscountType {
  PERCENT = 'percent',
  FIXED = 'fixed',
}

@Table({
  tableName: 'promo_codes',
  timestamps: false,
})
export class PromoCode extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  code!: string;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(DiscountType)))
  discount_type!: DiscountType;

  @AllowNull(false)
  @Column(DataType.DECIMAL(8, 2))
  amount!: number;

  @AllowNull(false)
  @Column(DataType.DATE)
  valid_from!: Date;

  @AllowNull(false)
  @Column(DataType.DATE)
  valid_to!: Date;

  @Column(DataType.INTEGER)
  usage_limit!: number;

  @Default(0)
  @Column(DataType.INTEGER)
  used_count!: number;
}