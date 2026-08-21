import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { Bill } from '@/modules/bills/bill.schema';
import { BillStatus } from '@/modules/bills/enums/bill-status.enum';
import { NotificationService } from '@/modules/notifications/notification.service';

@Injectable()
export class BillReminderJob {
  private readonly logger = new Logger(BillReminderJob.name);

  constructor(
    @InjectModel(Bill)
    private readonly billModel: typeof Bill,

    private readonly notificationService: NotificationService,
  ) {}

  @Cron('0 9 * * *', { timeZone: 'Asia/Kolkata' })
  async execute(): Promise<void> {
    return this.runCheck();
  }

  async triggerNow(): Promise<void> {
    return this.runCheck();
  }

  private async runCheck(): Promise<void> {
    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.logger.log('[BillReminder] Scheduler started.');

    try {
      const todayStr = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Kolkata',
      });

      this.logger.log(`[BillReminder] Today (IST): ${todayStr}`);

      const bills = await this.billModel.findAll({
        where: {
          status: { [Op.in]: [BillStatus.PENDING, BillStatus.OVERDUE] },
          deletedAt: null,
        },
      });

      this.logger.log(
        `[BillReminder] ${bills.length} pending/overdue bill(s) found.`,
      );

      let created = 0;
      let skipped = 0;

      for (const bill of bills) {
        const dueDateStr = new Date(bill.dueDate).toISOString().slice(0, 10);

        const todayMs = new Date(todayStr + 'T00:00:00Z').getTime();
        const dueMs = new Date(dueDateStr + 'T00:00:00Z').getTime();
        const diffDays = Math.round((dueMs - todayMs) / 86_400_000);

        const dueDateDisplay = new Date(
          dueDateStr + 'T00:00:00Z',
        ).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          timeZone: 'Asia/Kolkata',
        });

        this.logger.debug(
          `[BillReminder] "${bill.title}" | id=${bill.id} | dueDate=${dueDateStr} | diffDays=${diffDays}`,
        );

        if (diffDays === 0) {
          const since = new Date(todayStr + 'T00:00:00Z');
          const alreadySent =
            await this.notificationService.notificationExistsSince(
              bill.userId,
              'BILL_DUE_TODAY',
              bill.id,
              since,
            );

          if (alreadySent) {
            this.logger.warn(
              `[BillReminder] ⏭ DUE_TODAY already sent today: "${bill.title}"`,
            );
            skipped++;
          } else {
            await this.notificationService.createAndPush({
              userId: bill.userId,
              type: 'BILL_DUE_TODAY',
              title: 'Bill Due Today',
              message: `Your bill "${bill.title}" of ₹${bill.amount} is due today. Pay it now to avoid overdue charges.`,
              referenceId: bill.id,
              referenceType: 'BILL',
            });

            this.logger.log(
              `[BillReminder] ✅ DUE_TODAY notification created: "${bill.title}"`,
            );
            created++;
          }

          continue;
        }

        const reminderDays = bill.reminderDaysBefore?.length
          ? bill.reminderDaysBefore
          : [3, 2, 1];

        for (const reminderDay of reminderDays) {
          if (diffDays !== reminderDay) continue;

          const since = new Date(todayStr + 'T00:00:00Z');
          const alreadySent =
            await this.notificationService.notificationExistsSince(
              bill.userId,
              'BILL_UPCOMING',
              bill.id,
              since,
            );

          if (alreadySent) {
            this.logger.warn(
              `[BillReminder] ⏭ UPCOMING already sent today: "${bill.title}" (${diffDays}d away)`,
            );
            skipped++;
            break;
          }

          await this.notificationService.createAndPush({
            userId: bill.userId,
            type: 'BILL_UPCOMING',
            title: 'Upcoming Bill Reminder',
            message: `Your bill "${bill.title}" of ₹${bill.amount} is due on ${dueDateDisplay} (${diffDays} day${diffDays > 1 ? 's' : ''} away).`,
            referenceId: bill.id,
            referenceType: 'BILL',
          });

          await bill.update({ lastReminderSentAt: new Date() });

          this.logger.log(
            `[BillReminder] ✅ UPCOMING notification created: "${bill.title}" (${diffDays}d away)`,
          );
          created++;
          break;
        }
      }

      this.logger.log(
        `[BillReminder] Done — ✅ ${created} created, ⏭ ${skipped} skipped.`,
      );
    } catch (error) {
      this.logger.error(
        '[BillReminder] ❌ Unhandled error.',
        error instanceof Error ? error.message : String(error),
      );
    }

    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}
