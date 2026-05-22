import { Table, Column, Model, DataType, PrimaryKey, Default, AllowNull, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { User } from './User';
import { SourcingQuote } from './SourcingQuote';
import { SourcingAttachment } from './SourcingAttachment';

@Table({ tableName: 'sourcing_requests', timestamps: true, underscored: true })
export class SourcingRequest extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(true)
  @Column(DataType.UUID)
  user_id?: string;

  @BelongsTo(() => User)
  user?: User;

  @AllowNull(false)
  @Column(DataType.STRING)
  request_number!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  product_title!: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  description!: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  category?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  urgency?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  origin!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  destination!: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  destination_label?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  quantity?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  unit?: string;

  @AllowNull(true)
  @Column(DataType.DATEONLY)
  target_date?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  shipping_method?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  budget?: string;

  @AllowNull(false)
  @Default('pending')
  @Column(DataType.ENUM('pending', 'quoted', 'shipping', 'delivered'))
  status!: 'pending' | 'quoted' | 'shipping' | 'delivered';

  @AllowNull(true)
  @Column(DataType.STRING)
  user_status?: string;

  @AllowNull(true)
  @Column(DataType.ENUM('orange', 'blue', 'gray'))
  status_variant?: 'orange' | 'blue' | 'gray';

  @AllowNull(false)
  @Column(DataType.STRING)
  market!: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  client_name?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  client_initials?: string;

  @Default([])
  @Column(DataType.JSONB)
  reference_images!: string[];

  @AllowNull(true)
  @Column(DataType.INTEGER)
  reference_extra?: number;

  @Default(false)
  @Column(DataType.BOOLEAN)
  has_document!: boolean;

  @AllowNull(true)
  @Column(DataType.STRING)
  material_grade?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  voltage_range?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  budget_total?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  budget_subtitle?: string;

  @Default([])
  @Column(DataType.JSONB)
  regional_targets!: { code: string; label: string }[];

  @AllowNull(true)
  @Column(DataType.STRING)
  requester_location?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  product_image_url?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  destination_port?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  estimated_budget_range?: string;

  @HasMany(() => SourcingQuote)
  quotes?: SourcingQuote[];

  @HasMany(() => SourcingAttachment)
  attachments?: SourcingAttachment[];
}
