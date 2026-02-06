import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Production performance migration:
 * - Composite indexes for hot query patterns identified in performance audit
 * - Index on posts(author_id, created_at) for rate limiting and author queries
 * - Composite on post_topics(topic_id, post_id) for topic feeds
 * - Index on collection_items(collection_id, added_at) for paginated collections
 * - Index on external_sources(url) for co-citation lookups
 * - Index on posts(created_at DESC) for feed ordering
 * - Index on follows(follower_id, followee_id) for follow-check queries
 */
export class AddCompositePerformanceIndexes1771500000000 implements MigrationInterface {
  name = 'AddCompositePerformanceIndexes1771500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Posts: rate limiting query (WHERE author_id = ? AND created_at > ?)
    // Also used for author page ordering
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_posts_author_created" ON "posts" ("author_id", "created_at" DESC)`,
    );

    // Posts: global feed ordering
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_posts_created_desc" ON "posts" ("created_at" DESC) WHERE "deleted_at" IS NULL`,
    );

    // PostTopics: composite for topic feed joins (topic_id lookup + join to posts)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_post_topics_topic_post" ON "post_topics" ("topic_id", "post_id")`,
    );

    // CollectionItems: paginated collection queries
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_collection_items_collection_added" ON "collection_items" ("collection_id", "added_at" DESC)`,
    );

    // ExternalSources: co-citation URL lookups
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_external_sources_url" ON "external_sources" ("url")`,
    );

    // Follows: fast follower check (WHERE follower_id = ? AND followee_id IN (...))
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_follows_follower_followee" ON "follows" ("follower_id", "followee_id")`,
    );

    // Notifications: user inbox queries ordered by time
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notifications_user_created" ON "notifications" ("user_id", "created_at" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_notifications_user_created"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_follows_follower_followee"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_external_sources_url"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_collection_items_collection_added"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_post_topics_topic_post"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_posts_created_desc"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_posts_author_created"`);
  }
}
