import { z } from 'zod';

export const verifyPasswordOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d+$/, 'OTP must be numeric'),
});

export type VerifyPasswordOtpDto = z.infer<typeof verifyPasswordOtpSchema>;
