import { z } from 'zod';

export const resetPinSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    newPin: z
      .string()
      .length(4, 'PIN must be exactly 4 digits')
      .regex(/^\d+$/, 'PIN must be numeric'),
    confirmPin: z
      .string()
      .length(4, 'Confirm PIN must be exactly 4 digits')
      .regex(/^\d+$/, 'Confirm PIN must be numeric'),
  })
  .refine((data) => data.newPin === data.confirmPin, {
    message: 'PINs do not match',
    path: ['confirmPin'],
  });

export type ResetPinDto = z.infer<typeof resetPinSchema>;
