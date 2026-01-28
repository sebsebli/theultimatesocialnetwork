import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as admin from 'firebase-admin';

@Injectable()
export class FcmSender {
  private readonly logger = new Logger(FcmSender.name);
  private initialized = false;

  constructor(private configService: ConfigService) {
    this.initialize();
  }

  private initialize() {
    const serviceAccountPath = this.configService.get<string>(
      'FCM_SERVICE_ACCOUNT_JSON',
    );
    if (!serviceAccountPath) {
      this.logger.warn('FCM_SERVICE_ACCOUNT_JSON not set, FCM will not work');
      return;
    }

    try {
      if (!admin.apps.length) {
        const serviceAccount = JSON.parse(
          fs.readFileSync(serviceAccountPath, 'utf8'),
        ) as admin.ServiceAccount;
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        this.initialized = true;
        this.logger.log('FCM initialized successfully');
      } else {
        this.initialized = true;
      }
    } catch (error) {
      this.logger.error('Failed to initialize FCM', error);
    }
  }

  async send(args: {
    token: string;
    title: string;
    body: string;
    data: Record<string, string>;
  }): Promise<{ ok: boolean; invalidToken?: boolean; error?: string }> {
    if (!this.initialized) {
      return { ok: false, error: 'FCM not initialized' };
    }

    try {
      const message: admin.messaging.Message = {
        token: args.token,
        notification: {
          title: args.title,
          body: args.body,
        },
        data: args.data,
      };

      await admin.messaging().send(message);
      return { ok: true };
    } catch (error) {
      const err = error as { code?: string; message: string };
      this.logger.error('FCM send error', err);

      const errorCode = err.code;
      if (
        errorCode === 'messaging/registration-token-not-registered' ||
        errorCode === 'messaging/invalid-argument'
      ) {
        return { ok: false, invalidToken: true, error: errorCode };
      }

      return { ok: false, error: err.message };
    }
  }
}
