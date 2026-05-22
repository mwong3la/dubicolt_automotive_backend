import { Table, Column, Model, DataType, PrimaryKey, Default, AllowNull } from 'sequelize-typescript';

@Table({ tableName: 'admin_sourcing_orders', timestamps: true, underscored: true })
export class AdminSourcingOrder extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  order_number!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  customer_name!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  customer_detail!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  route!: string;

  @AllowNull(false)
  @Column(DataType.DECIMAL(12, 2))
  estimated_value!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  status!: string;

  @AllowNull(false)
  @Default('blue')
  @Column(DataType.ENUM('blue', 'orange'))
  status_variant!: 'blue' | 'orange';

  @AllowNull(false)
  @Column(DataType.STRING)
  primary_action!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  secondary_action!: string;
}
