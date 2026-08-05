export interface IJwtPayload {
  sub: string;
  email?: string;
  role?: string;
  sessionId?: string;
  tokenType: 'access' | 'refresh' | 'onboarding';
  iat?: number;
  exp?: number;
}
