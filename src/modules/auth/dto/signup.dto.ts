import { z } from 'zod';

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

export type SignupDto = z.infer<typeof signupSchema>;
