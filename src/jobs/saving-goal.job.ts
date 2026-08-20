import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { SavingGoal } from '../modules/saving-goals/schemas/saving-goal.schema';
import { SavingGoalStatus } from '../modules/saving-goals/enums/saving-goal-status.enum';
import { ReminderFrequency } from '../modules/saving-goals/enums/reminder-frequency.enum';
import { NotificationService } from '../modules/notifications/services/notification.service';

@Injectable()
export class SavingGoalJob {
  private readonly logger = new Logger(SavingGoalJob.name);

  constructor(
    @InjectModel(SavingGoal)
    private readonly savingGoalModel: typeof SavingGoal,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron('0 9 * * *', { timeZone: 'Asia/Kolkata' }) // Daily at 9 AM IST
  async execute(): Promise<void> {
    return this.runCheck();
  }

  async triggerNow(): Promise<void> {
    return this.runCheck();
  }

  private async runCheck(): Promise<void> {
    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.logger.log('[SavingGoal] Scheduler started.');

    try {
      const today = new Date();
      // IST string
      const todayStr = today.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const todayDate = new Date(todayStr + 'T00:00:00Z');
      
      const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday
      const dayOfMonth = today.getDate();

      this.logger.log(`[SavingGoal] Today (IST): ${todayStr} | DOW: ${dayOfWeek} | DOM: ${dayOfMonth}`);

      // Fetch all active goals with autoReminder enabled
      const goals = await this.savingGoalModel.findAll({
        where: {
          status: SavingGoalStatus.ACTIVE,
          autoReminder: true,
          deletedAt: null,
        },
      });

      this.logger.log(`[SavingGoal] ${goals.length} active goal(s) with auto-reminder found.`);

      let sent = 0;

      for (const goal of goals) {
        let shouldSend = false;
        let periodStart: Date = todayDate;

        switch (goal.reminderFrequency) {
          case ReminderFrequency.DAILY:
            shouldSend = true;
            periodStart = todayDate; // since start of today
            break;
          case ReminderFrequency.WEEKLY:
            // Send on Mondays
            if (dayOfWeek === 1) {
              shouldSend = true;
              periodStart = todayDate;
            }
            break;
          case ReminderFrequency.MONTHLY:
            // Send on the 1st of the month
            if (dayOfMonth === 1) {
              shouldSend = true;
              periodStart = todayDate;
            }
            break;
        }

        if (shouldSend) {
          const alreadySent = await this.notificationService.notificationExistsSince(
            goal.userId,
            'SAVING_GOAL_REMINDER',
            goal.id,
            periodStart,
          );

          if (!alreadySent) {
            await this.notificationService.createAndPush({
              userId: goal.userId,
              type: 'SAVING_GOAL_REMINDER',
              title: 'Saving Goal Reminder',
              message: `Reminder to deposit towards your goal "${goal.title}". You have saved ₹${goal.savedAmount} out of ₹${goal.targetAmount}.`,
              referenceId: goal.id,
              referenceType: 'SAVING_GOAL',
            });
            this.logger.log(`[SavingGoal] ✅ REMINDER sent for goal ${goal.id} (${goal.reminderFrequency})`);
            sent++;
          } else {
            this.logger.debug(`[SavingGoal] ⏭ REMINDER already sent for goal ${goal.id} this period.`);
          }
        }
      }

      this.logger.log(`[SavingGoal] Done — ${sent} reminder(s) sent.`);
    } catch (error) {
      this.logger.error(
        '[SavingGoal] ❌ Unhandled error.',
        error instanceof Error ? error.stack : String(error),
      );
    }
    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}
