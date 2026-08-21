import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BillHistoryService } from '@/modules/bill-history/bill-history.service';
import { BillHistory } from '@/modules/bill-history/bill-history.schema';
import { Transaction } from '@/modules/transactions/transaction.schema';
import { BillsModule } from '@/modules/bills/bills.module';

@Module({
  imports: [
    SequelizeModule.forFeature([BillHistory, Transaction]),
    forwardRef(() => BillsModule),
  ],
  controllers: [],
  providers: [BillHistoryService],
  exports: [BillHistoryService],
})
export class BillHistoryModule {}
