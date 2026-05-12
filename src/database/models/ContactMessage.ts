import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
} from 'sequelize-typescript';

@Table({
  tableName: 'contact_messages',
  timestamps: true,
  underscored: true,
})
export class ContactMessage extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING(200))
  name!: string;

  @AllowNull(false)
  @Column(DataType.STRING(320))
  email!: string;

  @AllowNull(true)
  @Column(DataType.STRING(40))
  phone?: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  message!: string;
}
