import {
  Column,
  CreatedAt,
  DataType,
  Model,
  Table,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { PaymentMethod } from '@/modules/bills/enums/payment-method.enum';
import { BillHistoryStatus } from '@/modules/bill-history/interfaces/bill-history.interface';
import { Bill } from '@/modules/bills/bill.schema';
import { Transaction } from '@/modules/transactions/transaction.schema';

@Table({
  tableName: 'bill_history',
  timestamps: true,
  updatedAt: false,
  underscored: false,
  indexes: [{ fields: ['billId'] }, { fields: ['paymentDate'] }],
})
export class BillHistory extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Bill)
  @Column({ type: DataType.UUID, allowNull: false })
  declare billId: string;

  @BelongsTo(() => Bill)
  declare bill: Bill;

  @ForeignKey(() => Transaction)
  @Column({ type: DataType.UUID, allowNull: true })
  declare transactionId: string | null;

  @BelongsTo(() => Transaction)
  declare transaction: Transaction | null;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW, allowNull: false })
  declare paymentDate: Date;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare amountPaid: number;

  @Column({
    type: DataType.ENUM(...Object.values(PaymentMethod)),
    allowNull: false,
  })
  declare paymentMethod: PaymentMethod;

  @Column({
    type: DataType.ENUM(...Object.values(BillHistoryStatus)),
    allowNull: false,
  })
  declare status: BillHistoryStatus;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare remarks: string | null;

  @CreatedAt
  declare createdAt: Date;
}
