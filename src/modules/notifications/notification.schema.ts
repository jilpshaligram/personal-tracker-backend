import {
  Column,
  CreatedAt,
  DataType,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

export interface NotificationAttributes {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  referenceId: string | null;
  referenceType: string | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationCreationAttributes extends Omit<
  NotificationAttributes,
  'id' | 'createdAt' | 'updatedAt'
> {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Table({
  tableName: 'notifications',
  timestamps: true,
  underscored: true,
})
export class Notification extends Model<
  NotificationAttributes,
  NotificationCreationAttributes
> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
  })
  declare id: string;

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare userId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare type: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare message: string;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare referenceId: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare referenceType: string | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare isRead: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare readAt: Date | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
