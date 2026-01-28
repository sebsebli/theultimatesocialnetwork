import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown, Inject } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Neo4jService } from '../database/neo4j.service';
import { NotificationHelperService } from '../shared/notification-helper.service';

interface FollowJobData {
  type: 'follow' | 'unfollow';
  followerId: string;
  followeeId: string;
}

@Injectable()
export class FollowWorker implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(FollowWorker.name);
  private worker: Worker;

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private configService: ConfigService,
    private neo4jService: Neo4jService,
    private notificationHelper: NotificationHelperService,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  onApplicationBootstrap() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    
    this.worker = new Worker<FollowJobData>('follow-processing', async (job: Job<FollowJobData>) => {
      await this.processFollow(job.data);
    }, { 
        connection: new Redis(redisUrl || 'redis://redis:6379', { maxRetriesPerRequest: null }) 
    });
    
    this.worker.on('failed', (job, err) => {
        this.logger.error(`Job ${job?.id} failed: ${err.message}`);
    });
  }

  onApplicationShutdown() {
    this.worker.close().catch((err: Error) => {
      console.error('Error closing worker', err);
    });
  }

  async processFollow(data: FollowJobData) {
      const { type, followerId, followeeId } = data;
      
      try {
          if (type === 'follow') {
              // 1. Update Counters (Eventual Consistency)
              await this.userRepo.increment({ id: followeeId }, 'followerCount', 1);
              await this.userRepo.increment({ id: followerId }, 'followingCount', 1);
              
              // 2. Neo4j Sync
              await this.neo4jService.run(
                `
                MERGE (u1:User {id: $followerId})
                MERGE (u2:User {id: $followeeId})
                MERGE (u1)-[:FOLLOWS]->(u2)
                `,
                { followerId, followeeId }
              );
              
              // 3. Notification
              // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
              await this.notificationHelper.createNotification({
                userId: followeeId,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                type: 'FOLLOW' as any,
                actorUserId: followerId,
              });
          } else {
              // Unfollow
              await this.userRepo.decrement({ id: followeeId }, 'followerCount', 1);
              await this.userRepo.decrement({ id: followerId }, 'followingCount', 1);
              
              await this.neo4jService.run(
                `
                MATCH (u1:User {id: $followerId})-[r:FOLLOWS]->(u2:User {id: $followeeId})
                DELETE r
                `,
                { followerId, followeeId }
              );
          }
      } catch (e) {
          this.logger.error(`Error processing follow job ${type}`, e);
          throw e;
      }
  }
}
