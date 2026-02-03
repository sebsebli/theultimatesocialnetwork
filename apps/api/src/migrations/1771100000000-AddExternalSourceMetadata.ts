import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add Open Graph metadata columns to external_sources: description, image_url.
 * Post worker already fetches OG and stores title; this allows storing description and image for richer source previews.
 */
export class AddExternalSourceMetadata1771100000000 implements MigrationInterface {
  name = 'AddExternalSourceMetadata1771100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "external_sources" ADD COLUMN IF NOT EXISTS "description" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "external_sources" ADD COLUMN IF NOT EXISTS "image_url" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "external_sources" DROP COLUMN IF EXISTS "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "external_sources" DROP COLUMN IF EXISTS "image_url"`,
    );
  }
}
