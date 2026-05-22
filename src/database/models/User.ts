import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  Unique,
  IsEmail,
} from 'sequelize-typescript';

export type UserRoleDb = 'buyer' | 'admin' | 'vendor';

@Table({ tableName: 'users', timestamps: true, underscored: true })
export class User extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @AllowNull(false)
  @Unique
  @IsEmail
  @Column(DataType.STRING)
  email!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  password!: string;

  @AllowNull(false)
  @Default('Unknown')
  @Column(DataType.STRING)
  company!: string;

  @AllowNull(false)
  @Default('buyer')
  @Column(DataType.STRING)
  role!: UserRoleDb;

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  is_active!: boolean;
}
