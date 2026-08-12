import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BillHistoryService } from './services/bill-history.service';
import { BillHistory } from './schemas/bill-history.schema';
import { BillsModule } from '../bills/bills.module';

@Module({
  imports: [
    SequelizeModule.forFeature([BillHistory]),
    forwardRef(() => BillsModule),
  ],
  controllers: [],
  providers: [BillHistoryService],
  exports: [BillHistoryService],
})
export class BillHistoryModule {}
