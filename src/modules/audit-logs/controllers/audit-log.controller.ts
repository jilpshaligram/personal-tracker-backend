import { Controller } from '@nestjs/common';
import { AuditLogService } from '../services/audit-log.service';

@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}
}
