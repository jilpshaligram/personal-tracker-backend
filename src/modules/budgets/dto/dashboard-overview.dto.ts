import { ApiProperty } from '@nestjs/swagger';

export class DashboardBudgetOverviewItemDto {
  @ApiProperty({ description: 'Budget UUID' })
  budgetId: string;

  @ApiProperty({
    description: 'Budget period (DAILY, WEEKLY, MONTHLY, YEARLY)',
  })
  period: string;

  @ApiProperty({ description: 'Total budget amount' })
  budgetAmount: number;

  @ApiProperty({ description: 'Total amount spent' })
  spentAmount: number;

  @ApiProperty({ description: 'Remaining budget amount' })
  remainingAmount: number;

  @ApiProperty({ description: 'Percentage of budget spent' })
  percentageSpent: number;

  @ApiProperty({ description: 'Budget start date' })
  startDate: string;

  @ApiProperty({ description: 'Budget end date' })
  endDate: string;
}

export class DashboardOverviewResponseDto {
  @ApiProperty({
    type: [DashboardBudgetOverviewItemDto],
    description: 'List of latest budgets overview',
  })
  budgets: DashboardBudgetOverviewItemDto[];
}
