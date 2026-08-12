import { PaymentMethod } from '../../bills/enums/payment-method.enum';
import { BillHistoryStatus } from '../interfaces/bill-history.interface';

export interface CreateBillHistoryDto {
  billId: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  status: BillHistoryStatus;
  remarks?: string;
}
