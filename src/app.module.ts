import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { AuthModule } from './modules/auth';
import { AuditLogsModule } from './modules/audit-logs';
import { BillHistoryModule } from './modules/bill-history';
import { BillsModule } from './modules/bills';
import { BudgetsModule } from './modules/budgets';
import { DashboardModule } from './modules/dashboard';
import { DocumentCategoryModule } from './modules/document-category';
import { DocumentModule } from './modules/documents';
import { ExpenseCategoryModule } from './modules/expense-category';
import { IncomeCategoryModule } from './modules/income-category';
import { NotificationsModule } from './modules/notifications';
import { OtpModule } from './modules/otp';
import { ReportsModule } from './modules/reports';
import { SavingGoalsModule } from './modules/saving-goals';
import { SavingTransactionsModule } from './modules/saving-transactions';
import { TransactionModule } from './modules/transactions';
import { UserSessionModule } from './modules/user-session';
import { UsersModule } from './modules/users';

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
    AuthModule,
    UsersModule,
    UserSessionModule,
    OtpModule,
    DocumentModule,
    TransactionModule,
    DocumentCategoryModule,
    IncomeCategoryModule,
    ExpenseCategoryModule,
    BudgetsModule,
    BillsModule,
    BillHistoryModule,
    SavingGoalsModule,
    SavingTransactionsModule,
    NotificationsModule,
    AuditLogsModule,
    DashboardModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
