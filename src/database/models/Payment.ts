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
import { Order } from './Order';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

@Table({ tableName: 'payments', timestamps: true, underscored: true })
export class Payment extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => Order)
  @AllowNull(false)
  @Column(DataType.UUID)
  order_id!: string;

  @BelongsTo(() => Order)
  order!: Order;

  @AllowNull(false)
  @Default('mpesa')
  @Column(DataType.STRING)
  method!: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  amount!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  phone!: string;

  @AllowNull(false)
  @Default('PENDING')
  @Column(DataType.STRING)
  status!: PaymentStatus;

  @AllowNull(true)
  @Column(DataType.STRING)
  mpesa_checkout_request_id?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  mpesa_receipt_number?: string;

  @AllowNull(true)
  @Column(DataType.JSONB)
  callback_payload?: Record<string, unknown>;
}
