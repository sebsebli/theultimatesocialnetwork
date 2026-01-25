import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown, Inject } from '@nestjs/common';
import { UsersService } from './users.service';
import { Worker, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import archiver from 'archiver';
import * as nodemailer from 'nodemailer';
import Redis from 'ioredis';
import { Readable } from 'stream';

@Injectable()
export class ExportWorker implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(ExportWorker.name);
  private worker: Worker;

  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
    @Inject('REDIS_CLIENT') private redis: Redis, 
  ) {}

  onApplicationBootstrap() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    
    this.worker = new Worker('data-export', async (job: Job) => {
      this.logger.log(`Processing export for user ${job.data.userId}`);
      await this.processExport(job.data.userId, job.data.email);
    }, { 
        connection: new Redis(redisUrl || 'redis://redis:6379', { maxRetriesPerRequest: null }) 
    });
    
    this.worker.on('failed', (job, err) => {
        this.logger.error(`Job ${job?.id} failed: ${err.message}`);
    });
  }

  onApplicationShutdown() {
    this.worker.close();
  }

  async processExport(userId: string, userEmail: string) {
    // 1. Fetch Data
    const data = await this.usersService.exportUserData(userId);
    
    // 2. Create Zip
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];
    
    archive.on('data', (chunk: Buffer) => chunks.push(chunk));
    
    return new Promise<void>((resolve, reject) => {
        archive.on('end', async () => {
            const resultBuffer = Buffer.concat(chunks);
            
            // 3. Send Email
            await this.sendEmail(userEmail, resultBuffer);
            resolve();
        });
        
        archive.on('error', (err: any) => reject(err));

        // Add files
        archive.append(JSON.stringify(data.user, null, 2), { name: 'profile.json' });
        archive.append(JSON.stringify(data.posts, null, 2), { name: 'posts.json' });
        archive.append(JSON.stringify(data.replies, null, 2), { name: 'replies.json' });
        archive.append(JSON.stringify(data.readHistory, null, 2), { name: 'reading-history.json' });
        archive.append(JSON.stringify(data.likes, null, 2), { name: 'likes.json' });
        archive.append(JSON.stringify(data.keeps, null, 2), { name: 'keeps.json' });
        archive.append(JSON.stringify(data.followers, null, 2), { name: 'followers.json' });
        archive.append(JSON.stringify(data.following, null, 2), { name: 'following.json' });
        
        archive.finalize();
    });
  }

  async sendEmail(to: string, attachment: Buffer) {
    // Mock Email Service if keys not present
    const host = this.configService.get('SMTP_HOST');
    if (!host) {
        this.logger.log(`[MOCK EMAIL] To: ${to} | Subject: Your Data Export | Attachment Size: ${attachment.length} bytes`);
        return;
    }

    const transporter = nodemailer.createTransport({
        host: host,
        port: parseInt(this.configService.get('SMTP_PORT') || '587'),
        secure: this.configService.get('SMTP_SECURE') === 'true',
        auth: {
            user: this.configService.get('SMTP_USER'),
            pass: this.configService.get('SMTP_PASS'),
        },
    });

    await transporter.sendMail({
        from: '"Cite System" <noreply@cite.com>',
        to: to,
        subject: 'Your Data Export',
        text: 'Attached is your requested data export.',
        attachments: [
            {
                filename: 'cite-export.zip',
                content: attachment,
            },
        ],
    });
    this.logger.log(`Email sent to ${to}`);
  }
}
