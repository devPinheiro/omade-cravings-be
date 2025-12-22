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
  UpdatedAt,
} from 'sequelize-typescript';

export enum UserRole {
  CUSTOMER = 'customer',
  RIDER = 'rider',
  STAFF = 'staff',
  ADMIN = 'admin',
}

@Table({
  tableName: 'users',
  timestamps: true,
})
export class User extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  email!: string;


  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(UserRole)))
  role!: UserRole;

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  password_hash!: string;

  @Column(DataType.STRING)
  phone!: string;

  @Column(DataType.STRING)
  avatar_url!: string;

  @Column(DataType.ENUM('google', 'apple', 'facebook'))
  social_provider!: string;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}