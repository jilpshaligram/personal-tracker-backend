import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SavingGoal } from '../schemas/saving-goal.schema';
import { SavingGoalStatus } from '../enums/saving-goal-status.enum';
import { ISavingGoal } from '../interfaces/saving-goal.interface';
import { CreateSavingGoalDto } from '../dto/create-saving-goal.dto';
import { UpdateSavingGoalDto } from '../dto/update-saving-goal.dto';
import { Transaction, FindOptions } from 'sequelize';
import { NotificationService } from '../../notifications/services/notification.service';

@Injectable()
export class SavingGoalService {
  constructor(
    @InjectModel(SavingGoal)
    private readonly savingGoalModel: typeof SavingGoal,
    private readonly notificationService: NotificationService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a new saving goal for the authenticated user.
   *
   * Initial state:
   *  - savedAmount = 0
   *  - remainingAmount = targetAmount
   *  - status = ACTIVE
   *  - isCompleted = false
   *  - startDate = today
   */
  async create(userId: string, dto: CreateSavingGoalDto): Promise<ISavingGoal> {
    const goal = await this.savingGoalModel.create({
      userId,
      title: dto.title,
      targetAmount: dto.targetAmount,
      savedAmount: 0,
      remainingAmount: dto.targetAmount, // remainingAmount = targetAmount - 0
      targetDate: dto.targetDate,
      startDate: new Date().toISOString().split('T')[0], // today
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

  // ─────────────────────────────────────────────────────────────────────────
  // READ
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get all active (non-deleted) saving goals belonging to the authenticated user.
   */
  async findAll(userId: string): Promise<ISavingGoal[]> {
    const goals = await this.savingGoalModel.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });
    return goals.map((g) => this.toSafeGoal(g));
  }

  /**
   * Get a single saving goal by ID.
   * Throws NotFoundException if not found or not owned by the user.
   */
  async findOne(id: string, userId: string): Promise<ISavingGoal> {
    const goal = await this.findGoalOrFail(id, userId);
    return this.toSafeGoal(goal);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Partially update a saving goal's user-editable fields.
   *
   * After updating targetAmount the remainingAmount is recalculated
   * so it stays consistent with savedAmount.
   */
  async update(
    id: string,
    userId: string,
    dto: UpdateSavingGoalDto,
  ): Promise<ISavingGoal> {
    const goal = await this.findGoalOrFail(id, userId);

    // Prevent updating a completed goal's financial target without explicit intent
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

    // Build the update payload — never touch savedAmount / isCompleted / completedAt here
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

    // Recalculate remaining amount if targetAmount changes
    if (dto.targetAmount !== undefined) {
      updateData.targetAmount = dto.targetAmount;
      updateData.remainingAmount = dto.targetAmount - Number(goal.savedAmount);
    }

    await this.savingGoalModel.update(updateData, { where: { id } });

    const updated = await this.savingGoalModel.findByPk(id);
    return this.toSafeGoal(updated!);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DELETE (soft)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Soft-delete a saving goal (sets deletedAt via paranoid).
   * Does NOT delete the associated transactions — they remain for audit purposes.
   */
  async remove(id: string, userId: string): Promise<void> {
    const goal = await this.findGoalOrFail(id, userId);
    await goal.destroy(); // paranoid: true → sets deletedAt
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INTERNAL — used by SavingTransactionService
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Recalculate savedAmount, remainingAmount, isCompleted, status, and completedAt
   * for a goal based on the provided total contribution and withdrawal sums.
   *
   * Called by SavingTransactionService after every transaction create/delete.
   *
   * @param goalId  The goal to recalculate
   * @param totalContributions  Sum of all CONTRIBUTION amounts for this goal
   * @param totalWithdrawals    Sum of all WITHDRAWAL amounts for this goal
   * @param transaction         Optional Sequelize transaction object
   */
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

    // savedAmount = contributions - withdrawals, floored at 0
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
      // Mark as completed only if it wasn't already
      updateData.status = SavingGoalStatus.COMPLETED;
      if (!goal.completedAt) {
        updateData.completedAt = new Date();

        // Trigger instant notification
        // Await the push so it saves to the DB before the transaction commits/ends.
        // Firebase errors are handled internally by createAndPush.
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
      // Revert to ACTIVE if a withdrawal brought it below the target
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

  /**
   * Find a goal by PK and verify it belongs to the given user.
   * Throws NotFoundException or ForbiddenException as appropriate.
   */
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

  // ─────────────────────────────────────────────────────────────────────────
  // SERIALISER
  // ─────────────────────────────────────────────────────────────────────────

  /** Map a Sequelize SavingGoal instance to the clean ISavingGoal shape */
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
