import { PaymentMethod } from '../../bills/enums/payment-method.enum';
import { BillHistoryStatus } from '../interfaces/bill-history.interface';

export interface BillHistoryResponseDto {
  id: string;
  billId: string;
  paymentDate: Date;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  status: BillHistoryStatus;
  remarks: string | null;
  createdAt: Date;
}
