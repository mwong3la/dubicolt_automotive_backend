import { Table, Column, Model, DataType, PrimaryKey, Default, AllowNull, Unique } from 'sequelize-typescript';

@Table({ tableName: 'products', timestamps: true, underscored: true })
export class Product extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  sku!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  description?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  brand?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  oem_number?: string;

  @Default([])
  @Column(DataType.JSONB)
  compatible_vehicles!: {
    make: string;
    model: string;
    yearFrom: number;
    yearTo: number;
  }[];

  @AllowNull(false)
  @Column(DataType.STRING)
  category!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  origin!: string;

  @AllowNull(false)
  @Column(DataType.DECIMAL(12, 2))
  price_usd!: number;

  /** Canonical marketplace price in Kenyan Shillings (admin-entered). */
  @AllowNull(true)
  @Column(DataType.INTEGER)
  price_kes?: number | null;

  @AllowNull(true)
  @Column(DataType.DECIMAL(12, 2))
  original_price?: number | null;

  /** Compare-at / was price in KES (admin-entered). */
  @AllowNull(true)
  @Column(DataType.INTEGER)
  compare_at_price_kes?: number | null;

  @AllowNull(false)
  @Column(DataType.STRING)
  image_url!: string;

  @Default([])
  @Column(DataType.JSONB)
  images!: string[];

  @Default({})
  @Column(DataType.JSONB)
  specs!: Record<string, string>;

  @AllowNull(true)
  @Column(DataType.STRING)
  currency_ke?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  currency_ae?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  vendor?: string;

  @Default('draft')
  @Column(DataType.ENUM('draft', 'published'))
  status!: 'draft' | 'published';

  @Default(false)
  @Column(DataType.BOOLEAN)
  on_marketplace!: boolean;

  @Default('cart')
  @Column(DataType.ENUM('cart', 'quote'))
  marketplace_cta!: 'cart' | 'quote';

  @Default(0)
  @Column(DataType.INTEGER)
  stock!: number;

  @Default(1)
  @Column(DataType.INTEGER)
  min_order!: number;

  @Default(false)
  @Column(DataType.BOOLEAN)
  low_stock!: boolean;
}
