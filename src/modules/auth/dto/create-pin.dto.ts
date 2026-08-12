import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const createPinSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    pin: z
      .string()
      .length(4, 'PIN must be exactly 4 digits')
      .regex(/^\d+$/, 'PIN must be numeric'),
    confirmPin: z
      .string()
      .length(4, 'Confirm PIN must be exactly 4 digits')
      .regex(/^\d+$/, 'Confirm PIN must be numeric'),
  })
  .refine((data) => data.pin === data.confirmPin, {
    message: 'PIN and confirm PIN do not match',
    path: ['confirmPin'],
  });

export class CreatePinDto {
  @ApiProperty({ example: 'john.doe@example.com', description: 'User email' })
  email: string;

  @ApiProperty({ example: '1234', description: '4-digit security PIN' })
  pin: string;

  @ApiProperty({ example: '1234', description: 'Confirm 4-digit security PIN' })
  confirmPin: string;
}
