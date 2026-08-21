import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import { Transaction } from '@/modules/transactions/transaction.schema';
import { Budget } from '@/modules/budgets/budget.schema';
import { Document } from '@/modules/documents/document.model';
import { DocumentCategory } from '@/modules/document-category/document-category.model';

import { BudgetPeriod } from '@/modules/budgets/enums/budget-period.enum';
import { TransactionType } from '@/modules/transactions/enums/transaction-type.enum';
import { PaymentMethod } from '@/modules/transactions/enums/payment-method.enum';
import { SavingGoalStatus } from '@/modules/saving-goals/enums/saving-goal-status.enum';

import { BillService } from '@/modules/bills/bill.service';
import { SavingGoalService } from '@/modules/saving-goals/saving-goal.service';
import { WalletRepository } from '@/modules/wallets/wallet.repository';

import { calculateBudgetPeriodDates } from '@/common/utils/date.utils';

import {
  IDashboardResponse,
  IDashboardBudget,
  IDashboardSavingGoal,
  IDashboardUpcomingBill,
  IDashboardExpenseBreakdownItem,
  IDashboardChartPoint,
  IDashboardDocumentAlert,
  IDashboardRecentTransaction,
} from '@/modules/dashboard/interfaces/dashboard-response.interface';

const UPCOMING_BILLS_DAYS = 30;
const RECENT_TRANSACTIONS_LIMIT = 10;

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectModel(Transaction)
    private readonly transactionModel: typeof Transaction,

    @InjectModel(Budget)
    private readonly budgetModel: typeof Budget,

    @InjectModel(Document)
    private readonly documentModel: typeof Document,

    @InjectConnection()
    private readonly sequelize: Sequelize,

    private readonly billService: BillService,
    private readonly savingGoalService: SavingGoalService,
    private readonly walletRepository: WalletRepository,
  ) {}

  async getDashboard(
    userId: string,
    period: BudgetPeriod,
  ): Promise<IDashboardResponse> {
    try {
      const normalizedPeriod = period.toUpperCase() as BudgetPeriod;
      const { startDate, endDate } =
        calculateBudgetPeriodDates(normalizedPeriod);

      const today = new Date().toISOString().split('T')[0];

      const [
        totalIncome,
        totalExpense,
        wallet,
        activeBudget,
        expenseBreakdown,
        incomeVsExpense,
        upcomingBillsResult,
        savingGoals,
        documentAlerts,
        recentTransactions,
      ] = await Promise.all([
        this.getTotalIncome(userId, startDate, endDate),

        this.getTotalExpense(userId, startDate, endDate),

        this.walletRepository.findByUserId(userId),

        this.findActiveBudgetForPeriod(userId, normalizedPeriod, today),

        this.getExpenseBreakdown(userId, startDate, endDate),

        this.getIncomeVsExpense(userId, normalizedPeriod, startDate, endDate),

        this.billService.findUpcoming(userId, UPCOMING_BILLS_DAYS, 1, 50),

        this.savingGoalService.findAll(userId),

        this.getDocumentAlerts(userId),

        this.getRecentTransactions(userId, RECENT_TRANSACTIONS_LIMIT),
      ]);

      const currentBalance = wallet ? Number(wallet.currentBalance) : 0;

      const totalSavings = savingGoals
        .filter((goal) => goal.status === SavingGoalStatus.ACTIVE)
        .reduce((sum, goal) => sum + Number(goal.savedAmount), 0);

      const summary = {
        income: parseFloat(totalIncome.toFixed(2)),
        expense: parseFloat(totalExpense.toFixed(2)),
        savings: parseFloat(totalSavings.toFixed(2)),
        balance: parseFloat(currentBalance.toFixed(2)),
      };

      let budgetOverview: IDashboardBudget | null = null;

      if (activeBudget) {
        const budgetAmount = Number(activeBudget.amount);

        const spent = await this.getExpenseInDateRange(
          userId,
          activeBudget.startDate,
          activeBudget.endDate,
        );

        const remaining = Math.max(0, budgetAmount - spent);

        const percentageUsed =
          budgetAmount > 0
            ? parseFloat(((spent / budgetAmount) * 100).toFixed(2))
            : 0;

        budgetOverview = {
          id: activeBudget.id,
          amount: parseFloat(budgetAmount.toFixed(2)),
          spent: parseFloat(spent.toFixed(2)),
          remaining: parseFloat(remaining.toFixed(2)),
          percentageUsed,
          period: activeBudget.period,
          startDate: activeBudget.startDate,
          endDate: activeBudget.endDate,
        };
      }

      const mappedSavingGoals: IDashboardSavingGoal[] = savingGoals.map(
        (goal) => {
          const target = Number(goal.targetAmount);

          const saved = Number(goal.savedAmount);

          const progressPercent =
            target > 0
              ? parseFloat(Math.min(100, (saved / target) * 100).toFixed(2))
              : 0;

          return {
            id: goal.id,
            title: goal.title,
            targetAmount: parseFloat(target.toFixed(2)),
            savedAmount: parseFloat(saved.toFixed(2)),
            remainingAmount: parseFloat(
              Number(goal.remainingAmount).toFixed(2),
            ),
            progressPercent,
            targetDate: goal.targetDate,
            status: goal.status,
            isCompleted: goal.isCompleted,
          };
        },
      );

      const mappedBills: IDashboardUpcomingBill[] =
        upcomingBillsResult.data.map((bill) => ({
          id: bill.id,
          title: bill.title,
          amount: Number(bill.amount),
          dueDate: bill.dueDate,
          status: bill.status,
          isRecurring: bill.isRecurring,
          categoryId: bill.categoryId,
        }));

      return {
        period,
        dateRange: {
          startDate,
          endDate,
        },
        summary,
        budget: budgetOverview,
        expenseBreakdown,
        incomeVsExpense,
        upcomingBills: mappedBills,
        savingGoals: mappedSavingGoals,
        documentAlerts,
        recentTransactions,
      };
    } catch (error: unknown) {
      this.logger.error(
        '=== DASHBOARD ERROR ===',
        error instanceof Error ? error.message : String(error),
      );

      throw error;
    }
  }

  async getTotalIncome(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<number> {
    const result = await this.sequelize.query<{
      total: string;
    }>(
      `
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM transactions
        WHERE user_id = :userId
          AND type = 'INCOME'
          AND transaction_date BETWEEN :startDate AND :endDate
          AND deleted_at IS NULL
        `,
      {
        replacements: {
          userId,
          startDate,
          endDate,
        },
        type: QueryTypes.SELECT,
      },
    );

    return parseFloat(result[0]?.total ?? '0');
  }

  async getTotalExpense(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<number> {
    const result = await this.sequelize.query<{
      total: string;
    }>(
      `
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM transactions
        WHERE user_id = :userId
          AND type = 'EXPENSE'
          AND transaction_date BETWEEN :startDate AND :endDate
          AND deleted_at IS NULL
        `,
      {
        replacements: {
          userId,
          startDate,
          endDate,
        },
        type: QueryTypes.SELECT,
      },
    );

    return parseFloat(result[0]?.total ?? '0');
  }

  async findActiveBudgetForPeriod(
    userId: string,
    period: BudgetPeriod,
    today: string,
  ): Promise<Budget | null> {
    return this.budgetModel.findOne({
      where: {
        userId,
        period,
        isActive: true,
        startDate: {
          [Op.lte]: today,
        },
        endDate: {
          [Op.gte]: today,
        },
      },
    });
  }

  async getExpenseInDateRange(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<number> {
    return this.getTotalExpense(userId, startDate, endDate);
  }

  async getExpenseBreakdown(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<IDashboardExpenseBreakdownItem[]> {
    const rows = await this.sequelize.query<{
      categoryId: string;
      categoryName: string;
      amount: string;
    }>(
      `
        SELECT
          c.id AS "categoryId",
          c.name AS "categoryName",
          COALESCE(SUM(t.amount), 0) AS amount
        FROM transactions t
        INNER JOIN categories c
          ON t.category_id = c.id
        WHERE t.user_id = :userId
          AND t.type = 'EXPENSE'
          AND t.transaction_date
              BETWEEN :startDate AND :endDate
          AND t.deleted_at IS NULL
          AND c.deleted_at IS NULL
        GROUP BY c.id, c.name
        ORDER BY SUM(t.amount) DESC
        `,
      {
        replacements: {
          userId,
          startDate,
          endDate,
        },
        type: QueryTypes.SELECT,
      },
    );

    if (!rows.length) {
      return [];
    }

    const total = rows.reduce(
      (sum, row) => sum + parseFloat(row.amount ?? '0'),
      0,
    );

    return rows.map((row) => {
      const amount = parseFloat(row.amount ?? '0');

      return {
        categoryId: row.categoryId,
        category: row.categoryName,
        amount: parseFloat(amount.toFixed(2)),
        percentage:
          total > 0 ? parseFloat(((amount / total) * 100).toFixed(2)) : 0,
      };
    });
  }

  async getIncomeVsExpense(
    userId: string,
    period: BudgetPeriod,
    startDate: string,
    endDate: string,
  ): Promise<IDashboardChartPoint[]> {
    if (period === BudgetPeriod.DAILY) {
      const [income, expense] = await Promise.all([
        this.getTotalIncome(userId, startDate, endDate),
        this.getTotalExpense(userId, startDate, endDate),
      ]);

      return [
        {
          label: 'Today',
          income,
          expense,
        },
      ];
    }

    let datePartExpr: string;
    let labelMap: (value: number) => string;
    let rangeSize: number;

    switch (period) {
      case BudgetPeriod.WEEKLY:
        datePartExpr = 'ISODOW';

        labelMap = (value) =>
          ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][value - 1] ??
          String(value);

        rangeSize = 7;
        break;

      case BudgetPeriod.MONTHLY:
        datePartExpr = 'DAY';

        labelMap = (value) => String(value);

        rangeSize = 31;
        break;

      case BudgetPeriod.YEARLY:
        datePartExpr = 'MONTH';

        labelMap = (value) =>
          [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
          ][value - 1] ?? String(value);

        rangeSize = 12;
        break;

      default:
        return [];
    }

    const rows = await this.sequelize.query<{
      time_part: string;
      type: string;
      total: string;
    }>(
      `
        SELECT
          EXTRACT(
            ${datePartExpr}
            FROM transaction_date
          )::int AS time_part,
          type,
          COALESCE(SUM(amount), 0) AS total
        FROM transactions
        WHERE user_id = :userId
          AND type IN ('INCOME', 'EXPENSE')
          AND transaction_date
              BETWEEN :startDate AND :endDate
          AND deleted_at IS NULL
        GROUP BY
          EXTRACT(
            ${datePartExpr}
            FROM transaction_date
          )::int,
          type
        ORDER BY time_part ASC
        `,
      {
        replacements: {
          userId,
          startDate,
          endDate,
        },
        type: QueryTypes.SELECT,
      },
    );

    const dataMap = new Map<
      number,
      {
        income: number;
        expense: number;
      }
    >();

    for (let i = 1; i <= rangeSize; i++) {
      dataMap.set(i, {
        income: 0,
        expense: 0,
      });
    }

    for (const row of rows) {
      const part = Number(row.time_part);

      const total = parseFloat(row.total ?? '0');

      const existing = dataMap.get(part) ?? {
        income: 0,
        expense: 0,
      };

      if (row.type === 'INCOME') {
        dataMap.set(part, {
          ...existing,
          income: total,
        });
      } else {
        dataMap.set(part, {
          ...existing,
          expense: total,
        });
      }
    }

    const result: IDashboardChartPoint[] = [];

    for (const [part, values] of dataMap.entries()) {
      result.push({
        label: labelMap(part),
        income: parseFloat(values.income.toFixed(2)),
        expense: parseFloat(values.expense.toFixed(2)),
      });
    }

    if (period === BudgetPeriod.MONTHLY) {
      const endDateObj = new Date(endDate);

      const daysInMonth = new Date(
        endDateObj.getFullYear(),
        endDateObj.getMonth() + 1,
        0,
      ).getDate();

      return result.slice(0, daysInMonth);
    }

    return result;
  }

  async getDocumentAlerts(userId: string): Promise<IDashboardDocumentAlert[]> {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const docs = await this.documentModel.findAll({
      where: {
        userId,
        expiryDate: {
          [Op.ne]: null,
        },
      },

      include: [
        {
          model: DocumentCategory,
          attributes: ['name'],
        },
      ],

      order: [['expiryDate', 'ASC']],
    });

    const todayTime = today.getTime();

    return docs
      .map((doc) => {
        if (!doc.expiryDate) {
          return null;
        }

        const expiryDate = new Date(doc.expiryDate);

        expiryDate.setHours(0, 0, 0, 0);

        const expiryTime = expiryDate.getTime();

        const reminderDaysBefore = Number(doc.reminderDaysBefore ?? 0);

        const reminderDate = new Date(expiryDate);

        reminderDate.setDate(reminderDate.getDate() - reminderDaysBefore);

        reminderDate.setHours(0, 0, 0, 0);

        const reminderTime = reminderDate.getTime();

        const shouldShowAlert =
          todayTime >= reminderTime && todayTime <= expiryTime;

        if (!shouldShowAlert) {
          return null;
        }

        const daysUntilExpiry = Math.round(
          (expiryTime - todayTime) / (1000 * 60 * 60 * 24),
        );

        return {
          id: doc.id,

          title: doc.title,

          expiryDate: expiryDate.toISOString().split('T')[0],

          reminderDaysBefore,

          reminderDate: reminderDate.toISOString().split('T')[0],

          categoryName:
            (doc.category as DocumentCategory | undefined)?.name ?? 'Unknown',

          daysUntilExpiry,
        };
      })
      .filter((alert): alert is IDashboardDocumentAlert => alert !== null);
  }

  async getRecentTransactions(
    userId: string,
    limit: number = 10,
  ): Promise<IDashboardRecentTransaction[]> {
    const rows = await this.sequelize.query<{
      id: string;
      type: string;
      amount: string;
      transaction_date: string;
      category_name: string | null;
      note: string | null;
      payment_method: string | null;
    }>(
      `
        SELECT
          t.id,
          t.type,
          t.amount,
          t.transaction_date,
          c.name AS category_name,
          t.note,
          t.payment_method
        FROM transactions t
        LEFT JOIN categories c
          ON t.category_id = c.id
          AND c.deleted_at IS NULL
        WHERE t.user_id = :userId
          AND t.deleted_at IS NULL
        ORDER BY
          t.transaction_date DESC,
          t.created_at DESC
        LIMIT :limit
        `,
      {
        replacements: {
          userId,
          limit,
        },
        type: QueryTypes.SELECT,
      },
    );

    return rows.map((row) => ({
      id: row.id,

      type: row.type as TransactionType,

      amount: parseFloat(row.amount ?? '0'),

      transactionDate: row.transaction_date,

      categoryName: row.category_name ?? null,

      note: row.note ?? null,

      paymentMethod: (row.payment_method as PaymentMethod) ?? null,
    }));
  }
}
