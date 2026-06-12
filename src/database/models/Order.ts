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
  HasMany,
  Unique,
} from 'sequelize-typescript';
import { User } from './User';
import { OrderItem } from './OrderItem';
import { Delivery } from './Delivery';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

@Table({ tableName: 'orders', timestamps: true, underscored: true })
export class Order extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  order_number!: string;

  @ForeignKey(() => User)
  @AllowNull(true)
  @Column(DataType.UUID)
  user_id?: string;

  @BelongsTo(() => User)
  user?: User;

  @AllowNull(false)
  @Default('PENDING_PAYMENT')
  @Column(DataType.STRING)
  status!: OrderStatus;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  total!: number;

  @AllowNull(true)
  @Column(DataType.STRING)
  delivery_method?: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  delivery_address?: string;

  @AllowNull(true)
  @Column(DataType.UUID)
  part_request_id?: string;

  @AllowNull(true)
  @Column(DataType.UUID)
  quotation_id?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  promotion_code?: string;

  @Default(0)
  @Column(DataType.INTEGER)
  discount_amount!: number;

  @HasMany(() => OrderItem)
  items?: OrderItem[];

  @HasMany(() => Delivery)
  deliveries?: Delivery[];
}
