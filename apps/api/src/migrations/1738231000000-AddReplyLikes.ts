import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReplyLikes1738231000000 implements MigrationInterface {
  name = 'AddReplyLikes1738231000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "replies" ADD COLUMN IF NOT EXISTS "like_count" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "reply_likes" (
        "user_id" uuid NOT NULL,
        "reply_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reply_likes" PRIMARY KEY ("user_id", "reply_id"),
        CONSTRAINT "FK_reply_likes_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reply_likes_reply" FOREIGN KEY ("reply_id") REFERENCES "replies"("id") ON DELETE CASCADE
      )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "reply_likes"`);
    await queryRunner.query(
      `ALTER TABLE "replies" DROP COLUMN IF EXISTS "like_count"`,
    );
  }
}
