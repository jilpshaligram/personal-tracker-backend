import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SavingTransaction } from './schemas/saving-transaction.schema';
import { SavingTransactionController } from './controllers/saving-transaction.controller';
import { SavingTransactionService } from './services/saving-transaction.service';
import { SavingGoalsModule } from '../saving-goals/saving-goals.module';

@Module({
  imports: [SequelizeModule.forFeature([SavingTransaction]), SavingGoalsModule],
  controllers: [SavingTransactionController],
  providers: [SavingTransactionService],
  exports: [SavingTransactionService],
})
export class SavingTransactionsModule {}
