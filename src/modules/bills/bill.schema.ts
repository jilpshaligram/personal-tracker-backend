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
  HasMany,
} from 'sequelize-typescript';
import { BillStatus } from '@/modules/bills/enums/bill-status.enum';
import { RecurringType } from '@/modules/bills/enums/recurring-type.enum';
import { PaymentMethod } from '@/modules/bills/enums/payment-method.enum';
import { User } from '@/modules/users/user.schema';
import { BillHistory } from '@/modules/bill-history/bill-history.schema';

@Table({
  tableName: 'bills',
  paranoid: true,
  timestamps: true,
  underscored: false,
  indexes: [
    { fields: ['userId'] },
    { fields: ['status'] },
    { fields: ['dueDate'] },
    { fields: ['categoryId'] },
    { fields: ['isRecurring'] },
    { fields: ['deletedAt'] },
    { fields: ['userId', 'status', 'dueDate'] },
  ],
})
export class Bill extends Model {
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

  @Column({ type: DataType.UUID, allowNull: false })
  declare categoryId: string;

  @Column({ type: DataType.STRING(150), allowNull: false })
  declare title: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare amount: number;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare dueDate: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare paidDate: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(PaymentMethod)),
    allowNull: true,
  })
  declare paymentMethod: PaymentMethod | null;

  @Column({
    type: DataType.ENUM(...Object.values(BillStatus)),
    defaultValue: BillStatus.PENDING,
    allowNull: false,
  })
  declare status: BillStatus;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare isRecurring: boolean;

  @Column({
    type: DataType.ENUM(...Object.values(RecurringType)),
    allowNull: true,
  })
  declare recurringType: RecurringType | null;

  @Column({ type: DataType.ARRAY(DataType.INTEGER), defaultValue: [] })
  declare reminderDaysBefore: number[];

  @Column({ type: DataType.DATE, allowNull: true })
  declare lastReminderSentAt: Date | null;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare attachment: {
    url: string;
    publicId: string;
    fileName: string;
    mimeType: string;
    size: number;
  } | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare notes: string | null;

  @Column({ type: DataType.DECIMAL(10, 2), defaultValue: 0, allowNull: false })
  declare paidAmount: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  declare remainingAmount: number | null;

  @HasMany(() => BillHistory, 'billId')
  declare paymentHistory: BillHistory[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date | null;
}
