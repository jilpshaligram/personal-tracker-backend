import { z } from 'zod';

export const createPinSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    pin: z
      .string()
      .length(4, 'PIN must be exactly 4 digits')
      .regex(/^\d+$/, 'PIN must be numeric'),
    confirmPin: z
      .string()
      .length(4, 'Confirm PIN must be exactly 4 digits')
      .regex(/^\d+$/, 'Confirm PIN must be numeric'),
  })
  .refine((data) => data.pin === data.confirmPin, {
    message: 'PIN and confirm PIN do not match',
    path: ['confirmPin'],
  });

export type CreatePinDto = z.infer<typeof createPinSchema>;
