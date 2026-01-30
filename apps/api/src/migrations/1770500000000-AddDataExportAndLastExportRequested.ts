import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDataExportAndLastExportRequested1770500000000 implements MigrationInterface {
  name = 'AddDataExportAndLastExportRequested1770500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "last_export_requested_at" TIMESTAMP`,
    );
    await queryRunner.query(`
      CREATE TABLE "data_exports" (
        "id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "token" varchar(64) NOT NULL,
        "storage_key" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "expires_at" TIMESTAMP NOT NULL,
        CONSTRAINT "PK_data_exports" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_data_exports_token" UNIQUE ("token"),
        CONSTRAINT "FK_data_exports_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_data_exports_user_id" ON "data_exports" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_data_exports_token" ON "data_exports" ("token")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "data_exports"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "last_export_requested_at"`,
    );
  }
}
