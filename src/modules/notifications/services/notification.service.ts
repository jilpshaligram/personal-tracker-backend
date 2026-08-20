import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { NotificationDevice } from '../schemas/notification-device.schema';
import { Notification } from '../schemas/notification.schema';
import { FirebaseService } from './firebase.service';

interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: string;
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification)
    private readonly notificationModel: typeof Notification,

    @InjectModel(NotificationDevice)
    private readonly notificationDeviceModel: typeof NotificationDevice,

    private readonly firebaseService: FirebaseService,
  ) {}

  // --------------------------------------------------
  // CREATE NOTIFICATION (DB only)
  // --------------------------------------------------

  async createNotification(
    params: CreateNotificationParams,
  ): Promise<Notification> {
    return this.notificationModel.create({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      referenceId: params.referenceId ?? null,
      referenceType: params.referenceType ?? null,
      isRead: false,
      readAt: null,
    });
  }

  // --------------------------------------------------
  // CREATE NOTIFICATION + SEND FIREBASE PUSH
  //
  // Use this from schedulers/jobs instead of calling
  // createNotification() and sendNotificationToUser() separately.
  // Firebase errors are caught and logged — they never block DB writes.
  // --------------------------------------------------

  async createAndPush(
    params: CreateNotificationParams,
    data?: Record<string, string>,
  ): Promise<Notification> {
    // 1. Save to DB first — always succeeds regardless of Firebase
    const notification = await this.createNotification(params);

    // 2. Attempt Firebase push — silently fails if no devices / bad token
    try {
      const pushResult = await this.sendNotificationToUser(
        params.userId,
        params.title,
        params.message,
        {
          type: params.type,
          notificationId: notification.id,
          referenceId: params.referenceId ?? '',
          referenceType: params.referenceType ?? '',
          ...data,
        },
      );

      if (pushResult.sent > 0 || pushResult.failed > 0) {
        console.log(
          `[NotificationService] Push for ${params.type} → sent=${pushResult.sent} failed=${pushResult.failed}`,
        );
      }
    } catch (err) {
      console.error(
        `[NotificationService] Push failed for ${params.type}:`,
        err,
      );
    }

    return notification;
  }

  // --------------------------------------------------
  // GET USER NOTIFICATIONS
  // --------------------------------------------------

  async getUserNotifications(userId: string) {
    return this.notificationModel.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });
  }

  // --------------------------------------------------
  // MARK ONE AS READ
  // --------------------------------------------------

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.notificationModel.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return null;
    }

    notification.isRead = true;
    notification.readAt = new Date();

    await notification.save();

    return notification;
  }

  // --------------------------------------------------
  // MARK ALL AS READ
  // --------------------------------------------------

  async markAllAsRead(userId: string) {
    await this.notificationModel.update(
      { isRead: true, readAt: new Date() },
      { where: { userId, isRead: false } },
    );

    return true;
  }

  // --------------------------------------------------
  // UNREAD COUNT
  // --------------------------------------------------

  async getUnreadCount(userId: string) {
    return this.notificationModel.count({
      where: { userId, isRead: false },
    });
  }

  // --------------------------------------------------
  // REGISTER DEVICE
  // --------------------------------------------------

  async registerDevice(userId: string, deviceToken: string, platform: string) {
    const existingDevice = await this.notificationDeviceModel.findOne({
      where: { deviceToken },
    });

    if (existingDevice) {
      existingDevice.userId = userId;
      existingDevice.platform = platform;
      existingDevice.isActive = true;

      await existingDevice.save();

      return existingDevice;
    }

    return this.notificationDeviceModel.create({
      userId,
      deviceToken,
      platform,
      isActive: true,
    });
  }

  // --------------------------------------------------
  // SEND PUSH NOTIFICATION TO USER
  //
  // Finds all active device tokens for userId, sends push to each.
  // Automatically disables invalid/unregistered tokens.
  // --------------------------------------------------

  async sendNotificationToUser(
    userId: string,
    title: string,
    message: string,
    data?: Record<string, string>,
  ) {
    const devices = await this.notificationDeviceModel.findAll({
      where: { userId, isActive: true },
    });

    let sent = 0;
    let failed = 0;

    for (const device of devices) {
      try {
        await this.firebaseService.sendNotification(
          device.deviceToken,
          title,
          message,
          data,
        );

        sent++;
      } catch (error: any) {
        failed++;

        const errorCode = error?.errorInfo?.code;

        console.error(
          `[NotificationService] Push failed for device ${device.id}: ${errorCode ?? error?.message}`,
        );

        // ── Invalid token cleanup ──────────────────────────────────────────
        // Automatically deactivate tokens that Firebase says are unregistered
        // or invalid. This prevents accumulating dead tokens.
        if (
          errorCode === 'messaging/registration-token-not-registered' ||
          errorCode === 'messaging/invalid-registration-token'
        ) {
          device.isActive = false;
          await device.save();

          console.log(
            `[NotificationService] Device ${device.id} deactivated (invalid token).`,
          );
        }
      }
    }

    return { sent, failed };
  }

  // --------------------------------------------------
  // FIND EXISTING DOCUMENT NOTIFICATION (duplicate guard)
  //
  // Returns a notification if one already exists for this document
  // in the given calendar year. Used by DocumentReminderService
  // to prevent spamming the same annual reminder.
  // --------------------------------------------------

  async findExistingDocumentNotification(
    userId: string,
    documentId: string,
    year: number,
  ): Promise<Notification | null> {
    const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);
    const yearEnd = new Date(`${year + 1}-01-01T00:00:00.000Z`);

    return this.notificationModel.findOne({
      where: {
        userId,
        type: 'DOCUMENT_EXPIRING',
        referenceId: documentId,
        referenceType: 'DOCUMENT',
        createdAt: {
          [Op.gte]: yearStart,
          [Op.lt]: yearEnd,
        },
      },
    });
  }

  // --------------------------------------------------
  // FIND EXISTING NOTIFICATION (generic duplicate guard)
  //
  // Used by bill / budget / saving-goal jobs to check if a
  // notification of a given type already exists for a reference
  // since a given date.
  // --------------------------------------------------

  async notificationExistsSince(
    userId: string,
    type: string,
    referenceId: string,
    since: Date,
  ): Promise<boolean> {
    const count = await this.notificationModel.count({
      where: {
        userId,
        type,
        referenceId,
        createdAt: { [Op.gte]: since },
      },
    });

    return count > 0;
  }
}