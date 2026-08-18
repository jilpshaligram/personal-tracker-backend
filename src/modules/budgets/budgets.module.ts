import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BudgetController } from './controllers/budget.controller';
import { BudgetService } from './services/budget.service';
import { BudgetRepository } from './repositories/budget.repository';
import { Budget } from './schemas/budget.schema';
import { Transaction } from '../transactions/schemas/transaction.schema';
import { Category } from '../categories/schemas/category.schema';

import { SecurityModule } from '../../infrastructure/security/security.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Budget, Transaction, Category]),
    SecurityModule,
  ],
  controllers: [BudgetController],
  providers: [BudgetService, BudgetRepository],
  exports: [BudgetService, BudgetRepository],
})
export class BudgetsModule {}
