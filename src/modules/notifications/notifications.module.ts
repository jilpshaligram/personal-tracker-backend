import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { NotificationController } from '@/modules/notifications/notification.controller';

import { NotificationService } from '@/modules/notifications/notification.service';
import { FirebaseService } from '@/common/firebase/firebase.service';
import { DocumentReminderService } from '@/common/document-reminder/document-reminder.service';

import { Notification } from '@/modules/notifications/notification.schema';
import { NotificationDevice } from '@/modules/notifications/notification-device.schema';

import { Document } from '@/modules/documents/document.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Notification, NotificationDevice, Document]),
  ],

  controllers: [NotificationController],

  providers: [NotificationService, FirebaseService, DocumentReminderService],

  exports: [NotificationService, FirebaseService],
})
export class NotificationsModule {}
