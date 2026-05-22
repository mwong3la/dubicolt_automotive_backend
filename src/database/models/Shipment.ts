import { Table, Column, Model, DataType, PrimaryKey, Default, AllowNull, Unique } from 'sequelize-typescript';

@Table({ tableName: 'shipments', timestamps: true, underscored: true })
export class Shipment extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  tracking_id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  current_status!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  origin_city!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  destination_city!: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  vessel?: string;

  @Default([])
  @Column(DataType.JSONB)
  milestones!: {
    label: string;
    detail: string;
    date: string;
    done: boolean;
    active?: boolean;
  }[];
}
