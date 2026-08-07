import {
  Column,
  CreatedAt,
  DataType,
  DeletedAt,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { SavingGoalStatus } from '../enums/saving-goal-status.enum';
import { ReminderFrequency } from '../enums/reminder-frequency.enum';

@Table({
  tableName: 'saving_goals',
  paranoid: true, // soft delete support via deletedAt
  timestamps: true,
  underscored: false,
})
export class SavingGoal extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.UUID, allowNull: false })
  declare userId: string;

  /** Human-readable title, e.g. "Buy Laptop" */
  @Column({ type: DataType.STRING, allowNull: false })
  declare title: string;

  // ─── Financials ───────────────────────────────────────────────────────────

  /** Target amount the user wants to save */
  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
  declare targetAmount: number;

  /**
   * Current amount saved — NEVER edited by the user directly.
   * Recalculated automatically whenever a SavingTransaction is created or deleted.
   */
  @Column({ type: DataType.DECIMAL(15, 2), defaultValue: 0, allowNull: false })
  declare savedAmount: number;

  /**
   * Remaining amount = targetAmount - savedAmount.
   * Recalculated automatically.
   */
  @Column({ type: DataType.DECIMAL(15, 2), defaultValue: 0, allowNull: false })
  declare remainingAmount: number;

  // ─── Dates ────────────────────────────────────────────────────────────────

  /** Date by which the user wants to reach the target */
  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare targetDate: string;

  /** Date the goal was started (defaults to today) */
  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare startDate: string;

  // ─── Meta ─────────────────────────────────────────────────────────────────

  // @Column({
  //   type: DataType.ENUM(...Object.values(SavingGoalPriority)),
  //   defaultValue: SavingGoalPriority.MEDIUM,
  //   allowNull: false,
  // })
  // declare priority: SavingGoalPriority;

  @Column({
    type: DataType.ENUM(...Object.values(SavingGoalStatus)),
    defaultValue: SavingGoalStatus.ACTIVE,
    allowNull: false,
  })
  declare status: SavingGoalStatus;

  /** Automatically true when savedAmount >= targetAmount */
  @Column({ type: DataType.BOOLEAN, defaultValue: false, allowNull: false })
  declare isCompleted: boolean;

  /** Set automatically when goal is completed; cleared on reversal */
  @Column({ type: DataType.DATE, allowNull: true })
  declare completedAt: Date | null;

  // ─── Reminders ────────────────────────────────────────────────────────────

  /** Whether the user wants automated reminders for this goal */
  @Column({ type: DataType.BOOLEAN, defaultValue: false, allowNull: false })
  declare autoReminder: boolean;

  /**
   * How often to remind — only required when autoReminder=true.
   * Stored as null when autoReminder=false.
   */
  @Column({
    type: DataType.ENUM(...Object.values(ReminderFrequency)),
    allowNull: true,
  })
  declare reminderFrequency: ReminderFrequency | null;

  // ─── Notes & Audit ────────────────────────────────────────────────────────

  /** Optional user notes */
  // @Column({ type: DataType.TEXT, allowNull: true })
  // declare notes: string | null;

  /** ID of the user who created this goal */
  @Column({ type: DataType.UUID, allowNull: true })
  declare createdBy: string | null;

  /** ID of the user who last updated this goal */
  @Column({ type: DataType.UUID, allowNull: true })
  declare updatedBy: string | null;

  // ─── Timestamps ───────────────────────────────────────────────────────────

  @DeletedAt
  declare deletedAt: Date | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
