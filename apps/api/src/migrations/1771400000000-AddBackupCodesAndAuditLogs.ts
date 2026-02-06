import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Production migration:
 * - users.two_factor_backup_codes (JSONB) for 2FA recovery codes
 * - audit_logs table for admin action tracking
 */
export class AddBackupCodesAndAuditLogs1771400000000 implements MigrationInterface {
  name = 'AddBackupCodesAndAuditLogs1771400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users: 2FA backup codes (JSONB array of { hash, used })
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "two_factor_backup_codes" jsonb`,
    );

    // Audit logs table for admin actions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "actor_id" character varying NOT NULL,
        "action" character varying NOT NULL,
        "resource_type" character varying,
        "resource_id" character varying,
        "details" jsonb,
        "ip_address" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);

    // Index for querying by actor and time range
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_audit_logs_actor_id" ON "audit_logs" ("actor_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_audit_logs_created_at" ON "audit_logs" ("created_at" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "two_factor_backup_codes"`,
    );
  }
}
