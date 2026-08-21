import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';
import { Budget } from '../modules/budgets/schemas/budget.schema';
import { BudgetService } from '../modules/budgets/services/budget.service';
import { NotificationService } from '../modules/notifications/services/notification.service';

@Injectable()
export class BudgetAlertJob {
  private readonly logger = new Logger(BudgetAlertJob.name);

  // 80% threshold
  private readonly ALERT_THRESHOLD = 0.8;

  constructor(
    @InjectModel(Budget)
    private readonly budgetModel: typeof Budget,
    private readonly budgetService: BudgetService,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron('0 9 * * *', { timeZone: 'Asia/Kolkata' }) // Daily at 10 AM IST
  async execute(): Promise<void> {
    return this.runCheck();
  }

  async triggerNow(): Promise<void> {
    return this.runCheck();
  }

  private async runCheck(): Promise<void> {
    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.logger.log('[BudgetAlert] Scheduler started.');

    try {
      const todayStr = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Kolkata',
      });
      const todayMs = new Date(todayStr + 'T00:00:00Z').getTime();

      this.logger.log(`[BudgetAlert] Today (IST): ${todayStr}`);

      // Find active budgets
      const activeBudgets = await this.budgetModel.findAll({
        where: { isActive: true },
      });

      this.logger.log(
        `[BudgetAlert] ${activeBudgets.length} active budget(s) found.`,
      );

      let alertsSent = 0;

      for (const budget of activeBudgets) {
        // Skip if budget hasn't started or already ended before today
        const startMs = new Date(budget.startDate + 'T00:00:00Z').getTime();
        const endMs = new Date(budget.endDate + 'T00:00:00Z').getTime();
        if (todayMs < startMs || todayMs > endMs) continue;

        const spentAmount = await this.budgetService.getSpentAmountForBudget(
          budget.userId,
          budget.startDate,
          budget.endDate,
        );

        const spentRatio = spentAmount / budget.amount;
        const remainingDays = Math.max(
          0,
          Math.round((endMs - todayMs) / 86_400_000),
        );

        this.logger.debug(
          `[BudgetAlert] Budget ${budget.id}: Spent ${spentAmount} of ${budget.amount} (${(spentRatio * 100).toFixed(1)}%). Ends in ${remainingDays} days.`,
        );

        const periodStart = new Date(budget.startDate + 'T00:00:00Z');

        // 1. BUDGET_EXCEEDED
        if (spentAmount > budget.amount) {
          const alreadySent =
            await this.notificationService.notificationExistsSince(
              budget.userId,
              'BUDGET_EXCEEDED',
              budget.id,
              periodStart,
            );

          if (!alreadySent) {
            await this.notificationService.createAndPush({
              userId: budget.userId,
              type: 'BUDGET_EXCEEDED',
              title: 'Budget Exceeded!',
              message: `You have spent ₹${spentAmount} on your budget (Limit: ₹${budget.amount}). You have exceeded your budget.`,
              referenceId: budget.id,
              referenceType: 'BUDGET',
            });
            this.logger.log(
              `[BudgetAlert] 🔴 BUDGET_EXCEEDED alert sent for budget ${budget.id}`,
            );
            alertsSent++;
          }
        }
        // 2. BUDGET_THRESHOLD (80%)
        else if (spentRatio >= this.ALERT_THRESHOLD) {
          const alreadySent =
            await this.notificationService.notificationExistsSince(
              budget.userId,
              'BUDGET_THRESHOLD',
              budget.id,
              periodStart,
            );

          if (!alreadySent) {
            await this.notificationService.createAndPush({
              userId: budget.userId,
              type: 'BUDGET_THRESHOLD',
              title: 'Budget Alert',
              message: `You have used ${Math.round(spentRatio * 100)}% of your budget (₹${spentAmount} / ₹${budget.amount}). Be careful with your spending!`,
              referenceId: budget.id,
              referenceType: 'BUDGET',
            });
            this.logger.log(
              `[BudgetAlert] 🟠 BUDGET_THRESHOLD alert sent for budget ${budget.id}`,
            );
            alertsSent++;
          }
        }

        // 3. BUDGET_ENDING (3 days left, spent > 0)
        if (remainingDays <= 3 && remainingDays >= 0 && spentAmount > 0) {
          // We only want to notify once when it enters the 3-day window
          // Check if sent in the last 4 days (to cover the 3-day window)
          const windowStart = new Date(todayMs - 4 * 86_400_000);
          const sinceDate =
            windowStart > periodStart ? windowStart : periodStart;

          const alreadySent =
            await this.notificationService.notificationExistsSince(
              budget.userId,
              'BUDGET_ENDING',
              budget.id,
              sinceDate,
            );

          if (!alreadySent && spentAmount < budget.amount) {
            await this.notificationService.createAndPush({
              userId: budget.userId,
              type: 'BUDGET_ENDING',
              title: 'Budget Ending Soon',
              message: `Your budget period ends in ${remainingDays} days. You have ₹${budget.amount - spentAmount} left to spend.`,
              referenceId: budget.id,
              referenceType: 'BUDGET',
            });
            this.logger.log(
              `[BudgetAlert] ⏳ BUDGET_ENDING alert sent for budget ${budget.id}`,
            );
            alertsSent++;
          }
        }
      }

      this.logger.log(`[BudgetAlert] Done — ${alertsSent} alert(s) sent.`);
    } catch (error) {
      this.logger.error(
        '[BudgetAlert] ❌ Unhandled error.',
        error instanceof Error ? error.stack : String(error),
      );
    }
    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}
