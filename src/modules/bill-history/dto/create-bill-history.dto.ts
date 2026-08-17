import { PaymentMethod } from '../../bills/enums/payment-method.enum';
import { BillHistoryStatus } from '../interfaces/bill-history.interface';

export interface CreateBillHistoryDto {
  billId: string;
  transactionId?: string | null;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  status: BillHistoryStatus;
  remarks?: string;
}
