import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize, Transaction as SequelizeTransaction } from 'sequelize';
import { TransactionRepository } from '../repositories/transaction.repository';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { TransactionType } from '../enums/transaction-type.enum';
import { WalletRepository } from '../../wallets/repositories/wallet.repository';
import { CategoriesRepository } from '../../categories/repositories/categories.repository';
import { SavingGoalService } from '../../saving-goals/services/saving-goal.service';
import { CategoryTransactionType } from '../../categories/enums/category-transaction-type.enum';
import { SavingGoalStatus } from '../../saving-goals/enums/saving-goal-status.enum';
import { QueryTransactionDto } from '../dto/query-transaction.dto';
import { QueryHelper } from '../../../common/helpers/query.helper';
import { TRANSACTION_QUERY_FIELDS } from '../constants/transaction-query-fields';

@Injectable()
export class TransactionService {
  constructor(
    @InjectConnection()
    private readonly sequelize: Sequelize,
    private readonly transactionRepository: TransactionRepository,
    private readonly walletRepository: WalletRepository,
    private readonly categoriesRepository: CategoriesRepository,
    private readonly savingGoalService: SavingGoalService,
  ) {}

  async create(userId: string, dto: CreateTransactionDto) {
    // We execute the entire financial operation inside a PostgreSQL transaction.
    return this.sequelize.transaction(async (t: SequelizeTransaction) => {
      // 1. Validate and lock the wallet
      const wallet = await this.walletRepository.findByUserIdForUpdate(
        userId,
        t,
      );
      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }
      if (wallet.id !== dto.wallet_id) {
        throw new ForbiddenException('Wallet does not belong to current user');
      }

      let newCurrentBalance = Number(wallet.currentBalance);
      let newBlockedAmount = Number(wallet.blockedAmount);
      const availableBalance = newCurrentBalance - newBlockedAmount;

      // 2. Process based on transaction type
      switch (dto.type) {
        case TransactionType.INCOME: {
          // Validate category
          if (!dto.category_id)
            throw new BadRequestException('Category required for INCOME');
          const category = await this.categoriesRepository.findOneById(
            dto.category_id,
          );
          if (!category) throw new NotFoundException('Category not found');
          if (!category.is_active)
            throw new BadRequestException('Category is inactive');
          if (category.created_by && category.created_by !== userId) {
            throw new ForbiddenException(
              'Category does not belong to current user',
            );
          }
          if (category.type !== CategoryTransactionType.INCOME) {
            throw new BadRequestException(
              'Category type does not match transaction type',
            );
          }

          newCurrentBalance += dto.amount;
          break;
        }

        case TransactionType.EXPENSE: {
          // Validate category
          if (!dto.category_id)
            throw new BadRequestException('Category required for EXPENSE');
          const category = await this.categoriesRepository.findOneById(
            dto.category_id,
          );
          if (!category) throw new NotFoundException('Category not found');
          if (!category.is_active)
            throw new BadRequestException('Category is inactive');
          if (category.created_by && category.created_by !== userId) {
            throw new ForbiddenException(
              'Category does not belong to current user',
            );
          }
          if (category.type !== CategoryTransactionType.EXPENSE) {
            throw new BadRequestException(
              'Category type does not match transaction type',
            );
          }

          if (availableBalance < dto.amount) {
            throw new BadRequestException('Insufficient available balance');
          }

          newCurrentBalance -= dto.amount;
          break;
        }

        case TransactionType.TRANSFER_TO_SAVING: {
          if (!dto.saving_goal_id)
            throw new BadRequestException(
              'Saving goal required for TRANSFER_TO_SAVING',
            );
          const goal = await this.savingGoalService.findGoalOrFail(
            dto.saving_goal_id,
            userId,
          );
          if (goal.status === SavingGoalStatus.COMPLETED) {
            throw new BadRequestException(
              'Cannot transfer to a completed saving goal',
            );
          }

          if (availableBalance < dto.amount) {
            throw new BadRequestException('Insufficient available balance');
          }

          // Update Wallet
          newBlockedAmount += dto.amount;

          // Update Saving Goal
          const newSavedAmount = Number(goal.savedAmount) + dto.amount;
          const targetAmount = Number(goal.targetAmount);
          const remainingAmount = Math.max(0, targetAmount - newSavedAmount);
          const isCompleted = newSavedAmount >= targetAmount;

          const goalUpdateData: Record<string, any> = {
            savedAmount: newSavedAmount,
            remainingAmount,
            isCompleted,
          };

          if (isCompleted) {
            goalUpdateData.status = SavingGoalStatus.COMPLETED;
            if (!goal.completedAt) goalUpdateData.completedAt = new Date();
          }

          await goal.update(goalUpdateData, { transaction: t });
          break;
        }

        case TransactionType.TRANSFER_FROM_SAVING: {
          if (!dto.saving_goal_id)
            throw new BadRequestException(
              'Saving goal required for TRANSFER_FROM_SAVING',
            );
          const goal = await this.savingGoalService.findGoalOrFail(
            dto.saving_goal_id,
            userId,
          );

          if (Number(goal.savedAmount) < dto.amount) {
            throw new BadRequestException('Insufficient saved amount');
          }
          if (newBlockedAmount < dto.amount) {
            throw new BadRequestException(
              'Insufficient blocked amount in wallet',
            );
          }

          // Update Wallet
          newBlockedAmount -= dto.amount;

          // Update Saving Goal
          const newSavedAmount = Number(goal.savedAmount) - dto.amount;
          const targetAmount = Number(goal.targetAmount);
          const remainingAmount = Math.max(0, targetAmount - newSavedAmount);

          const goalUpdateData: Record<string, any> = {
            savedAmount: newSavedAmount,
            remainingAmount,
            isCompleted: false, // Since we withdrew, it can't be newly completed
          };

          if (
            goal.status === SavingGoalStatus.COMPLETED &&
            newSavedAmount < targetAmount
          ) {
            goalUpdateData.status = SavingGoalStatus.ACTIVE;
            goalUpdateData.completedAt = null;
          }

          await goal.update(goalUpdateData, { transaction: t });
          break;
        }

        case TransactionType.OPENING_BALANCE: {
          throw new BadRequestException(
            'Opening balance transactions are no longer supported',
          );
        }

        default:
          throw new BadRequestException('Invalid transaction type');
      }

      // 3. Persist Wallet Updates
      await this.walletRepository.update(
        wallet.id,
        {
          currentBalance: newCurrentBalance,
          blockedAmount: newBlockedAmount,
        } as Record<string, any>,
        t,
      );

      // 4. Create Transaction Record
      const transaction = await this.transactionRepository.create(
        userId,
        dto,
        t,
      );

      return transaction;
    });
  }

  async findAll(userId: string, query: QueryTransactionDto) {
    const queryResult = QueryHelper.build(query, TRANSACTION_QUERY_FIELDS);

    const { count, rows } = await this.transactionRepository.findAllPaginated(
      userId,
      queryResult,
      query,
    );

    const mappedTransactions = rows.map((tx) => {
      const currentBalance = tx.wallet?.currentBalance ?? 0;
      const blockedAmount = tx.wallet?.blockedAmount ?? 0;

      return {
        amount: Number(tx.amount),
        type: tx.type,
        categoryName: tx.category?.name || 'N/A',
        currentBalance: Number(currentBalance),
        blockedAmount: Number(blockedAmount),
        availableBalance: Number(currentBalance) - Number(blockedAmount),
        savingGoalTitle: tx.savingGoal?.title || 'N/A',
        transactionDate: tx.transactionDate,
        paymentMethod: tx.paymentMethod || 'N/A',
        note: tx.note || 'N/A',
      };
    });

    const totalPages = Math.ceil(count / queryResult.limit);

    return {
      transactions: mappedTransactions,
      pagination: {
        total: count,
        page: queryResult.page,
        limit: queryResult.limit,
        totalPages,
        hasNext: queryResult.page < totalPages,
        hasPrevious: queryResult.page > 1,
      },
    };
  }

  async findOne(id: string, userId: string) {
    const transaction = await this.transactionRepository.findOneByIdAndUserId(
      id,
      userId,
    );
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }
}
