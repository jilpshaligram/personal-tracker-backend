import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BudgetController } from './controllers/budget.controller';
import { BudgetService } from './services/budget.service';
import { BudgetRepository } from './repositories/budget.repository';
import { Budget } from './schemas/budget.schema';

import { SecurityModule } from '../../infrastructure/security/security.module';

@Module({
  imports: [SequelizeModule.forFeature([Budget]), SecurityModule],
  controllers: [BudgetController],
  providers: [BudgetService, BudgetRepository],
  exports: [BudgetService, BudgetRepository],
})
export class BudgetsModule {}
