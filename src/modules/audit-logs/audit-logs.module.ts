import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuditLogController } from '@/modules/audit-logs/audit-log.controller';
import { AuditLogService } from '@/modules/audit-logs/audit-log.service';
import { AuditLog } from '@/modules/audit-logs/audit-log.schema';
@Module({
  imports: [SequelizeModule.forFeature([AuditLog])],
  controllers: [AuditLogController],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogsModule {}
