import { z } from 'zod';
import { ApiPropertyOptional } from '@nestjs/swagger';
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
  sortBy: z
    .enum(['dueDate', 'amount', 'title', 'status', 'createdAt'])
    .default('dueDate'),
  sortOrder: z.enum(['ASC', 'DESC']).default('ASC'),
});

export class BillFilterDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  page: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  limit: number = 10;

  @ApiPropertyOptional({ description: 'Search title/description/notes' })
  search?: string;

  @ApiPropertyOptional({ enum: BillStatus, description: 'Filter by bill status' })
  status?: BillStatus;

  @ApiPropertyOptional({ description: 'Filter by category UUID' })
  categoryId?: string;

  @ApiPropertyOptional({ type: Boolean, description: 'Filter recurring status' })
  isRecurring?: boolean;

  @ApiPropertyOptional({ example: '2026-08-01', description: 'Due date from (YYYY-MM-DD)' })
  dueFrom?: string;

  @ApiPropertyOptional({ example: '2026-08-31', description: 'Due date to (YYYY-MM-DD)' })
  dueTo?: string;

  @ApiPropertyOptional({ example: 'dueDate', enum: ['dueDate', 'amount', 'title', 'status', 'createdAt'] })
  sortBy: 'dueDate' | 'amount' | 'title' | 'status' | 'createdAt' = 'dueDate';

  @ApiPropertyOptional({ example: 'ASC', enum: ['ASC', 'DESC'] })
  sortOrder: 'ASC' | 'DESC' = 'ASC';
}
