import { Table, Column, Model, DataType, PrimaryKey, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './User';

@Table({ tableName: 'marketplace_orders', timestamps: true, underscored: true })
export class MarketplaceOrder extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(true)
  @Column(DataType.UUID)
  user_id?: string;

  @BelongsTo(() => User)
  user?: User;

  @AllowNull(false)
  @Column(DataType.STRING)
  order_number!: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  tracking_id?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  title!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  vendor!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  origin_flag!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  image_url!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  status!: string;

  @AllowNull(false)
  @Column(DataType.ENUM('transit', 'delivered', 'processing'))
  status_icon!: 'transit' | 'delivered' | 'processing';

  @AllowNull(false)
  @Column(DataType.INTEGER)
  progress_step!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  price_kes!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  price_secondary!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  date_label!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  date_value!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  primary_action!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  secondary_action!: string;

  @AllowNull(false)
  @Default('navy')
  @Column(DataType.ENUM('navy', 'red'))
  primary_style!: 'navy' | 'red';
}
