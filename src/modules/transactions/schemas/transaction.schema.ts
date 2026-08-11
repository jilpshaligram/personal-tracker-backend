import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { PaymentMethod } from '../enums/payment-method.enum';
import { Category } from '../../categories/schemas/category.schema';
import { User } from '../../users/schemas/user.schema';
import { SavingGoal } from '../../saving-goals/schemas/saving-goal.schema';
import { TransactionType } from '../enums/transaction-type.enum';
import { ITransaction } from '../interfaces/transaction.interface';

/**
 * @entity Transaction
 *
 * @description
 * Sequelize model for the `transactions` PostgreSQL table.
 * This entity is the single source of truth for the `transactions` table schema,
 * implementing the ITransaction interface to guarantee strict typing.
 */
@Table({
  tableName: 'transactions',
  paranoid: true,
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'idx_transactions_user_date',
      fields: ['user_id', 'transaction_date'],
      where: { deleted_at: null },
    },
    {
      name: 'idx_transactions_category',
      fields: ['category_id'],
      where: { deleted_at: null },
    },
    {
      name: 'idx_transactions_wallet_date',
      fields: ['wallet_id', 'transaction_date'],
      where: { deleted_at: null },
    },
    {
      name: 'idx_transactions_saving_goal',
      fields: ['saving_goal_id'],
      where: { deleted_at: null },
    },
    {
      name: 'idx_transactions_user_type_date',
      fields: ['user_id', 'type', 'transaction_date'],
      where: { deleted_at: null },
    },
    {
      name: 'idx_transactions_user_created',
      fields: ['user_id', 'created_at'],
      where: { deleted_at: null },
    },
  ],
})
export class Transaction
  extends Model<ITransaction, Partial<ITransaction>>
  implements ITransaction
{
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  declare id: string;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, field: 'user_id' })
  declare userId: string;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...Object.values(TransactionType)),
  })
  declare type: TransactionType;

  @AllowNull(false)
  @Column({ type: DataType.UUID, field: 'wallet_id' })
  declare walletId: string;

  @AllowNull(true)
  @ForeignKey(() => Category)
  @Column({ type: DataType.UUID, field: 'category_id' })
  declare categoryId: string | null;

  @AllowNull(true)
  @ForeignKey(() => SavingGoal)
  @Column({ type: DataType.UUID, field: 'saving_goal_id' })
  declare savingGoalId: string | null;

  @AllowNull(false)
  @Column({
    type: DataType.DECIMAL(15, 2),
    get() {
      const value = this.getDataValue('amount') as string | number | null;
      if (value === null) return null;
      return typeof value === 'string' ? parseFloat(value) : value;
    },
  })
  declare amount: number;

  @AllowNull(false)
  @Column({ type: DataType.DATEONLY, field: 'transaction_date' })
  declare transactionDate: Date;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...Object.values(PaymentMethod)),
    field: 'payment_method',
  })
  declare paymentMethod: PaymentMethod;

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  declare note: string | null;

  @BelongsTo(() => User, {
    foreignKey: 'userId',
    as: 'user',
  })
  declare user: User;

  @BelongsTo(() => Category, {
    foreignKey: 'categoryId',
    as: 'category',
  })
  // @ts-expect-error - Category model uses CategoryTransactionType enum, while ITransaction expects TransactionType enum
  declare category: Category;

  @BelongsTo(() => SavingGoal, {
    foreignKey: 'savingGoalId',
    as: 'savingGoal',
  })
  declare savingGoal: SavingGoal;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}
