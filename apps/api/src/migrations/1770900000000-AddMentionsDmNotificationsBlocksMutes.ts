import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds tables that exist as entities but were never in InitialSchema:
 * mentions, dm_threads, dm_messages, notifications, blocks, mutes.
 * Idempotent: CREATE TABLE IF NOT EXISTS.
 */
export class AddMentionsDmNotificationsBlocksMutes1770900000000 implements MigrationInterface {
  name = 'AddMentionsDmNotificationsBlocksMutes1770900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Notifications enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "notifications_type_enum" AS ENUM(
          'FOLLOW', 'FOLLOW_REQUEST', 'REPLY', 'QUOTE', 'LIKE',
          'MENTION', 'COLLECTION_ADD', 'DM'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // mentions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mentions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "post_id" uuid,
        "reply_id" uuid,
        "mentioned_user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_mentions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_mentions_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_mentions_reply" FOREIGN KEY ("reply_id") REFERENCES "replies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_mentions_mentioned_user" FOREIGN KEY ("mentioned_user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_mentions_post_id" ON "mentions" ("post_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_mentions_reply_id" ON "mentions" ("reply_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_mentions_mentioned_user_id" ON "mentions" ("mentioned_user_id")`,
    );

    // dm_threads (add updated_at for getThreads orderBy)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "dm_threads" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_a" uuid NOT NULL,
        "user_b" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_dm_threads" PRIMARY KEY ("id"),
        CONSTRAINT "FK_dm_threads_user_a" FOREIGN KEY ("user_a") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_dm_threads_user_b" FOREIGN KEY ("user_b") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_dm_threads_user_a" ON "dm_threads" ("user_a")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_dm_threads_user_b" ON "dm_threads" ("user_b")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_dm_threads_updated_at" ON "dm_threads" ("updated_at")`,
    );

    // dm_messages (add read_at for unread count)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "dm_messages" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "thread_id" uuid NOT NULL,
        "sender_id" uuid NOT NULL,
        "body" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "read_at" TIMESTAMP,
        CONSTRAINT "PK_dm_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_dm_messages_thread" FOREIGN KEY ("thread_id") REFERENCES "dm_threads"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_dm_messages_sender" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_dm_messages_thread_id" ON "dm_messages" ("thread_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_dm_messages_sender_id" ON "dm_messages" ("sender_id")`,
    );

    // notifications
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "type" "notifications_type_enum" NOT NULL,
        "actor_user_id" uuid,
        "post_id" uuid,
        "reply_id" uuid,
        "collection_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "read_at" TIMESTAMP,
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notifications_user_id" ON "notifications" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notifications_read_at" ON "notifications" ("read_at")`,
    );

    // blocks
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blocks" (
        "blocker_id" uuid NOT NULL,
        "blocked_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_blocks" PRIMARY KEY ("blocker_id", "blocked_id"),
        CONSTRAINT "FK_blocks_blocker" FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_blocks_blocked" FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_blocks_blocker_id" ON "blocks" ("blocker_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_blocks_blocked_id" ON "blocks" ("blocked_id")`,
    );

    // mutes
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mutes" (
        "muter_id" uuid NOT NULL,
        "muted_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_mutes" PRIMARY KEY ("muter_id", "muted_id"),
        CONSTRAINT "FK_mutes_muter" FOREIGN KEY ("muter_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_mutes_muted" FOREIGN KEY ("muted_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_mutes_muter_id" ON "mutes" ("muter_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_mutes_muted_id" ON "mutes" ("muted_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "mutes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blocks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "dm_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "dm_threads"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mentions"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notifications_type_enum"`);
  }
}
