import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReportComment1738230000000 implements MigrationInterface {
  name = 'AddReportComment1738230000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "comment" TEXT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "reports" DROP COLUMN "comment"`);
  }
}
