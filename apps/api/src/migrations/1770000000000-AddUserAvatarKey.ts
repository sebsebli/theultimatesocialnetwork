import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAvatarKey1770000000000 implements MigrationInterface {
  name = 'AddUserAvatarKey1770000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "avatar_key" TEXT`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_key"`);
  }
}
