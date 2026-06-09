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
import { Product } from './Product';

@Table({ tableName: 'inventory', timestamps: true, underscored: true })
export class InventoryRecord extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => Product)
  @AllowNull(false)
  @Unique
  @Column(DataType.UUID)
  product_id!: string;

  @BelongsTo(() => Product)
  product!: Product;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  quantity!: number;
}
