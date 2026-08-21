import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from '@/modules/transactions/transaction.schema';
import { CreateTransactionDto } from '@/modules/transactions/dto/create-transaction.dto';
import { Transaction as SequelizeTransaction } from 'sequelize';
import { PaymentMethod } from '@/modules/transactions/enums/payment-method.enum';
import { QueryResult } from '@/common/interfaces/query-result.interface';
import { Category } from '@/modules/categories/category.schema';
import { SavingGoal } from '@/modules/saving-goals/saving-goal.schema';
import { Wallet } from '@/modules/wallets/wallet.schema';
import { QueryTransactionDto } from '@/modules/transactions/dto/query-transaction.dto';
import { Op, Sequelize, WhereOptions } from 'sequelize';
import { ITransaction } from '@/modules/transactions/interfaces/transaction.interface';
import { ICategory } from '@/modules/categories/interfaces/category.interface';

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

  async findAllPaginated(
    userId: string,
    queryResult: QueryResult,
    rawQuery: QueryTransactionDto,
  ): Promise<{ rows: Transaction[]; count: number }> {
    const where: WhereOptions<ITransaction> = {
      ...(queryResult.where as WhereOptions<ITransaction>),
      userId,
    };

    if (rawQuery.type && rawQuery.type !== 'ALL') {
      (where as Record<string, unknown>).type = rawQuery.type;
    }

    if (rawQuery.startDate || rawQuery.endDate) {
      const dateConditions: unknown[] = [];
      if (rawQuery.startDate) {
        dateConditions.push(
          Sequelize.where(
            Sequelize.cast(
              Sequelize.col('Transaction.transaction_date'),
              'DATE',
            ),
            {
              [Op.gte]: rawQuery.startDate,
            },
          ),
        );
      }
      if (rawQuery.endDate) {
        dateConditions.push(
          Sequelize.where(
            Sequelize.cast(
              Sequelize.col('Transaction.transaction_date'),
              'DATE',
            ),
            {
              [Op.lte]: rawQuery.endDate,
            },
          ),
        );
      }
      const existingAnd = (where as Record<symbol, unknown>)[Op.and];
      const existingAndArray: unknown[] = Array.isArray(existingAnd)
        ? (existingAnd as unknown[])
        : [];
      (where as Record<symbol, unknown>)[Op.and] = [
        ...existingAndArray,
        ...dateConditions,
      ];
    }

    const categoryWhere: WhereOptions<ICategory> = {};
    if (rawQuery.category && rawQuery.category !== 'ALL') {
      (categoryWhere as Record<string, unknown>).name = {
        [Op.iLike]: `%${rawQuery.category}%`,
      };
    }

    if (rawQuery.search) {
      const searchStr = `%${rawQuery.search}%`;
      (where as Record<symbol, unknown>)[Op.or] = [
        { note: { [Op.iLike]: searchStr } },
        Sequelize.where(
          Sequelize.cast(Sequelize.col('Transaction.amount'), 'varchar'),
          { [Op.iLike]: searchStr },
        ),
        Sequelize.where(
          Sequelize.cast(Sequelize.col('Transaction.type'), 'varchar'),
          { [Op.iLike]: searchStr },
        ),
        Sequelize.where(
          Sequelize.cast(
            Sequelize.col('Transaction.payment_method'),
            'varchar',
          ),
          { [Op.iLike]: searchStr },
        ),
        Sequelize.where(
          Sequelize.cast(
            Sequelize.col('Transaction.transaction_date'),
            'varchar',
          ),
          { [Op.iLike]: searchStr },
        ),
        { '$category.name$': { [Op.iLike]: searchStr } },
        { '$savingGoal.title$': { [Op.iLike]: searchStr } },
      ];
    }

    let order = queryResult.order;
    if (rawQuery.sortBy) {
      const sortDirection = (rawQuery.sortOrder || 'DESC').toUpperCase();
      switch (rawQuery.sortBy) {
        case 'categoryName':
          order = [
            [{ model: Category, as: 'category' }, 'name', sortDirection],
          ];
          break;
        case 'savingGoalTitle':
          order = [
            [{ model: SavingGoal, as: 'savingGoal' }, 'title', sortDirection],
          ];
          break;
        case 'currentBalance':
          order = [
            [{ model: Wallet, as: 'wallet' }, 'currentBalance', sortDirection],
          ];
          break;
        case 'blockedAmount':
          order = [
            [{ model: Wallet, as: 'wallet' }, 'blockedAmount', sortDirection],
          ];
          break;
        case 'availableBalance':
          order = [
            [
              Sequelize.literal(
                '"wallet"."current_balance" - "wallet"."blocked_amount"',
              ),
              sortDirection,
            ],
          ];
          break;
        case 'amount':
        case 'transactionDate':
        case 'createdAt':
        case 'updatedAt':
        case 'type':
        case 'paymentMethod':
        case 'note':
          order = [[rawQuery.sortBy, sortDirection]];
          break;
      }
    }

    return this.transactionModel.findAndCountAll({
      where,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['name', 'type'],
          where: Object.keys(categoryWhere).length ? categoryWhere : undefined,
          required: Object.keys(categoryWhere).length > 0,
        },
        {
          model: SavingGoal,
          as: 'savingGoal',
          attributes: ['title'],
          required: false,
        },
        {
          model: Wallet,
          as: 'wallet',
          attributes: ['currentBalance', 'blockedAmount'],
          required: false,
        },
      ],
      order,
      offset: queryResult.offset,
      limit: queryResult.limit,
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

  async findByIdAndUserIdForUpdate(
    id: string,
    userId: string,
    transaction: SequelizeTransaction,
  ): Promise<Transaction | null> {
    return this.transactionModel.findOne({
      where: { id, userId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
  }
}
