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
}
