import { z } from 'zod';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const updateUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  phone: z
    .string()
    .min(10, 'Phone must be at least 10 digits')
    .max(15, 'Phone must be at most 15 digits')
    .regex(/^\d+$/, 'Phone must contain digits only')
    .optional(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format')
    .optional(),
  gender: z
    .enum(['MALE', 'FEMALE', 'OTHER'], {
      message: 'Gender must be MALE, FEMALE, or OTHER',
    })
    .optional(),
  profileImage: z.string().url('Profile image must be a valid URL').optional(),
  notificationEnabled: z.boolean().optional(),
});

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John', description: 'First name' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'Last name' })
  lastName?: string;

  @ApiPropertyOptional({ example: '1234567890', description: 'Phone number' })
  phone?: string;

  @ApiPropertyOptional({ example: '1995-05-15', description: 'Date of birth (YYYY-MM-DD)' })
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'MALE', enum: ['MALE', 'FEMALE', 'OTHER'], description: 'Gender' })
  gender?: 'MALE' | 'FEMALE' | 'OTHER';

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', description: 'Profile image URL' })
  profileImage?: string;

  @ApiPropertyOptional({ example: true, description: 'Enable/disable notifications' })
  notificationEnabled?: boolean;
}
