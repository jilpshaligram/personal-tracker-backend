import { Bill } from '@/modules/bills/bill.schema';
import { BillResponseDto } from '@/modules/bills/dto/bill-response.dto';
import { BillHistoryResponseDto } from '@/modules/bill-history/dto/bill-history-response.dto';
import { BillHistoryMapper } from '@/modules/bill-history/mapper/bill-history.mapper';

export class BillMapper {
  static toResponseDto(
    bill: Bill,
    extras?: {
      totalAmountPaid?: number;
      remainingAmount?: number;
      paymentHistory?: BillHistoryResponseDto[];
      transactionId?: string | null;
    },
  ): BillResponseDto {
    const paymentHistory =
      extras?.paymentHistory ??
      (bill.paymentHistory
        ? BillHistoryMapper.toResponseDtoList(bill.paymentHistory)
        : undefined);

    const transactionId =
      extras?.transactionId !== undefined
        ? extras.transactionId
        : paymentHistory && paymentHistory.length > 0
          ? (paymentHistory[0].transactionId ?? null)
          : null;

    return {
      id: bill.id,
      userId: bill.userId,
      categoryId: bill.categoryId,
      title: bill.title,
      description: bill.description,
      amount: Number(bill.amount),
      dueDate: bill.dueDate,
      paidDate: bill.paidDate,
      paymentMethod: bill.paymentMethod,
      status: bill.status,
      isRecurring: bill.isRecurring,
      recurringType: bill.recurringType,
      reminderDaysBefore: bill.reminderDaysBefore,
      lastReminderSentAt: bill.lastReminderSentAt,
      attachment: bill.attachment,
      notes: bill.notes,
      paidAmount: Number(bill.paidAmount),
      remainingAmount: Number(bill.remainingAmount),
      totalAmountPaid: extras?.totalAmountPaid,
      transactionId,
      paymentHistory,
      createdAt: bill.createdAt,
      updatedAt: bill.updatedAt,
    };
  }

  static toResponseDtoList(
    bills: Bill[],
    extrasMap?: Record<
      string,
      {
        totalAmountPaid?: number;
        remainingAmount?: number;
        paymentHistory?: BillHistoryResponseDto[];
        transactionId?: string | null;
      }
    >,
  ): BillResponseDto[] {
    return bills.map((bill) => this.toResponseDto(bill, extrasMap?.[bill.id]));
  }
}
