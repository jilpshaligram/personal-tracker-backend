import { Module } from '@nestjs/common';
import { BillController } from './controllers/bill.controller';
import { BillService } from './services/bill.service';

@Module({
  controllers: [BillController],
  providers: [BillService],
})
export class BillsModule {}
