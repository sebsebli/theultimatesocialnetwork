import { Injectable, Logger } from '@nestjs/common';
import { Record as Neo4jRecord } from 'neo4j-driver';
import { Neo4jService } from './neo4j.service';

/**
 * Neo4jQueryService — Graph-powered READ queries for recommendations and discovery.
 *
 * All methods gracefully fall back to empty results when Neo4j is disabled or unhealthy.
 * Callers should always have a Postgres fallback path.
 *
 * Graph model (populated by workers):
 *   (User)-[:AUTHORED]->(Post)
 *   (Post)-[:IN_TOPIC]->(Topic)
 *   (Post)-[:LINKS_TO]->(Post)
 *   (Post)-[:QUOTES]->(Post)
 *   (Post)-[:MENTIONS]->(User)
 *   (Post)-[:CITES_EXTERNAL]->(ExternalUrl)
 *   (User)-[:FOLLOWS]->(User)
 *   (User)-[:AUTHORED]->(Reply)-[:REPLIED_TO]->(Post)
 */
@Injectable()
export class Neo4jQueryService {
  private readonly logger = new Logger(Neo4jQueryService.name);

  constructor(private neo4j: Neo4jService) {}

  /** Check if Neo4j is available for reads. */
  isAvailable(): boolean {
    const status = this.neo4j.getStatus();
    return status.enabled && status.healthy;
  }

  // ---------------------------------------------------------------------------
  // 1. POST GRAPH — Multi-hop traversal for graph visualization
  // ---------------------------------------------------------------------------

