import { z } from 'zod';

export const refreshTokenSchema = z.object({});

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
