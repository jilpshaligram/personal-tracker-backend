import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import {
  Op,
  Sequelize,
  Transaction as SequelizeTransaction,
  WhereOptions,
} from 'sequelize';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';
import { TransactionType } from '../enums/transaction-type.enum';
import { WalletService } from '../../wallets/services/wallet.service';
import { CategoriesService } from '../../categories/services/categories.service';
import { SavingGoalService } from '../../saving-goals/services/saving-goal.service';
import { CategoryTransactionType } from '../../categories/enums/category-transaction-type.enum';
import { SavingGoalStatus } from '../../saving-goals/enums/saving-goal-status.enum';
import { SavingGoal } from '../../saving-goals/schemas/saving-goal.schema';
import { QueryTransactionDto } from '../dto/query-transaction.dto';
import { QueryHelper } from '../../../common/helpers/query.helper';
import { TRANSACTION_QUERY_FIELDS } from '../constants/transaction-query-fields';
import { NotificationService } from '../../notifications/services/notification.service';
import { Transaction } from '../schemas/transaction.schema';
import { PaymentMethod } from '../enums/payment-method.enum';
import { Category } from '../../categories/schemas/category.schema';
import { Wallet } from '../../wallets/schemas/wallet.schema';
import { ITransaction } from '../interfaces/transaction.interface';
import { ICategory } from '../../categories/interfaces/category.interface';
import { QueryResult } from '../../../common/interfaces/query-result.interface';

