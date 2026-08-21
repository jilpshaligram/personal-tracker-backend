import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SavingGoal } from './schemas/saving-goal.schema';
import { SavingGoalController } from './controllers/saving-goal.controller';
import { SavingGoalService } from './services/saving-goal.service';
import { TransactionModule } from '../transactions/transaction.module';
import { Transaction as TransactionModel } from '../transactions/schemas/transaction.schema';
import { SecurityModule } from '../../infrastructure/security/security.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SavingGoalJob } from '../../jobs/saving-goal.job';
import { WalletsModule } from '../wallets/wallets.module';

@Module({
  imports: [
    SequelizeModule.forFeature([SavingGoal, TransactionModel]),
    forwardRef(() => TransactionModule),
    SecurityModule,
    NotificationsModule,
    WalletsModule,
  ],
  controllers: [SavingGoalController],
  providers: [SavingGoalService, SavingGoalJob],
  exports: [SavingGoalService, SequelizeModule],
})
export class SavingGoalsModule {}
