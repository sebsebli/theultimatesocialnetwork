import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInviteEmailAndLifecycle1770200000000 implements MigrationInterface {
  name = 'AddInviteEmailAndLifecycle1770200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "invites" ADD COLUMN IF NOT EXISTS "email" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "invites" ADD COLUMN IF NOT EXISTS "expires_at" timestamp`,
    );
    await queryRunner.query(
      `ALTER TABLE "invites" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'PENDING'`,
    );
    await queryRunner.query(
      `ALTER TABLE "invites" ADD COLUMN IF NOT EXISTS "revoked_at" timestamp`,
    );
    await queryRunner.query(
      `ALTER TABLE "invites" ADD COLUMN IF NOT EXISTS "last_sent_at" timestamp`,
    );
    await queryRunner.query(
      `UPDATE "invites" SET "status" = 'PENDING' WHERE "status" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "invites" SET "status" = 'ACTIVATED' WHERE "used_at" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "invites" DROP COLUMN IF EXISTS "email"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invites" DROP COLUMN IF EXISTS "expires_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invites" DROP COLUMN IF EXISTS "status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invites" DROP COLUMN IF EXISTS "revoked_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invites" DROP COLUMN IF EXISTS "last_sent_at"`,
    );
  }
}
