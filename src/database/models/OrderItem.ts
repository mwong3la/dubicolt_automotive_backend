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
import { Product } from './Product';

@Table({ tableName: 'order_items', timestamps: true, underscored: true })
export class OrderItem extends Model {
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

  @ForeignKey(() => Product)
  @AllowNull(true)
  @Column(DataType.UUID)
  product_id?: string;

  @BelongsTo(() => Product)
  product?: Product;

  @AllowNull(false)
  @Column(DataType.STRING)
  title!: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  quantity!: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  unit_price!: number;

  @AllowNull(true)
  @Column(DataType.STRING)
  image_url?: string;
}
