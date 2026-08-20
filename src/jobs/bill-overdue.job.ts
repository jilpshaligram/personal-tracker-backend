import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { Bill } from '../modules/bills/schemas/bill.schema';
import { BillStatus } from '../modules/bills/enums/bill-status.enum';
import { NotificationService } from '../modules/notifications/services/notification.service';

@Injectable()
export class BillOverdueJob {
  private readonly logger = new Logger(BillOverdueJob.name);

  constructor(
    @InjectModel(Bill)
    private readonly billModel: typeof Bill,

    private readonly notificationService: NotificationService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // CRON — every day at midnight IST
  // Marks past-due PENDING bills as OVERDUE, then notifies users.
  // ─────────────────────────────────────────────────────────────────────────────

  @Cron('0 9 * * *', { timeZone: 'Asia/Kolkata' })
  async execute(): Promise<void> {
    return this.runCheck();
  }

  async triggerNow(): Promise<void> {
    return this.runCheck();
  }

  private async runCheck(): Promise<void> {
    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.logger.log('[BillOverdue] Job started.');

    try {
      const todayStr = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Kolkata',
      });

      this.logger.log(`[BillOverdue] Today (IST): ${todayStr}`);

      // Step 1: Find PENDING bills whose due date is before today
      const overdueBills = await this.billModel.findAll({
        where: {
          status: BillStatus.PENDING,
          dueDate: { [Op.lt]: todayStr },
          deletedAt: null,
        },
      });

      this.logger.log(`[BillOverdue] ${overdueBills.length} bill(s) newly overdue.`);

      let updated = 0;

      for (const bill of overdueBills) {
        // Step 2: Mark as OVERDUE in DB
        await bill.update({ status: BillStatus.OVERDUE });

        this.logger.log(
          `[BillOverdue] 🔴 Marked OVERDUE: "${bill.title}" (id=${bill.id}) | userId=${bill.userId}`,
        );

        // Step 3: Dedup — only send one OVERDUE notification per bill per day
        const since = new Date(todayStr + 'T00:00:00Z');
        const alreadySent = await this.notificationService.notificationExistsSince(
          bill.userId,
          'BILL_OVERDUE',
          bill.id,
          since,
        );

        if (alreadySent) {
          this.logger.warn(`[BillOverdue] ⏭ OVERDUE notification already sent today: "${bill.title}"`);
          continue;
        }

        const dueDateDisplay = new Date(bill.dueDate + 'T00:00:00Z').toLocaleDateString(
          'en-IN',
          { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' },
        );

        // Step 4: Create DB notification + Firebase push
        await this.notificationService.createAndPush({
          userId: bill.userId,
          type: 'BILL_OVERDUE',
          title: 'Bill Overdue!',
          message: `Your bill "${bill.title}" of ₹${bill.amount} was due on ${dueDateDisplay} and is now overdue. Please pay it immediately.`,
          referenceId: bill.id,
          referenceType: 'BILL',
        });

        this.logger.log(`[BillOverdue] ✅ OVERDUE notification sent: "${bill.title}" | userId=${bill.userId}`);

        updated++;
      }

      this.logger.log(`[BillOverdue] Done — ${updated} bill(s) marked overdue and notified.`);
    } catch (error) {
      this.logger.error(
        '[BillOverdue] ❌ Unhandled error.',
        error instanceof Error ? error.stack : String(error),
      );
    }

    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}
