import { ApiPropertyOptional } from '@nestjs/swagger';
import { createBudgetSchema } from './create-budget.dto';
import { BudgetPeriod } from '../enums/budget-period.enum';

export const updateBudgetSchema = createBudgetSchema.partial().strict();

export class UpdateBudgetDto {
  @ApiPropertyOptional({ example: 1200, description: 'Budget limit amount' })
  amount?: number;

  @ApiPropertyOptional({
    enum: BudgetPeriod,
    example: BudgetPeriod.MONTHLY,
    description: 'Budget period',
  })
  period?: BudgetPeriod;

  @ApiPropertyOptional({
    example: '2026-08-01',
    description: 'Start date (YYYY-MM-DD)',
  })
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-08-31',
    description: 'End date (YYYY-MM-DD)',
  })
  endDate?: string;
}
