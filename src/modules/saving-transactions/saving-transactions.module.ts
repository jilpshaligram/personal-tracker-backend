import { Module } from '@nestjs/common';
import { SavingTransactionController } from './controllers/saving-transaction.controller';
import { SavingTransactionService } from './services/saving-transaction.service';

@Module({
  controllers: [SavingTransactionController],
  providers: [SavingTransactionService],
})
export class SavingTransactionsModule {}
