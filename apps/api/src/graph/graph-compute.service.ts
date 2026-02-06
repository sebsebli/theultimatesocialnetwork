import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import Redis from 'ioredis';
import { Record as Neo4jRecord } from 'neo4j-driver';
import { Neo4jService } from '../database/neo4j.service';

/**
 * GraphComputeService — Periodically computes derived graph features from Neo4j.
 *
 * Runs every 15 minutes and pre-computes:
 *   1. Post authority scores (simplified PageRank via citation graph)
 *   2. User influence scores (follower reach + citation impact)
 *   3. Trending velocity (rate of new citations in recent windows)
 *   4. Topic clusters (which topics are co-cited together)
 *
 * Results are stored in Redis with a "graph:" prefix for fast reads by
 * explore/recommendation services. Each key has a TTL of 20 minutes
 * (slightly longer than the 15-min compute interval for overlap safety).
 *
 * When Neo4j is disabled, all computations are silently skipped.
 */
@Injectable()
export class GraphComputeService {
  private readonly logger = new Logger(GraphComputeService.name);
  private readonly REDIS_TTL = 1200; // 20 minutes
  private isRunning = false;

  constructor(
    private neo4j: Neo4jService,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  // ---------------------------------------------------------------------------
  // Scheduler: every 15 minutes
  // ---------------------------------------------------------------------------

  @Cron('0 */15 * * * *') // At second 0 of every 15th minute
  async computeAll(): Promise<void> {
    if (!this.neo4j.isEnabled() || !this.neo4j.getStatus().healthy) {
      return; // Skip silently when Neo4j is not available
    }

    if (this.isRunning) {
      this.logger.warn('Graph compute already running, skipping this cycle.');
      return;
    }

    this.isRunning = true;
    const start = Date.now();
    this.logger.log('Starting periodic graph feature computation...');

    try {
      await Promise.all([
        this.computePostAuthority(),
        this.computeUserInfluence(),
        this.computeTrendingVelocity(),
        this.computeTopicClusters(),
      ]);

      const duration = Date.now() - start;
      this.logger.log(`Graph feature computation completed in ${duration}ms.`);
    } catch (e) {
      this.logger.error(
        `Graph feature computation failed: ${(e as Error).message}`,
      );
    } finally {
      this.isRunning = false;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Post Authority Score (Simplified PageRank)
  // ---------------------------------------------------------------------------

  /**
   * Computes a simplified PageRank-like authority score for posts.
   * Score = directCitations + 0.5 * secondDegreeCitations + 0.3 * quoteCitations
   *
   * Stored as: graph:post-authority (Redis sorted set, score = authority)
   */
  private async computePostAuthority(): Promise<void> {
    try {
      const result = await this.neo4j.run(`
        MATCH (p:Post)
        OPTIONAL MATCH (p)<-[:LINKS_TO]-(linker:Post)
        WITH p, COUNT(DISTINCT linker) AS linkCitations

        OPTIONAL MATCH (p)<-[:QUOTES]-(quoter:Post)
        WITH p, linkCitations, COUNT(DISTINCT quoter) AS quoteCitations

        OPTIONAL MATCH (p)<-[:LINKS_TO|QUOTES]-(:Post)<-[:LINKS_TO|QUOTES]-(l2:Post)
        WITH p, linkCitations, quoteCitations, COUNT(DISTINCT l2) AS secondDegree

        WITH p,
             linkCitations * 1.0 + quoteCitations * 1.5 + secondDegree * 0.3 AS authority
        WHERE authority > 0
        RETURN p.id AS postId, authority
        ORDER BY authority DESC
        LIMIT 500
      `);

      if (result.records.length > 0) {
        const pipeline = this.redis.pipeline();
        pipeline.del('graph:post-authority');

        for (const rec of result.records) {
          const record = rec as Neo4jRecord;
          const postId = record.get('postId') as string;
          const authority = this.toNumber(record.get('authority'));
          pipeline.zadd('graph:post-authority', authority, postId);
        }
        pipeline.expire('graph:post-authority', this.REDIS_TTL);
        await pipeline.exec();

        this.logger.debug(
          `Computed authority scores for ${result.records.length} posts.`,
        );
      }
    } catch (e) {
      this.logger.warn(
        `Post authority computation failed: ${(e as Error).message}`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 2. User Influence Score
  // ---------------------------------------------------------------------------

  /**
   * Computes user influence based on:
   * - Number of followers
   * - Total citations their posts receive
   * - Network reach (followers of followers)
   *
   * Stored as: graph:user-influence (Redis sorted set, score = influence)
   */
  private async computeUserInfluence(): Promise<void> {
    try {
      const result = await this.neo4j.run(`
        MATCH (u:User)

        // Follower count
        OPTIONAL MATCH (u)<-[:FOLLOWS]-(follower:User)
        WITH u, COUNT(DISTINCT follower) AS followers

        // Citation impact: how many times their posts are cited
        OPTIONAL MATCH (u)-[:AUTHORED]->(p:Post)<-[:LINKS_TO|QUOTES]-(citer:Post)
        WITH u, followers, COUNT(DISTINCT citer) AS citationImpact

        // Network reach: followers of followers (2nd degree)
        OPTIONAL MATCH (u)<-[:FOLLOWS]-(:User)<-[:FOLLOWS]-(fof:User)
        WHERE fof <> u
        WITH u, followers, citationImpact, COUNT(DISTINCT fof) AS networkReach

        WITH u,
             followers * 1.0 + citationImpact * 2.0 + networkReach * 0.1 AS influence
        WHERE influence > 0
        RETURN u.id AS userId, influence, followers, citationImpact
        ORDER BY influence DESC
        LIMIT 200
      `);

      if (result.records.length > 0) {
        const pipeline = this.redis.pipeline();
        pipeline.del('graph:user-influence');

        for (const rec of result.records) {
          const record = rec as Neo4jRecord;
          const userId = record.get('userId') as string;
          const influence = this.toNumber(record.get('influence'));
          pipeline.zadd('graph:user-influence', influence, userId);
        }
        pipeline.expire('graph:user-influence', this.REDIS_TTL);
        await pipeline.exec();

        this.logger.debug(
          `Computed influence scores for ${result.records.length} users.`,
        );
      }
    } catch (e) {
      this.logger.warn(
        `User influence computation failed: ${(e as Error).message}`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Trending Velocity
  // ---------------------------------------------------------------------------

  /**
   * Computes trending velocity: posts gaining citations at an accelerating rate.
   * Looks at recent citation patterns and compares short vs long window.
   *
   * Stored as: graph:trending-velocity (Redis sorted set, score = velocity)
   */
  private async computeTrendingVelocity(): Promise<void> {
    try {
      // Use Postgres-based data since Neo4j doesn't store timestamps reliably for edges
      // Instead, compute from the graph structure: posts with high citation ratios
      // relative to their age (newer posts with many citations = high velocity)
      const result = await this.neo4j.run(`
        MATCH (p:Post)<-[:LINKS_TO|QUOTES]-(citer:Post)
        WITH p, COUNT(DISTINCT citer) AS citations

        // Approximate recency: posts with createdAt timestamp
        WHERE p.createdAt IS NOT NULL AND citations >= 2

        WITH p, citations,
             duration.between(datetime(p.createdAt), datetime()).days AS ageDays

        // Velocity = citations / max(ageDays, 1) — newer posts with citations score higher
        WITH p,
             citations * 1.0 / CASE WHEN ageDays < 1 THEN 1 ELSE ageDays END AS velocity,
             citations
        WHERE velocity > 0
        RETURN p.id AS postId, velocity, citations
        ORDER BY velocity DESC
        LIMIT 100
      `);

      if (result.records.length > 0) {
        const pipeline = this.redis.pipeline();
        pipeline.del('graph:trending-velocity');

        for (const rec of result.records) {
          const record = rec as Neo4jRecord;
          const postId = record.get('postId') as string;
          const velocity = this.toNumber(record.get('velocity'));
          pipeline.zadd('graph:trending-velocity', velocity, postId);
        }
        pipeline.expire('graph:trending-velocity', this.REDIS_TTL);
        await pipeline.exec();

        this.logger.debug(
          `Computed trending velocity for ${result.records.length} posts.`,
        );
      }
    } catch (e) {
      this.logger.warn(
        `Trending velocity computation failed: ${(e as Error).message}`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Topic Clusters (Co-citation Analysis)
  // ---------------------------------------------------------------------------

  /**
   * Finds topics that are frequently co-cited (appear together on the same posts).
   * This reveals natural topic clusters / knowledge domains.
   *
   * Stored as: graph:topic-clusters:{topicSlug} (Redis set of related topic slugs)
   * And: graph:topic-cluster-scores (Redis hash of topicSlug -> cluster data JSON)
   */
  private async computeTopicClusters(): Promise<void> {
    try {
      const result = await this.neo4j.run(`
        // Find topic pairs that appear together on the same posts
        MATCH (t1:Topic)<-[:IN_TOPIC]-(p:Post)-[:IN_TOPIC]->(t2:Topic)
        WHERE id(t1) < id(t2)
        WITH t1, t2, COUNT(DISTINCT p) AS sharedPosts
        WHERE sharedPosts >= 2

        RETURN t1.slug AS topic1, t2.slug AS topic2, sharedPosts
        ORDER BY sharedPosts DESC
        LIMIT 200
      `);

      if (result.records.length > 0) {
        // Build adjacency: topic -> [related topics]
        const clusters = new Map<
          string,
          Array<{ topic: string; strength: number }>
        >();

        for (const rec of result.records) {
          const record = rec as Neo4jRecord;
          const t1 = record.get('topic1') as string;
          const t2 = record.get('topic2') as string;
          const strength = this.toNumber(record.get('sharedPosts'));

          if (!clusters.has(t1)) clusters.set(t1, []);
          if (!clusters.has(t2)) clusters.set(t2, []);
          clusters.get(t1)!.push({ topic: t2, strength });
          clusters.get(t2)!.push({ topic: t1, strength });
        }

        const pipeline = this.redis.pipeline();

        // Store each topic's related topics
        for (const [slug, related] of clusters) {
          const key = `graph:topic-clusters:${slug}`;
          pipeline.del(key);
          const sorted = related
            .sort((a, b) => b.strength - a.strength)
            .slice(0, 10);
          pipeline.set(key, JSON.stringify(sorted), 'EX', this.REDIS_TTL);
        }

        await pipeline.exec();
        this.logger.debug(
          `Computed topic clusters for ${clusters.size} topics.`,
        );
      }
    } catch (e) {
      this.logger.warn(
        `Topic cluster computation failed: ${(e as Error).message}`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Public API: Read computed scores
  // ---------------------------------------------------------------------------

  /** Get top posts by authority score. */
  async getTopAuthorityPosts(limit = 20): Promise<string[]> {
    try {
      return await this.redis.zrevrange('graph:post-authority', 0, limit - 1);
    } catch {
      return [];
    }
  }

  /** Get authority score for specific posts. */
  async getPostAuthorityScores(
    postIds: string[],
  ): Promise<Map<string, number>> {
    if (postIds.length === 0) return new Map();
    try {
      const pipeline = this.redis.pipeline();
      for (const id of postIds) {
        pipeline.zscore('graph:post-authority', id);
      }
      const results = await pipeline.exec();
      const scores = new Map<string, number>();
      for (let i = 0; i < postIds.length; i++) {
        const score = results?.[i]?.[1];
        if (score != null) {
          scores.set(postIds[i], parseFloat(score as string));
        }
      }
      return scores;
    } catch {
      return new Map();
    }
  }

  /** Get top users by influence score. */
  async getTopInfluentialUsers(limit = 20): Promise<string[]> {
    try {
      return await this.redis.zrevrange('graph:user-influence', 0, limit - 1);
    } catch {
      return [];
    }
  }

  /** Get top posts by trending velocity. */
  async getTrendingByVelocity(limit = 20): Promise<string[]> {
    try {
      return await this.redis.zrevrange(
        'graph:trending-velocity',
        0,
        limit - 1,
      );
    } catch {
      return [];
    }
  }

  /** Get related topics for a given topic (from co-citation clusters). */
  async getRelatedTopics(
    topicSlug: string,
  ): Promise<Array<{ topic: string; strength: number }>> {
    try {
      const data = await this.redis.get(`graph:topic-clusters:${topicSlug}`);
      return data
        ? (JSON.parse(data) as Array<{ topic: string; strength: number }>)
        : [];
    } catch {
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private toNumber(val: unknown): number {
    if (val == null) return 0;
    if (typeof val === 'number') return val;
    if (
      typeof val === 'object' &&
      val !== null &&
      'toNumber' in val &&
      typeof (val as { toNumber: unknown }).toNumber === 'function'
    )
      return (val as { toNumber(): number }).toNumber();
    return Number(val) || 0;
  }
}
