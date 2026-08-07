import { z } from 'zod';
import { BillStatus } from '../enums/bill-status.enum';

export const billFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.nativeEnum(BillStatus).optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  isRecurring: z.coerce.boolean().optional(),
  dueFrom: z.string().optional(),
  dueTo: z.string().optional(),
  sortBy: z.enum(['dueDate', 'amount', 'title', 'status', 'createdAt']).default('dueDate'),
  sortOrder: z.enum(['ASC', 'DESC']).default('ASC'),
});

export type BillFilterDto = z.infer<typeof billFilterSchema>;
