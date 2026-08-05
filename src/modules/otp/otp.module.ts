import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Otp } from './schemas/otp.schema';
import { OtpController } from './controllers/otp.controller';
import { OtpService } from './services/otp.service';
import { SecurityModule } from '../../infrastructure/security/security.module';

@Module({
  imports: [SequelizeModule.forFeature([Otp]), SecurityModule],
  controllers: [OtpController],
  providers: [OtpService],
  exports: [OtpService, SequelizeModule],
})
export class OtpModule {}
