import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SavingGoal } from './schemas/saving-goal.schema';
import { SavingGoalController } from './controllers/saving-goal.controller';
import { SavingGoalService } from './services/saving-goal.service';

@Module({
  imports: [
    // Register the SavingGoal Sequelize model for this module's scope
    SequelizeModule.forFeature([SavingGoal]),
  ],
  controllers: [SavingGoalController],
  providers: [SavingGoalService],
  // Export both the service and the SequelizeModule so that SavingTransactionsModule
  // can inject SavingGoalService and Sequelize can auto-load the model globally.
  exports: [SavingGoalService, SequelizeModule],
})
export class SavingGoalsModule {}
