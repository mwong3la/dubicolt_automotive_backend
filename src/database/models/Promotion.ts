import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  Unique,
} from 'sequelize-typescript';

export type PromotionType = 'percent' | 'fixed';

@Table({ tableName: 'promotions', timestamps: true, underscored: true })
export class Promotion extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  code!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  type!: PromotionType;

  @AllowNull(false)
  @Column(DataType.DECIMAL(12, 2))
  value!: number;

  @Default(0)
  @Column(DataType.DECIMAL(12, 2))
  min_order_amount!: number;

  @Default(true)
  @Column(DataType.BOOLEAN)
  active!: boolean;

  @AllowNull(true)
  @Column(DataType.DATE)
  starts_at?: Date;

  @AllowNull(true)
  @Column(DataType.DATE)
  ends_at?: Date;

  @Default(0)
  @Column(DataType.INTEGER)
  usage_count!: number;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  max_uses?: number;
}
