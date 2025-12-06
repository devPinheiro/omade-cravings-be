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
import { Restaurant } from './Restaurant';

export enum MenuItemStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
  OUT_OF_STOCK = 'out_of_stock',
}

@Table({
  tableName: 'menu_items',
  timestamps: true,
})
export class MenuItem extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => Restaurant)
  @AllowNull(false)
  @Column(DataType.UUID)
  restaurantId!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.TEXT)
  description!: string;

  @AllowNull(false)
  @Column(DataType.DECIMAL(8, 2))
  price!: number;

  @Column(DataType.STRING)
  category!: string;

  @Column(DataType.STRING)
  imageUrl!: string;

  @AllowNull(false)
  @Default(MenuItemStatus.AVAILABLE)
  @Column(DataType.ENUM(...Object.values(MenuItemStatus)))
  status!: MenuItemStatus;

  @Default(false)
  @Column(DataType.BOOLEAN)
  isVegetarian!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  isVegan!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  isGlutenFree!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  isSpicy!: boolean;

  @Column(DataType.INTEGER)
  preparationTime!: number;

  @Default(0)
  @Column(DataType.INTEGER)
  calories!: number;

  @Column(DataType.JSON)
  allergens!: string[];

  @Column(DataType.JSON)
  ingredients!: string[];

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  @BelongsTo(() => Restaurant, 'restaurantId')
  restaurant!: Restaurant;
}