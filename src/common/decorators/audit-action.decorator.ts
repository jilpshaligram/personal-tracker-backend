import { SetMetadata } from '@nestjs/common';
import { ActionType } from '../../modules/audit-logs/enums/action-type.enum';

export const AUDIT_ACTION_KEY = 'audit_action';
export const AuditAction = (action: ActionType) =>
  SetMetadata(AUDIT_ACTION_KEY, action);
