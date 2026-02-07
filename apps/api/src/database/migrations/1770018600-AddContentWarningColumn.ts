import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContentWarningColumn1770018600
  implements MigrationInterface {
  name = 'AddContentWarningColumn1770018600';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Post: content_warning (Apple 1.2.1(a) / DSA)
    await queryRunner.query(
      `ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "content_warning" text`,
    );
    // User: privacy_settings (GDPR Art. 21)
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "privacy_settings" jsonb DEFAULT '{}'::jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts" DROP COLUMN IF EXISTS "content_warning"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "privacy_settings"`,
    );
  }
}
