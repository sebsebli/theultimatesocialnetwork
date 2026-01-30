import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfileHeaderKey1770300000000 implements MigrationInterface {
  name = 'AddUserProfileHeaderKey1770300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "profile_header_key" TEXT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "profile_header_key"`,
    );
  }
}
