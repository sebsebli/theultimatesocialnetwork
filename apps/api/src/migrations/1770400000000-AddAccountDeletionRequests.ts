import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccountDeletionRequests1770400000000 implements MigrationInterface {
  name = 'AddAccountDeletionRequests1770400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "account_deletion_requests" (
        "id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "token" uuid NOT NULL,
        "reason" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "expires_at" TIMESTAMP NOT NULL,
        "consumed_at" TIMESTAMP,
        CONSTRAINT "PK_account_deletion_requests" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_account_deletion_requests_token" UNIQUE ("token"),
        CONSTRAINT "FK_account_deletion_requests_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_account_deletion_requests_user_id" ON "account_deletion_requests" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_account_deletion_requests_token" ON "account_deletion_requests" ("token")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "account_deletion_requests"`);
  }
}
