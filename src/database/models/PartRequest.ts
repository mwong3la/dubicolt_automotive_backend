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
import { Quotation } from './Quotation';

export type PartRequestStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'QUOTED' | 'CLOSED';

@Table({ tableName: 'part_requests', timestamps: true, underscored: true })
export class PartRequest extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  request_number!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  user_id!: string;

  @BelongsTo(() => User)
  user!: User;

  @AllowNull(false)
  @Column(DataType.JSONB)
  vehicle!: { make: string; model: string; year: number };

  @AllowNull(false)
  @Column(DataType.STRING)
  part_name!: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  description!: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  vin?: string;

  @Default([])
  @Column(DataType.JSONB)
  photo_urls!: string[];

  @AllowNull(false)
  @Default('standard')
  @Column(DataType.STRING)
  urgency!: 'standard' | 'express';

  @AllowNull(false)
  @Default('SUBMITTED')
  @Column(DataType.STRING)
  status!: PartRequestStatus;

  @HasMany(() => Quotation)
  quotations?: Quotation[];
}
