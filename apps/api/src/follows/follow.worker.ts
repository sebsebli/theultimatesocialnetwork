import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { NotificationType } from '../entities/notification.entity';
import { Neo4jService } from '../database/neo4j.service';
import { NotificationHelperService } from '../shared/notification-helper.service';
import { IEventBus, EVENT_BUS } from '../common/event-bus/event-bus.interface';
import Redis from 'ioredis';

interface FollowJobData {
  type: 'follow' | 'unfollow';
  followerId: string;
  followeeId: string;
}

@Injectable()
export class FollowWorker implements OnApplicationBootstrap {
  private readonly logger = new Logger(FollowWorker.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private neo4jService: Neo4jService,
    private notificationHelper: NotificationHelperService,
    @Inject('REDIS_CLIENT') private redis: Redis,
    @Inject(EVENT_BUS) private eventBus: IEventBus,
  ) { }

  async onApplicationBootstrap() {
    await this.eventBus.subscribe<FollowJobData>(
      'follow-processing',
      async (_event, data) => {
        await this.processFollow(data);
      },
      { concurrency: 5 },
    );
  }

  async processFollow(data: FollowJobData) {
    const { type, followerId, followeeId } = data;

    try {
      if (type === 'follow') {
        // 1. Update Counters (Eventual Consistency)
        await this.userRepo.increment({ id: followeeId }, 'followerCount', 1);
        await this.userRepo.increment({ id: followerId }, 'followingCount', 1);

        // 2. Neo4j Sync (optional — skipped when Neo4j is not configured)
        try {
          await this.neo4jService.run(
            `
                  MERGE (u1:User {id: $followerId})
                  MERGE (u2:User {id: $followeeId})
                  MERGE (u1)-[:FOLLOWS]->(u2)
                  `,
            { followerId, followeeId },
          );
        } catch (e) {
          this.logger.warn(`Neo4j follow sync failed (non-fatal): ${(e as Error).message}`);
        }

        // 3. Notification
        await this.notificationHelper.createNotification({
          userId: followeeId,
          type: NotificationType.FOLLOW,
          actorUserId: followerId,
        });
      } else {
        // Unfollow
        await this.userRepo.decrement({ id: followeeId }, 'followerCount', 1);
        await this.userRepo.decrement({ id: followerId }, 'followingCount', 1);

        // Neo4j Sync (optional)
        try {
          await this.neo4jService.run(
            `
                  MATCH (u1:User {id: $followerId})-[r:FOLLOWS]->(u2:User {id: $followeeId})
                  DELETE r
                  `,
            { followerId, followeeId },
          );
        } catch (e) {
          this.logger.warn(`Neo4j unfollow sync failed (non-fatal): ${(e as Error).message}`);
        }
      }
    } catch (e) {
      this.logger.error(`Error processing follow job ${type}`, e);
      throw e;
    }
  }
}
