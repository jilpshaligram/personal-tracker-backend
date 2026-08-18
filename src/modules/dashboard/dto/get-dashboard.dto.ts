import { z } from 'zod';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BudgetPeriod } from '../../budgets/enums/budget-period.enum';

/**
 * @schema getDashboardSchema
 *
 * @description
 
 */
export const getDashboardSchema = z.object({
  period: z
    .string()
    .optional()
    .default('monthly')
    .transform((val) => val.toUpperCase())
    .pipe(
      z.nativeEnum(BudgetPeriod, {
        message: 'period must be one of: daily, weekly, monthly, yearly',
      }),
    ),
});

export type GetDashboardSchemaType = z.infer<typeof getDashboardSchema>;

export class GetDashboardDto {
  @ApiPropertyOptional({
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    example: 'monthly',
    description:
      'Dashboard period filter. Determines the date range for income/expense aggregations. ' +
      'Document expiry alerts are always period-independent.',
    default: 'monthly',
  })
  period?: string;
}
