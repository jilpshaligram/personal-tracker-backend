import {
  ConflictException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Budget } from '../schemas/budget.schema';
import { CreateBudgetDto } from '../dto/create-budget.dto';
import { UpdateBudgetDto } from '../dto/update-budget.dto';
import { calculateBudgetPeriodDates } from '../../../common/utils/date.utils';

@Injectable()
export class BudgetService {
  constructor(
    @InjectModel(Budget)
    private readonly budgetModel: typeof Budget,
  ) {}

  async create(userId: string, data: CreateBudgetDto) {
    const { startDate, endDate } = calculateBudgetPeriodDates(data.period);

    const isDuplicate = await this.checkDuplicateBudget(
      userId,
      data.period,
      startDate,
      endDate,
    );

    if (isDuplicate) {
      throw new ConflictException(
        'An active budget for this period and date range already exists.',
      );
    }

    try {
      return await this.budgetModel.create({
        ...data,
        startDate,
        endDate,
        userId,
      });
    } catch (error: unknown) {
      throw new InternalServerErrorException('Error creating budget', {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async findAll(userId: string) {
    try {
      return await this.budgetModel.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
      });
    } catch (error: unknown) {
      throw new InternalServerErrorException('Error fetching budgets', {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async findOne(id: string, userId: string) {
    let budget: Budget | null;
    try {
      budget = await this.budgetModel.findOne({
        where: { id, userId },
      });
    } catch (error: unknown) {
      throw new InternalServerErrorException('Error fetching budget', {
        description: error instanceof Error ? error.message : String(error),
      });
    }

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }
    return budget;
  }

  async update(id: string, userId: string, data: UpdateBudgetDto) {
    const budget = await this.findOne(id, userId);

    let startDate = budget.startDate;
    let endDate = budget.endDate;
    const period = data.period ?? budget.period;

    // If period is changed, recalculate dates from the current date
    if (data.period && data.period !== budget.period) {
      const dates = calculateBudgetPeriodDates(data.period);
      startDate = dates.startDate;
      endDate = dates.endDate;
    }

    if (data.period) {
      const isDuplicate = await this.checkDuplicateBudget(
        userId,
        period,
        startDate,
        endDate,
        id,
      );

      if (isDuplicate) {
        throw new ConflictException(
          'An active budget for this period and date range already exists.',
        );
      }
    }

    const updateData: Partial<Budget> = { ...data };
    if (data.period && data.period !== budget.period) {
      updateData.startDate = startDate;
      updateData.endDate = endDate;
    }

    let affectedCount: number;
    let updatedBudgets: Budget[];

    try {
      [affectedCount, updatedBudgets] = await this.budgetModel.update(
        updateData,
        {
          where: { id, userId },
          returning: true,
        },
      );
    } catch (error: unknown) {
      throw new InternalServerErrorException('Error updating budget', {
        description: error instanceof Error ? error.message : String(error),
      });
    }

    if (affectedCount === 0) {
      throw new NotFoundException('Budget not found or could not be updated');
    }

    return updatedBudgets[0];
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId); // Ensure it exists and belongs to user
    try {
      await this.budgetModel.destroy({
        where: { id, userId },
      });
    } catch (error: unknown) {
      throw new InternalServerErrorException('Error deleting budget', {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async getDashboardOverview(userId: string) {
    const allActiveBudgets = await this.findLatestActiveBudgets(userId);

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const validActiveBudgets: typeof allActiveBudgets = [];
    for (const budget of allActiveBudgets) {
      const endDate = new Date(budget.endDate);
      if (endDate < currentDate) {
        await this.update(budget.id, userId, {
          isActive: false,
        } as unknown as UpdateBudgetDto);
      } else {
        validActiveBudgets.push(budget);
      }
    }

    // Keep only the first budget we encounter for each period (since ordered by startDate DESC, it's the latest)
    const latestBudgetsMap = new Map<string, (typeof allActiveBudgets)[0]>();
    for (const budget of validActiveBudgets) {
      if (!latestBudgetsMap.has(budget.period)) {
        latestBudgetsMap.set(budget.period, budget);
      }
    }

    const latestBudgets = Array.from(latestBudgetsMap.values());

    const overviewItems = await Promise.all(
      latestBudgets.map(async (budget) => {
        const spentAmount = await this.getSpentAmountForBudget(
          userId,
          budget.startDate,
          budget.endDate,
        );

        const budgetAmount =
          typeof budget.amount === 'string'
            ? parseFloat(budget.amount)
            : budget.amount;

        const safeBudgetAmount = isNaN(budgetAmount) ? 0 : budgetAmount;

        const remainingAmount = Math.max(safeBudgetAmount - spentAmount, 0);

        let percentageSpent = 0;
        if (safeBudgetAmount > 0) {
          percentageSpent = Number(
            ((spentAmount / safeBudgetAmount) * 100).toFixed(2),
          );
        }

        return {
          budgetId: budget.id,
          period: budget.period,
          budgetAmount: safeBudgetAmount,
          spentAmount,
          remainingAmount,
          percentageSpent,
          startDate: budget.startDate,
          endDate: budget.endDate,
        };
      }),
    );

    return { budgets: overviewItems };
  }

  // --------------------------------------------------------------------------
  // INTERNAL HELPERS
  // --------------------------------------------------------------------------

  private async checkDuplicateBudget(
    userId: string,
    period: string,
    startDate: string,
    endDate: string,
    ignoreId?: string,
  ): Promise<boolean> {
    try {
      const whereClause: Record<symbol | string, any> = {
        userId,
        period,
        startDate,
        endDate,
        isActive: true,
      };

      if (ignoreId) {
        whereClause.id = { [Op.ne]: ignoreId };
      }

      const count = await this.budgetModel.count({ where: whereClause });
      return count > 0;
    } catch (error: unknown) {
      throw new InternalServerErrorException(
        'Error checking for duplicate budget',
        { description: error instanceof Error ? error.message : String(error) },
      );
    }
  }

  private async findLatestActiveBudgets(userId: string): Promise<Budget[]> {
    try {
      return await this.budgetModel.findAll({
        where: { userId, isActive: true },
        order: [['startDate', 'DESC']],
      });
    } catch (error: unknown) {
      throw new InternalServerErrorException('Error fetching latest budgets', {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async getSpentAmountForBudget(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<number> {
    try {
      const result =
        await this.budgetModel.sequelize!.models.Transaction.findAll({
          attributes: [
            [
              this.budgetModel.sequelize!.fn(
                'SUM',
                this.budgetModel.sequelize!.col('amount'),
              ),
              'total',
            ],
          ],
          where: {
            userId,
            type: 'EXPENSE',
            transactionDate: {
              [Op.gte]: startDate,
              [Op.lte]: endDate,
            },
          },
          raw: true,
        });

      const totalSpent = result.length
        ? parseFloat((result[0] as unknown as { total: string }).total)
        : 0;
      return isNaN(totalSpent) ? 0 : totalSpent;
    } catch (error: unknown) {
      throw new InternalServerErrorException(
        'Error fetching spent amount for budget',
        { description: error instanceof Error ? error.message : String(error) },
      );
    }
  }
}
