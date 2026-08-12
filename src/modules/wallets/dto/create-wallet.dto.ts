import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const createWalletSchema = z.object({
  currency: z
    .string()
    .length(3, 'Currency must be exactly 3 characters long')
    .toUpperCase(),
});

export class CreateWalletDto {
  @ApiProperty({ example: 'USD', description: '3-character ISO currency code' })
  currency: string;
}
