import { Injectable, Logger } from '@nestjs/common';

import {
  App,
  cert,
  getApp,
  getApps,
  initializeApp,
} from 'firebase-admin/app';

import {
  getMessaging,
  Messaging,
} from 'firebase-admin/messaging';

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);

  private readonly firebaseApp: App;
  private readonly messaging: Messaging;

  constructor() {
    if (getApps().length === 0) {
      this.firebaseApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey:
            process.env.FIREBASE_PRIVATE_KEY?.replace(
              /\\n/g,
              '\n',
            ),
        }),
      });

      this.logger.log('Firebase initialized');
    } else {
      this.firebaseApp = getApp();
    }

    this.messaging = getMessaging(this.firebaseApp);
  }

  async sendNotification(
    deviceToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    try {
      const response = await this.messaging.send({
        token: deviceToken,

        notification: {
          title,
          body,
        },

        data: data ?? {},
      });

      this.logger.log(
        `Firebase notification sent successfully: ${response}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Firebase notification failed for token ${deviceToken}`,
        error,
      );

      throw error;
    }
  }
}