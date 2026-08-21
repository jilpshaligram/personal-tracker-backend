import { BudgetPeriod } from '@/modules/budgets/enums/budget-period.enum';
import { BillStatus } from '@/modules/bills/enums/bill-status.enum';
import { SavingGoalStatus } from '@/modules/saving-goals/enums/saving-goal-status.enum';
import { TransactionType } from '@/modules/transactions/enums/transaction-type.enum';
import { PaymentMethod } from '@/modules/transactions/enums/payment-method.enum';

export interface IDashboardDateRange {
  startDate: string;
  endDate: string;
}

export interface IDashboardSummary {
  income: number;
  expense: number;
  savings: number;
  balance: number;
}

export interface IDashboardBudget {
  id: string;
  amount: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
}

export interface IDashboardExpenseBreakdownItem {
  categoryId: string;
  category: string;
  amount: number;
  percentage: number;
}

export interface IDashboardChartPoint {
  label: string;
  income: number;
  expense: number;
}

export interface IDashboardUpcomingBill {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: BillStatus;
  isRecurring: boolean;
  categoryId: string;
}

export interface IDashboardSavingGoal {
  id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  remainingAmount: number;
  progressPercent: number;
  targetDate: string;
  status: SavingGoalStatus;
  isCompleted: boolean;
}
export interface IDashboardDocumentAlert {
  id: string;
  title: string;
  expiryDate: string;
  reminderDaysBefore: number;
  reminderDate: string;
  categoryName: string;
  daysUntilExpiry: number;
}

export interface IDashboardRecentTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  transactionDate: string;
  categoryName: string | null;
  note: string | null;
  paymentMethod: PaymentMethod | null;
}

export interface IDashboardResponse {
  period: BudgetPeriod;
  dateRange: IDashboardDateRange;
  summary: IDashboardSummary;
  budget: IDashboardBudget | null;
  expenseBreakdown: IDashboardExpenseBreakdownItem[];
  incomeVsExpense: IDashboardChartPoint[];
  upcomingBills: IDashboardUpcomingBill[];
  savingGoals: IDashboardSavingGoal[];

  documentAlerts: IDashboardDocumentAlert[];
  recentTransactions: IDashboardRecentTransaction[];
}
