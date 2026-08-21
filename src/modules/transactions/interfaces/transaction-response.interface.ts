import { TransactionType } from '@/modules/transactions/enums/transaction-type.enum';
import { PaymentMethod } from '@/modules/transactions/enums/payment-method.enum';

export interface ICategoryMeta {

  readonly id: string;

  readonly name: string;

  readonly type: TransactionType;

  readonly icon: string | null;

  readonly color: string | null;
}

export interface ITransactionResponse {

  readonly id: string;

  readonly amount: number;

  readonly transactionDate: string;

  readonly paymentMethod: PaymentMethod;

  readonly type: TransactionType;

  readonly note: string | null;

  readonly category: ICategoryMeta;

  readonly createdAt: string;

  readonly updatedAt: string;
}

export interface ITransactionListResponse {

  readonly data: ITransactionResponse[];

  readonly meta: {

    readonly total: number;

    readonly page: number;

    readonly limit: number;

    readonly totalPages: number;

    readonly hasNextPage: boolean;

    readonly hasPreviousPage: boolean;
  };
}
