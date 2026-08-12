import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SavingGoal } from './schemas/saving-goal.schema';
import { SavingGoalController } from './controllers/saving-goal.controller';
import { SavingGoalService } from './services/saving-goal.service';
import { TransactionModule } from '../transactions/transaction.module';

@Module({
  imports: [
    SequelizeModule.forFeature([SavingGoal]),
    forwardRef(() => TransactionModule),
  ],
  controllers: [SavingGoalController],
  providers: [SavingGoalService],
  exports: [SavingGoalService, SequelizeModule],
})
export class SavingGoalsModule {}
