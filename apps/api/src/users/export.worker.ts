import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  Inject,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ConfigService } from '@nestjs/config';
import archiver from 'archiver';
import { EmailService } from '../shared/email.service';
import { UploadService } from '../upload/upload.service';
import { IEventBus, EVENT_BUS } from '../common/event-bus/event-bus.interface';

interface ExportJobData {
  userId: string;
  email: string;
  lang?: string;
}

@Injectable()
export class ExportWorker implements OnApplicationBootstrap {
  private readonly logger = new Logger(ExportWorker.name);

  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
    private emailService: EmailService,
    private uploadService: UploadService,
    @Inject(EVENT_BUS) private eventBus: IEventBus,
  ) {}

  async onApplicationBootstrap() {
    await this.eventBus.subscribe<ExportJobData>(
      'data-export',
      async (_event, data) => {
        this.logger.log(`Processing export for user ${data.userId}`);
        await this.processExport(data.userId, data.email, data.lang || 'en');
      },
      { concurrency: 2 },
    );
  }

  async processExport(userId: string, userEmail: string, lang: string = 'en') {
    // 1. Fetch Data
    const raw = await this.usersService.exportUserData(userId);
    if (!raw) {
      this.logger.warn(`No user data for export: ${userId}`);
      return;
    }

    // 2. Sanitize: remove all IDs so the zip never contains user IDs or internal identifiers
    const data = this.usersService.sanitizeExportForDownload(raw);

    // 3. Create Zip
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on('data', (chunk: Buffer) => chunks.push(chunk));

    return new Promise<void>((resolve, reject) => {
      archive.on('end', () => {
        void (async () => {
          const resultBuffer = Buffer.concat(chunks);

          try {
            // 3. Upload zip to storage
            const storageKey =
              await this.uploadService.uploadExportZip(resultBuffer);
            const token = await this.usersService.createDataExport(
              userId,
              storageKey,
            );

            // 4. Build download URL (API base URL)
            const apiBase =
              this.configService.get<string>('API_PUBLIC_URL') ||
              this.configService.get<string>('BASE_URL') ||
              'http://localhost:3000';
            const baseUrl = apiBase.replace(/\/$/, '');
            const downloadUrl = `${baseUrl}/users/download-export?token=${encodeURIComponent(token)}`;

            // 5. Send email with link (no attachment)
            await this.emailService.sendDataExportLink(
              userEmail,
              downloadUrl,
              lang,
            );
            resolve();
          } catch (err) {
            reject(err instanceof Error ? err : new Error(String(err)));
          }
        })();
      });

      archive.on('error', (err: any) =>
        reject(err instanceof Error ? err : new Error(String(err))),
      );

      // Add files (sanitized data: no IDs)
      archive.append(JSON.stringify(data.user, null, 2), {
        name: 'profile.json',
      });
      archive.append(JSON.stringify(data.posts, null, 2), {
        name: 'posts.json',
      });
      archive.append(JSON.stringify(data.replies, null, 2), {
        name: 'replies.json',
      });
      archive.append(JSON.stringify(data.readHistory, null, 2), {
        name: 'reading-history.json',
      });
      archive.append(JSON.stringify(data.likes, null, 2), {
        name: 'likes.json',
      });
      archive.append(JSON.stringify(data.keeps, null, 2), {
        name: 'keeps.json',
      });
      archive.append(JSON.stringify(data.followers, null, 2), {
        name: 'followers.json',
      });
      archive.append(JSON.stringify(data.following, null, 2), {
        name: 'following.json',
      });
      archive.append(JSON.stringify(data.collections, null, 2), {
        name: 'collections.json',
      });
      if (data.blocks) {
        archive.append(JSON.stringify(data.blocks, null, 2), {
          name: 'blocks.json',
        });
      }
      if (data.mutes) {
        archive.append(JSON.stringify(data.mutes, null, 2), {
          name: 'mutes.json',
        });
      }
      if (data.directMessages) {
        archive.append(JSON.stringify(data.directMessages, null, 2), {
          name: 'direct-messages.json',
        });
      }
      if (data.notificationPrefs) {
        archive.append(JSON.stringify(data.notificationPrefs, null, 2), {
          name: 'notification-prefs.json',
        });
      }

      archive.finalize().catch(reject);
    });
  }
}
