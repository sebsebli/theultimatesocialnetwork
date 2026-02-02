import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds remaining Postgres tables used by entities but not in InitialSchema or
 * AddMentionsDmNotificationsBlocksMutes: post_edges, post_reads, likes, keeps,
 * collections, collection_items, external_sources, follow_requests, topic_follows,
 * push_tokens, push_outbox, waiting_list.
 * Idempotent: CREATE TABLE IF NOT EXISTS.
 */
export class AddRemainingPostgresTables1771000000000 implements MigrationInterface {
  name = 'AddRemainingPostgresTables1771000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // post_edges enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "post_edges_edge_type_enum" AS ENUM('LINK', 'QUOTE');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "post_edges" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "from_post_id" uuid NOT NULL,
        "to_post_id" uuid NOT NULL,
        "edge_type" "post_edges_edge_type_enum" NOT NULL,
        "anchor_text" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_post_edges" PRIMARY KEY ("id"),
        CONSTRAINT "FK_post_edges_from" FOREIGN KEY ("from_post_id") REFERENCES "posts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_post_edges_to" FOREIGN KEY ("to_post_id") REFERENCES "posts"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_post_edges_from_post_id" ON "post_edges" ("from_post_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_post_edges_to_post_id" ON "post_edges" ("to_post_id")`,
    );

    // post_reads
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "post_reads" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "post_id" uuid NOT NULL,
        "duration_seconds" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "last_read_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_post_reads" PRIMARY KEY ("id"),
        CONSTRAINT "FK_post_reads_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_post_reads_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_post_reads_user_post" UNIQUE ("user_id", "post_id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_post_reads_user_id" ON "post_reads" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_post_reads_post_id" ON "post_reads" ("post_id")`,
    );

    // likes
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "likes" (
        "user_id" uuid NOT NULL,
        "post_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_likes" PRIMARY KEY ("user_id", "post_id"),
        CONSTRAINT "FK_likes_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_likes_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_likes_post_id" ON "likes" ("post_id")`,
    );

    // keeps
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "keeps" (
        "user_id" uuid NOT NULL,
        "post_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_keeps" PRIMARY KEY ("user_id", "post_id"),
        CONSTRAINT "FK_keeps_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_keeps_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_keeps_post_id" ON "keeps" ("post_id")`,
    );

    // collections
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "collections" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "owner_id" uuid NOT NULL,
        "title" character varying NOT NULL,
        "description" text,
        "is_public" boolean NOT NULL DEFAULT false,
        "share_saves" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_collections" PRIMARY KEY ("id"),
        CONSTRAINT "FK_collections_owner" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_collections_owner_id" ON "collections" ("owner_id")`,
    );

    // collection_items
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "collection_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "collection_id" uuid NOT NULL,
        "post_id" uuid NOT NULL,
        "curator_note" text,
        "added_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "sort_order" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_collection_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_collection_items_collection" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_collection_items_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_collection_items_collection_id" ON "collection_items" ("collection_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_collection_items_post_id" ON "collection_items" ("post_id")`,
    );

    // external_sources
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "external_sources" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "post_id" uuid NOT NULL,
        "url" character varying NOT NULL,
        "canonical_url" text,
        "title" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_external_sources" PRIMARY KEY ("id"),
        CONSTRAINT "FK_external_sources_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_external_sources_post_id" ON "external_sources" ("post_id")`,
    );

    // follow_requests enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "follow_requests_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "follow_requests" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "requester_id" uuid NOT NULL,
        "target_id" uuid NOT NULL,
        "status" "follow_requests_status_enum" NOT NULL DEFAULT 'PENDING',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_follow_requests" PRIMARY KEY ("id"),
        CONSTRAINT "FK_follow_requests_requester" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_follow_requests_target" FOREIGN KEY ("target_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_follow_requests_target_id" ON "follow_requests" ("target_id")`,
    );

    // topic_follows
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "topic_follows" (
        "user_id" uuid NOT NULL,
        "topic_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_topic_follows" PRIMARY KEY ("user_id", "topic_id"),
        CONSTRAINT "FK_topic_follows_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_topic_follows_topic" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_topic_follows_topic_id" ON "topic_follows" ("topic_id")`,
    );

    // push_tokens enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "push_tokens_provider_enum" AS ENUM('APNS', 'FCM');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "push_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "provider" "push_tokens_provider_enum" NOT NULL,
        "token" character varying NOT NULL,
        "platform" character varying NOT NULL,
        "device_id" text,
        "app_version" text,
        "locale" text,
        "apns_environment" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "last_seen_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "disabled_at" TIMESTAMP,
        CONSTRAINT "PK_push_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_push_tokens_provider_token" UNIQUE ("provider", "token"),
        CONSTRAINT "FK_push_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_push_tokens_user_id" ON "push_tokens" ("user_id")`,
    );

    // push_outbox enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "push_outbox_status_enum" AS ENUM('pending', 'sent', 'failed', 'suppressed');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "push_outbox" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "notif_type" character varying NOT NULL,
        "title" character varying NOT NULL,
        "body" character varying NOT NULL,
        "data" jsonb NOT NULL DEFAULT '{}',
        "priority" character varying NOT NULL DEFAULT 'normal',
        "status" "push_outbox_status_enum" NOT NULL DEFAULT 'pending',
        "attempt_count" integer NOT NULL DEFAULT 0,
        "last_error" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "sent_at" TIMESTAMP,
        CONSTRAINT "PK_push_outbox" PRIMARY KEY ("id"),
        CONSTRAINT "FK_push_outbox_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_push_outbox_user_id" ON "push_outbox" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_push_outbox_status" ON "push_outbox" ("status")`,
    );

    // waiting_list enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "waiting_list_status_enum" AS ENUM('PENDING', 'INVITED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "waiting_list" (
        "email" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "ip_hash" text,
        "status" "waiting_list_status_enum" NOT NULL DEFAULT 'PENDING',
        CONSTRAINT "PK_waiting_list" PRIMARY KEY ("email")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "waiting_list"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "waiting_list_status_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "push_outbox"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "push_outbox_status_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "push_tokens"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "push_tokens_provider_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "topic_follows"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "follow_requests"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "follow_requests_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "external_sources"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "collection_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "collections"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "keeps"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "likes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "post_reads"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "post_edges"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "post_edges_edge_type_enum"`);
  }
}
