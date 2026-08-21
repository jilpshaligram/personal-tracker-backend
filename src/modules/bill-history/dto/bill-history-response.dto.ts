import { PaymentMethod } from '@/modules/bills/enums/payment-method.enum';
import { BillHistoryStatus } from '@/modules/bill-history/interfaces/bill-history.interface';

export interface BillTransactionDetailsDto {
  id: string;
  walletId: string;
  categoryId?: string | null;
  type: string;
  amount: number;
  paymentMethod: string;
  note?: string | null;
  transactionDate: Date | string;
  createdAt: Date;
}

export interface BillHistoryResponseDto {
  id: string;
  billId: string;
  transactionId?: string | null;
  paymentDate: Date;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  status: BillHistoryStatus;
  remarks: string | null;
  transaction?: BillTransactionDetailsDto | null;
  createdAt: Date;
}
