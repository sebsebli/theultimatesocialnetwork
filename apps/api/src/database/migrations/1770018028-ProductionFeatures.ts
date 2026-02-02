import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductionFeatures1770018028 implements MigrationInterface {
  name = 'ProductionFeatures1770018028';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Users: Add Role, BannedAt, 2FA, TokenVersion, IsProtected
    await queryRunner.query(
      `ALTER TABLE "users" ADD "role" character varying NOT NULL DEFAULT 'user'`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "banned_at" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "two_factor_enabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "two_factor_secret" text`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "token_version" integer NOT NULL DEFAULT 0`,
    );
    // is_protected might already exist or be needed, checking safety
    await queryRunner.query(
      `ALTER TABLE "users" ADD IF NOT EXISTS "is_protected" boolean NOT NULL DEFAULT false`,
    );

    // 2. Posts: Add Status (Drafts), Media (Rich Content)
    await queryRunner.query(
      `CREATE TYPE "public"."posts_status_enum" AS ENUM('PUBLISHED', 'DRAFT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "status" "public"."posts_status_enum" NOT NULL DEFAULT 'PUBLISHED'`,
    );
    await queryRunner.query(`ALTER TABLE "posts" ADD "media" jsonb`);
    await queryRunner.query(
      `CREATE INDEX "IDX_posts_status" ON "posts" ("status")`,
    );

    // 3. Create Sessions Table
    await queryRunner.query(
      `CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "token_hash" text NOT NULL, "ip_address" text, "device_info" text, "last_active_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "expires_at" TIMESTAMP NOT NULL, CONSTRAINT "UQ_sessions_token_hash" UNIQUE ("token_hash"), CONSTRAINT "PK_sessions_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sessions_user_id" ON "sessions" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sessions_expires_at" ON "sessions" ("expires_at")`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "FK_sessions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // 4. Create Reports Table
    await queryRunner.query(
      `CREATE TYPE "public"."reports_target_type_enum" AS ENUM('POST', 'REPLY', 'USER', 'DM')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."reports_status_enum" AS ENUM('OPEN', 'REVIEWED', 'ACTIONED', 'DISMISSED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reporter_id" character varying NOT NULL, "target_type" "public"."reports_target_type_enum" NOT NULL, "target_id" character varying NOT NULL, "reason" text NOT NULL, "comment" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "status" "public"."reports_status_enum" NOT NULL DEFAULT 'OPEN', CONSTRAINT "PK_reports_id" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "reports"`);
    await queryRunner.query(`DROP TYPE "public"."reports_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."reports_target_type_enum"`);

    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "FK_sessions_user_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_sessions_expires_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_sessions_user_id"`);
    await queryRunner.query(`DROP TABLE "sessions"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_posts_status"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "media"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."posts_status_enum"`);

    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_protected"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "token_version"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "two_factor_secret"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "two_factor_enabled"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "banned_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
  }
}
