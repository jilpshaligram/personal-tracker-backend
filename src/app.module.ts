import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './config/app.config';
import authConfig from './config/auth.config';
import cloudinaryConfig from './config/cloudinary.config';
import configuration from './config/configuration';
import databaseConfig from './config/database.config';
import { validate } from './config/env.validation';
import mailConfig from './config/mail.config';
import swaggerConfig from './config/swagger.config';
import throttlerConfig from './config/throttler.config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { LoggerModule } from './infrastructure/logging/logger.module';
import { SecurityModule } from './infrastructure/security/security.module';
import { AuthGuard } from './common/guards/auth.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { AuthModule } from './modules/auth';
import { AuditLogsModule } from './modules/audit-logs';
import { BillHistoryModule } from './modules/bill-history';
import { BillsModule } from './modules/bills';
import { BudgetsModule } from './modules/budgets';
import { DashboardModule } from './modules/dashboard';
import { DocumentCategoryModule } from './modules/document-category';
import { DocumentModule } from './modules/documents';
import { NotificationsModule } from './modules/notifications';
import { OtpModule } from './modules/otp';
import { SavingGoalsModule } from './modules/saving-goals';
import { SavingTransactionsModule } from './modules/saving-transactions';
import { TransactionModule } from './modules/transactions';
import { UserSessionModule } from './modules/user-session';
import { UsersModule } from './modules/users';
import { CategoriesModule } from './modules/categories';
import { WalletsModule } from './modules/wallets/wallets.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        configuration,
        databaseConfig,
        appConfig,
        authConfig,
        swaggerConfig,
        mailConfig,
        cloudinaryConfig,
        throttlerConfig,
      ],
      validate,
    }),
    DatabaseModule,
    LoggerModule,
    SecurityModule,
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    UserSessionModule,
    OtpModule,
    TransactionModule,
    WalletsModule,
    CategoriesModule,
    DocumentCategoryModule,
    DocumentModule,
    BudgetsModule,
    BillsModule,
    BillHistoryModule,
    SavingGoalsModule,
    SavingTransactionsModule,
    NotificationsModule,
    AuditLogsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
