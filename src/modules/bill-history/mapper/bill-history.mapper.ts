import { BillHistory } from '@/modules/bill-history/bill-history.schema';
import { BillHistoryResponseDto } from '@/modules/bill-history/dto/bill-history-response.dto';

export class BillHistoryMapper {
  static toResponseDto(history: BillHistory): BillHistoryResponseDto {
    return {
      id: history.id,
      billId: history.billId,
      transactionId: history.transactionId ?? null,
      paymentDate: history.paymentDate,
      amountPaid: Number(history.amountPaid),
      paymentMethod: history.paymentMethod,
      status: history.status,
      remarks: history.remarks,
      transaction: history.transaction
        ? {
            id: history.transaction.id,
            walletId: history.transaction.walletId,
            categoryId: history.transaction.categoryId,
            type: history.transaction.type,
            amount: Number(history.transaction.amount),
            paymentMethod: history.transaction.paymentMethod,
            note: history.transaction.note,
            transactionDate: history.transaction.transactionDate,
            createdAt: history.transaction.createdAt,
          }
        : null,
      createdAt: history.createdAt,
    };
  }

  static toResponseDtoList(histories: BillHistory[]): BillHistoryResponseDto[] {
    return histories.map((history) => this.toResponseDto(history));
  }
}
