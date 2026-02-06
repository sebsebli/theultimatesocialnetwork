import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Follow } from '../entities/follow.entity';
import {
  FollowRequest,
  FollowRequestStatus,
} from '../entities/follow-request.entity';
import { User } from '../entities/user.entity';
import { NotificationType } from '../entities/notification.entity';
import { Neo4jService } from '../database/neo4j.service';
import { NotificationHelperService } from '../shared/notification-helper.service';
import { IEventBus, EVENT_BUS } from '../common/event-bus/event-bus.interface';

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(Follow) private followRepo: Repository<Follow>,
    @InjectRepository(FollowRequest)
    private followRequestRepo: Repository<FollowRequest>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private dataSource: DataSource,
    private neo4jService: Neo4jService,
    private notificationHelper: NotificationHelperService,
    @Inject(EVENT_BUS) private eventBus: IEventBus,
  ) { }

  async follow(followerId: string, followeeId: string) {
    if (followerId === followeeId) {
      throw new Error('Cannot follow yourself');
    }

    const followee = await this.userRepo.findOne({ where: { id: followeeId } });
    if (!followee) {
      throw new NotFoundException('User not found');
    }

    // Check if already following
    const existing = await this.followRepo.findOne({
      where: { followerId, followeeId },
    });

    if (existing) {
      throw new ConflictException('Already following');
    }

    // If protected account, create follow request
    if (followee.isProtected) {
      const existingRequest = await this.followRequestRepo.findOne({
        where: {
          requesterId: followerId,
          targetId: followeeId,
          status: FollowRequestStatus.PENDING,
        },
      });

      if (existingRequest) {
        throw new ConflictException('Follow request already pending');
      }

      const request = this.followRequestRepo.create({
        requesterId: followerId,
        targetId: followeeId,
        status: FollowRequestStatus.PENDING,
      });

      const savedRequest = await this.followRequestRepo.save(request);

      // Notify target of follow request (Synchronous for immediate feedback, or queue? Sync is fine for requests)
      await this.notificationHelper.createNotification({
        userId: followeeId,
        type: NotificationType.FOLLOW_REQUEST,
        actorUserId: followerId,
      });

      return savedRequest;
    }

    // Transaction for SQL updates
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const follow = this.followRepo.create({ followerId, followeeId });
      await queryRunner.manager.save(Follow, follow);

      await queryRunner.commitTransaction();

      // Queue background processing (Counts, Neo4j, Notifications)
      await this.eventBus.publish('follow-processing', 'process', {
        type: 'follow',
        followerId,
        followeeId,
      });

      return follow;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async unfollow(followerId: string, followeeId: string) {
    const follow = await this.followRepo.findOne({
      where: { followerId, followeeId },
    });

    if (!follow) {
      throw new NotFoundException('Not following');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.remove(follow);

      await queryRunner.commitTransaction();

      // Queue background processing (Counts, Neo4j)
      await this.eventBus.publish('follow-processing', 'process', {
        type: 'unfollow',
        followerId,
        followeeId,
      });

      return { success: true };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async approveFollowRequest(userId: string, requestId: string) {
    const request = await this.followRequestRepo.findOne({
      where: {
        id: requestId,
        targetId: userId,
        status: FollowRequestStatus.PENDING,
      },
    });

    if (!request) {
      throw new NotFoundException('Follow request not found');
    }

    request.status = FollowRequestStatus.APPROVED;
    await this.followRequestRepo.save(request);

    // Create follow
    await this.follow(request.requesterId, request.targetId);

    return request;
  }

  async rejectFollowRequest(userId: string, requestId: string) {
    const request = await this.followRequestRepo.findOne({
      where: {
        id: requestId,
        targetId: userId,
        status: FollowRequestStatus.PENDING,
      },
    });

    if (!request) {
      throw new NotFoundException('Follow request not found');
    }

    request.status = FollowRequestStatus.REJECTED;
    await this.followRequestRepo.save(request);

    return request;
  }
}
