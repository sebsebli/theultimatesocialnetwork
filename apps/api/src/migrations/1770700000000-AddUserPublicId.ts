import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserPublicId1770700000000 implements MigrationInterface {
  name = 'AddUserPublicId1770700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add column nullable
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "public_id" text`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_public_id" ON "users" ("public_id")`,
    );

    // 2. Backfill existing users with a random ID (Postgres-side generation for speed/simplicity)
    // Using a simple random string for now. In a real massive DB, we'd batch this.
    // 12 chars from base64 of random bytes is reasonably unique for user IDs.
    await queryRunner.query(`
      UPDATE "users" 
      SET "public_id" = substring(md5(random()::text || clock_timestamp()::text) from 1 for 12)
      WHERE "public_id" IS NULL
    `);

    // 3. Enforce Not Null
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "public_id" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_users_public_id"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "public_id"`);
  }
}
