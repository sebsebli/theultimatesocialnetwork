import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  Inject,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Worker, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import archiver from 'archiver';
import Redis from 'ioredis';
import { EmailService } from '../shared/email.service';
import { UploadService } from '../upload/upload.service';
import { defaultQueueConfig } from '../common/queue-config';

interface ExportJobData {
  userId: string;
  email: string;
  lang?: string;
}

@Injectable()
export class ExportWorker
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(ExportWorker.name);
  private worker: Worker;

  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
    private emailService: EmailService,
    private uploadService: UploadService,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  onApplicationBootstrap() {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    this.worker = new Worker<ExportJobData>(
      'data-export',
      async (job: Job<ExportJobData>) => {
        this.logger.log(`Processing export for user ${job.data.userId}`);
        await this.processExport(
          job.data.userId,
          job.data.email,
          job.data.lang || 'en',
        );
      },
      {
        connection: new Redis(redisUrl || 'redis://redis:6379', {
          maxRetriesPerRequest: null,
        }),
        ...defaultQueueConfig,
      },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed: ${err.message}`);
    });
  }

  onApplicationShutdown() {
    this.worker.close().catch((err) => console.error(err));
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
      if (data.notificationPrefs) {
        archive.append(JSON.stringify(data.notificationPrefs, null, 2), {
          name: 'notification-prefs.json',
        });
      }

      archive.finalize().catch(reject);
    });
  }
}
