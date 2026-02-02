import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates system_settings table if missing (e.g. DBs that ran InitialSchema before it included this table).
 * Idempotent: safe to run on fresh DB (InitialSchema already creates it) or existing DB.
 */
export class AddSystemSettings1720000000001 implements MigrationInterface {
  name = 'AddSystemSettings1720000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
    await queryRunner.query(`DROP TABLE IF EXISTS "system_settings"`);
  }
}
