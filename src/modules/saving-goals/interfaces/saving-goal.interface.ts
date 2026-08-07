import { SavingGoalStatus } from '../enums/saving-goal-status.enum';
import { ReminderFrequency } from '../enums/reminder-frequency.enum';

export interface ISavingGoal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  remainingAmount: number;
  targetDate: string;
  startDate: string;
  status: SavingGoalStatus;
  isCompleted: boolean;
  completedAt: Date | null;
  autoReminder: boolean;
  reminderFrequency: ReminderFrequency | null;
  createdBy: string | null;
  updatedBy: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
