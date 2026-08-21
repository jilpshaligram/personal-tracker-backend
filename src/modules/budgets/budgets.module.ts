import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BudgetController } from '@/modules/budgets/budget.controller';
import { BudgetService } from '@/modules/budgets/budget.service';
import { Budget } from '@/modules/budgets/budget.schema';
import { Transaction } from '@/modules/transactions/transaction.schema';
import { Category } from '@/modules/categories/category.schema';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { BudgetAlertJob } from '@/jobs/budget-alert.job';

@Module({
  imports: [
    SequelizeModule.forFeature([Budget, Transaction, Category]),
    NotificationsModule,
  ],
  controllers: [BudgetController],
  providers: [BudgetService, BudgetAlertJob],
  exports: [BudgetService, SequelizeModule],
})
export class BudgetsModule {}
