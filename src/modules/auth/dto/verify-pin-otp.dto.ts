import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const verifyPinOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d+$/, 'OTP must be numeric'),
});

export class VerifyPinOtpDto {
  @ApiProperty({ example: 'john.doe@example.com', description: 'User email' })
  email: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP' })
  otp: string;
}
