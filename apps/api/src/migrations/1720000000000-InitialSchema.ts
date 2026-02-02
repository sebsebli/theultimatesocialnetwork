import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates base tables so that incremental migrations (1738224000000 and later)
 * can run on a completely fresh database. Only tables/columns that are *altered*
 * by later migrations are created here in their "pre-migration" state; all
 * other app tables are created with full schema so the app can run.
 */
export class InitialSchema1720000000000 implements MigrationInterface {
  name = 'InitialSchema1720000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure uuid extension exists (TypeORM often runs this before migrations; make it safe)
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create enum types used by base tables (ignore if already exist)
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "users_role_enum" AS ENUM('user', 'admin', 'moderator');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "reports_target_type_enum" AS ENUM('POST', 'REPLY', 'USER', 'DM');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "reports_status_enum" AS ENUM('OPEN', 'REVIEWED', 'ACTIONED', 'DISMISSED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "posts_visibility_enum" AS ENUM('FOLLOWERS', 'PUBLIC');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "posts_status_enum" AS ENUM('PUBLISHED', 'DRAFT');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // Users table (base: no onboarding_completed_at, avatar_key, profile_header_key, public_id, last_export_requested_at — those are added by later migrations)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL,
        "email" character varying UNIQUE,
        "handle" character varying NOT NULL,
        "display_name" character varying NOT NULL,
        "bio" text,
        "is_protected" boolean NOT NULL DEFAULT false,
        "role" "users_role_enum" NOT NULL DEFAULT 'user',
        "banned_at" TIMESTAMP,
        "two_factor_enabled" boolean NOT NULL DEFAULT false,
        "two_factor_secret" text,
        "token_version" integer NOT NULL DEFAULT 0,
        "invites_remaining" integer NOT NULL DEFAULT 3,
        "languages" text array NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "follower_count" integer NOT NULL DEFAULT 0,
        "following_count" integer NOT NULL DEFAULT 0,
        "quote_received_count" integer NOT NULL DEFAULT 0,
        "preferences" jsonb NOT NULL DEFAULT '{}',
        "last_username_change_at" TIMESTAMP,
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_handle" ON "users" ("handle")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_display_name" ON "users" ("display_name")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_created_at" ON "users" ("created_at")`,
    );

