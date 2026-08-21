import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction as DbTransaction } from 'sequelize';
import { BillHistory } from '@/modules/bill-history/bill-history.schema';
import { Transaction } from '@/modules/transactions/transaction.schema';
import { CreateBillHistoryDto } from '@/modules/bill-history/dto/create-bill-history.dto';
import { BillHistoryResponseDto } from '@/modules/bill-history/dto/bill-history-response.dto';
import { BillHistoryMapper } from '@/modules/bill-history/mapper/bill-history.mapper';
import { PaymentSummary } from '@/modules/bill-history/interfaces/bill-history.interface';

@Injectable()
export class BillHistoryService {
  constructor(
    @InjectModel(BillHistory)
    private readonly billHistoryModel: typeof BillHistory,
  ) {}

  async createHistory(
    dto: CreateBillHistoryDto,
    transaction?: DbTransaction,
  ): Promise<BillHistory> {
    return this.billHistoryModel.create(
      {
        billId: dto.billId,
        transactionId: dto.transactionId ?? null,
        amountPaid: dto.amountPaid,
        paymentMethod: dto.paymentMethod,
        status: dto.status,
        remarks: dto.remarks,
        paymentDate: new Date(),
      },
      { transaction },
    );
  }

  async findByBill(
    billId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: BillHistoryResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const offset = (page - 1) * limit;

    const { rows, count } = await this.billHistoryModel.findAndCountAll({
      where: { billId },
      include: [
        {
          model: Transaction,
          as: 'transaction',
          required: false,
        },
      ],
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

  async getPaymentSummary(
    billId: string,
    transaction?: DbTransaction,
  ): Promise<PaymentSummary> {
    const histories = await this.billHistoryModel.findAll({
      where: { billId },
      transaction,
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
