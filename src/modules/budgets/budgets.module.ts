import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BudgetController } from './controllers/budget.controller';
import { BudgetService } from './services/budget.service';
import { Budget } from './schemas/budget.schema';
import { Transaction } from '../transactions/schemas/transaction.schema';
import { Category } from '../categories/schemas/category.schema';
import { SecurityModule } from '../../infrastructure/security/security.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BudgetAlertJob } from '../../jobs/budget-alert.job';

@Module({
  imports: [
    SequelizeModule.forFeature([Budget, Transaction, Category]),
    SecurityModule,
    NotificationsModule,
  ],
  controllers: [BudgetController],
  providers: [BudgetService, BudgetAlertJob],
  exports: [BudgetService, SequelizeModule],
})
export class BudgetsModule {}
