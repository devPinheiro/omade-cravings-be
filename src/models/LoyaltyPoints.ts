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
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from './User';

@Table({
  tableName: 'loyalty_points',
  timestamps: false,
})
export class LoyaltyPoints extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  user_id!: string;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  points!: number;

  @UpdatedAt
  updatedAt!: Date;

  @BelongsTo(() => User, 'user_id')
  user!: User;
}