    // Posts (full — needed for replies and post_topics)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "posts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "author_id" uuid NOT NULL,
        "visibility" "posts_visibility_enum" NOT NULL DEFAULT 'PUBLIC',
        "status" "posts_status_enum" NOT NULL DEFAULT 'PUBLISHED',
        "body" text NOT NULL,
        "title" text,
        "header_image_key" text,
        "header_image_blurhash" text,
        "lang" text,
        "lang_confidence" float,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "reply_count" integer NOT NULL DEFAULT 0,
        "quote_count" integer NOT NULL DEFAULT 0,
        "private_like_count" integer NOT NULL DEFAULT 0,
        "view_count" integer NOT NULL DEFAULT 0,
        "reading_time_minutes" float NOT NULL DEFAULT 0,
        "media" jsonb,
        CONSTRAINT "PK_posts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_posts_author" FOREIGN KEY ("author_id") REFERENCES "users"("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_posts_author_created" ON "posts" ("author_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_posts_status_created" ON "posts" ("status", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_posts_author_id" ON "posts" ("author_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_posts_lang" ON "posts" ("lang")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_posts_created_at" ON "posts" ("created_at")`,
    );

    // Topics
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "topics" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "slug" character varying NOT NULL,
        "title" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        CONSTRAINT "PK_topics" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_topics_slug" UNIQUE ("slug")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_topics_slug" ON "topics" ("slug")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_topics_created_by" ON "topics" ("created_by")`,
    );

    // Post topics
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "post_topics" (
        "post_id" uuid NOT NULL,
        "topic_id" uuid NOT NULL,
        CONSTRAINT "PK_post_topics" PRIMARY KEY ("post_id", "topic_id"),
        CONSTRAINT "FK_post_topics_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_post_topics_topic" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE
      )
    `);

    // Reports (base: no "comment" — added by AddReportComment)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reports" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "reporter_id" uuid NOT NULL,
        "target_type" "reports_target_type_enum" NOT NULL,
        "target_id" uuid NOT NULL,
        "reason" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "status" "reports_status_enum" NOT NULL DEFAULT 'OPEN',
        CONSTRAINT "PK_reports" PRIMARY KEY ("id")
      )
    `);

    // Replies (base: no like_count — added by AddReplyLikes)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "replies" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "post_id" uuid NOT NULL,
        "author_id" uuid NOT NULL,
        "parent_reply_id" uuid,
        "body" text NOT NULL,
        "lang" text,
        "lang_confidence" float,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_replies" PRIMARY KEY ("id"),
        CONSTRAINT "FK_replies_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_replies_author" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_replies_parent" FOREIGN KEY ("parent_reply_id") REFERENCES "replies"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_replies_post_id" ON "replies" ("post_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_replies_author_id" ON "replies" ("author_id")`,
    );

    // Invites (base: only code, creator_id, used_by_id, created_at, used_at — email, expires_at, status, revoked_at, last_sent_at added by AddInviteEmailAndLifecycle)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invites" (
        "code" text NOT NULL,
        "creator_id" uuid,
        "used_by_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "used_at" TIMESTAMP,
        CONSTRAINT "PK_invites" PRIMARY KEY ("code"),
        CONSTRAINT "FK_invites_creator" FOREIGN KEY ("creator_id") REFERENCES "users"("id"),
        CONSTRAINT "FK_invites_used_by" FOREIGN KEY ("used_by_id") REFERENCES "users"("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_invites_creator_id" ON "invites" ("creator_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_invites_used_by_id" ON "invites" ("used_by_id")`,
    );

    // Notification prefs (base: no email_marketing, email_product_updates — added by AddEmailNotificationPrefs)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_prefs" (
        "user_id" uuid NOT NULL,
        "push_enabled" boolean NOT NULL DEFAULT true,
        "replies" boolean NOT NULL DEFAULT true,
        "quotes" boolean NOT NULL DEFAULT true,
        "mentions" boolean NOT NULL DEFAULT true,
        "dms" boolean NOT NULL DEFAULT true,
        "follows" boolean NOT NULL DEFAULT true,
        "saves" boolean NOT NULL DEFAULT false,
        "quiet_hours_start" smallint,
        "quiet_hours_end" smallint,
        CONSTRAINT "PK_notification_prefs" PRIMARY KEY ("user_id"),
        CONSTRAINT "FK_notification_prefs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Sessions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token_hash" text NOT NULL,
        "ip_address" text,
        "device_info" text,
        "last_active_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "expires_at" TIMESTAMP NOT NULL,
        CONSTRAINT "PK_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_sessions_token_hash" UNIQUE ("token_hash"),
        CONSTRAINT "FK_sessions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sessions_user_id" ON "sessions" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sessions_expires_at" ON "sessions" ("expires_at")`,
    );

    // Follows
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "follows" (
        "follower_id" uuid NOT NULL,
        "followee_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_follows" PRIMARY KEY ("follower_id", "followee_id"),
        CONSTRAINT "FK_follows_follower" FOREIGN KEY ("follower_id") REFERENCES "users"("id"),
        CONSTRAINT "FK_follows_followee" FOREIGN KEY ("followee_id") REFERENCES "users"("id")
      )
    `);

    // System settings (key/value for beta mode, etc.)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "system_settings" (
        "key" text NOT NULL,
        "value" text NOT NULL,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_system_settings" PRIMARY KEY ("key")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Down in reverse order of creation (drop FKs first by dropping tables)
    await queryRunner.query(`DROP TABLE IF EXISTS "system_settings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "follows"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_prefs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invites"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "replies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reports"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "post_topics"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "topics"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "posts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "posts_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "posts_visibility_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "reports_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "reports_target_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum"`);
  }
}
