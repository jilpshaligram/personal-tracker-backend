import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SavingGoal } from './schemas/saving-goal.schema';
import { SavingGoalController } from './controllers/saving-goal.controller';
import { SavingGoalService } from './services/saving-goal.service';
import { TransactionModule } from '../transactions/transaction.module';

import { SecurityModule } from '../../infrastructure/security/security.module';

@Module({
  imports: [
    SequelizeModule.forFeature([SavingGoal]),
    forwardRef(() => TransactionModule),
    SecurityModule,
  ],
  controllers: [SavingGoalController],
  providers: [SavingGoalService],
  exports: [SavingGoalService, SequelizeModule],
})
export class SavingGoalsModule {}
