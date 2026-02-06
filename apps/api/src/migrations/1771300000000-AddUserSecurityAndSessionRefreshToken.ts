import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds columns required by User and Session entities that were missing in production:
 * - users: failed_login_attempts, locked_until (account lockout)
 * - sessions: refresh_token_hash (for refresh token validation)
 */
export class AddUserSecurityAndSessionRefreshToken1771300000000 implements MigrationInterface {
  name = 'AddUserSecurityAndSessionRefreshToken1771300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users: account lockout fields
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failed_login_attempts" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "locked_until" TIMESTAMP`,
    );

    // Sessions: refresh token hash for validating refresh requests
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "refresh_token_hash" text`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sessions_refresh_token_hash" ON "sessions" ("refresh_token_hash")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_sessions_refresh_token_hash"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP COLUMN IF EXISTS "refresh_token_hash"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "locked_until"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "failed_login_attempts"`,
    );
  }
}
