import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SavingGoal } from '@/modules/saving-goals/saving-goal.schema';
import { SavingGoalController } from '@/modules/saving-goals/saving-goal.controller';
import { SavingGoalService } from '@/modules/saving-goals/saving-goal.service';
import { TransactionModule } from '@/modules/transactions/transaction.module';
import { Transaction } from '@/modules/transactions/transaction.schema';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { SavingGoalJob } from '@/jobs/saving-goal.job';
import { WalletsModule } from '@/modules/wallets/wallets.module';

@Module({
  imports: [
    SequelizeModule.forFeature([SavingGoal, Transaction]),
    forwardRef(() => TransactionModule),
    NotificationsModule,
    WalletsModule,
  ],
  controllers: [SavingGoalController],
  providers: [SavingGoalService, SavingGoalJob],
  exports: [SavingGoalService, SequelizeModule],
})
export class SavingGoalsModule {}
