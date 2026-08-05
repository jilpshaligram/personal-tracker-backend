import { z } from 'zod';

export const logoutSchema = z.object({});

export type LogoutDto = z.infer<typeof logoutSchema>;
