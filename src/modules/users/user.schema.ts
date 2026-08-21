import {
  Column,
  CreatedAt,
  DataType,
  DeletedAt,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Gender } from '@/modules/users/enums/gender.enum';
import { UserRole } from '@/modules/users/enums/user-role.enum';
import { UserStatus } from '@/modules/users/enums/user-status.enum';

@Table({
  tableName: 'users',
  paranoid: true,
  timestamps: true,
  underscored: false,
})
export class User extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare firstName: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare lastName: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare email: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare phone: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare password: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare pin: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(UserRole)),
    defaultValue: UserRole.USER,
    allowNull: false,
  })
  declare role: UserRole;

  @Column({ type: DataType.STRING, allowNull: true })
  declare profileImage: string | null;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare dateOfBirth: string;

  @Column({
    type: DataType.ENUM(...Object.values(Gender)),
    allowNull: false,
  })
  declare gender: Gender;

  @Column({
    type: DataType.ENUM(...Object.values(UserStatus)),
    defaultValue: UserStatus.PENDING,
    allowNull: false,
  })
  declare status: UserStatus;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare isVerified: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare isPinCreated: boolean;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare wrongPinAttempts: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare failedLoginAttempts: number;

  @Column({ type: DataType.DATE, allowNull: true })
  declare pinLockedUntil: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare lastLoginAt: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare lastPasswordChangedAt: Date | null;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare notificationEnabled: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  declare createdBy: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare updatedBy: string | null;

  @DeletedAt
  declare deletedAt: Date | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
