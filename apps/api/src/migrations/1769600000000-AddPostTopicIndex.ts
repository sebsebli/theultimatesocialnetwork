import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostTopicIndex1769600000000 implements MigrationInterface {
  name = 'AddPostTopicIndex1769600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_post_topics_topic_id" ON "post_topics" ("topic_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_post_topics_topic_id"`);
  }
}
