import { z } from 'zod';

export const forgotPinSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ForgotPinDto = z.infer<typeof forgotPinSchema>;
