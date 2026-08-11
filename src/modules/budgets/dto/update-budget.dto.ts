import { z } from 'zod';
import { createBudgetSchema } from './create-budget.dto';

export const updateBudgetSchema = createBudgetSchema.partial().strict();

export type UpdateBudgetDto = z.infer<typeof updateBudgetSchema>;
