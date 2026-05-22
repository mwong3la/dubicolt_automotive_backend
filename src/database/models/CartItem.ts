import { Table, Column, Model, DataType, PrimaryKey, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './User';
import { Product } from './Product';

@Table({ tableName: 'cart_items', timestamps: true, underscored: true })
export class CartItem extends Model {
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

  @ForeignKey(() => Product)
  @AllowNull(false)
  @Column(DataType.UUID)
  product_id!: string;

  @BelongsTo(() => Product)
  product!: Product;

  @AllowNull(false)
  @Default(1)
  @Column(DataType.INTEGER)
  quantity!: number;
}
