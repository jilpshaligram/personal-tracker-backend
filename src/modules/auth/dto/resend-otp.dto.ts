import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const resendEmailOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resendPhoneOtpSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone must be at least 10 digits')
    .regex(/^\d+$/, 'Phone must be numeric'),
});

export class ResendEmailOtpDto {
  @ApiProperty({ example: 'john.doe@example.com', description: 'User email' })
  email: string;
}

export class ResendPhoneOtpDto {
  @ApiProperty({ example: '1234567890', description: 'Phone number' })
  phone: string;
}
