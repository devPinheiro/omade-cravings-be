import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  Unique,
  CreatedAt,
} from 'sequelize-typescript';

@Table({
  tableName: 'newsletter_subscribers',
  timestamps: true,
  createdAt: 'subscribed_at',
  updatedAt: false,
})
export class NewsletterSubscriber extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING(255))
  email!: string;

  @CreatedAt
  createdAt!: Date; // DB column: subscribed_at (see table options)
}
