import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { UsersModule } from '../users/users.module';
import { OtpModule } from '../otp/otp.module';
import { UserSessionModule } from '../user-session/user-session.module';
import { SecurityModule } from '../../infrastructure/security/security.module';
import { MailModule } from '../../infrastructure/mail/mail.module';
import { AuthGuard } from '../../common/guards/auth.guard';
import { OnboardingGuard } from '../../common/guards/onboarding.guard';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';

@Module({
  imports: [
    UsersModule,
    OtpModule,
    UserSessionModule,
    SecurityModule,
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, OnboardingGuard, AccessTokenGuard],
  exports: [
    AuthService,
    AuthGuard,
    OnboardingGuard,
    AccessTokenGuard,
    SecurityModule,
  ],
})
export class AuthModule {}
