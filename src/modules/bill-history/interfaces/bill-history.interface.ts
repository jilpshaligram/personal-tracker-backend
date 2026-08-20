import { PaymentMethod } from '../../bills/enums/payment-method.enum';

export enum BillHistoryStatus {
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  FAILED = 'FAILED',
}

export interface BillHistoryEntity {
  id: string;
  billId: string;
  transactionId?: string | null;
  paymentDate: Date;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  status: BillHistoryStatus;
  remarks: string | null;
  createdAt: Date;
}

export interface PaymentSummary {
  totalPayments: number;
  totalAmountPaid: number;
  lastPaymentDate: Date | null;
}
