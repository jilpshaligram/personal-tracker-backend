import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TransactionController } from '@/modules/transactions/transaction.controller';
import { TransactionService } from '@/modules/transactions/transaction.service';
import { Transaction } from '@/modules/transactions/transaction.schema';
import { WalletsModule } from '@/modules/wallets/wallets.module';
import { CategoriesModule } from '@/modules/categories/categories.module';
import { SavingGoalsModule } from '@/modules/saving-goals/saving-goals.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Transaction]),
    WalletsModule,
    CategoriesModule,
    forwardRef(() => SavingGoalsModule),
    NotificationsModule,
  ],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService, SequelizeModule],
})
export class TransactionModule {}
