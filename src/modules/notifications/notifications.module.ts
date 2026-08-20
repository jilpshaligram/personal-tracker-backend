import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { NotificationController } from './controllers/notification.controller';

import { NotificationService } from './services/notification.service';
import { FirebaseService } from './services/firebase.service';
import { DocumentReminderService } from './services/document-reminder.service';

import { Notification } from './schemas/notification.schema';
import { NotificationDevice } from './schemas/notification-device.schema';

import { Document } from '../documents/models/document.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Notification,
      NotificationDevice,
      Document,
    ]),
  ],

  controllers: [
    NotificationController,
  ],

  providers: [
    NotificationService,
    FirebaseService,
    DocumentReminderService,
  ],

  exports: [
    NotificationService,
    FirebaseService,
  ],
})
export class NotificationsModule {}