import { BillStatus } from '../enums/bill-status.enum';
import { RecurringType } from '../enums/recurring-type.enum';
import { PaymentMethod } from '../enums/payment-method.enum';

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
  createdAt: Date;
  updatedAt: Date;
}
