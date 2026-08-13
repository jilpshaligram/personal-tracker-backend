import type { Request } from 'express';

export interface IJwtPayload {
  sub: string;
  sessionId?: string;
  tokenType: string;
  [key: string]: unknown;
}

export interface AuthenticatedRequest extends Request {
  user: IJwtPayload;
}
