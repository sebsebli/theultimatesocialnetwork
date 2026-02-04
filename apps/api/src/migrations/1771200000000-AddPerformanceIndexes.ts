import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1771200000000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1771200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Follows: efficiently find followers of a user
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_follows_followee_id" ON "follows" ("followee_id")`,
    );

    // Likes: efficiently find users who liked a post (for suggestions/analytics)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_likes_post_id" ON "likes" ("post_id")`,
    );

    // PostEdges: efficiently find "Referenced By" / "Quoted By" sorted by time
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_post_edges_to_edge_created" ON "post_edges" ("to_post_id", "edge_type", "created_at" DESC)`,
    );

    // ExternalSources: efficiently find sources for a post (for Newsroom/Sources tab)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_external_sources_post_id" ON "external_sources" ("post_id")`,
    );

    // PostTopics: efficiently find latest posts in a topic (already partially covered by Index on topic_id, but composed might be better)
    // The existing index is just on `topic_id`.
    // We often do: JOIN post_topics pt ... JOIN posts p ... ORDER BY p.created_at.
    // A composite index on (topic_id, post_id) helps with the JOIN, but the sort is on a different table (posts).
    // So we'll leave that for now.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_external_sources_post_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_post_edges_to_edge_created"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_likes_post_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_follows_followee_id"`);
  }
}
