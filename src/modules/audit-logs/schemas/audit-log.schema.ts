import {
  Column,
  CreatedAt,
  DataType,
  DeletedAt,
  Model,
  Table,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
  Index,
} from 'sequelize-typescript';
import { User } from '../../users/schemas/user.schema';
import { ActionType } from '../enums/action-type.enum';

@Table({
  tableName: 'audit_logs',
  paranoid: false,
  timestamps: true,
  underscored: false,
})
export class AuditLog extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare userId: string;

  @BelongsTo(() => User)
  declare user: User;

  @Index
  @Column({ type: DataType.STRING(50), allowNull: false })
  declare module: string;

  @Index
  @Column({
    type: DataType.ENUM(...Object.values(ActionType)),
    allowNull: false,
  })
  declare action: ActionType;

  @Index
  @Column({ type: DataType.UUID, allowNull: true })
  declare entityId: string | null;

  @Column({ type: DataType.STRING(50), allowNull: true })
  declare entityType: string | null;

  @Column({ type: DataType.STRING(45), allowNull: false })
  declare ipAddress: string;

  @Column({ type: DataType.STRING(500), allowNull: false })
  declare userAgent: string;

  @Column({ type: DataType.STRING(10), allowNull: false })
  declare requestMethod: string;

  @Column({ type: DataType.STRING(500), allowNull: false })
  declare requestUrl: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare statusCode: number;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare changes: Record<string, any> | null;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare metadata: Record<string, any> | null;

  @Index
  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date | null;
}
