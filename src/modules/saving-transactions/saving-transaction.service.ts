import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SavingTransaction } from '@/modules/saving-transactions/saving-transaction.schema';
import { SavingTransactionType } from '@/modules/saving-transactions/enums/saving-transaction-type.enum';
import { ISavingTransaction } from '@/modules/saving-transactions/interfaces/saving-transaction.interface';
import { CreateSavingTransactionDto } from '@/modules/saving-transactions/dto/create-saving-transaction.dto';
import { UpdateSavingTransactionDto } from '@/modules/saving-transactions/dto/update-saving-transaction.dto';
import { SavingGoalService } from '@/modules/saving-goals/saving-goal.service';
import { fn, col, literal, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { QuerySavingTransactionDto } from '@/modules/saving-transactions/dto/query-saving-transaction.dto';
import { QueryHelper } from '@/common/helpers/query.helper';
import { SAVING_TRANSACTION_QUERY_FIELDS } from '@/modules/saving-transactions/constants/query-fields.constants';

@Injectable()
export class SavingTransactionService {
  constructor(
    @InjectModel(SavingTransaction)
    private readonly savingTransactionModel: typeof SavingTransaction,
    private readonly savingGoalService: SavingGoalService,
    private readonly sequelize: Sequelize,
  ) {}

  async create(
    goalId: string,
    userId: string,
    dto: CreateSavingTransactionDto,
  ): Promise<ISavingTransaction> {
    const goal = await this.savingGoalService.findGoalOrFail(goalId, userId);

    if ((dto.type as unknown) === SavingTransactionType.WITHDRAWAL) {
      const currentSaved = Number(goal.savedAmount);
      if (dto.amount > currentSaved) {
        throw new BadRequestException({
          success: false,
          message: `Withdrawal amount (${dto.amount}) exceeds current saved amount (${currentSaved}). Cannot overdraw a saving goal.`,
          errors: [],
        });
      }
    }

    return this.sequelize.transaction(async (t) => {
      const transaction = await this.savingTransactionModel.create(
        {
          savingGoalId: goalId,
          userId,
          type: dto.type,
          amount: dto.amount,
          note: dto.note ?? null,
        },
        { transaction: t },
      );

      await this.recalculateSavingGoal(goalId, t);

      return this.toSafeTransaction(transaction);
    });
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateSavingTransactionDto,
  ): Promise<ISavingTransaction> {
    const transactionRecord = await this.savingTransactionModel.findByPk(id);

    if (!transactionRecord) {
      throw new NotFoundException({
        success: false,
        message: `Saving transaction with id "${id}" not found`,
        errors: [],
      });
    }

    if (transactionRecord.userId !== userId) {
      throw new ForbiddenException({
        success: false,
        message: 'You do not have permission to update this transaction',
        errors: [],
      });
    }

    const goalId = transactionRecord.savingGoalId;
    const goal = await this.savingGoalService.findGoalOrFail(goalId, userId);

    const newType = dto.type ?? transactionRecord.type;
    const newAmount = dto.amount ?? Number(transactionRecord.amount);

    if (newType === SavingTransactionType.WITHDRAWAL) {
      const currentSaved = Number(goal.savedAmount);

      let baseSavedAmount = currentSaved;
      if (transactionRecord.type === SavingTransactionType.CONTRIBUTION) {
        baseSavedAmount -= Number(transactionRecord.amount);
      } else {
        baseSavedAmount += Number(transactionRecord.amount);
      }

      if (newAmount > baseSavedAmount) {
        throw new BadRequestException({
          success: false,
          message: `Withdrawal amount (${newAmount}) exceeds the base saved amount (${baseSavedAmount}). Cannot overdraw a saving goal.`,
          errors: [],
        });
      }
    }

    return this.sequelize.transaction(async (t) => {
      if (dto.type !== undefined)
        transactionRecord.type = dto.type as SavingTransactionType;
      if (dto.amount !== undefined) transactionRecord.amount = dto.amount;

      await transactionRecord.save({ transaction: t });

      await this.recalculateSavingGoal(goalId, t);

      return this.toSafeTransaction(transactionRecord);
    });
  }

  async findAllByGoal(
    goalId: string,
    userId: string,
    query: QuerySavingTransactionDto,
  ): Promise<{
    transactions: ISavingTransaction[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  }> {
    await this.savingGoalService.findGoalOrFail(goalId, userId);

    const queryResult = QueryHelper.build(
      query,
      SAVING_TRANSACTION_QUERY_FIELDS,
    );

    queryResult.where = {
      ...queryResult.where,
      savingGoalId: goalId,
    };

    const { count, rows } = await this.savingTransactionModel.findAndCountAll({
      where: queryResult.where,
      order: queryResult.order,
      offset: queryResult.offset,
      limit: queryResult.limit,
    });

    return {
      transactions: rows.map((transaction) =>
        this.toSafeTransaction(transaction),
      ),

      pagination: {
        total: count,
        page: queryResult.page,
        limit: queryResult.limit,
        totalPages: Math.ceil(count / queryResult.limit),
        hasNext: queryResult.page < Math.ceil(count / queryResult.limit),
        hasPrevious: queryResult.page > 1,
      },
    };
  }

  async findOne(id: string, userId: string): Promise<ISavingTransaction> {
    const transaction = await this.savingTransactionModel.findByPk(id);

    if (!transaction) {
      throw new NotFoundException({
        success: false,
        message: `Saving transaction with id "${id}" not found`,
        errors: [],
      });
    }

    if (transaction.userId !== userId) {
      throw new ForbiddenException({
        success: false,
        message: 'You do not have permission to access this transaction',
        errors: [],
      });
    }

    return this.toSafeTransaction(transaction);
  }

  async remove(id: string, userId: string): Promise<void> {
    const transaction = await this.savingTransactionModel.findByPk(id);

    if (!transaction) {
      throw new NotFoundException({
        success: false,
        message: `Saving transaction not found`,
        errors: [],
      });
    }

    if (transaction.userId !== userId) {
      throw new ForbiddenException({
        success: false,
        message: 'You do not have permission to delete this transaction',
        errors: [],
      });
    }

    const goalId = transaction.savingGoalId;

    await this.sequelize.transaction(async (t) => {
      await transaction.destroy({ transaction: t });

      await this.recalculateSavingGoal(goalId, t);
    });
  }

  private async recalculateSavingGoal(
    goalId: string,
    transaction: Transaction,
  ): Promise<void> {
    const contributionResult = (await this.savingTransactionModel.findOne({
      attributes: [
        [fn('COALESCE', fn('SUM', col('amount')), literal('0')), 'total'],
      ],
      where: {
        savingGoalId: goalId,
        type: SavingTransactionType.CONTRIBUTION,
      },
      raw: true,
      transaction,
    })) as unknown as { total: string };

    const withdrawalResult = (await this.savingTransactionModel.findOne({
      attributes: [
        [fn('COALESCE', fn('SUM', col('amount')), literal('0')), 'total'],
      ],
      where: {
        savingGoalId: goalId,
        type: SavingTransactionType.WITHDRAWAL,
      },
      raw: true,
      transaction,
    })) as unknown as { total: string };

    const totalContributions = parseFloat(contributionResult?.total ?? '0');
    const totalWithdrawals = parseFloat(withdrawalResult?.total ?? '0');

    await this.savingGoalService.recalculateGoal(
      goalId,
      totalContributions,
      totalWithdrawals,
      transaction,
    );
  }

  toSafeTransaction(transaction: SavingTransaction): ISavingTransaction {
    return {
      id: transaction.id,
      savingGoalId: transaction.savingGoalId,
      userId: transaction.userId,
      type: transaction.type,
      amount: Number(transaction.amount),
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      deletedAt: transaction.deletedAt,
    };
  }
}