  /**
   * Get the citation graph around a post using a single multi-hop Cypher query.
   * Returns nodes and edges for L1 (direct connections) and L2 (2nd-degree) visualization.
   */
  async getPostGraph(
    postId: string,
    maxL1 = 40,
    maxL2 = 30,
  ): Promise<{
    nodes: Array<{
      id: string;
      type: string;
      label: string;
      image?: string;
      author?: string;
      url?: string;
      isCenter?: boolean;
      isL2?: boolean;
    }>;
    edges: Array<{ source: string; target: string; type: string }>;
  } | null> {
    if (!this.isAvailable()) return null;

    try {
      // Single query: center -> L1 outgoing + L1 incoming + L2 outgoing from L1
      const result = await this.neo4j.run(
        `
        // Center post
        MATCH (center:Post {id: $postId})

        // L1: outgoing connections (what this post cites/links/mentions)
        OPTIONAL MATCH (center)-[r1]->(l1)
        WHERE type(r1) IN ['LINKS_TO', 'QUOTES', 'IN_TOPIC', 'MENTIONS', 'CITES_EXTERNAL']
        WITH center, COLLECT(DISTINCT {
          node: l1,
          rel: type(r1),
          direction: 'outgoing'
        })[0..$maxL1] AS l1Out

        // L1: incoming connections (what cites this post)
        OPTIONAL MATCH (l1In)-[r2]->(center)
        WHERE type(r2) IN ['LINKS_TO', 'QUOTES']
        WITH center, l1Out, COLLECT(DISTINCT {
          node: l1In,
          rel: type(r2),
          direction: 'incoming'
        })[0..20] AS l1In

        // Combine L1
        WITH center, l1Out + l1In AS l1All

        // L2: outgoing from L1 posts (what L1 posts cite)
        UNWIND l1All AS l1Item
        WITH center, l1All, l1Item
        WHERE l1Item.node IS NOT NULL AND labels(l1Item.node)[0] = 'Post'
        OPTIONAL MATCH (l1Item.node)-[r3]->(l2)
        WHERE type(r3) IN ['LINKS_TO', 'QUOTES', 'IN_TOPIC', 'CITES_EXTERNAL']
          AND l2 <> center
        WITH center, l1All,
             COLLECT(DISTINCT {
               source: l1Item.node.id,
               node: l2,
               rel: type(r3)
             })[0..$maxL2] AS l2All

        RETURN
          center.id AS centerId,
          [item IN l1All WHERE item.node IS NOT NULL |
            {
              id: item.node.id,
              labels: labels(item.node),
              props: properties(item.node),
              rel: item.rel,
              direction: item.direction
            }
          ] AS l1Nodes,
          [item IN l2All WHERE item.node IS NOT NULL |
            {
              id: item.node.id,
              labels: labels(item.node),
              props: properties(item.node),
              rel: item.rel,
              source: item.source
            }
          ] AS l2Nodes
        `,
        { postId, maxL1, maxL2 },
      );

      if (!result.records?.length) return null;

      const record = result.records[0] as Neo4jRecord;
      const centerId = record.get('centerId') as string;
      const l1Raw = (record.get('l1Nodes') || []) as Array<{
        id?: string;
        labels: string[];
        props?: Record<string, unknown>;
        rel: string;
        direction?: string;
      }>;
      const l2Raw = (record.get('l2Nodes') || []) as Array<{
        id?: string;
        labels: string[];
        props?: Record<string, unknown>;
        rel: string;
        source?: string;
      }>;

      const nodes: Array<{
        id: string;
        type: string;
        label: string;
        image?: string;
        author?: string;
        url?: string;
        isCenter?: boolean;
        isL2?: boolean;
      }> = [];
      const edges: Array<{ source: string; target: string; type: string }> = [];
      const seen = new Set<string>();

      // Center node
      nodes.push({
        id: centerId,
        type: 'post',
        label: 'Center',
        isCenter: true,
      });
      seen.add(centerId);

      // Process L1 nodes
      for (const item of l1Raw) {
        const nodeType = this.labelToType(item.labels);
        const id =
          item.id ?? item.props?.id ?? item.props?.url ?? item.props?.slug;
        if (!id || seen.has(id)) continue;
        seen.add(id);

        nodes.push({
          id,
          type: nodeType,
          label:
            item.props?.title ||
            item.props?.handle ||
            item.props?.slug ||
            item.props?.url ||
            'Node',
          url: item.props?.url,
        });

        if (item.direction === 'outgoing') {
          edges.push({
            source: postId,
            target: id,
            type: this.relToEdgeType(item.rel),
          });
        } else {
          edges.push({
            source: id,
            target: postId,
            type: this.relToEdgeType(item.rel),
          });
        }
      }

      // Process L2 nodes
      for (const item of l2Raw) {
        const nodeType = this.labelToType(item.labels);
        const id =
          item.id ?? item.props?.id ?? item.props?.url ?? item.props?.slug;
        if (!id || seen.has(id)) continue;
        seen.add(id);

        nodes.push({
          id,
          type: nodeType,
          label:
            item.props?.title ||
            item.props?.handle ||
            item.props?.slug ||
            item.props?.url ||
            'Node',
          url: item.props?.url,
          isL2: true,
        });

        if (item.source) {
          edges.push({
            source: item.source,
            target: id,
            type: this.relToEdgeType(item.rel),
          });
        }
      }

      return { nodes, edges };
    } catch (e) {
      this.logger.warn(`Neo4j getPostGraph failed: ${(e as Error).message}`);
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // 2. EXTENDED NETWORK POSTS — Posts from friends-of-friends
  // ---------------------------------------------------------------------------

  /**
   * Find posts authored by users 2 hops away (friends of friends).
   * These are posts the user might not see in their feed but are connected through their network.
   */
  async getExtendedNetworkPostIds(
    userId: string,
    limit = 40,
    excludePostIds: string[] = [],
  ): Promise<string[]> {
    if (!this.isAvailable()) return [];

    try {
      const result = await this.neo4j.run(
        `
        MATCH (u:User {id: $userId})-[:FOLLOWS]->(:User)-[:FOLLOWS]->(fof:User)
        WHERE fof <> u AND NOT (u)-[:FOLLOWS]->(fof)
        WITH COLLECT(DISTINCT fof) AS fofUsers
        UNWIND fofUsers AS fof
        MATCH (fof)-[:AUTHORED]->(p:Post)
        WHERE NOT p.id IN $excludePostIds
        WITH p, COUNT(*) AS networkConnections
        ORDER BY networkConnections DESC, p.createdAt DESC
        LIMIT $limit
        RETURN p.id AS postId, networkConnections
        `,
        { userId, limit: this.toInt(limit), excludePostIds },
      );

      return result.records.map(
        (r) => (r as Neo4jRecord).get('postId') as string,
      );
    } catch (e) {
      this.logger.warn(
        `Neo4j getExtendedNetworkPostIds failed: ${(e as Error).message}`,
      );
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // 3. RECOMMENDED PEOPLE — Mutual follows + co-citation patterns
  // ---------------------------------------------------------------------------

  /**
   * Find recommended users based on graph signals:
   * - Mutual follows (users followed by people you follow)
   * - Co-citation patterns (users who cite/are cited by the same posts as you)
   */
  async getRecommendedPeopleIds(
    userId: string,
    limit = 20,
  ): Promise<
    Array<{
      userId: string;
      mutualFollows: number;
      coCitations: number;
      score: number;
    }>
  > {
    if (!this.isAvailable()) return [];

    try {
      const result = await this.neo4j.run(
        `
        // Mutual follows: users followed by people I follow
        MATCH (me:User {id: $userId})-[:FOLLOWS]->(mutual:User)-[:FOLLOWS]->(suggested:User)
        WHERE suggested <> me AND NOT (me)-[:FOLLOWS]->(suggested)
        WITH suggested, COUNT(DISTINCT mutual) AS mutualFollows

        // Co-citation: users who cite the same posts I cite
        OPTIONAL MATCH (me)-[:AUTHORED]->(:Post)-[:LINKS_TO|QUOTES]->(shared:Post)<-[:LINKS_TO|QUOTES]-(:Post)<-[:AUTHORED]-(suggested)
        WITH suggested, mutualFollows, COUNT(DISTINCT shared) AS coCitations

        // Score: weighted combination
        WITH suggested,
             mutualFollows,
             coCitations,
             mutualFollows * 3.0 + coCitations * 1.0 AS score
        WHERE score > 0
        ORDER BY score DESC
        LIMIT $limit
        RETURN suggested.id AS userId, mutualFollows, coCitations, score
        `,
        { userId, limit: this.toInt(limit) },
      );

      return result.records.map((r) => {
        const record = r as Neo4jRecord;
        return {
          userId: record.get('userId') as string,
          mutualFollows: this.toNumber(record.get('mutualFollows')),
          coCitations: this.toNumber(record.get('coCitations')),
          score: this.toNumber(record.get('score')),
        };
      });
    } catch (e) {
      this.logger.warn(
        `Neo4j getRecommendedPeopleIds failed: ${(e as Error).message}`,
      );
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // 4. DEEP DIVES — Citation chain depth traversal
  // ---------------------------------------------------------------------------

  /**
   * Find posts that are the root of deep citation chains.
   * Uses variable-length path matching to find posts with long link chains.
   */
  async getDeepDivePostIds(
    limit = 20,
    skip = 0,
  ): Promise<
    Array<{ postId: string; chainDepth: number; citedByCount: number }>
  > {
    if (!this.isAvailable()) return [];

    try {
      const result = await this.neo4j.run(
        `
        // Find posts that are heavily cited AND whose citers are also cited (chain depth)
        MATCH (p:Post)<-[:LINKS_TO|QUOTES]-(citer:Post)
        WITH p, COUNT(DISTINCT citer) AS directCitations
        WHERE directCitations >= 2

        // Check if citers are also cited (2nd level depth)
        OPTIONAL MATCH (citer:Post)-[:LINKS_TO|QUOTES]->(p)<-[:LINKS_TO|QUOTES]-(citer2:Post)
        WHERE citer2 <> citer
        WITH p, directCitations, COUNT(DISTINCT citer2) AS indirectCitations

        // Chain depth: try to find actual chain length
        OPTIONAL MATCH path = (start:Post)-[:LINKS_TO*1..4]->(p)
        WITH p, directCitations, indirectCitations, MAX(length(path)) AS maxChainDepth

        WITH p,
             COALESCE(maxChainDepth, 0) + 1 AS chainDepth,
             directCitations + indirectCitations AS citedByCount
        ORDER BY chainDepth DESC, citedByCount DESC
        SKIP $skip
        LIMIT $limit
        RETURN p.id AS postId, chainDepth, citedByCount
        `,
        { limit: this.toInt(limit), skip: this.toInt(skip) },
      );

      return result.records.map((r) => {
        const record = r as Neo4jRecord;
        return {
          postId: record.get('postId') as string,
          chainDepth: this.toNumber(record.get('chainDepth')),
          citedByCount: this.toNumber(record.get('citedByCount')),
        };
      });
    } catch (e) {
      this.logger.warn(
        `Neo4j getDeepDivePostIds failed: ${(e as Error).message}`,
      );
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // 5. TOPIC CENTRALITY — Graph-based "Start Here" ranking
  // ---------------------------------------------------------------------------

  /**
   * Find the most important posts in a topic using graph centrality.
   * Considers: direct citations + 2nd-degree citations + topic-internal link density.
   */
  async getTopicCentralPostIds(
    topicSlug: string,
    limit = 10,
  ): Promise<Array<{ postId: string; centrality: number }>> {
    if (!this.isAvailable()) return [];

    try {
      const result = await this.neo4j.run(
        `
        // Posts in this topic
        MATCH (p:Post)-[:IN_TOPIC]->(t:Topic {slug: $topicSlug})

        // Direct citations from any post
        OPTIONAL MATCH (p)<-[:LINKS_TO|QUOTES]-(citer:Post)
        WITH p, COUNT(DISTINCT citer) AS directCitations

        // 2nd-degree: posts that cite the citers
        OPTIONAL MATCH (citer:Post)-[:LINKS_TO|QUOTES]->(p)<-[:LINKS_TO|QUOTES]-(citer)
        <-[:LINKS_TO|QUOTES]-(citer2:Post)
        WITH p, directCitations, COUNT(DISTINCT citer2) AS secondDegreeCitations

        // Topic-internal links: how many other posts in the same topic link to this post
        OPTIONAL MATCH (inTopic:Post)-[:IN_TOPIC]->(t:Topic {slug: $topicSlug}),
                       (inTopic)-[:LINKS_TO|QUOTES]->(p)
        WITH p, directCitations, secondDegreeCitations, COUNT(DISTINCT inTopic) AS inTopicCitations

        // Centrality score: weighted combination
        WITH p,
             directCitations * 1.0 +
             secondDegreeCitations * 0.3 +
             inTopicCitations * 0.5 AS centrality
        ORDER BY centrality DESC
        LIMIT $limit
        RETURN p.id AS postId, centrality
        `,
        { topicSlug, limit: this.toInt(limit) },
      );

      return result.records.map((r) => {
        const record = r as Neo4jRecord;
        return {
          postId: record.get('postId') as string,
          centrality: this.toNumber(record.get('centrality')),
        };
      });
    } catch (e) {
      this.logger.warn(
        `Neo4j getTopicCentralPostIds failed: ${(e as Error).message}`,
      );
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // 6. NETWORK PROXIMITY BOOST — Score posts by distance in the social graph
  // ---------------------------------------------------------------------------

  /**
   * Given a set of post IDs, return a proximity boost score for each based on
   * how close the post's author is to the user in the social graph.
   * - 1 hop (direct follow): 0.3
   * - 2 hops (friend of friend): 0.15
   */
  async getNetworkProximityScores(
    userId: string,
    postIds: string[],
  ): Promise<Map<string, number>> {
    if (!this.isAvailable() || postIds.length === 0) return new Map();

    try {
      const result = await this.neo4j.run(
        `
        MATCH (me:User {id: $userId})
        UNWIND $postIds AS pid
        MATCH (author:User)-[:AUTHORED]->(p:Post {id: pid})
        OPTIONAL MATCH path = shortestPath((me)-[:FOLLOWS*1..2]->(author))
        WITH p.id AS postId, CASE
          WHEN path IS NULL THEN 0
          WHEN length(path) = 1 THEN 0.3
          WHEN length(path) = 2 THEN 0.15
          ELSE 0
        END AS boost
        WHERE boost > 0
        RETURN postId, boost
        `,
        { userId, postIds },
      );

      const scores = new Map<string, number>();
      for (const record of result.records) {
        const r = record as Neo4jRecord;
        scores.set(r.get('postId') as string, this.toNumber(r.get('boost')));
      }
      return scores;
    } catch (e) {
      this.logger.warn(
        `Neo4j getNetworkProximityScores failed: ${(e as Error).message}`,
      );
      return new Map();
    }
  }

  // ---------------------------------------------------------------------------
  // 7. CO-CITED POSTS — Posts frequently cited alongside a given post
  // ---------------------------------------------------------------------------

  /**
   * Find posts that are frequently co-cited with a given post
   * (appear together as sources in other posts).
   */
  async getCoCitedPostIds(
    postId: string,
    limit = 10,
  ): Promise<Array<{ postId: string; coCitationCount: number }>> {
    if (!this.isAvailable()) return [];

    try {
      const result = await this.neo4j.run(
        `
        // Posts that cite the same things as this post
        MATCH (center:Post {id: $postId})-[:LINKS_TO|QUOTES]->(shared)<-[:LINKS_TO|QUOTES]-(coCited:Post)
        WHERE coCited <> center
        WITH coCited, COUNT(DISTINCT shared) AS sharedSources
        ORDER BY sharedSources DESC
        LIMIT $limit
        RETURN coCited.id AS postId, sharedSources AS coCitationCount
        `,
        { postId, limit: this.toInt(limit) },
      );

      return result.records.map((r) => {
        const record = r as Neo4jRecord;
        return {
          postId: record.get('postId') as string,
          coCitationCount: this.toNumber(record.get('coCitationCount')),
        };
      });
    } catch (e) {
      this.logger.warn(
        `Neo4j getCoCitedPostIds failed: ${(e as Error).message}`,
      );
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // 8. QUOTED NOW — Network-weighted quote velocity
  // ---------------------------------------------------------------------------

  /**
   * Get recently quoted posts, weighted by how close the quoters are to the user
   * in the social graph.
   */
  async getNetworkQuotedPostIds(
    userId: string,
    limit = 20,
  ): Promise<Array<{ postId: string; score: number }>> {
    if (!this.isAvailable()) return [];

    try {
      const result = await this.neo4j.run(
        `
        // Recent quotes (approximate: all quotes in the graph)
        MATCH (quoter:User)-[:AUTHORED]->(quotingPost:Post)-[:QUOTES]->(quoted:Post)

        // Network weight: direct follow = 2x, friend-of-friend = 1.5x, other = 1x
        OPTIONAL MATCH (me:User {id: $userId})-[:FOLLOWS]->(quoter)
        WITH quoted, quoter, me,
             CASE
               WHEN me IS NOT NULL THEN 2.0
               ELSE 1.0
             END AS networkWeight

        WITH quoted, SUM(networkWeight) AS weightedScore
        ORDER BY weightedScore DESC
        LIMIT $limit
        RETURN quoted.id AS postId, weightedScore AS score
        `,
        { userId, limit: this.toInt(limit) },
      );

      return result.records.map((r) => {
        const record = r as Neo4jRecord;
        return {
          postId: record.get('postId') as string,
          score: this.toNumber(record.get('score')),
        };
      });
    } catch (e) {
      this.logger.warn(
        `Neo4j getNetworkQuotedPostIds failed: ${(e as Error).message}`,
      );
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private labelToType(labels: string[]): string {
    if (!labels?.length) return 'unknown';
    const label = labels[0];
    switch (label) {
      case 'Post':
        return 'post';
      case 'User':
        return 'user';
      case 'Topic':
        return 'topic';
      case 'ExternalUrl':
        return 'external';
      case 'Reply':
        return 'reply';
      default:
        return label.toLowerCase();
    }
  }

  private relToEdgeType(rel: string): string {
    switch (rel) {
      case 'LINKS_TO':
        return 'link';
      case 'QUOTES':
        return 'quote';
      case 'IN_TOPIC':
        return 'topic';
      case 'MENTIONS':
        return 'mention';
      case 'CITES_EXTERNAL':
        return 'cites';
      case 'AUTHORED':
        return 'authored';
      case 'FOLLOWS':
        return 'follows';
      case 'REPLIED_TO':
        return 'reply';
      default:
        return rel.toLowerCase();
    }
  }

  /** Convert Neo4j Integer to JS number. */
  private toNumber(val: unknown): number {
    if (val == null) return 0;
    if (typeof val === 'number') return val;
    if (
      typeof val === 'object' &&
      val !== null &&
      'toNumber' in val &&
      typeof (val as { toNumber(): number }).toNumber === 'function'
    ) {
      return (val as { toNumber(): number }).toNumber();
    }
    return Number(val) || 0;
  }

  /** Convert to Neo4j-safe integer. */
  private toInt(val: number): number {
    return Math.floor(val);
  }
}
