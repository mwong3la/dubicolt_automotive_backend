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

@Table({ tableName: 'vehicles', timestamps: true, underscored: true })
export class Vehicle extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  user_id!: string;

  @BelongsTo(() => User)
  user!: User;

  @AllowNull(false)
  @Column(DataType.STRING)
  make!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  model!: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  year!: number;

  @AllowNull(true)
  @Column(DataType.STRING)
  engine?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  vin?: string;
}
