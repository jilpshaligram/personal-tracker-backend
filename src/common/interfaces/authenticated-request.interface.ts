import type { Request } from 'express';
import type { IJwtPayload } from '@/modules/auth/interfaces/jwt-payload.interface';

export type { IJwtPayload };

export interface AuthenticatedRequest extends Request {
  user: IJwtPayload;
}
