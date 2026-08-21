import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BillController } from '@/modules/bills/bill.controller';
import { BillService } from '@/modules/bills/bill.service';
import { Bill } from '@/modules/bills/bill.schema';
import { BillHistory } from '@/modules/bill-history/bill-history.schema';
import { Transaction } from '@/modules/transactions/transaction.schema';
import { BillHistoryModule } from '@/modules/bill-history/bill-history.module';
import { BillReminderJob } from '@/jobs/bill-reminder.job';
import { BillOverdueJob } from '@/jobs/bill-overdue.job';
import { CloudinaryService } from '@/common/cloudinary/cloudinary.service';
import { WalletsModule } from '@/modules/wallets/wallets.module';
import { TransactionModule } from '@/modules/transactions/transaction.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Bill, BillHistory, Transaction]),
    forwardRef(() => BillHistoryModule),
    WalletsModule,
    TransactionModule,
    NotificationsModule,
  ],
  controllers: [BillController],
  providers: [BillService, CloudinaryService, BillReminderJob, BillOverdueJob],
  exports: [BillService],
})
export class BillsModule {}
