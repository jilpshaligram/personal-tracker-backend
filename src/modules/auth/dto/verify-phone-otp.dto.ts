import { z } from 'zod';

export const verifyPhoneOtpSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone must be at least 10 digits')
    .regex(/^\d+$/, 'Phone must be numeric'),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d+$/, 'OTP must be numeric'),
});

export type VerifyPhoneOtpDto = z.infer<typeof verifyPhoneOtpSchema>;
