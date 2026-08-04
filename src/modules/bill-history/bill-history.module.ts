import { Module } from '@nestjs/common';
import { BillHistoryController } from './controllers/bill-history.controller';
import { BillHistoryService } from './services/bill-history.service';

@Module({
  controllers: [BillHistoryController],
  providers: [BillHistoryService],
})
export class BillHistoryModule {}
