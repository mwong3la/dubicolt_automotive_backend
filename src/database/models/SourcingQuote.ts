import { Table, Column, Model, DataType, PrimaryKey, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { SourcingRequest } from './SourcingRequest';

@Table({ tableName: 'sourcing_quotes', timestamps: true, underscored: true })
export class SourcingQuote extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => SourcingRequest)
  @AllowNull(false)
  @Column(DataType.UUID)
  sourcing_request_id!: string;

  @BelongsTo(() => SourcingRequest)
  sourcing_request!: SourcingRequest;

  @AllowNull(false)
  @Column(DataType.STRING)
  unit_price!: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  shipping_cost?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  lead_time!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  shipment!: string;

  @AllowNull(false)
  @Default('')
  @Column(DataType.TEXT)
  notes!: string;

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  official!: boolean;
}
