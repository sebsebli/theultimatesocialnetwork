import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddModerationRecords1770800000000 implements MigrationInterface {
  name = 'AddModerationRecords1770800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "moderation_records_target_type_enum" AS ENUM('POST', 'REPLY');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "moderation_records_reason_code_enum" AS ENUM(
          'SPAM', 'ADVERTISING', 'HARASSMENT', 'REPEATED', 'VIOLENCE', 'HATE', 'OTHER'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "moderation_records_source_enum" AS ENUM('ASYNC_CHECK', 'REPORT_THRESHOLD');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "moderation_records" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "target_type" "moderation_records_target_type_enum" NOT NULL,
        "target_id" uuid NOT NULL,
        "author_id" uuid NOT NULL,
        "reason_code" "moderation_records_reason_code_enum" NOT NULL,
        "reason_text" text NOT NULL,
        "confidence" float NOT NULL,
        "content_snapshot" text NOT NULL,
        "source" "moderation_records_source_enum" NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_moderation_records" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_moderation_records_target_type" ON "moderation_records" ("target_type")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_moderation_records_target_id" ON "moderation_records" ("target_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_moderation_records_author_id" ON "moderation_records" ("author_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_moderation_records_created_at" ON "moderation_records" ("created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "moderation_records"`);
    await queryRunner.query(`DROP TYPE "moderation_records_source_enum"`);
    await queryRunner.query(`DROP TYPE "moderation_records_reason_code_enum"`);
    await queryRunner.query(`DROP TYPE "moderation_records_target_type_enum"`);
  }
}
