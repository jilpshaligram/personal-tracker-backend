import { PaymentMethod } from '@/modules/transactions/enums/payment-method.enum';
import { TransactionType } from '@/modules/transactions/enums/transaction-type.enum';
import { ICategory } from '@/modules/transactions/interfaces/category.interface';

export interface ITransaction {
  readonly id: string;

  readonly userId: string;

  readonly walletId: string;

  readonly categoryId: string | null;

  readonly savingGoalId: string | null;

  readonly type: TransactionType;

  readonly amount: number;

  readonly transactionDate: Date;

  readonly paymentMethod: PaymentMethod;

  readonly note: string | null;

  readonly category?: ICategory;

  readonly createdAt: Date;

  readonly updatedAt: Date;

  readonly deletedAt: Date | null;
}
