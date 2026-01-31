import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailNotificationPrefs1770600000000 implements MigrationInterface {
  name = 'AddEmailNotificationPrefs1770600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification_prefs" ADD COLUMN "email_marketing" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_prefs" ADD COLUMN "email_product_updates" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification_prefs" DROP COLUMN "email_product_updates"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_prefs" DROP COLUMN "email_marketing"`,
    );
  }
}
