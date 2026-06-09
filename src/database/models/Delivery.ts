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

export type DeliveryStatus = 'PROCESSING' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED';

@Table({ tableName: 'deliveries', timestamps: true, underscored: true })
export class Delivery extends Model {
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
  @Default('PROCESSING')
  @Column(DataType.STRING)
  status!: DeliveryStatus;

  @AllowNull(true)
  @Column(DataType.TEXT)
  notes?: string;
}
