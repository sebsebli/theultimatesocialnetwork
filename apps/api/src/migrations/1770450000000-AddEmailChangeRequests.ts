import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailChangeRequests1770450000000 implements MigrationInterface {
  name = 'AddEmailChangeRequests1770450000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "email_change_requests" (
        "id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "new_email" text NOT NULL,
        "token" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "expires_at" TIMESTAMP NOT NULL,
        "consumed_at" TIMESTAMP,
        CONSTRAINT "PK_email_change_requests" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_email_change_requests_token" UNIQUE ("token"),
        CONSTRAINT "FK_email_change_requests_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_email_change_requests_user_id" ON "email_change_requests" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_email_change_requests_token" ON "email_change_requests" ("token")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "email_change_requests"`);
  }
}
