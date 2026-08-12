import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const resetPinSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    newPin: z
      .string()
      .length(4, 'PIN must be exactly 4 digits')
      .regex(/^\d+$/, 'PIN must be numeric'),
    confirmPin: z
      .string()
      .length(4, 'Confirm PIN must be exactly 4 digits')
      .regex(/^\d+$/, 'Confirm PIN must be numeric'),
  })
  .refine((data) => data.newPin === data.confirmPin, {
    message: 'PINs do not match',
    path: ['confirmPin'],
  });

export class ResetPinDto {
  @ApiProperty({ example: 'john.doe@example.com', description: 'User email' })
  email: string;

  @ApiProperty({ example: '5678', description: 'New 4-digit PIN' })
  newPin: string;

  @ApiProperty({ example: '5678', description: 'Confirm new 4-digit PIN' })
  confirmPin: string;
}
