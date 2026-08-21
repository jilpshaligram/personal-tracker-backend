import { Module } from '@nestjs/common';
import { AuthController } from '@/modules/auth/auth.controller';
import { AuthService } from '@/modules/auth/auth.service';
import { UsersModule } from '@/modules/users/users.module';
import { OtpModule } from '@/modules/otp/otp.module';
import { UserSessionModule } from '@/modules/user-session/user-session.module';
import { SecurityService } from '@/infrastructure/security/security.service';
import { MailService } from '@/infrastructure/mail/mail.service';
import {
  AuthGuard,
  OnboardingGuard,
  AccessTokenGuard,
} from '@/common/guards/auth.guard';

@Module({
  imports: [UsersModule, OtpModule, UserSessionModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    SecurityService,
    MailService,
    AuthGuard,
    OnboardingGuard,
    AccessTokenGuard,
  ],
  exports: [
    AuthService,
    SecurityService,
    MailService,
    AuthGuard,
    OnboardingGuard,
    AccessTokenGuard,
  ],
})
export class AuthModule {}
