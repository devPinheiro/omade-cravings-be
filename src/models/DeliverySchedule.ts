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
import { User } from './User';

export enum DeliveryStatus {
  AVAILABLE = 'available',
  ASSIGNED = 'assigned',
  COMPLETED = 'completed',
}

@Table({
  tableName: 'delivery_schedules',
  timestamps: false,
})
export class DeliverySchedule extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.DATEONLY)
  delivery_date!: Date;

  @AllowNull(false)
  @Column(DataType.STRING)
  delivery_time!: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  rider_id!: string;

  @AllowNull(false)
  @Default(DeliveryStatus.AVAILABLE)
  @Column(DataType.ENUM(...Object.values(DeliveryStatus)))
  status!: DeliveryStatus;

  @BelongsTo(() => User, 'rider_id')
  rider!: User;
}