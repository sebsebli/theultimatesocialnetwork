import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';

@Injectable()
export class TrustService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
  ) {}

  /**
   * Determine if a user is "trusted" enough to skip expensive deep moderation (Stage 2 LLM).
   * Trusted if:
   * - Account age > 30 days
   * - AND Post count > 10
   * - AND No recent ban (bannedAt is null)
   */
  async isTrusted(userId: string): Promise<boolean> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['createdAt', 'bannedAt'],
    });

    if (!user) return false;
    if (user.bannedAt) return false; // Previously banned users are never trusted

    const now = new Date();
    const ageDays =
      (now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays < 30) return false; // Too new

    const postCount = await this.postRepo.count({
      where: { authorId: userId },
    });
    if (postCount < 10) return false; // Not enough history

    return true;
  }
}
