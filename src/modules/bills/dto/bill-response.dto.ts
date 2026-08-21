import { BillStatus } from '@/modules/bills/enums/bill-status.enum';
import { RecurringType } from '@/modules/bills/enums/recurring-type.enum';
import { PaymentMethod } from '@/modules/bills/enums/payment-method.enum';
import { BillHistoryResponseDto } from '@/modules/bill-history/dto/bill-history-response.dto';

export interface BillResponseDto {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  description: string | null;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  paymentMethod: PaymentMethod | null;
  status: BillStatus;
  isRecurring: boolean;
  recurringType: RecurringType | null;
  reminderDaysBefore: number[];
  lastReminderSentAt: Date | null;
  attachment: {
    url: string;
    publicId: string;
    fileName: string;
    mimeType: string;
    size: number;
  } | null;
  notes: string | null;
  paidAmount: number;
  remainingAmount: number;
  totalAmountPaid?: number;
  transactionId?: string | null;
  paymentHistory?: BillHistoryResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}
