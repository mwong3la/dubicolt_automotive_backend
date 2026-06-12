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
  Unique,
} from 'sequelize-typescript';
import { User } from './User';
import { Order } from './Order';

export type ReturnStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'REFUNDED';

@Table({ tableName: 'return_requests', timestamps: true, underscored: true })
export class ReturnRequest extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  return_number!: string;

  @ForeignKey(() => Order)
  @AllowNull(false)
  @Column(DataType.UUID)
  order_id!: string;

  @BelongsTo(() => Order)
  order!: Order;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  user_id!: string;

  @BelongsTo(() => User)
  user!: User;

  @AllowNull(false)
  @Column(DataType.TEXT)
  reason!: string;

  @AllowNull(false)
  @Default('REQUESTED')
  @Column(DataType.STRING)
  status!: ReturnStatus;

  @AllowNull(true)
  @Column(DataType.DECIMAL(12, 2))
  refund_amount?: number;

  @AllowNull(true)
  @Column(DataType.TEXT)
  admin_notes?: string;
}
