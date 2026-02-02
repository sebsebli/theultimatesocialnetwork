import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1770018500 implements MigrationInterface {
  name = 'AddPerformanceIndexes1770018500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_posts_author_created" ON "posts" ("author_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_posts_status_created" ON "posts" ("status", "created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_posts_status_created"`);
    await queryRunner.query(`DROP INDEX "IDX_posts_author_created"`);
  }
}
