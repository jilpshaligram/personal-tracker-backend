import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const forgotPinSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export class ForgotPinDto {
  @ApiProperty({ example: 'john.doe@example.com', description: 'User email' })
  email: string;
}
