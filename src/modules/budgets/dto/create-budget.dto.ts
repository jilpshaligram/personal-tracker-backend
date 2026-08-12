import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { BudgetPeriod } from '../enums/budget-period.enum';

export const createBudgetSchema = z
  .object({
    amount: z
      .number({ error: 'Amount is required' })
      .positive('Amount must be greater than 0'),
    period: z.nativeEnum(BudgetPeriod, {
      error: 'Period is required and must be DAILY, WEEKLY, MONTHLY, or YEARLY',
    }),
    startDate: z
      .string({ error: 'Start date is required' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
    endDate: z
      .string({ error: 'End date is required' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
  })
  .strict();

export class CreateBudgetDto {
  @ApiProperty({ example: 1000, description: 'Budget limit amount' })
  amount: number;

  @ApiProperty({ enum: BudgetPeriod, example: BudgetPeriod.MONTHLY, description: 'Budget period' })
  period: BudgetPeriod;

  @ApiProperty({ example: '2026-08-01', description: 'Start date (YYYY-MM-DD)' })
  startDate: string;

  @ApiProperty({ example: '2026-08-31', description: 'End date (YYYY-MM-DD)' })
  endDate: string;
}
