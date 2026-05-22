import { Table, Column, Model, DataType, PrimaryKey, Default, AllowNull } from 'sequelize-typescript';

@Table({ tableName: 'categories', timestamps: true, underscored: true })
export class Category extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  description!: string;

  @AllowNull(false)
  @Column(DataType.JSONB)
  origins!: string[];

  @AllowNull(false)
  @Column(DataType.STRING)
  image_url!: string;

  @AllowNull(false)
  @Default('draft')
  @Column(DataType.ENUM('draft', 'published'))
  status!: 'draft' | 'published';

  @Default('Stable')
  @Column(DataType.STRING)
  trend!: string;

  @Default('stable')
  @Column(DataType.ENUM('up', 'stable', 'down'))
  trend_variant!: 'up' | 'stable' | 'down';

  @Default(0)
  @Column(DataType.INTEGER)
  total_skus!: number;

  @Default(0)
  @Column(DataType.INTEGER)
  vendors!: number;
}
