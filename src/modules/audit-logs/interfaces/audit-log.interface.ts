import { ActionType } from '../enums/action-type.enum';

/**
 * Audit log interface
 */
export interface IAuditLog {
  id?: string;
  userId: string;
  module: string;
  action: ActionType;
  entityId?: string | null;
  entityType?: string | null;
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
