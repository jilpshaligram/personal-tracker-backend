import { z } from 'zod';

export const resendEmailOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resendPhoneOtpSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone must be at least 10 digits')
    .regex(/^\d+$/, 'Phone must be numeric'),
});

export type ResendEmailOtpDto = z.infer<typeof resendEmailOtpSchema>;
export type ResendPhoneOtpDto = z.infer<typeof resendPhoneOtpSchema>;
