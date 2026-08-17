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
  })
  .strict();

export class CreateBudgetDto {
  @ApiProperty({ example: 1000, description: 'Budget limit amount' })
  amount: number;

  @ApiProperty({
    enum: BudgetPeriod,
    example: BudgetPeriod.MONTHLY,
    description: 'Budget period',
  })
  period: BudgetPeriod;
}
