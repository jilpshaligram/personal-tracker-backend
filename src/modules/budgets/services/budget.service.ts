import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BudgetRepository } from '../repositories/budget.repository';
import { CreateBudgetDto } from '../dto/create-budget.dto';
import { UpdateBudgetDto } from '../dto/update-budget.dto';
import { calculateBudgetPeriodDates } from '../../../common/utils/date.utils';

@Injectable()
export class BudgetService {
  constructor(private readonly budgetRepository: BudgetRepository) {}

  async create(userId: string, data: CreateBudgetDto) {
    const { startDate, endDate } = calculateBudgetPeriodDates(data.period);

    const isDuplicate = await this.budgetRepository.checkDuplicateBudget(
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

    return await this.budgetRepository.create(userId, data, startDate, endDate);
  }

  async findAll(userId: string) {
    return await this.budgetRepository.findAllByUser(userId);
  }

  async findOne(id: string, userId: string) {
    const budget = await this.budgetRepository.findOneByIdAndUser(id, userId);
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
      const isDuplicate = await this.budgetRepository.checkDuplicateBudget(
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

    const [affectedCount, [updatedBudget]] = await this.budgetRepository.update(
      id,
      userId,
      data,
      data.period && data.period !== budget.period ? startDate : undefined,
      data.period && data.period !== budget.period ? endDate : undefined,
    );

    if (affectedCount === 0) {
      throw new NotFoundException('Budget not found or could not be updated');
    }

    return updatedBudget;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId); // Ensure it exists and belongs to user
    await this.budgetRepository.softDelete(id, userId);
  }

  // async getCategoryBreakdown(id: string, userId: string) {
  //   const budget = await this.findOne(id, userId);
  //   const rawBreakdown = await this.budgetRepository.getCategoryBreakdown(
  //     budget,
  //     userId,
  //   );

  //   let spentAmount = 0;
  //   const categories = rawBreakdown.map((item: any) => {
  //     const amount = parseFloat(item.totalAmount) || 0;
  //     spentAmount += amount;

  //     return {
  //       categoryId: item.categoryId,
  //       categoryName: item['category.name'] || 'Unknown Category',
  //       amount: amount,
  //     };
  //   });

  //   return {
  //     budgetAmount:
  //       typeof budget.amount === 'string'
  //         ? parseFloat(budget.amount)
  //         : budget.amount,
  //     spentAmount: spentAmount,
  //     categories,
  //   };
  // }

  async getDashboardOverview(userId: string) {
    const allActiveBudgets =
      await this.budgetRepository.findLatestActiveBudgets(userId);

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const validActiveBudgets: typeof allActiveBudgets = [];
    for (const budget of allActiveBudgets) {
      const endDate = new Date(budget.endDate);
      if (endDate < currentDate) {
        await this.budgetRepository.update(budget.id, userId, {
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
        const spentAmount = await this.budgetRepository.getSpentAmountForBudget(
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
}
