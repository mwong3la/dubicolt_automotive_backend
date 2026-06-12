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
import { PartRequest } from './PartRequest';
import { Supplier } from './Supplier';

export type QuotationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

@Table({ tableName: 'quotations', timestamps: true, underscored: true })
export class Quotation extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => PartRequest)
  @AllowNull(false)
  @Column(DataType.UUID)
  request_id!: string;

  @BelongsTo(() => PartRequest)
  partRequest!: PartRequest;

  @ForeignKey(() => Supplier)
  @AllowNull(true)
  @Column(DataType.UUID)
  supplier_id?: string;

  @BelongsTo(() => Supplier)
  supplier?: Supplier;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  price!: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  lead_time_days!: number;

  @AllowNull(false)
  @Column(DataType.DATEONLY)
  valid_until!: string;

  @AllowNull(false)
  @Default('PENDING')
  @Column(DataType.STRING)
  status!: QuotationStatus;

  @AllowNull(true)
  @Column(DataType.TEXT)
  notes?: string;

  @Default(0)
  @Column(DataType.INTEGER)
  shipping_cost!: number;
}
