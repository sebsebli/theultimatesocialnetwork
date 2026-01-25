import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from '../entities/follow.entity';
import { FollowRequest, FollowRequestStatus } from '../entities/follow-request.entity';
import { User } from '../entities/user.entity';
import { Neo4jService } from '../database/neo4j.service';

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(Follow) private followRepo: Repository<Follow>,
    @InjectRepository(FollowRequest) private followRequestRepo: Repository<FollowRequest>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private neo4jService: Neo4jService,
  ) {}

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
          status: FollowRequestStatus.PENDING 
        },
      });

      if (existingRequest) {
        throw new ConflictException('Follow request already pending');
      }

      const request = this.followRequestRepo.create({
        requesterId: followerId,
        targetId: followeeId,
        status: FollowRequestStatus.PENDING as any,
      });

      return this.followRequestRepo.save(request);
    }

    // Create follow
    const follow = this.followRepo.create({
      followerId,
      followeeId,
    });

    await this.followRepo.save(follow);

    // Update counts
    await this.userRepo.increment({ id: followeeId }, 'followerCount', 1);
    await this.userRepo.increment({ id: followerId }, 'followingCount', 1);

    // Neo4j update
    await this.neo4jService.run(
      `
      MERGE (u1:User {id: $followerId})
      MERGE (u2:User {id: $followeeId})
      MERGE (u1)-[:FOLLOWS]->(u2)
      `,
      { followerId, followeeId }
    );

    return follow;
  }

  async unfollow(followerId: string, followeeId: string) {
    const follow = await this.followRepo.findOne({
      where: { followerId, followeeId },
    });

    if (!follow) {
      throw new NotFoundException('Not following');
    }

    await this.followRepo.remove(follow);

    // Update counts
    await this.userRepo.decrement({ id: followeeId }, 'followerCount', 1);
    await this.userRepo.decrement({ id: followerId }, 'followingCount', 1);

    // Neo4j update
    await this.neo4jService.run(
      `
      MATCH (u1:User {id: $followerId})-[r:FOLLOWS]->(u2:User {id: $followeeId})
      DELETE r
      `,
      { followerId, followeeId }
    );

    return { success: true };
  }

  async approveFollowRequest(userId: string, requestId: string) {
    const request = await this.followRequestRepo.findOne({
      where: { id: requestId, targetId: userId, status: FollowRequestStatus.PENDING } as any,
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
      where: { id: requestId, targetId: userId, status: FollowRequestStatus.PENDING } as any,
    });

    if (!request) {
      throw new NotFoundException('Follow request not found');
    }

      request.status = FollowRequestStatus.REJECTED;
    await this.followRequestRepo.save(request);

    return request;
  }
}
