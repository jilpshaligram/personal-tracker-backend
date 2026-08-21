import { BillStatus } from '@/modules/bills/enums/bill-status.enum';
import { RecurringType } from '@/modules/bills/enums/recurring-type.enum';
import { PaymentMethod } from '@/modules/bills/enums/payment-method.enum';

export interface BillEntity {
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
  deletedAt: Date | null;
}

export interface BillSummary {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: BillStatus;
  isRecurring: boolean;
}

export interface BillFilter {
  page?: number;
  limit?: number;
  search?: string;
  status?: BillStatus;
  categoryId?: string;
  isRecurring?: boolean;
  dueFrom?: string;
  dueTo?: string;
  sortBy?: 'dueDate' | 'amount' | 'title' | 'status' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
}

export interface BillStatistics {
  totalBills: number;
  pendingBills: number;
  paidBills: number;
  overdueBills: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

export interface BillResponse {
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
