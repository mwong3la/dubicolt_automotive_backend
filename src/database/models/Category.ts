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

@Table({ tableName: 'categories', timestamps: true, underscored: true })
export class Category extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  name!: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  slug!: string;

  @Default('')
  @Column(DataType.TEXT)
  description!: string;

  @Default('')
  @Column(DataType.STRING)
  image_url!: string;

  @Default('published')
  @Column(DataType.ENUM('draft', 'published'))
  status!: 'draft' | 'published';

  /** Markets where this category is active (KE, AE, CN). */
  @Default(['KE'])
  @Column(DataType.JSONB)
  origins!: string[];
}
