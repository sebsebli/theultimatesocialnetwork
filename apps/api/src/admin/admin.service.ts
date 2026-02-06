import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportStatus } from '../entities/report.entity';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { AuditLog } from './audit-log.entity';
import { MeilisearchService } from '../search/meilisearch.service';
import { Neo4jService } from '../database/neo4j.service';
import { GraphComputeService } from '../graph/graph-compute.service';
import { EdgeType } from '../entities/post-edge.entity';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Report) private reportRepo: Repository<Report>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(AuditLog) private auditLogRepo: Repository<AuditLog>,
    private meilisearch: MeilisearchService,
    private neo4j: Neo4jService,
    private graphCompute: GraphComputeService,
  ) {}

  /** Log an admin/moderator action for security auditing. */
  async logAction(
    actorId: string,
    action: string,
    resourceType: string,
    resourceId?: string | null,
    details?: Record<string, unknown> | null,
    ipAddress?: string | null,
  ): Promise<void> {
    try {
      await this.auditLogRepo.save({
        actorId,
        action,
        resourceType,
        resourceId: resourceId ?? null,
        details: details ?? null,
        ipAddress: ipAddress ?? null,
      });
    } catch (err) {
      this.logger.error('Failed to write audit log', err);
    }
  }

  /** Get audit logs (admin only). */
  async getAuditLogs(limit = 50, offset = 0) {
    const [items, total] = await this.auditLogRepo.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['actor'],
    });
    return { items, total };
  }

  async getReports(status?: ReportStatus, limit = 20, offset = 0) {
    const qb = this.reportRepo.createQueryBuilder('report');
    if (status) {
      qb.where('report.status = :status', { status });
    }
    qb.orderBy('report.createdAt', 'DESC');
    qb.take(limit).skip(offset);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async resolveReport(id: string, status: ReportStatus) {
    const report = await this.reportRepo.findOne({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');

    report.status = status;
    return this.reportRepo.save(report);
  }

  async banUser(
    userId: string,
    reason: string,
    actorId?: string,
    ipAddress?: string,
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    user.bannedAt = new Date();
    const result = await this.userRepo.save(user);

    if (actorId) {
      await this.logAction(
        actorId,
        'ban_user',
        'user',
        userId,
        { reason },
        ipAddress,
      );
    }
    return result;
  }

  async unbanUser(userId: string, actorId?: string, ipAddress?: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    user.bannedAt = null;
    const result = await this.userRepo.save(user);

    if (actorId) {
      await this.logAction(
        actorId,
        'unban_user',
        'user',
        userId,
        null,
        ipAddress,
      );
    }
    return result;
  }

  /**
   * Trigger a full reindex of users, topics, posts, and messages from PostgreSQL into Meilisearch.
   * Runs in the background; use when search is missing results (e.g. after restore or if indexing failed).
   */
  triggerSearchReindex(): { message: string } {
    void this.meilisearch
      .reindexFromPostgres()
      .then(() => {})
      .catch((err) => console.error('Admin reindex failed', err));
    return {
      message:
        'Reindex started in background. Search may take a few minutes to reflect all data.',
    };
  }

  /**
   * Rebuild Neo4j graph from PostgreSQL. Only available when Neo4j is enabled.
   */
  triggerGraphRebuild(): { message: string } {
    if (!this.neo4j.isEnabled()) {
      return {
        message: 'Neo4j is not configured. Graph rebuild skipped.',
      };
    }
    void this.rebuildNeo4jGraph().catch((err) =>
      this.logger.error('Graph rebuild failed', err),
    );
    return {
      message:
        'Neo4j graph rebuild started in background. May take several minutes for large datasets.',
    };
  }

  /**
   * Trigger on-demand recomputation of derived graph features (authority, influence, trending, clusters).
   */
  triggerGraphCompute(): { message: string } {
    if (!this.neo4j.isEnabled()) {
      return { message: 'Neo4j is not configured. Graph compute skipped.' };
    }
    void this.graphCompute
      .computeAll()
      .catch((err) => this.logger.error('On-demand graph compute failed', err));
    return { message: 'Graph feature computation started in background.' };
  }

  private async rebuildNeo4jGraph(): Promise<void> {
    const BATCH = 50;
    let offset = 0;
    let total = 0;
    this.logger.log('Neo4j graph rebuild from PostgreSQL started.');
    for (;;) {
      const posts = await this.postRepo.find({
        where: {},
        relations: [
          'author',
          'postTopics',
          'postTopics.topic',
          'outgoingEdges',
          'mentions',
        ],
        order: { createdAt: 'ASC' },
        skip: offset,
        take: BATCH,
      });
      if (posts.length === 0) break;
      for (const post of posts) {
        const userId = post.authorId ?? post.author?.id;
        if (!userId) continue;
        await this.neo4j.run(
          `
          MERGE (u:User {id: $userId})
          MERGE (p:Post {id: $postId})
          SET p.createdAt = $createdAt, p.readingTime = $readingTime
          MERGE (u)-[:AUTHORED]->(p)
          `,
          {
            userId,
            postId: post.id,
            createdAt: post.createdAt.toISOString(),
            readingTime: post.readingTimeMinutes ?? 0,
          },
        );
        if (post.postTopics?.length) {
          for (const pt of post.postTopics) {
            const topic = pt.topic;
            if (!topic) continue;
            await this.neo4j.run(
              `
              MATCH (p:Post {id: $postId})
              MERGE (t:Topic {slug: $slug})
              ON CREATE SET t.title = $title
              MERGE (p)-[:IN_TOPIC]->(t)
              `,
              {
                postId: post.id,
                slug: topic.slug,
                title: topic.title ?? topic.slug,
              },
            );
          }
        }
        if (post.outgoingEdges?.length) {
          for (const edge of post.outgoingEdges) {
            if (edge.edgeType === EdgeType.LINK) {
              await this.neo4j.run(
                `
                MATCH (p1:Post {id: $fromId})
                MERGE (p2:Post {id: $toId})
                MERGE (p1)-[:LINKS_TO]->(p2)
                `,
                { fromId: post.id, toId: edge.toPostId },
              );
            } else if (edge.edgeType === EdgeType.QUOTE) {
              await this.neo4j.run(
                `
                MATCH (p1:Post {id: $fromId})
                MATCH (p2:Post {id: $toId})
                MERGE (p1)-[:QUOTES]->(p2)
                `,
                { fromId: post.id, toId: edge.toPostId },
              );
            }
          }
        }
        if (post.mentions?.length) {
          for (const mention of post.mentions) {
            const uid = mention.mentionedUserId;
            if (!uid) continue;
            await this.neo4j.run(
              `
              MATCH (p:Post {id: $postId})
              MERGE (u:User {id: $userId})
              MERGE (p)-[:MENTIONS]->(u)
              `,
              { postId: post.id, userId: uid },
            );
          }
        }
        total++;
      }
      offset += posts.length;
      this.logger.log(`Graph rebuild: ${total} posts synced so far.`);
      if (posts.length < BATCH) break;
    }
    this.logger.log(`Neo4j graph rebuild finished. ${total} posts synced.`);
  }
}
