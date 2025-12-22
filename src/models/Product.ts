import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({
  tableName: 'products',
  timestamps: true,
})
export class Product extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

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

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  stock!: number;

  @Column(DataType.STRING)
  image_url!: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_customizable!: boolean;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}