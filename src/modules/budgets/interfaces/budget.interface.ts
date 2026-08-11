import { BudgetPeriod } from '../enums/budget-period.enum';

export interface IBudget {
  id: string;
  userId: string;
  amount: number;
  period: BudgetPeriod;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
