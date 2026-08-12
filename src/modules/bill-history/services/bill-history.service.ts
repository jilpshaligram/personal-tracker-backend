import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BillHistory } from '../schemas/bill-history.schema';
import { CreateBillHistoryDto } from '../dto/create-bill-history.dto';
import { BillHistoryResponseDto } from '../dto/bill-history-response.dto';
import { BillHistoryMapper } from '../mapper/bill-history.mapper';
import { PaymentSummary } from '../interfaces/bill-history.interface';

@Injectable()
export class BillHistoryService {
  constructor(
    @InjectModel(BillHistory)
    private readonly billHistoryModel: typeof BillHistory,
  ) {}

  async createHistory(dto: CreateBillHistoryDto): Promise<BillHistory> {
    return this.billHistoryModel.create({
      billId: dto.billId,
      amountPaid: dto.amountPaid,
      paymentMethod: dto.paymentMethod,
      status: dto.status,
      remarks: dto.remarks,
      paymentDate: new Date(),
    });
  }

  async findByBill(
    billId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: BillHistoryResponseDto[]; pagination: any }> {
    const offset = (page - 1) * limit;

    const { rows, count } = await this.billHistoryModel.findAndCountAll({
      where: { billId },
      order: [['paymentDate', 'DESC']],
      limit,
      offset,
    });

    return {
      data: BillHistoryMapper.toResponseDtoList(rows),
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async getPaymentSummary(billId: string): Promise<PaymentSummary> {
    const histories = await this.billHistoryModel.findAll({
      where: { billId },
    });

    const totalPayments = histories.length;
    const totalAmountPaid = histories.reduce(
      (sum, h) => sum + Number(h.amountPaid),
      0,
    );
    const lastPaymentDate =
      histories.length > 0
        ? histories.sort(
            (a, b) => b.paymentDate.getTime() - a.paymentDate.getTime(),
          )[0].paymentDate
        : null;

    return {
      totalPayments,
      totalAmountPaid,
      lastPaymentDate,
    };
  }

  deleteHistory(): never {
    throw new ForbiddenException({
      success: false,
      message: 'Bill history cannot be deleted',
      errors: [],
    });
  }

  archiveHistory(): never {
    throw new ForbiddenException({
      success: false,
      message: 'Bill history cannot be archived',
      errors: [],
    });
  }
}
