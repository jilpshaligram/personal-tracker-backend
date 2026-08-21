import { Global, Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import configuration from '@/config/configuration';
import { validate } from '@/config/env.validation';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { SecurityService } from '@/infrastructure/security/security.service';
import { MailService } from '@/infrastructure/mail/mail.service';
import { CloudinaryService } from '@/common/cloudinary/cloudinary.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { AuditInterceptor } from '@/common/interceptors/audit.interceptor';
import { AuthModule } from '@/modules/auth/auth.module';
import { AuditLogsModule } from '@/modules/audit-logs/audit-logs.module';
import { BillHistoryModule } from '@/modules/bill-history/bill-history.module';
import { BillsModule } from '@/modules/bills/bills.module';
import { BudgetsModule } from '@/modules/budgets/budgets.module';
import { DashboardModule } from '@/modules/dashboard/dashboard.module';
import { DocumentCategoryModule } from '@/modules/document-category/document-category.module';
import { DocumentModule } from '@/modules/documents/document.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { OtpModule } from '@/modules/otp/otp.module';
import { SavingGoalsModule } from '@/modules/saving-goals/saving-goals.module';
import { SavingTransactionsModule } from '@/modules/saving-transactions/saving-transactions.module';
import { TransactionModule } from '@/modules/transactions/transaction.module';
import { UserSessionModule } from '@/modules/user-session/user-session.module';
import { UsersModule } from '@/modules/users/users.module';
import { CategoriesModule } from '@/modules/categories/categories.module';
import { WalletsModule } from '@/modules/wallets/wallets.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
    DatabaseModule,
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
    LoggerService,
    SecurityService,
    MailService,
    CloudinaryService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [LoggerService, SecurityService, MailService, CloudinaryService],
})
export class AppModule {}
