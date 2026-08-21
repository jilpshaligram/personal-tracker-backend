import { BudgetPeriod } from '@/modules/budgets/enums/budget-period.enum';

export interface IBudget {
  id: string;
  userId: string;
  amount: number;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
