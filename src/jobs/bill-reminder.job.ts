import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';
import { Bill } from '../modules/bills/schemas/bill.schema';
import { BillStatus } from '../modules/bills/enums/bill-status.enum';
import { Op } from 'sequelize';

@Injectable()
export class BillReminderJob {
  private readonly logger = new Logger(BillReminderJob.name);

  constructor(
    @InjectModel(Bill)
    private readonly billModel: typeof Bill,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async execute() {
    this.logger.log('Executing Bill Reminder job...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const bills = await this.billModel.findAll({
        where: {
          status: {
            [Op.in]: [BillStatus.PENDING, BillStatus.OVERDUE],
          },
          deletedAt: null,
        },
      });

      for (const bill of bills) {
        const dueDate = new Date(bill.dueDate);
        const diffDays = Math.ceil(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        for (const reminderDay of bill.reminderDaysBefore) {
          if (diffDays === reminderDay) {
            const lastReminderDate = bill.lastReminderSentAt
              ? new Date(bill.lastReminderSentAt)
              : null;
            const shouldSend =
              !lastReminderDate ||
              lastReminderDate.toISOString().split('T')[0] !==
                today.toISOString().split('T')[0];

            if (shouldSend) {
              this.logger.log(
                `Sending reminder for bill ${bill.id} - ${bill.title}`,
              );
              await bill.update({ lastReminderSentAt: today });
            }
          }
        }
      }

      this.logger.log('Bill Reminder job completed successfully');
    } catch (error) {
      this.logger.error('Bill Reminder job failed', error);
    }
  }
}
