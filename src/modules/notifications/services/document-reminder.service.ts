import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { Document } from '../../documents/models/document.model';
import { NotificationService } from './notification.service';

@Injectable()
export class DocumentReminderService {
  private readonly logger = new Logger(DocumentReminderService.name);

  constructor(
    @InjectModel(Document)
    private readonly documentModel: typeof Document,

    private readonly notificationService: NotificationService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // CRON — runs every day at 09:00 AM IST
  // ─────────────────────────────────────────────────────────────────────────────

  @Cron('0 9 * * *', { timeZone: 'Asia/Kolkata' })
  async checkDocumentExpiryReminders(): Promise<void> {
    return this.runCheck();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PUBLIC — manual trigger for testing (used by POST /notifications/test-reminder)
  // ─────────────────────────────────────────────────────────────────────────────

  async triggerNow(): Promise<void> {
    return this.runCheck();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CORE LOGIC
  // ─────────────────────────────────────────────────────────────────────────────

  private async runCheck(): Promise<void> {
    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.logger.log('[DocumentReminder] Scheduler started.');

    try {
      const todayStr = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Kolkata',
      });

      this.logger.log(`[DocumentReminder] Today (IST): ${todayStr}`);

      // Fetch only documents that have an expiry date set and are not soft-deleted
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

        // ── Compute dates as plain strings to avoid timezone drift ──────────
        // DATEONLY columns come back as "2026-08-25T00:00:00.000Z" or "2026-08-25".
        // Normalise to a plain YYYY-MM-DD string in either case.
        const expiryStr = new Date(doc.expiryDate).toISOString().slice(0, 10); // "2026-08-25"

        const expiryMs = new Date(expiryStr + 'T00:00:00Z').getTime();
        const todayMs = new Date(todayStr + 'T00:00:00Z').getTime();

        const daysUntilExpiry = Math.round((expiryMs - todayMs) / 86_400_000);

        // ── Reminder schedule ────────────────────────────────────────────────
        // First reminder comes from DB.
        // If DB value is null/undefined, default to 7.
        // Then always remind at 3, 1 and 0 days.
        const reminderDays = [doc.reminderDaysBefore ?? 7, 3, 1, 0];

        // Remove duplicates if DB value itself is 3, 1 or 0.
        const uniqueReminderDays = [...new Set(reminderDays)];

        this.logger.debug(
          `[DocumentReminder] "${doc.title}" | id=${doc.id} | userId=${doc.userId}` +
            ` | expiryDate=${expiryStr}` +
            ` | configuredReminder=${doc.reminderDaysBefore ?? 7}` +
            ` | daysUntilExpiry=${daysUntilExpiry}` +
            ` | reminderDays=[${uniqueReminderDays.join(', ')}]`,
        );

        // ── Not a reminder day — skip ────────────────────────────────────────
        if (!uniqueReminderDays.includes(daysUntilExpiry)) {
          continue;
        }

        this.logger.log(
          `[DocumentReminder] 🔔 Reminder day reached!` +
            ` "${doc.title}" (id=${doc.id}) | userId=${doc.userId}` +
            ` | expires ${expiryStr}`,
        );

        // ── Duplicate guard — one notification per document per calendar year ─
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

        // ── Human-friendly expiry date for the message ───────────────────────
        const expiryDisplay = new Date(
          expiryStr + 'T00:00:00Z',
        ).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          timeZone: 'Asia/Kolkata',
        });

        // ── Create DB notification + send Firebase push ──────────────────────
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
        error instanceof Error ? error.stack : String(error),
      );
    }

    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}
