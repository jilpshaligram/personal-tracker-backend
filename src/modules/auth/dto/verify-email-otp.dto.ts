import { z } from 'zod';

export const verifyEmailOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d+$/, 'OTP must be numeric'),
});

export type VerifyEmailOtpDto = z.infer<typeof verifyEmailOtpSchema>;
