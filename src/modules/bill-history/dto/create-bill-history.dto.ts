import { PaymentMethod } from '@/modules/bills/enums/payment-method.enum';
import { BillHistoryStatus } from '@/modules/bill-history/interfaces/bill-history.interface';

export interface CreateBillHistoryDto {
  billId: string;
  transactionId?: string | null;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  status: BillHistoryStatus;
  remarks?: string;
}
