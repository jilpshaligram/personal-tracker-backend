import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BillController } from './controllers/bill.controller';
import { BillService } from './services/bill.service';
import { Bill } from './schemas/bill.schema';
import { BillHistoryModule } from '../bill-history/bill-history.module';
import { BillReminderJob } from '../../jobs/bill-reminder.job';
import { BillOverdueJob } from '../../jobs/bill-overdue.job';
import { SecurityModule } from '../../infrastructure/security/security.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Bill]),
    forwardRef(() => BillHistoryModule),
    SecurityModule,
  ],
  controllers: [BillController],
  providers: [BillService, BillReminderJob, BillOverdueJob],
  exports: [BillService],
})
export class BillsModule {}