@Injectable()
export class TransactionService {
  constructor(
    @InjectConnection()
    private readonly sequelize: Sequelize,
    @InjectModel(Transaction)
    private readonly transactionModel: typeof Transaction,
    private readonly walletService: WalletService,
    private readonly categoriesService: CategoriesService,
    private readonly savingGoalService: SavingGoalService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(userId: string, dto: CreateTransactionDto) {
    // We execute the entire financial operation inside a PostgreSQL transaction.
    return this.sequelize.transaction(async (t: SequelizeTransaction) => {
      // 1. Validate and lock the wallet
      const wallet = await this.walletService.findByUserIdForUpdate(userId, t);
      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }
      if (wallet.id !== dto.wallet_id) {
        throw new ForbiddenException('Wallet not found');
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
          const category = await this.categoriesService.findOneById(
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
          const category = await this.categoriesService.findOneById(
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
            t, // Pass transaction for row-level locking
          );
          if (
            goal.status === SavingGoalStatus.COMPLETED ||
            Number(goal.savedAmount) >= Number(goal.targetAmount)
          ) {
            throw new BadRequestException(
              'Saving goal has already reached its target amount.',
            );
          }

          const targetAmount = Number(goal.targetAmount);
          const currentSavedAmount = Number(goal.savedAmount);
          const remainingTarget = Math.max(
            0,
            targetAmount - currentSavedAmount,
          );

          const actualDeposit = Math.min(dto.amount, remainingTarget);

          if (actualDeposit <= 0) {
            throw new BadRequestException(
              'Deposit amount must be greater than zero and saving goal must not be full.',
            );
          }

          if (availableBalance < actualDeposit) {
            throw new BadRequestException('Insufficient available balance');
          }

          // Update Wallet with actualDeposit
          newBlockedAmount += actualDeposit;

          // Update Saving Goal
          const newSavedAmount = currentSavedAmount + actualDeposit;
          const remainingAmount = Math.max(0, targetAmount - newSavedAmount);
          const isCompleted = newSavedAmount >= targetAmount;

          const goalUpdateData: Record<string, any> = {
            savedAmount: newSavedAmount,
            remainingAmount,
            isCompleted,
          };

          if (isCompleted) {
            goalUpdateData.status = SavingGoalStatus.COMPLETED;
            if (!goal.completedAt) {
              goalUpdateData.completedAt = new Date();

              // Trigger instant notification
              await this.notificationService.createAndPush({
                userId: goal.userId,
                type: 'SAVING_GOAL_COMPLETED',
                title: 'Saving Goal Completed! 🎉',
                message: `Congratulations! You have successfully reached your saving goal "${goal.title}" (₹${targetAmount}).`,
                referenceId: goal.id,
                referenceType: 'SAVING_GOAL',
              });
            }
          }

          await goal.update(goalUpdateData, { transaction: t });

          // Modify dto.amount so the final created transaction reflects only actualDeposit
          dto.amount = actualDeposit;
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
            t, // Pass transaction for row-level locking
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
      await wallet.update(
        {
          currentBalance: newCurrentBalance,
          blockedAmount: newBlockedAmount,
        },
        { transaction: t },
      );

      // 4. Create Transaction Record
      const transaction = await this.transactionModel.create(
        {
          userId,
          walletId: dto.wallet_id,
          categoryId: dto.category_id || null,
          savingGoalId: dto.saving_goal_id || null,
          type: dto.type,
          amount: dto.amount,
          paymentMethod: dto.payment_method || PaymentMethod.CASH,
          note: dto.note || null,
          transactionDate: new Date(dto.transaction_date),
        },
        { transaction: t },
      );

      return transaction;
    });
  }

  async findAll(userId: string, query: QueryTransactionDto) {
    const queryResult = QueryHelper.build(query, TRANSACTION_QUERY_FIELDS);

    const { count, rows } = await this.findAllPaginated(
      userId,
      queryResult,
      query,
    );

    const mappedTransactions = rows.map((tx) => {
      const currentBalance = tx.wallet?.currentBalance ?? 0;
      const blockedAmount = tx.wallet?.blockedAmount ?? 0;

      return {
        id: tx.id,
        amount: Number(tx.amount),
        type: tx.type,
        categoryName: tx.category?.name || 'N/A',
        currentBalance: Number(currentBalance),
        blockedAmount: Number(blockedAmount),
        availableBalance: Number((currentBalance - blockedAmount).toFixed(2)),
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
    const transaction = await this.transactionModel.findOne({
      where: { id, userId },
    });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }

  async update(id: string, userId: string, dto: UpdateTransactionDto) {
    return this.sequelize.transaction(async (t: SequelizeTransaction) => {
      const oldTx = await this.transactionModel.findOne({
        where: { id, userId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!oldTx) throw new NotFoundException('Transaction not found');

      const wallet = await this.walletService.findByUserIdForUpdate(userId, t);
      if (!wallet) throw new NotFoundException('Wallet not found');

      if (dto.wallet_id && wallet.id !== dto.wallet_id) {
        throw new ForbiddenException('Wallet not found');
      }

      const newType = dto.type ?? oldTx.type;
      const newAmount =
        dto.amount !== undefined ? dto.amount : Number(oldTx.amount);
      const newCategoryId =
        dto.category_id !== undefined ? dto.category_id : oldTx.categoryId;
      const newSavingGoalId =
        dto.saving_goal_id !== undefined
          ? dto.saving_goal_id
          : oldTx.savingGoalId;

      if (
        newType === TransactionType.INCOME ||
        newType === TransactionType.EXPENSE
      ) {
        if (!newCategoryId)
          throw new BadRequestException(
            'category_id is required for INCOME and EXPENSE transactions',
          );
        if (newSavingGoalId)
          throw new BadRequestException(
            'saving_goal_id should not be provided for INCOME or EXPENSE transactions',
          );
      } else if (
        newType === TransactionType.TRANSFER_TO_SAVING ||
        newType === TransactionType.TRANSFER_FROM_SAVING
      ) {
        if (!newSavingGoalId)
          throw new BadRequestException(
            'saving_goal_id is required for TRANSFER transactions',
          );
        if (newCategoryId)
          throw new BadRequestException(
            'category_id should not be provided for TRANSFER transactions',
          );
      } else if (newType === TransactionType.OPENING_BALANCE) {
        throw new BadRequestException(
          'Opening balance transactions are no longer supported',
        );
      }

      if (newCategoryId) {
        const category =
          await this.categoriesService.findOneById(newCategoryId);
        if (!category) throw new NotFoundException('Category not found');
        if (!category.is_active)
          throw new BadRequestException('Category is inactive');
        if (category.created_by && category.created_by !== userId) {
          throw new ForbiddenException(
            'Category does not belong to current user',
          );
        }
        const expectedCatType =
          newType === TransactionType.INCOME
            ? CategoryTransactionType.INCOME
            : CategoryTransactionType.EXPENSE;
        if (category.type !== expectedCatType) {
          throw new BadRequestException(
            'Category type does not match transaction type',
          );
        }
      }

      const goalIdsToLock = new Set<string>();
      if (oldTx.savingGoalId) goalIdsToLock.add(oldTx.savingGoalId);
      if (newSavingGoalId) goalIdsToLock.add(newSavingGoalId);

      const sortedGoalIds = Array.from(goalIdsToLock).sort();
      const lockedGoals = new Map<string, SavingGoal>();
      for (const gId of sortedGoalIds) {
        const goal = await this.savingGoalService.findGoalOrFail(
          gId,
          userId,
          t,
        );
        lockedGoals.set(gId, goal);
      }

      const oldGoal = oldTx.savingGoalId
        ? lockedGoals.get(oldTx.savingGoalId)
        : null;
      const newGoal = newSavingGoalId ? lockedGoals.get(newSavingGoalId) : null;

      let newCurrentBalance = Number(wallet.currentBalance);
      let newBlockedAmount = Number(wallet.blockedAmount);

      switch (oldTx.type) {
        case TransactionType.INCOME:
          newCurrentBalance -= Number(oldTx.amount);
          break;
        case TransactionType.EXPENSE:
          newCurrentBalance += Number(oldTx.amount);
          break;
        case TransactionType.TRANSFER_TO_SAVING: {
          newBlockedAmount -= Number(oldTx.amount);
          if (oldGoal) {
            const revertedSavedAmount =
              Number(oldGoal.savedAmount) - Number(oldTx.amount);
            const revertedRemaining = Math.max(
              0,
              Number(oldGoal.targetAmount) - revertedSavedAmount,
            );
            await oldGoal.update(
              {
                savedAmount: revertedSavedAmount,
                remainingAmount: revertedRemaining,
                status: SavingGoalStatus.ACTIVE,
                isCompleted: false,
                completedAt: null,
              },
              { transaction: t },
            );
          }
          break;
        }
        case TransactionType.TRANSFER_FROM_SAVING: {
          newBlockedAmount += Number(oldTx.amount);
          if (oldGoal) {
            const revertedSavedAmount =
              Number(oldGoal.savedAmount) + Number(oldTx.amount);
            const revertedRemaining = Math.max(
              0,
              Number(oldGoal.targetAmount) - revertedSavedAmount,
            );
            const isCompleted =
              revertedSavedAmount >= Number(oldGoal.targetAmount);
            await oldGoal.update(
              {
                savedAmount: revertedSavedAmount,
                remainingAmount: revertedRemaining,
                isCompleted,
                ...(isCompleted
                  ? {
                      status: SavingGoalStatus.COMPLETED,
                      completedAt: oldGoal.completedAt || new Date(),
                    }
                  : {}),
              },
              { transaction: t },
            );
          }
          break;
        }
      }

      if (newGoal && oldGoal && newGoal.id === oldGoal.id) {
        await newGoal.reload({ transaction: t });
      }

      const availableBalance = newCurrentBalance - newBlockedAmount;
      let finalNewAmount = newAmount;

      switch (newType) {
        case TransactionType.INCOME:
          newCurrentBalance += newAmount;
          break;
        case TransactionType.EXPENSE:
          if (availableBalance < newAmount) {
            throw new BadRequestException('Insufficient available balance');
          }
          newCurrentBalance -= newAmount;
          break;
        case TransactionType.TRANSFER_TO_SAVING: {
          if (!newGoal) {
            throw new BadRequestException('Saving goal is missing');
          }
          if (
            newGoal.status === SavingGoalStatus.COMPLETED ||
            Number(newGoal.savedAmount) >= Number(newGoal.targetAmount)
          ) {
            throw new BadRequestException(
              'Saving goal has already reached its target amount.',
            );
          }
          const targetAmount = Number(newGoal.targetAmount);
          const currentSavedAmount = Number(newGoal.savedAmount);
          const remainingTarget = Math.max(
            0,
            targetAmount - currentSavedAmount,
          );

          const actualDeposit = Math.min(newAmount, remainingTarget);

          if (actualDeposit <= 0) {
            throw new BadRequestException(
              'Deposit amount must be greater than zero and saving goal must not be full.',
            );
          }

          if (availableBalance < actualDeposit) {
            throw new BadRequestException('Insufficient available balance');
          }

          newBlockedAmount += actualDeposit;
          finalNewAmount = actualDeposit;

          const appliedSavedAmount = currentSavedAmount + actualDeposit;
          const appliedRemainingAmount = Math.max(
            0,
            targetAmount - appliedSavedAmount,
          );
          const isCompleted = appliedSavedAmount >= targetAmount;

          await newGoal.update(
            {
              savedAmount: appliedSavedAmount,
              remainingAmount: appliedRemainingAmount,
              isCompleted,
              ...(isCompleted
                ? {
                    status: SavingGoalStatus.COMPLETED,
                    completedAt: newGoal.completedAt || new Date(),
                  }
                : {}),
            },
            { transaction: t },
          );
          break;
        }

        case TransactionType.TRANSFER_FROM_SAVING: {
          if (!newGoal) {
            throw new BadRequestException('Saving goal is missing');
          }
          if (Number(newGoal.savedAmount) < newAmount) {
            throw new BadRequestException('Insufficient saved amount');
          }
          if (newBlockedAmount < newAmount) {
            throw new BadRequestException(
              'Insufficient blocked amount in wallet',
            );
          }

          newBlockedAmount -= newAmount;

          const withdrawnSavedAmount = Number(newGoal.savedAmount) - newAmount;
          const withdrawnRemaining = Math.max(
            0,
            Number(newGoal.targetAmount) - withdrawnSavedAmount,
          );

          await newGoal.update(
            {
              savedAmount: withdrawnSavedAmount,
              remainingAmount: withdrawnRemaining,
              isCompleted: false,
              ...(newGoal.status === SavingGoalStatus.COMPLETED &&
              withdrawnSavedAmount < Number(newGoal.targetAmount)
                ? { status: SavingGoalStatus.ACTIVE, completedAt: null }
                : {}),
            },
            { transaction: t },
          );
          break;
        }
      }

      await wallet.update(
        {
          currentBalance: newCurrentBalance,
          blockedAmount: newBlockedAmount,
        },
        { transaction: t },
      );

      const updateData: {
        walletId?: string;
        categoryId?: string | null;
        savingGoalId?: string | null;
        type?: TransactionType;
        amount?: number;
        paymentMethod?: any;
        note?: string | null;
        transactionDate?: Date;
      } = {};
      if (dto.wallet_id !== undefined) updateData.walletId = dto.wallet_id;
      if (dto.category_id !== undefined)
        updateData.categoryId = dto.category_id;
      if (dto.saving_goal_id !== undefined)
        updateData.savingGoalId = dto.saving_goal_id;
      if (dto.type !== undefined) updateData.type = dto.type;
      updateData.amount = finalNewAmount;
      if (dto.payment_method !== undefined)
        updateData.paymentMethod = dto.payment_method;
      if (dto.note !== undefined) updateData.note = dto.note;
      if (dto.transaction_date !== undefined)
        updateData.transactionDate = new Date(dto.transaction_date);

      await oldTx.update(updateData as any, { transaction: t });
      return oldTx;
    });
  }

  async remove(id: string, userId: string) {
    return this.sequelize.transaction(async (t: SequelizeTransaction) => {
      const transaction = await this.transactionModel.findOne({
        where: { id, userId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!transaction) throw new NotFoundException('Transaction not found');

      const wallet = await this.walletService.findByUserIdForUpdate(userId, t);
      if (!wallet) throw new NotFoundException('Wallet not found');

      let newCurrentBalance = Number(wallet.currentBalance);
      let newBlockedAmount = Number(wallet.blockedAmount);

      switch (transaction.type) {
        case TransactionType.INCOME:
          newCurrentBalance -= Number(transaction.amount);
          break;
        case TransactionType.EXPENSE:
          newCurrentBalance += Number(transaction.amount);
          break;
        case TransactionType.TRANSFER_TO_SAVING: {
          newBlockedAmount -= Number(transaction.amount);
          if (transaction.savingGoalId) {
            const goal = await this.savingGoalService.findGoalOrFail(
              transaction.savingGoalId,
              userId,
              t,
            );
            const newSavedAmount =
              Number(goal.savedAmount) - Number(transaction.amount);
            const remainingAmount = Math.max(
              0,
              Number(goal.targetAmount) - newSavedAmount,
            );
            await goal.update(
              {
                savedAmount: newSavedAmount,
                remainingAmount,
                status: SavingGoalStatus.ACTIVE,
                isCompleted: false,
                completedAt: null,
              },
              { transaction: t },
            );
          }
          break;
        }
        case TransactionType.TRANSFER_FROM_SAVING: {
          newBlockedAmount += Number(transaction.amount);
          if (transaction.savingGoalId) {
            const goal = await this.savingGoalService.findGoalOrFail(
              transaction.savingGoalId,
              userId,
              t,
            );
            const newSavedAmount =
              Number(goal.savedAmount) + Number(transaction.amount);
            const remainingAmount = Math.max(
              0,
              Number(goal.targetAmount) - newSavedAmount,
            );
            const isCompleted = newSavedAmount >= Number(goal.targetAmount);
            await goal.update(
              {
                savedAmount: newSavedAmount,
                remainingAmount,
                isCompleted,
                ...(isCompleted
                  ? {
                      status: SavingGoalStatus.COMPLETED,
                      completedAt: goal.completedAt || new Date(),
                    }
                  : {}),
              },
              { transaction: t },
            );
          }
          break;
        }
      }

      await wallet.update(
        {
          currentBalance: newCurrentBalance,
          blockedAmount: newBlockedAmount,
        },
        { transaction: t },
      );

      await transaction.destroy({ transaction: t });
      return { success: true, message: 'Transaction deleted successfully' };
    });
  }

  // --------------------------------------------------------------------------
  // INTERNAL HELPERS
  // --------------------------------------------------------------------------

  private async findAllPaginated(
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
      const whereWithAnd = where as Record<symbol, unknown[]>;
      if (Array.isArray(whereWithAnd[Op.and])) {
        whereWithAnd[Op.and] = [...whereWithAnd[Op.and], ...dateConditions];
      } else {
        whereWithAnd[Op.and] = dateConditions;
      }
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
}
