import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const openingBalanceSchema = z.object({
  amount: z.number().min(0, 'Amount must be greater than or equal to zero.'),
});

export class OpeningBalanceDto {
  @ApiProperty({ example: 25000, description: 'Opening balance amount' })
  amount: number;
}
