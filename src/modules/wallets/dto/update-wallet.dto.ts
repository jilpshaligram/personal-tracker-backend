import { z } from 'zod';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const updateWalletSchema = z.object({
  currency: z
    .string()
    .length(3, 'Currency must be exactly 3 characters long')
    .toUpperCase()
    .optional(),
});

export class UpdateWalletDto {
  @ApiPropertyOptional({ example: 'EUR', description: '3-character ISO currency code' })
  currency?: string;
}
