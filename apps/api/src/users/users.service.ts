import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { Reply } from '../entities/reply.entity';
import { PostEdge, EdgeType } from '../entities/post-edge.entity';
import { Like } from '../entities/like.entity';
import { Keep } from '../entities/keep.entity';
import { Follow } from '../entities/follow.entity';
import { PostRead } from '../entities/post-read.entity';
import { Notification } from '../entities/notification.entity';
import { MeilisearchService } from '../search/meilisearch.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(Reply) private replyRepo: Repository<Reply>,
    @InjectRepository(PostEdge) private postEdgeRepo: Repository<PostEdge>,
    @InjectRepository(Like) private likeRepo: Repository<Like>,
    @InjectRepository(Keep) private keepRepo: Repository<Keep>,
    @InjectRepository(Follow) private followRepo: Repository<Follow>,
    @InjectRepository(PostRead) private readRepo: Repository<PostRead>,
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
    private meilisearch: MeilisearchService,
  ) {}

  async isHandleAvailable(
    handle: string,
    excludeUserId?: string,
  ): Promise<boolean> {
    const normalized = (handle || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (normalized.length < 3 || normalized.length > 30) return false;
    const existing = await this.userRepo.findOne({
      where: { handle: normalized },
    });
    if (!existing) return true;
    return !!excludeUserId && existing.id === excludeUserId;
  }

  async findByHandle(handle: string) {
    const user = await this.userRepo.findOne({
      where: { handle },
    });

    if (!user) return null;

    // Get posts with single optimized query
    const posts = await this.postRepo.find({
      where: { authorId: user.id, deletedAt: IsNull() },
      relations: ['author'],
      order: { createdAt: 'DESC' },
      take: 20,
    });

    return { ...user, posts };
  }

  async findById(id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
    });

    if (!user) return null;

    const posts = await this.postRepo.find({
      where: { authorId: user.id, deletedAt: IsNull() },
      relations: ['author'],
      order: { createdAt: 'DESC' },
      take: 20,
    });

    return { ...user, posts };
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    await this.userRepo.update(id, updates);
    const user = await this.userRepo.findOneOrFail({ where: { id } });
    this.meilisearch.indexUser(user).catch(err => 
      console.error('Failed to update user index', err)
    );
    return user;
  }

  async getSuggested(userId?: string, limit = 10) {
    return this.userRepo.find({
      order: { followerCount: 'DESC' },
      take: limit,
    });
  }

  async getReplies(userId: string) {
    return this.replyRepo.find({
      where: { authorId: userId },
      relations: ['post', 'post.author'],
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async getQuotes(userId: string) {
    // Find posts that QUOTE posts authored by userId.
    // We join Post (quoter) -> PostEdge (QUOTE) -> Post (quoted)
    // Where quoted.authorId = userId

    return this.postRepo
      .createQueryBuilder('quoter')
      .innerJoin(PostEdge, 'edge', 'edge.from_post_id = quoter.id')
      .innerJoin('posts', 'quoted', 'quoted.id = edge.to_post_id')
      .where('edge.edge_type = :type', { type: EdgeType.QUOTE })
      .andWhere('quoted.author_id = :userId', { userId })
      .leftJoinAndSelect('quoter.author', 'author')
      .orderBy('quoter.created_at', 'DESC')
      .take(20)
      .getMany();
  }

  async deleteUser(userId: string) {
    // Soft delete user
    await this.userRepo.softDelete(userId);
    // Soft delete all posts by user
    await this.postRepo.softDelete({ authorId: userId });
    
    // Remove from search
    this.meilisearch.deleteUser(userId).catch(err => 
      console.error('Failed to remove user from index', err)
    );

    return { success: true };
  }

  async exportUserData(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const posts = await this.postRepo.find({ where: { authorId: userId } });
    const replies = await this.replyRepo.find({ where: { authorId: userId } });
    const likes = await this.likeRepo.find({ where: { userId } });
    const keeps = await this.keepRepo.find({ where: { userId } });
    const following = await this.followRepo.find({
      where: { followerId: userId },
    });
    const followers = await this.followRepo.find({
      where: { followeeId: userId },
    });
    const reads = await this.readRepo.find({ where: { userId } });
    const notifications = await this.notifRepo.find({ where: { userId } });

    return {
      user,
      posts,
      replies,
      likes,
      keeps,
      following,
      followers,
      readHistory: reads,
      notifications,
      exportedAt: new Date(),
    };
  }
}
