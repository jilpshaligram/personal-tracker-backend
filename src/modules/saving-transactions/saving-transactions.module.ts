import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SavingTransaction } from '@/modules/saving-transactions/saving-transaction.schema';
import { SavingTransactionController } from '@/modules/saving-transactions/saving-transaction.controller';
import { SavingTransactionService } from '@/modules/saving-transactions/saving-transaction.service';
import { SavingGoalsModule } from '@/modules/saving-goals/saving-goals.module';

@Module({
  imports: [SequelizeModule.forFeature([SavingTransaction]), SavingGoalsModule],
  controllers: [SavingTransactionController],
  providers: [SavingTransactionService],
  exports: [SavingTransactionService],
})
export class SavingTransactionsModule {}
