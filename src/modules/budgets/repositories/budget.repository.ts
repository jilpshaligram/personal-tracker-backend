import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Budget } from '../schemas/budget.schema';
import { CreateBudgetDto } from '../dto/create-budget.dto';
import type { UpdateBudgetDto } from '../dto/update-budget.dto';
import { Op } from 'sequelize';

@Injectable()
export class BudgetRepository {
  constructor(
    @InjectModel(Budget)
    private readonly budgetModel: typeof Budget,
  ) {}

  async create(
    userId: string,
    data: CreateBudgetDto,
    startDate: string,
    endDate: string,
  ): Promise<Budget> {
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

  async findAllByUser(userId: string): Promise<Budget[]> {
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

  async findOneByIdAndUser(id: string, userId: string): Promise<Budget | null> {
    try {
      return await this.budgetModel.findOne({
        where: { id, userId },
      });
    } catch (error: unknown) {
      throw new InternalServerErrorException('Error fetching budget', {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async update(
    id: string,
    userId: string,
    data: UpdateBudgetDto,
    startDate?: string,
    endDate?: string,
  ): Promise<[number, Budget[]]> {
    try {
      const updateData: Partial<Budget> = { ...data };
      if (startDate) updateData.startDate = startDate;
      if (endDate) updateData.endDate = endDate;

      return await this.budgetModel.update(updateData, {
        where: { id, userId },
        returning: true,
      });
    } catch (error: unknown) {
      throw new InternalServerErrorException('Error updating budget', {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async softDelete(id: string, userId: string): Promise<number> {
    try {
      return await this.budgetModel.destroy({
        where: { id, userId },
      });
    } catch (error: unknown) {
      throw new InternalServerErrorException('Error deleting budget', {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async checkDuplicateBudget(
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
}
