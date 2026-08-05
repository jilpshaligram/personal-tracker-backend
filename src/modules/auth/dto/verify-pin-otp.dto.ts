import { z } from 'zod';

export const verifyPinOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d+$/, 'OTP must be numeric'),
});

export type VerifyPinOtpDto = z.infer<typeof verifyPinOtpSchema>;
