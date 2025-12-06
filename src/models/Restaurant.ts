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
import { MenuItem } from './MenuItem';
import { Order } from './Order';

export enum RestaurantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

@Table({
  tableName: 'restaurants',
  timestamps: true,
})
export class Restaurant extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  ownerId!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.TEXT)
  description!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  address!: string;

  @Column(DataType.DECIMAL(10, 8))
  latitude!: number;

  @Column(DataType.DECIMAL(11, 8))
  longitude!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  phoneNumber!: string;

  @Column(DataType.STRING)
  email!: string;

  @Column(DataType.STRING)
  cuisine!: string;

  @Column(DataType.STRING)
  imageUrl!: string;

  @AllowNull(false)
  @Default(RestaurantStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(RestaurantStatus)))
  status!: RestaurantStatus;

  @Column(DataType.DECIMAL(3, 2))
  rating!: number;

  @Default(0)
  @Column(DataType.INTEGER)
  totalReviews!: number;

  @Column(DataType.TIME)
  openingTime!: string;

  @Column(DataType.TIME)
  closingTime!: string;

  @Default(30)
  @Column(DataType.INTEGER)
  deliveryTime!: number;

  @Default(0)
  @Column(DataType.DECIMAL(5, 2))
  deliveryFee!: number;

  @Default(0)
  @Column(DataType.DECIMAL(5, 2))
  minimumOrder!: number;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  @BelongsTo(() => User, 'ownerId')
  owner!: User;

  @HasMany(() => MenuItem)
  menuItems!: MenuItem[];

  @HasMany(() => Order)
  orders!: Order[];
}