import { ActionType } from '@/modules/audit-logs/enums/action-type.enum';

export interface IAuditLog {
  id?: string;
  userId: string;
  module: string;
  action: ActionType;
  ipAddress: string;
  userAgent: string;
  requestMethod: string;
  requestUrl: string;
  statusCode: number;
  changes?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
