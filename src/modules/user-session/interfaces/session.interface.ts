export interface ISession {
  id: string;
  userId: string;
  device: string | null;
  loginMethod: string | null;
  isActive: boolean;
  expiresAt: Date;
  lastActivityAt: Date | null;
  createdAt: Date;
}
