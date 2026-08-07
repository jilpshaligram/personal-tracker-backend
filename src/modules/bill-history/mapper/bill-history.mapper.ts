import { BillHistory } from '../schemas/bill-history.schema';
import { BillHistoryResponseDto } from '../dto/bill-history-response.dto';

export class BillHistoryMapper {
  static toResponseDto(history: BillHistory): BillHistoryResponseDto {
    return {
      id: history.id,
      billId: history.billId,
      paymentDate: history.paymentDate,
      amountPaid: Number(history.amountPaid),
      paymentMethod: history.paymentMethod,
      status: history.status,
      remarks: history.remarks,
      createdAt: history.createdAt,
    };
  }

  static toResponseDtoList(histories: BillHistory[]): BillHistoryResponseDto[] {
    return histories.map((history) => this.toResponseDto(history));
  }
}
