import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .min(10, 'Phone must be at least 10 digits')
    .max(15, 'Phone must be at most 15 digits')
    .regex(/^\d+$/, 'Phone must contain digits only'),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], {
    message: 'Gender must be MALE, FEMALE, or OTHER',
  }),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character',
    ),
});

export class SignupDto {
  @ApiProperty({ example: 'John', description: 'First name' })
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Unique email address' })
  email: string;

  @ApiProperty({ example: '1234567890', description: 'Phone number' })
  phone: string;

  @ApiProperty({ example: '1995-05-15', description: 'Date of birth in YYYY-MM-DD format' })
  dateOfBirth: string;

  @ApiProperty({ example: 'MALE', enum: ['MALE', 'FEMALE', 'OTHER'], description: 'Gender' })
  gender: 'MALE' | 'FEMALE' | 'OTHER';

  @ApiProperty({ example: 'Password123!', description: 'Strong user password' })
  password: string;
}
