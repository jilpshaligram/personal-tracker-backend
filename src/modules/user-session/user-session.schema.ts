import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from '@/modules/users/user.schema';

@Table({
  tableName: 'user_sessions',
  timestamps: true,
  underscored: false,
})
export class UserSession extends Model {
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

  @Column({ type: DataType.TEXT, allowNull: false })
  declare refreshToken: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare device: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare loginMethod: string | null;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare isActive: boolean;

  @Column({ type: DataType.DATE, allowNull: false })
  declare expiresAt: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  declare lastActivityAt: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare loggedOutAt: Date | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
