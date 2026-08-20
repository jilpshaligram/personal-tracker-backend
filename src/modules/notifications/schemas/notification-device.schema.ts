import {
  Column,
  CreatedAt,
  DataType,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

export interface NotificationDeviceCreationAttributes {
  userId: string;
  deviceToken: string;
  platform?: string;
  isActive?: boolean;
}

@Table({
  tableName: 'notification_devices',
  timestamps: true,
})
export class NotificationDevice extends Model<
  NotificationDevice,
  NotificationDeviceCreationAttributes
> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  userId!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    unique: true,
  })
  deviceToken!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'WEB',
  })
  platform!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  isActive!: boolean;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
