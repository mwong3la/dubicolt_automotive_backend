import { Table, Column, Model, DataType, PrimaryKey, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { SourcingRequest } from './SourcingRequest';

@Table({ tableName: 'sourcing_attachments', timestamps: true, underscored: true })
export class SourcingAttachment extends Model {
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
  name!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  size!: string;

  @AllowNull(false)
  @Column(DataType.ENUM('pdf', 'zip'))
  type!: 'pdf' | 'zip';

  @AllowNull(true)
  @Column(DataType.STRING)
  url?: string;
}
