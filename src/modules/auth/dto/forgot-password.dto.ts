import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export class ForgotPasswordDto {
  @ApiProperty({ example: 'john.doe@example.com', description: 'User email' })
  email: string;
}
