import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BillController } from './controllers/bill.controller';
import { BillService } from './services/bill.service';
import { Bill } from './schemas/bill.schema';
import { BillHistory } from '../bill-history/schemas/bill-history.schema';
import { Transaction } from '../transactions/schemas/transaction.schema';
import { BillHistoryModule } from '../bill-history/bill-history.module';
import { BillReminderJob } from '../../jobs/bill-reminder.job';
import { BillOverdueJob } from '../../jobs/bill-overdue.job';
import { SecurityModule } from '../../infrastructure/security/security.module';
import { CloudinaryModule } from '../../common/cloudinary/cloudinary.module';
import { WalletsModule } from '../wallets/wallets.module';
import { TransactionModule } from '../transactions/transaction.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Bill, BillHistory, Transaction]),
    forwardRef(() => BillHistoryModule),
    WalletsModule,
    TransactionModule,
    SecurityModule,
    CloudinaryModule,
    WalletsModule,
    TransactionModule,
  ],
  controllers: [BillController],
  providers: [BillService, BillReminderJob, BillOverdueJob],
  exports: [BillService],
})
export class BillsModule {}
