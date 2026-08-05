import { z } from 'zod';

export const verifyPinSchema = z.object({
  email: z.string().email('Invalid email address'),
  pin: z
    .string()
    .length(4, 'PIN must be exactly 4 digits')
    .regex(/^\d+$/, 'PIN must be numeric'),
});

export type VerifyPinDto = z.infer<typeof verifyPinSchema>;
