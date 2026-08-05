export interface IOtp {
  id: string;
  userId: string;
  email: string;
  purpose: string;
  expiresAt: Date;
  isVerified: boolean;
  attempts: number;
  maxAttempts: number;
  resendCount: number;
  lastSentAt: Date | null;
}
