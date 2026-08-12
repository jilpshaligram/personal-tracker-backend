import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BudgetRepository } from '../repositories/budget.repository';
import { CreateBudgetDto } from '../dto/create-budget.dto';
import { UpdateBudgetDto } from '../dto/update-budget.dto';

@Injectable()
export class BudgetService {
  constructor(private readonly budgetRepository: BudgetRepository) {}

  async create(userId: string, data: CreateBudgetDto) {
    this.validateDates(data.startDate, data.endDate);

    const isDuplicate = await this.budgetRepository.checkDuplicateBudget(
      userId,
      data.period,
      data.startDate,
      data.endDate,
    );

    if (isDuplicate) {
      throw new ConflictException(
        'An active budget for this period and date range already exists.',
      );
    }

    return await this.budgetRepository.create(userId, data);
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

    const startDate = data.startDate ?? budget.startDate;
    const endDate = data.endDate ?? budget.endDate;
    const period = data.period ?? budget.period;

    if (data.startDate || data.endDate) {
      this.validateDates(startDate, endDate);
    }

    if (data.period || data.startDate || data.endDate) {
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

  private validateDates(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      throw new BadRequestException('Start date cannot be after end date.');
    }
  }
}
