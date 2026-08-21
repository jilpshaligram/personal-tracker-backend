import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Document } from '@/modules/documents/document.model';
import { NotificationService } from '@/modules/notifications/notification.service';

@Injectable()
export class DocumentReminderService {
  private readonly logger = new Logger(DocumentReminderService.name);

  constructor(
    @InjectModel(Document)
    private readonly documentModel: typeof Document,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron('0 9 * * *', { timeZone: 'Asia/Kolkata' })
  async checkDocumentExpiryReminders(): Promise<void> {
    return this.runCheck();
  }

  async triggerNow(): Promise<void> {
    return this.runCheck();
  }

  private async runCheck(): Promise<void> {
    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.logger.log('[DocumentReminder] Scheduler started.');

    try {
      const todayStr = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Kolkata',
      });

      this.logger.log(`[DocumentReminder] Today (IST): ${todayStr}`);

      const documents = await this.documentModel.findAll({
        where: {
          expiryDate: { [Op.not]: null },
        },
      });

      this.logger.log(
        `[DocumentReminder] ${documents.length} document(s) with an expiry date found.`,
      );

      let created = 0;
      let skipped = 0;

      for (const doc of documents) {
        if (!doc.expiryDate) continue;

        const expiryStr = new Date(doc.expiryDate).toISOString().slice(0, 10);

        const expiryMs = new Date(expiryStr + 'T00:00:00Z').getTime();
        const todayMs = new Date(todayStr + 'T00:00:00Z').getTime();

        const daysUntilExpiry = Math.round((expiryMs - todayMs) / 86_400_000);

        const reminderDays = [doc.reminderDaysBefore ?? 7, 3, 1, 0];

        const uniqueReminderDays = [...new Set(reminderDays)];

        this.logger.debug(
          `[DocumentReminder] "${doc.title}" | id=${doc.id} | userId=${doc.userId}` +
            ` | expiryDate=${expiryStr}` +
            ` | configuredReminder=${doc.reminderDaysBefore ?? 7}` +
            ` | daysUntilExpiry=${daysUntilExpiry}` +
            ` | reminderDays=[${uniqueReminderDays.join(', ')}]`,
        );

        if (!uniqueReminderDays.includes(daysUntilExpiry)) {
          continue;
        }

        this.logger.log(
          `[DocumentReminder] 🔔 Reminder day reached!` +
            ` "${doc.title}" (id=${doc.id}) | userId=${doc.userId}` +
            ` | expires ${expiryStr}`,
        );

        const currentYear = new Date().getFullYear();
        const existing =
          await this.notificationService.findExistingDocumentNotification(
            doc.userId,
            doc.id,
            currentYear,
          );

        if (existing) {
          this.logger.warn(
            `[DocumentReminder] ⏭ Skipped — already notified this year.` +
              ` doc="${doc.title}" (id=${doc.id}) existingNotif=${existing.id}`,
          );
          skipped++;
          continue;
        }
        const expiryDisplay = new Date(
          expiryStr + 'T00:00:00Z',
        ).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          timeZone: 'Asia/Kolkata',
        });

        const notification = await this.notificationService.createAndPush({
          userId: doc.userId,
          type: 'DOCUMENT_EXPIRING',
          title: 'Document Expiring Soon',
          message: `Your document "${doc.title}" will expire on ${expiryDisplay}. Please renew it before it expires.`,
          referenceId: doc.id,
          referenceType: 'DOCUMENT',
        });

        this.logger.log(
          `[DocumentReminder] ✅ Notification created.` +
            ` notifId=${notification.id} | doc="${doc.title}" (id=${doc.id})` +
            ` | userId=${doc.userId}`,
        );

        created++;
      }

      this.logger.log(
        `[DocumentReminder] Done — ✅ ${created} created, ⏭ ${skipped} skipped.`,
      );
    } catch (error) {
      this.logger.error(
        '[DocumentReminder] ❌ Unhandled error during expiry check.',
        error instanceof Error ? error.message : String(error),
      );
    }

    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}
