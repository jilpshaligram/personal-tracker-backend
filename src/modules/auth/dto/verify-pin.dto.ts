import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const verifyPinSchema = z.object({
  email: z.string().email('Invalid email address'),
  pin: z
    .string()
    .length(4, 'PIN must be exactly 4 digits')
    .regex(/^\d+$/, 'PIN must be numeric'),
});

export class VerifyPinDto {
  @ApiProperty({ example: 'john.doe@example.com', description: 'User email' })
  email: string;

  @ApiProperty({ example: '1234', description: '4-digit PIN' })
  pin: string;
}
