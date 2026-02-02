import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOnboardingCompletedAt1738224000000 implements MigrationInterface {
  name = 'AddOnboardingCompletedAt1738224000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_completed_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "onboarding_completed_at"`,
    );
  }
}
