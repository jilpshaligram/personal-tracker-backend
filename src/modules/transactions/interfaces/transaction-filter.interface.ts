import { TransactionType } from '@/modules/transactions/enums/transaction-type.enum';
import { PaymentMethod } from '@/modules/transactions/enums/payment-method.enum';

export interface ITransactionFilter {
  readonly userId: string;

  readonly categoryId?: string;

  readonly type?: TransactionType;

  readonly paymentMethod?: PaymentMethod;

  readonly dateFrom?: string;

  readonly dateTo?: string;

  readonly minAmount?: number;

  readonly maxAmount?: number;

  readonly page?: number;

  readonly limit?: number;
}
