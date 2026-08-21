import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SavingGoal } from '@/modules/saving-goals/saving-goal.schema';
import { SavingGoalStatus } from '@/modules/saving-goals/enums/saving-goal-status.enum';
import { ISavingGoal } from '@/modules/saving-goals/interfaces/saving-goal.interface';
import { CreateSavingGoalDto } from '@/modules/saving-goals/dto/create-saving-goal.dto';
import { UpdateSavingGoalDto } from '@/modules/saving-goals/dto/update-saving-goal.dto';
import { Transaction, FindOptions } from 'sequelize';
import { NotificationService } from '@/modules/notifications/notification.service';

@Injectable()
export class SavingGoalService {
  constructor(
    @InjectModel(SavingGoal)
    private readonly savingGoalModel: typeof SavingGoal,
    private readonly notificationService: NotificationService,
  ) {}

  async create(userId: string, dto: CreateSavingGoalDto): Promise<ISavingGoal> {
    const goal = await this.savingGoalModel.create({
      userId,
      title: dto.title,
      targetAmount: dto.targetAmount,
      savedAmount: 0,
      remainingAmount: dto.targetAmount,
      targetDate: dto.targetDate,
      startDate: new Date().toISOString().split('T')[0],
      status: SavingGoalStatus.ACTIVE,
      isCompleted: false,
      completedAt: null,
      autoReminder: dto.autoReminder ?? false,
      reminderFrequency: dto.reminderFrequency ?? null,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.toSafeGoal(goal);
  }

  async findAll(userId: string): Promise<ISavingGoal[]> {
    const goals = await this.savingGoalModel.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });
    return goals.map((g) => this.toSafeGoal(g));
  }

  async findOne(id: string, userId: string): Promise<ISavingGoal> {
    const goal = await this.findGoalOrFail(id, userId);
    return this.toSafeGoal(goal);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateSavingGoalDto,
  ): Promise<ISavingGoal> {
    const goal = await this.findGoalOrFail(id, userId);

    if (
      goal.status === SavingGoalStatus.COMPLETED &&
      dto.targetAmount !== undefined
    ) {
      throw new BadRequestException({
        success: false,
        message:
          'Cannot change targetAmount on a completed goal. Cancel it first.',
        errors: [],
      });
    }

    const updateData: Partial<SavingGoal> = {
      updatedBy: userId,
    };

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.autoReminder !== undefined)
      updateData.autoReminder = dto.autoReminder;
    if (dto.reminderFrequency !== undefined)
      updateData.reminderFrequency =
        dto.reminderFrequency as unknown as SavingGoal['reminderFrequency'];
    if (dto.targetDate !== undefined) updateData.targetDate = dto.targetDate;
    if (dto.status !== undefined)
      updateData.status = dto.status as SavingGoalStatus;

    if (dto.targetAmount !== undefined) {
      updateData.targetAmount = dto.targetAmount;
      updateData.remainingAmount = dto.targetAmount - Number(goal.savedAmount);
    }

    await this.savingGoalModel.update(updateData, { where: { id } });

    const updated = await this.savingGoalModel.findByPk(id);
    return this.toSafeGoal(updated!);
  }

  async remove(id: string, userId: string): Promise<void> {
    const goal = await this.findGoalOrFail(id, userId);
    await goal.destroy();
  }

  async recalculateGoal(
    goalId: string,
    totalContributions: number,
    totalWithdrawals: number,
    transaction?: Transaction,
  ): Promise<void> {
    const goal = await this.savingGoalModel.findByPk(goalId, { transaction });
    if (!goal) {
      throw new NotFoundException({
        success: false,
        message: `Saving goal with id "${goalId}" not found`,
        errors: [],
      });
    }

    const savedAmount = Math.max(0, totalContributions - totalWithdrawals);
    const targetAmount = Number(goal.targetAmount);
    const remainingAmount = Math.max(0, targetAmount - savedAmount);

    const isCompleted = savedAmount >= targetAmount;

    const updateData: Partial<{
      savedAmount: number;
      remainingAmount: number;
      isCompleted: boolean;
      status: SavingGoalStatus;
      completedAt: Date | null;
    }> = {
      savedAmount,
      remainingAmount,
      isCompleted,
    };

    if (isCompleted) {
      updateData.status = SavingGoalStatus.COMPLETED;
      if (!goal.completedAt) {
        updateData.completedAt = new Date();

        await this.notificationService.createAndPush({
          userId: goal.userId,
          type: 'SAVING_GOAL_COMPLETED',
          title: 'Saving Goal Completed! 🎉',
          message: `Congratulations! You have successfully reached your saving goal "${goal.title}" (₹${targetAmount}).`,
          referenceId: goal.id,
          referenceType: 'SAVING_GOAL',
        });
      }
    } else {
      if (goal.status === SavingGoalStatus.COMPLETED) {
        updateData.status = SavingGoalStatus.ACTIVE;
        updateData.completedAt = null;
      }
    }

    await this.savingGoalModel.update(updateData, {
      where: { id: goalId },
      transaction,
    });
  }

  async findGoalOrFail(
    id: string,
    userId: string,
    transaction?: Transaction,
  ): Promise<SavingGoal> {
    const options: FindOptions = {};
    if (transaction) {
      options.transaction = transaction;
      options.lock = transaction.LOCK.UPDATE;
    }
    const goal = await this.savingGoalModel.findByPk(id, options);

    if (!goal) {
      throw new NotFoundException({
        success: false,
        message: `Saving goal not found`,
        errors: [],
      });
    }

    if (goal.userId !== userId) {
      throw new ForbiddenException({
        success: false,
        message: 'You do not have permission to access this saving goal',
        errors: [],
      });
    }

    return goal;
  }

  toSafeGoal(goal: SavingGoal): ISavingGoal {
    return {
      id: goal.id,
      userId: goal.userId,
      title: goal.title,
      targetAmount: Number(goal.targetAmount),
      savedAmount: Number(goal.savedAmount),
      remainingAmount: Number(goal.remainingAmount),
      targetDate: goal.targetDate,
      startDate: goal.startDate,
      status: goal.status,
      isCompleted: goal.isCompleted,
      completedAt: goal.completedAt,
      autoReminder: goal.autoReminder,
      reminderFrequency: goal.reminderFrequency,
      createdBy: goal.createdBy,
      updatedBy: goal.updatedBy,
      deletedAt: goal.deletedAt,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    };
  }
}
