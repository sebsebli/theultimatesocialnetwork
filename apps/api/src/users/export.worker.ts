import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown, Inject } from '@nestjs/common';
import { UsersService } from './users.service';
import { Worker, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import archiver from 'archiver';
import Redis from 'ioredis';
import { EmailService } from '../shared/email.service';
import { defaultQueueConfig } from '../common/queue-config';

interface ExportJobData {
  userId: string;
  email: string;
}

@Injectable()
export class ExportWorker implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(ExportWorker.name);
  private worker: Worker;

  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
    private emailService: EmailService,
    @Inject('REDIS_CLIENT') private redis: Redis, 
  ) {}

  onApplicationBootstrap() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    
    this.worker = new Worker<ExportJobData>('data-export', async (job: Job<ExportJobData>) => {
      this.logger.log(`Processing export for user ${job.data.userId}`);
      await this.processExport(job.data.userId, job.data.email);
    }, { 
        connection: new Redis(redisUrl || 'redis://redis:6379', { maxRetriesPerRequest: null }),
        ...defaultQueueConfig,
    });
    
    this.worker.on('failed', (job, err) => {
        this.logger.error(`Job ${job?.id} failed: ${err.message}`);
    });
  }

  onApplicationShutdown() {
    this.worker.close().catch(err => console.error(err));
  }

  async processExport(userId: string, userEmail: string) {
    // 1. Fetch Data
    const data = await this.usersService.exportUserData(userId);
    
    // 2. Create Zip
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];
    
    archive.on('data', (chunk: Buffer) => chunks.push(chunk));
    
    return new Promise<void>((resolve, reject) => {
        archive.on('end', () => {
            const resultBuffer = Buffer.concat(chunks);
            
            // 3. Send Email
            this.emailService.sendEmail(
                userEmail, 
                'Your Data Export', 
                '<p>Attached is your requested data export.</p>',
                'Attached is your requested data export.',
                [{ filename: 'cite-export.zip', content: resultBuffer }]
            ).then(() => resolve()).catch(reject);
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
}