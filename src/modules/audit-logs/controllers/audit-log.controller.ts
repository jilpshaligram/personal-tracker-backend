import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditLogService } from '../services/audit-log.service';

@ApiTags('Audit Logs')
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}
}
