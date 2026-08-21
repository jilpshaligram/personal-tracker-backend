import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Otp } from '@/modules/otp/otp.schema';
import { OtpController } from '@/modules/otp/otp.controller';
import { OtpService } from '@/modules/otp/otp.service';
import { OtpCleanupService } from '@/modules/otp/otp-cleanup.service';
import { SecurityService } from '@/infrastructure/security/security.service';

@Module({
  imports: [SequelizeModule.forFeature([Otp])],
  controllers: [OtpController],
  providers: [OtpService, OtpCleanupService, SecurityService],
  exports: [OtpService, SequelizeModule],
})
export class OtpModule {}
