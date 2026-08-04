import { Module } from '@nestjs/common';
import { SavingGoalController } from './controllers/saving-goal.controller';
import { SavingGoalService } from './services/saving-goal.service';

@Module({
  controllers: [SavingGoalController],
  providers: [SavingGoalService],
})
export class SavingGoalsModule {}
