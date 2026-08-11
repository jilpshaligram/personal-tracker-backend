import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from '../schemas/transaction.schema';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { Transaction as SequelizeTransaction } from 'sequelize';
import { PaymentMethod } from '../enums/payment-method.enum';

@Injectable()
export class TransactionRepository {
  constructor(
    @InjectModel(Transaction)
    private readonly transactionModel: typeof Transaction,
  ) {}

  async create(
    userId: string,
    data: CreateTransactionDto,
    transaction?: SequelizeTransaction,
  ): Promise<Transaction> {
    return this.transactionModel.create(
      {
        userId,
        walletId: data.wallet_id,
        categoryId: data.category_id || null,
        savingGoalId: data.saving_goal_id || null,
        type: data.type,
        amount: data.amount,
        paymentMethod: data.payment_method || PaymentMethod.CASH,
        note: data.note || null,
        transactionDate: new Date(data.transaction_date),
      },
      { transaction },
    );
  }

  async findAllByUserId(userId: string): Promise<Transaction[]> {
    return this.transactionModel.findAll({
      where: { userId },
      order: [
        ['transactionDate', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });
  }

  async findOneByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<Transaction | null> {
    return this.transactionModel.findOne({
      where: { id, userId },
    });
  }
}
