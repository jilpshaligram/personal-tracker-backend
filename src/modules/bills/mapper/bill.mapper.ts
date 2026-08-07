import { Bill } from '../schemas/bill.schema';
import { BillResponseDto } from '../dto/bill-response.dto';

export class BillMapper {
  static toResponseDto(bill: Bill): BillResponseDto {
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
      createdAt: bill.createdAt,
      updatedAt: bill.updatedAt,
    };
  }

  static toResponseDtoList(bills: Bill[]): BillResponseDto[] {
    return bills.map((bill) => this.toResponseDto(bill));
  }
}
