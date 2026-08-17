import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuditLogController } from './controllers/audit-log.controller';
import { AuditLogService } from './services/audit-log.service';
import { AuditLog } from './schemas/audit-log.schema';
import { SecurityModule } from '../../infrastructure/security/security.module';

@Module({
  imports: [SequelizeModule.forFeature([AuditLog]), SecurityModule],
  controllers: [AuditLogController],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogsModule {}
