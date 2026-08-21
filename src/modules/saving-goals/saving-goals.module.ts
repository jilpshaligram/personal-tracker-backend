import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SavingGoal } from './schemas/saving-goal.schema';
import { SavingGoalController } from './controllers/saving-goal.controller';
import { SavingGoalService } from './services/saving-goal.service';
import { TransactionModule } from '../transactions/transaction.module';
import { SecurityModule } from '../../infrastructure/security/security.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SavingGoalJob } from '../../jobs/saving-goal.job';

@Module({
  imports: [
    SequelizeModule.forFeature([SavingGoal]),
    forwardRef(() => TransactionModule),
    SecurityModule,
    NotificationsModule,
  ],
  controllers: [SavingGoalController],
  providers: [SavingGoalService, SavingGoalJob],
  exports: [SavingGoalService, SequelizeModule],
})
export class SavingGoalsModule {}
