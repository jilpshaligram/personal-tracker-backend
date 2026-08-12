import { Module } from '@nestjs/common';
import { AuditLogController } from './controllers/audit-log.controller';
import { AuditLogService } from './services/audit-log.service';

@Module({
  controllers: [AuditLogController],
  providers: [AuditLogService],
})
export class AuditLogsModule {}
