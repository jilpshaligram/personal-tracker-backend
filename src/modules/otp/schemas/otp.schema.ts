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
import { OtpPurpose } from '../enums/otp-purpose.enum';
import { User } from '../../users/schemas/user.schema';

@Table({
  tableName: 'otps',
  timestamps: true,
  underscored: false,
})
export class Otp extends Model {
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

  @Column({ type: DataType.STRING, allowNull: false })
  declare email: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare otp: string;

  @Column({
    type: DataType.ENUM(...Object.values(OtpPurpose)),
    allowNull: false,
  })
  declare purpose: OtpPurpose;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare attempts: number;

  @Column({ type: DataType.INTEGER, defaultValue: 5 })
  declare maxAttempts: number;

  @Column({ type: DataType.DATE, allowNull: false })
  declare expiresAt: Date;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare isVerified: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  declare verifiedAt: Date | null;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare resendCount: number;

  @Column({ type: DataType.DATE, allowNull: true })
  declare lastSentAt: Date | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
