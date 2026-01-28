import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as http2 from 'http2';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';

@Injectable()
export class ApnsSender {
  private readonly logger = new Logger(ApnsSender.name);
  private session: http2.ClientHttp2Session | null = null;
  private token: string | null = null;
  private tokenGeneratedAt = 0;

  constructor(private configService: ConfigService) {}

  private getAuthToken(): string {
    const now = Math.floor(Date.now() / 1000);
    // Refresh token every 50 minutes (max 1 hour)
    if (this.token && now - this.tokenGeneratedAt < 3000) {
      return this.token;
    }

    const keyId = this.configService.get('APNS_KEY_ID');
    const teamId = this.configService.get('APNS_TEAM_ID');
    const p8Path = this.configService.get('APNS_P8_PATH');

    if (!keyId || !teamId || !p8Path) {
      throw new Error('Missing APNs configuration');
    }

    try {
      const privateKey = fs.readFileSync(p8Path, 'utf8');
      this.token = jwt.sign(
        {
          iss: teamId,
          iat: now,
        },
        privateKey,
        {
          algorithm: 'ES256',
          header: {
            alg: 'ES256',
            kid: keyId,
          },
        },
      );
      this.tokenGeneratedAt = now;
      return this.token;
    } catch (error) {
      this.logger.error('Failed to generate APNs token', error);
      throw error;
    }
  }

  private getSession(isProduction: boolean): http2.ClientHttp2Session {
    const host = isProduction
      ? 'https://api.push.apple.com'
      : 'https://api.sandbox.push.apple.com';

    if (!this.session || this.session.destroyed || this.session.closed) {
      this.session = http2.connect(host);
      this.session.on('error', (err) => {
        this.logger.error('APNs session error', err);
        this.session = null;
      });
    }
    return this.session;
  }

  async send(args: {
    deviceToken: string;
    title: string;
    body: string;
    data: Record<string, string>;
    environment: 'sandbox' | 'production';
  }): Promise<{ ok: boolean; invalidToken?: boolean; error?: string }> {
    const { deviceToken, title, body, data, environment } = args;
    const bundleId = this.configService.get('APNS_BUNDLE_ID');

    if (!bundleId) {
      this.logger.error('APNs Bundle ID not configured');
      return { ok: false, error: 'Configuration Error' };
    }

    try {
      const token = this.getAuthToken();
      const session = this.getSession(environment === 'production');

      const payload = {
        aps: {
          alert: {
            title,
            body,
          },
          sound: 'default',
        },
        ...data,
      };

      return new Promise((resolve) => {
        const req = session.request({
          ':method': 'POST',
          ':path': `/3/device/${deviceToken}`,
          authorization: `bearer ${token}`,
          'apns-topic': bundleId,
          'apns-push-type': 'alert', // Required for iOS 13+
          'apns-priority': '10',
        });

        let data = '';
        req.on('data', (chunk) => (data += chunk));

        req.on('response', (headers) => {
          const status = headers[':status'];
          if (status === 200) {
            resolve({ ok: true });
          } else {
            const responseBody = data ? JSON.parse(data) : {};
            const reason = responseBody.reason;
            this.logger.warn(`APNs error: ${status} ${reason}`);

            if (
              status === 410 ||
              reason === 'BadDeviceToken' ||
              reason === 'Unregistered'
            ) {
              resolve({ ok: false, invalidToken: true, error: reason });
            } else {
              resolve({ ok: false, error: reason || `Status ${status}` });
            }
          }
        });

        req.on('error', (err) => {
          this.logger.error('APNs request error', err);
          resolve({ ok: false, error: err.message });
        });

        req.end(JSON.stringify(payload));
      });
    } catch (error: any) {
      this.logger.error('Failed to send APNs notification', error);
      return { ok: false, error: error.message };
    }
  }
}
