import { MigrationInterface, QueryRunner } from 'typeorm';

const IGNORED_CODES = new Set(['42P01', '42704', '42703']); // undefined_table, undefined_object, undefined_column

/** Run a query and ignore missing relation/constraint/column so migration is safe on fresh DBs. Uses savepoints so a failed statement doesn't abort the transaction. */
async function runIgnoreMissing(
  queryRunner: QueryRunner,
  sql: string,
): Promise<void> {
  const savepoint = `migration_ignore_${Math.random().toString(36).slice(2, 10)}`;
  await queryRunner.query(`SAVEPOINT ${savepoint}`);
  try {
    await queryRunner.query(sql);
    await queryRunner.query(`RELEASE SAVEPOINT ${savepoint}`);
  } catch (err: unknown) {
    await queryRunner.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
    const code =
      (err as { driverError?: { code: string }; code?: string })?.driverError
        ?.code ??
      (err as { code?: string })?.code ??
      '';
    if (!IGNORED_CODES.has(code)) throw err;
  }
}

export class MakeAuthorIdNullable1770209237982 implements MigrationInterface {
  name = 'MakeAuthorIdNullable1770209237982';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "topic_follows" DROP CONSTRAINT "FK_topic_follows_topic"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "topic_follows" DROP CONSTRAINT "FK_topic_follows_user"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "sessions" DROP CONSTRAINT "FK_sessions_user"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "post_edges" DROP CONSTRAINT "FK_post_edges_to"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "post_edges" DROP CONSTRAINT "FK_post_edges_from"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "post_topics" DROP CONSTRAINT "FK_post_topics_topic"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "post_topics" DROP CONSTRAINT "FK_post_topics_post"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "mentions" DROP CONSTRAINT "FK_mentions_mentioned_user"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "mentions" DROP CONSTRAINT "FK_mentions_reply"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "mentions" DROP CONSTRAINT "FK_mentions_post"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "posts" DROP CONSTRAINT "FK_posts_author"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "replies" DROP CONSTRAINT "FK_replies_parent"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "replies" DROP CONSTRAINT "FK_replies_author"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "replies" DROP CONSTRAINT "FK_replies_post"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "reply_likes" DROP CONSTRAINT "FK_reply_likes_reply"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "reply_likes" DROP CONSTRAINT "FK_reply_likes_user"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "push_tokens" DROP CONSTRAINT "FK_push_tokens_user"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "push_outbox" DROP CONSTRAINT "FK_push_outbox_user"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "post_reads" DROP CONSTRAINT "FK_post_reads_post"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "post_reads" DROP CONSTRAINT "FK_post_reads_user"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_user"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "notification_prefs" DROP CONSTRAINT "FK_notification_prefs_user"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "mutes" DROP CONSTRAINT "FK_mutes_muted"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "mutes" DROP CONSTRAINT "FK_mutes_muter"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "likes" DROP CONSTRAINT "FK_likes_post"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "likes" DROP CONSTRAINT "FK_likes_user"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "keeps" DROP CONSTRAINT "FK_keeps_post"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "keeps" DROP CONSTRAINT "FK_keeps_user"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "invites" DROP CONSTRAINT "FK_invites_used_by"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "invites" DROP CONSTRAINT "FK_invites_creator"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "follows" DROP CONSTRAINT "FK_follows_followee"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "follows" DROP CONSTRAINT "FK_follows_follower"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "follow_requests" DROP CONSTRAINT "FK_follow_requests_target"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "follow_requests" DROP CONSTRAINT "FK_follow_requests_requester"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "external_sources" DROP CONSTRAINT "FK_external_sources_post"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "email_change_requests" DROP CONSTRAINT "FK_email_change_requests_user"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "dm_threads" DROP CONSTRAINT "FK_dm_threads_user_b"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "dm_threads" DROP CONSTRAINT "FK_dm_threads_user_a"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "dm_messages" DROP CONSTRAINT "FK_dm_messages_sender"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "dm_messages" DROP CONSTRAINT "FK_dm_messages_thread"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "data_exports" DROP CONSTRAINT "FK_data_exports_user"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "collection_items" DROP CONSTRAINT "FK_collection_items_post"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "collection_items" DROP CONSTRAINT "FK_collection_items_collection"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "collections" DROP CONSTRAINT "FK_collections_owner"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "blocks" DROP CONSTRAINT "FK_blocks_blocked"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "blocks" DROP CONSTRAINT "FK_blocks_blocker"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "account_deletion_requests" DROP CONSTRAINT "FK_account_deletion_requests_user"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_users_handle"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_users_display_name"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_users_created_at"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_users_public_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_topics_slug"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_topics_created_by"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_topic_follows_topic_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_sessions_user_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_sessions_expires_at"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_post_edges_from_post_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_post_edges_to_post_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_post_edges_to_edge_created"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_post_topics_topic_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_mentions_post_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_mentions_reply_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_mentions_mentioned_user_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_posts_author_created"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_posts_status_created"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_posts_author_id"`,
    );
    await runIgnoreMissing(queryRunner, `DROP INDEX "public"."IDX_posts_lang"`);
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_posts_created_at"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_replies_post_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_replies_author_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_push_tokens_user_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_push_outbox_user_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_push_outbox_status"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_post_reads_user_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_post_reads_post_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_notifications_user_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_notifications_read_at"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_mutes_muter_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_mutes_muted_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_moderation_records_target_type"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_moderation_records_target_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_moderation_records_author_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_moderation_records_created_at"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_likes_post_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_keeps_post_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_invites_creator_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_invites_used_by_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_follows_followee_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_follow_requests_target_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_external_sources_post_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_email_change_requests_user_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_email_change_requests_token"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_dm_threads_user_a"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_dm_threads_user_b"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_dm_threads_updated_at"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_dm_messages_thread_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_dm_messages_sender_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_data_exports_user_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_data_exports_token"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_collection_items_collection_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_collection_items_post_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_collections_owner_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_blocks_blocker_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_blocks_blocked_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_account_deletion_requests_user_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_account_deletion_requests_token"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "push_tokens" DROP CONSTRAINT "UQ_push_tokens_provider_token"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "post_reads" DROP CONSTRAINT "UQ_post_reads_user_post"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TYPE "public"."waiting_list_status_enum" RENAME TO "waiting_list_status_enum_old"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE TYPE "public"."waiting_list_status_enum" AS ENUM('PENDING', 'INVITED')`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "waiting_list" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "waiting_list" ALTER COLUMN "status" TYPE "public"."waiting_list_status_enum" USING "status"::"text"::"public"."waiting_list_status_enum"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "waiting_list" ALTER COLUMN "status" SET DEFAULT 'PENDING'`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP TYPE "public"."waiting_list_status_enum_old"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "users" DROP COLUMN "public_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "users" ADD "public_id" character varying NOT NULL`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_848b8b23bf0748243d4e1e76ae3" UNIQUE ("public_id")`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_6a7e5f591436179c411f5308a9e" UNIQUE ("handle")`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "sessions" ALTER COLUMN "last_active_at" SET DEFAULT now()`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "reports" DROP COLUMN "reporter_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "reports" ADD "reporter_id" character varying NOT NULL`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "reports" DROP COLUMN "target_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "reports" ADD "target_id" character varying NOT NULL`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TYPE "public"."post_edges_edge_type_enum" RENAME TO "post_edges_edge_type_enum_old"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE TYPE "public"."post_edges_edge_type_enum" AS ENUM('LINK', 'QUOTE')`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "post_edges" ALTER COLUMN "edge_type" TYPE "public"."post_edges_edge_type_enum" USING "edge_type"::"text"::"public"."post_edges_edge_type_enum"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP TYPE "public"."post_edges_edge_type_enum_old"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "posts" ALTER COLUMN "author_id" DROP NOT NULL`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "push_tokens" DROP COLUMN "user_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "push_tokens" ADD "user_id" character varying NOT NULL`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TYPE "public"."push_tokens_provider_enum" RENAME TO "push_tokens_provider_enum_old"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE TYPE "public"."push_tokens_provider_enum" AS ENUM('APNS', 'FCM')`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "push_tokens" ALTER COLUMN "provider" TYPE "public"."push_tokens_provider_enum" USING "provider"::"text"::"public"."push_tokens_provider_enum"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP TYPE "public"."push_tokens_provider_enum_old"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "push_tokens" ALTER COLUMN "last_seen_at" SET DEFAULT now()`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "push_outbox" DROP COLUMN "user_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "push_outbox" ADD "user_id" character varying NOT NULL`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TYPE "public"."push_outbox_status_enum" RENAME TO "push_outbox_status_enum_old"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE TYPE "public"."push_outbox_status_enum" AS ENUM('pending', 'sent', 'failed', 'suppressed')`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "push_outbox" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "push_outbox" ALTER COLUMN "status" TYPE "public"."push_outbox_status_enum" USING "status"::"text"::"public"."push_outbox_status_enum"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "push_outbox" ALTER COLUMN "status" SET DEFAULT 'pending'`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP TYPE "public"."push_outbox_status_enum_old"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TYPE "public"."notifications_type_enum" RENAME TO "notifications_type_enum_old"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('FOLLOW', 'FOLLOW_REQUEST', 'REPLY', 'QUOTE', 'LIKE', 'MENTION', 'COLLECTION_ADD', 'DM')`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::"text"::"public"."notifications_type_enum"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP TYPE "public"."notifications_type_enum_old"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "notification_prefs" DROP CONSTRAINT "PK_notification_prefs"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "notification_prefs" DROP COLUMN "user_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "notification_prefs" ADD "user_id" character varying NOT NULL`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "notification_prefs" ADD CONSTRAINT "PK_08aa9b88bddce108c313eb9835c" PRIMARY KEY ("user_id")`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "invites" ALTER COLUMN "status" SET NOT NULL`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "follow_requests" DROP COLUMN "requester_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "follow_requests" ADD "requester_id" character varying NOT NULL`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "follow_requests" DROP COLUMN "target_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "follow_requests" ADD "target_id" character varying NOT NULL`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TYPE "public"."follow_requests_status_enum" RENAME TO "follow_requests_status_enum_old"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE TYPE "public"."follow_requests_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED')`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "follow_requests" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "follow_requests" ALTER COLUMN "status" TYPE "public"."follow_requests_status_enum" USING "status"::"text"::"public"."follow_requests_status_enum"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "follow_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING'`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP TYPE "public"."follow_requests_status_enum_old"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "dm_threads" DROP COLUMN "user_a"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "dm_threads" ADD "user_a" character varying NOT NULL`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "dm_threads" DROP COLUMN "user_b"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "dm_threads" ADD "user_b" character varying NOT NULL`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "dm_messages" DROP COLUMN "sender_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "dm_messages" ADD "sender_id" character varying NOT NULL`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "collection_items" ALTER COLUMN "added_at" SET DEFAULT now()`,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_848b8b23bf0748243d4e1e76ae" ON "users" ("public_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_6a7e5f591436179c411f5308a9" ON "users" ("handle") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_a72fa0bb46a03bedcd1745efb4" ON "users" ("display_name") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_c9b5b525a96ddc2c5647d7f7fa" ON "users" ("created_at") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_1c80d78f4792b4c37d32a7a012" ON "users" ("follower_count") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_97c66ab0029f49fde30517f819" ON "topics" ("slug") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_ebe91e9df775ee52d843137510" ON "topics" ("created_by") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_085d540d9f418cfbdc7bd55bb1" ON "sessions" ("user_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_9cfe37d28c3b229a350e086d94" ON "sessions" ("expires_at") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_465b5db6469b315c53362ed454" ON "post_edges" ("from_post_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_b995da5024cb9246ef9e227158" ON "post_edges" ("to_post_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_fa971a43908f58fe75d73b1484" ON "post_topics" ("topic_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_2063b52c183174db78dba86230" ON "mentions" ("post_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_a3adcf8c5535db4a96c6e3e2bf" ON "mentions" ("reply_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_1901d04a1e2de8e831fc107fe3" ON "mentions" ("mentioned_user_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_312c63be865c81b922e39c2475" ON "posts" ("author_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_a69d9e2ae78ef7d100f8317ae0" ON "posts" ("status") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_82f704bea211c1b6cddaa41e9b" ON "posts" ("lang") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_60818528127866f5002e7f826d" ON "posts" ("created_at") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_cf549e613de67f7bbf796e94b7" ON "posts" ("status", "created_at") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_8b2fdcb4fb94d189e0e679748a" ON "posts" ("author_id", "created_at") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_3f53ba89a89b9cea8b9dd9286d" ON "replies" ("post_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_59341ab9e0f418332b712b2dd0" ON "replies" ("author_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_0191ba563241ab8fad41df2d24" ON "post_reads" ("user_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_992e728268bfd0da357d255b9c" ON "post_reads" ("post_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE UNIQUE INDEX "IDX_502ee4309011f9572a7a5d9e24" ON "post_reads" ("user_id", "post_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_2ffe28c7a4e5c3156d135a602c" ON "moderation_records" ("target_type") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_68f018651fdbbe1da9827e8b10" ON "moderation_records" ("target_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_57af857f57c78988ff1889620d" ON "moderation_records" ("author_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_8e4b6bb4cd54b0b5b93f78379f" ON "moderation_records" ("created_at") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_76f6a446d903e8bc9b5f418fe4" ON "invites" ("creator_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_51bac8e59ded3fda54dec66526" ON "invites" ("used_by_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_45b3391d341b1a58def2881e8c" ON "email_change_requests" ("user_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_c236de00f1b420644f7b38052c" ON "email_change_requests" ("token") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_9e781649c6a6b1e316b0a7de95" ON "dm_messages" ("thread_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_8ee9254a3040f10d3f57d789d2" ON "data_exports" ("user_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_38e332e9aea16c8fe619413a87" ON "data_exports" ("token") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_d910810b3fbbd3745a925bcd6c" ON "collections" ("owner_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_741b76f2bbc0cc65281abb0828" ON "account_deletion_requests" ("user_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_43755a9b2165a39eb182a95634" ON "account_deletion_requests" ("token") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "push_tokens" ADD CONSTRAINT "UQ_3470f186e712e35b679da817270" UNIQUE ("provider", "token")`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "topic_follows" ADD CONSTRAINT "FK_227af56af9044dc4df92570effa" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "topic_follows" ADD CONSTRAINT "FK_d9d1eb1f37c517867cd3f8def70" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "sessions" ADD CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "post_edges" ADD CONSTRAINT "FK_465b5db6469b315c53362ed4545" FOREIGN KEY ("from_post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "post_edges" ADD CONSTRAINT "FK_b995da5024cb9246ef9e2271581" FOREIGN KEY ("to_post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "post_topics" ADD CONSTRAINT "FK_ce06cab30d332c3ea040e55bb9a" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "post_topics" ADD CONSTRAINT "FK_fa971a43908f58fe75d73b1484f" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "mentions" ADD CONSTRAINT "FK_2063b52c183174db78dba862302" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "mentions" ADD CONSTRAINT "FK_a3adcf8c5535db4a96c6e3e2bf8" FOREIGN KEY ("reply_id") REFERENCES "replies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "mentions" ADD CONSTRAINT "FK_1901d04a1e2de8e831fc107fe3e" FOREIGN KEY ("mentioned_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "posts" ADD CONSTRAINT "FK_312c63be865c81b922e39c2475e" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "replies" ADD CONSTRAINT "FK_3f53ba89a89b9cea8b9dd9286dc" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "replies" ADD CONSTRAINT "FK_59341ab9e0f418332b712b2dd0b" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "replies" ADD CONSTRAINT "FK_fdda4518c2dd4d9bae7855ecfad" FOREIGN KEY ("parent_reply_id") REFERENCES "replies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "reply_likes" ADD CONSTRAINT "FK_ab114098af787728a1d33dd0d25" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "reply_likes" ADD CONSTRAINT "FK_b399fb36f6e8875c933865df1ad" FOREIGN KEY ("reply_id") REFERENCES "replies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "post_reads" ADD CONSTRAINT "FK_0191ba563241ab8fad41df2d24f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "post_reads" ADD CONSTRAINT "FK_992e728268bfd0da357d255b9c6" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "mutes" ADD CONSTRAINT "FK_9ad4d46d1770bdb681b11cdc131" FOREIGN KEY ("muter_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "mutes" ADD CONSTRAINT "FK_6b578ebb2c35ca3bb5ea08829b2" FOREIGN KEY ("muted_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "likes" ADD CONSTRAINT "FK_3f519ed95f775c781a254089171" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "likes" ADD CONSTRAINT "FK_741df9b9b72f328a6d6f63e79ff" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "keeps" ADD CONSTRAINT "FK_e6a9c673ef0d191cb121ebfb810" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "keeps" ADD CONSTRAINT "FK_1f128dcfac0e2c07f43748fc2da" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "invites" ADD CONSTRAINT "FK_76f6a446d903e8bc9b5f418fe4a" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "invites" ADD CONSTRAINT "FK_51bac8e59ded3fda54dec66526b" FOREIGN KEY ("used_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "follows" ADD CONSTRAINT "FK_54b5dc2739f2dea57900933db66" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "follows" ADD CONSTRAINT "FK_1984b177379388946c21afcdaa9" FOREIGN KEY ("followee_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "external_sources" ADD CONSTRAINT "FK_bb63a3e37423cfc040299d2464a" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "email_change_requests" ADD CONSTRAINT "FK_45b3391d341b1a58def2881e8c2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "dm_messages" ADD CONSTRAINT "FK_9e781649c6a6b1e316b0a7de95b" FOREIGN KEY ("thread_id") REFERENCES "dm_threads"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "collection_items" ADD CONSTRAINT "FK_21bf61f8ce7e69b7bcaee625676" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "collection_items" ADD CONSTRAINT "FK_b5e2cfc2d04beb4ddd398cc766e" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "collections" ADD CONSTRAINT "FK_d910810b3fbbd3745a925bcd6c6" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "blocks" ADD CONSTRAINT "FK_74f530c6fbffc357047b263818d" FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "blocks" ADD CONSTRAINT "FK_8aa6c887bed61ad10829450f2f0" FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "account_deletion_requests" ADD CONSTRAINT "FK_741b76f2bbc0cc65281abb08287" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "account_deletion_requests" DROP CONSTRAINT "FK_741b76f2bbc0cc65281abb08287"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "blocks" DROP CONSTRAINT "FK_8aa6c887bed61ad10829450f2f0"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "blocks" DROP CONSTRAINT "FK_74f530c6fbffc357047b263818d"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "collections" DROP CONSTRAINT "FK_d910810b3fbbd3745a925bcd6c6"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "collection_items" DROP CONSTRAINT "FK_b5e2cfc2d04beb4ddd398cc766e"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "collection_items" DROP CONSTRAINT "FK_21bf61f8ce7e69b7bcaee625676"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "dm_messages" DROP CONSTRAINT "FK_9e781649c6a6b1e316b0a7de95b"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "email_change_requests" DROP CONSTRAINT "FK_45b3391d341b1a58def2881e8c2"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "external_sources" DROP CONSTRAINT "FK_bb63a3e37423cfc040299d2464a"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "follows" DROP CONSTRAINT "FK_1984b177379388946c21afcdaa9"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "follows" DROP CONSTRAINT "FK_54b5dc2739f2dea57900933db66"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "invites" DROP CONSTRAINT "FK_51bac8e59ded3fda54dec66526b"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "invites" DROP CONSTRAINT "FK_76f6a446d903e8bc9b5f418fe4a"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "keeps" DROP CONSTRAINT "FK_1f128dcfac0e2c07f43748fc2da"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "keeps" DROP CONSTRAINT "FK_e6a9c673ef0d191cb121ebfb810"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "likes" DROP CONSTRAINT "FK_741df9b9b72f328a6d6f63e79ff"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "likes" DROP CONSTRAINT "FK_3f519ed95f775c781a254089171"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "mutes" DROP CONSTRAINT "FK_6b578ebb2c35ca3bb5ea08829b2"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "mutes" DROP CONSTRAINT "FK_9ad4d46d1770bdb681b11cdc131"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "post_reads" DROP CONSTRAINT "FK_992e728268bfd0da357d255b9c6"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "post_reads" DROP CONSTRAINT "FK_0191ba563241ab8fad41df2d24f"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "reply_likes" DROP CONSTRAINT "FK_b399fb36f6e8875c933865df1ad"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "reply_likes" DROP CONSTRAINT "FK_ab114098af787728a1d33dd0d25"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "replies" DROP CONSTRAINT "FK_fdda4518c2dd4d9bae7855ecfad"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "replies" DROP CONSTRAINT "FK_59341ab9e0f418332b712b2dd0b"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "replies" DROP CONSTRAINT "FK_3f53ba89a89b9cea8b9dd9286dc"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "posts" DROP CONSTRAINT "FK_312c63be865c81b922e39c2475e"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "mentions" DROP CONSTRAINT "FK_1901d04a1e2de8e831fc107fe3e"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "mentions" DROP CONSTRAINT "FK_a3adcf8c5535db4a96c6e3e2bf8"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "mentions" DROP CONSTRAINT "FK_2063b52c183174db78dba862302"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "post_topics" DROP CONSTRAINT "FK_fa971a43908f58fe75d73b1484f"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "post_topics" DROP CONSTRAINT "FK_ce06cab30d332c3ea040e55bb9a"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "post_edges" DROP CONSTRAINT "FK_b995da5024cb9246ef9e2271581"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "post_edges" DROP CONSTRAINT "FK_465b5db6469b315c53362ed4545"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "sessions" DROP CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "topic_follows" DROP CONSTRAINT "FK_d9d1eb1f37c517867cd3f8def70"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "topic_follows" DROP CONSTRAINT "FK_227af56af9044dc4df92570effa"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "push_tokens" DROP CONSTRAINT "UQ_3470f186e712e35b679da817270"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_43755a9b2165a39eb182a95634"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_741b76f2bbc0cc65281abb0828"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_d910810b3fbbd3745a925bcd6c"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_38e332e9aea16c8fe619413a87"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_8ee9254a3040f10d3f57d789d2"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_9e781649c6a6b1e316b0a7de95"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_c236de00f1b420644f7b38052c"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_45b3391d341b1a58def2881e8c"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_51bac8e59ded3fda54dec66526"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_76f6a446d903e8bc9b5f418fe4"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_8e4b6bb4cd54b0b5b93f78379f"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_57af857f57c78988ff1889620d"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_68f018651fdbbe1da9827e8b10"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_2ffe28c7a4e5c3156d135a602c"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_502ee4309011f9572a7a5d9e24"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_992e728268bfd0da357d255b9c"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_0191ba563241ab8fad41df2d24"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_59341ab9e0f418332b712b2dd0"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_3f53ba89a89b9cea8b9dd9286d"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_8b2fdcb4fb94d189e0e679748a"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_cf549e613de67f7bbf796e94b7"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_60818528127866f5002e7f826d"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_82f704bea211c1b6cddaa41e9b"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_a69d9e2ae78ef7d100f8317ae0"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_312c63be865c81b922e39c2475"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_1901d04a1e2de8e831fc107fe3"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_a3adcf8c5535db4a96c6e3e2bf"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_2063b52c183174db78dba86230"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_fa971a43908f58fe75d73b1484"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_b995da5024cb9246ef9e227158"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_465b5db6469b315c53362ed454"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_9cfe37d28c3b229a350e086d94"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_085d540d9f418cfbdc7bd55bb1"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_ebe91e9df775ee52d843137510"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_97c66ab0029f49fde30517f819"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_1c80d78f4792b4c37d32a7a012"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_c9b5b525a96ddc2c5647d7f7fa"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_a72fa0bb46a03bedcd1745efb4"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_6a7e5f591436179c411f5308a9"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP INDEX "public"."IDX_848b8b23bf0748243d4e1e76ae"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "collection_items" ALTER COLUMN "added_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "dm_messages" DROP COLUMN "sender_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "dm_messages" ADD "sender_id" uuid NOT NULL`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "dm_threads" DROP COLUMN "user_b"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "dm_threads" ADD "user_b" uuid NOT NULL`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "dm_threads" DROP COLUMN "user_a"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "dm_threads" ADD "user_a" uuid NOT NULL`,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE TYPE "public"."follow_requests_status_enum_old" AS ENUM('PENDING', 'APPROVED', 'REJECTED')`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "follow_requests" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "follow_requests" ALTER COLUMN "status" TYPE "public"."follow_requests_status_enum_old" USING "status"::"text"::"public"."follow_requests_status_enum_old"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "follow_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING'`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP TYPE "public"."follow_requests_status_enum"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TYPE "public"."follow_requests_status_enum_old" RENAME TO "follow_requests_status_enum"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "follow_requests" DROP COLUMN "target_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "follow_requests" ADD "target_id" uuid NOT NULL`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "follow_requests" DROP COLUMN "requester_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "follow_requests" ADD "requester_id" uuid NOT NULL`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "invites" ALTER COLUMN "status" DROP NOT NULL`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "notification_prefs" DROP CONSTRAINT "PK_08aa9b88bddce108c313eb9835c"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "notification_prefs" DROP COLUMN "user_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "notification_prefs" ADD "user_id" uuid NOT NULL`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "notification_prefs" ADD CONSTRAINT "PK_notification_prefs" PRIMARY KEY ("user_id")`,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE TYPE "public"."notifications_type_enum_old" AS ENUM('FOLLOW', 'FOLLOW_REQUEST', 'REPLY', 'QUOTE', 'LIKE', 'MENTION', 'COLLECTION_ADD', 'DM')`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum_old" USING "type"::"text"::"public"."notifications_type_enum_old"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP TYPE "public"."notifications_type_enum"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TYPE "public"."notifications_type_enum_old" RENAME TO "notifications_type_enum"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE TYPE "public"."push_outbox_status_enum_old" AS ENUM('pending', 'sent', 'failed', 'suppressed')`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "push_outbox" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "push_outbox" ALTER COLUMN "status" TYPE "public"."push_outbox_status_enum_old" USING "status"::"text"::"public"."push_outbox_status_enum_old"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "push_outbox" ALTER COLUMN "status" SET DEFAULT 'pending'`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP TYPE "public"."push_outbox_status_enum"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TYPE "public"."push_outbox_status_enum_old" RENAME TO "push_outbox_status_enum"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "push_outbox" DROP COLUMN "user_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "push_outbox" ADD "user_id" uuid NOT NULL`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "push_tokens" ALTER COLUMN "last_seen_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE TYPE "public"."push_tokens_provider_enum_old" AS ENUM('APNS', 'FCM')`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "push_tokens" ALTER COLUMN "provider" TYPE "public"."push_tokens_provider_enum_old" USING "provider"::"text"::"public"."push_tokens_provider_enum_old"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP TYPE "public"."push_tokens_provider_enum"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TYPE "public"."push_tokens_provider_enum_old" RENAME TO "push_tokens_provider_enum"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "push_tokens" DROP COLUMN "user_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "push_tokens" ADD "user_id" uuid NOT NULL`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "posts" ALTER COLUMN "author_id" SET NOT NULL`,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE TYPE "public"."post_edges_edge_type_enum_old" AS ENUM('LINK', 'QUOTE')`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "post_edges" ALTER COLUMN "edge_type" TYPE "public"."post_edges_edge_type_enum_old" USING "edge_type"::"text"::"public"."post_edges_edge_type_enum_old"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP TYPE "public"."post_edges_edge_type_enum"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TYPE "public"."post_edges_edge_type_enum_old" RENAME TO "post_edges_edge_type_enum"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "reports" DROP COLUMN "target_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "reports" ADD "target_id" uuid NOT NULL`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "reports" DROP COLUMN "reporter_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "reports" ADD "reporter_id" uuid NOT NULL`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "sessions" ALTER COLUMN "last_active_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_6a7e5f591436179c411f5308a9e"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_848b8b23bf0748243d4e1e76ae3"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "users" DROP COLUMN "public_id"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "users" ADD "public_id" text NOT NULL`,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE TYPE "public"."waiting_list_status_enum_old" AS ENUM('PENDING', 'INVITED')`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "waiting_list" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "waiting_list" ALTER COLUMN "status" TYPE "public"."waiting_list_status_enum_old" USING "status"::"text"::"public"."waiting_list_status_enum_old"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "waiting_list" ALTER COLUMN "status" SET DEFAULT 'PENDING'`,
    );
    await runIgnoreMissing(
      queryRunner,
      `DROP TYPE "public"."waiting_list_status_enum"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TYPE "public"."waiting_list_status_enum_old" RENAME TO "waiting_list_status_enum"`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "post_reads" ADD CONSTRAINT "UQ_post_reads_user_post" UNIQUE ("user_id", "post_id")`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "push_tokens" ADD CONSTRAINT "UQ_push_tokens_provider_token" UNIQUE ("provider", "token")`,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_account_deletion_requests_token" ON "account_deletion_requests" ("token") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_account_deletion_requests_user_id" ON "account_deletion_requests" ("user_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_blocks_blocked_id" ON "blocks" ("blocked_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_blocks_blocker_id" ON "blocks" ("blocker_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_collections_owner_id" ON "collections" ("owner_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_collection_items_post_id" ON "collection_items" ("post_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_collection_items_collection_id" ON "collection_items" ("collection_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_data_exports_token" ON "data_exports" ("token") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_data_exports_user_id" ON "data_exports" ("user_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_dm_messages_sender_id" ON "dm_messages" ("sender_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_dm_messages_thread_id" ON "dm_messages" ("thread_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_dm_threads_updated_at" ON "dm_threads" ("updated_at") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_dm_threads_user_b" ON "dm_threads" ("user_b") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_dm_threads_user_a" ON "dm_threads" ("user_a") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_email_change_requests_token" ON "email_change_requests" ("token") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_email_change_requests_user_id" ON "email_change_requests" ("user_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_external_sources_post_id" ON "external_sources" ("post_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_follow_requests_target_id" ON "follow_requests" ("target_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_follows_followee_id" ON "follows" ("followee_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_invites_used_by_id" ON "invites" ("used_by_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_invites_creator_id" ON "invites" ("creator_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_keeps_post_id" ON "keeps" ("post_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_likes_post_id" ON "likes" ("post_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_moderation_records_created_at" ON "moderation_records" ("created_at") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_moderation_records_author_id" ON "moderation_records" ("author_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_moderation_records_target_id" ON "moderation_records" ("target_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_moderation_records_target_type" ON "moderation_records" ("target_type") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_mutes_muted_id" ON "mutes" ("muted_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_mutes_muter_id" ON "mutes" ("muter_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_notifications_read_at" ON "notifications" ("read_at") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_notifications_user_id" ON "notifications" ("user_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_post_reads_post_id" ON "post_reads" ("post_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_post_reads_user_id" ON "post_reads" ("user_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_push_outbox_status" ON "push_outbox" ("status") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_push_outbox_user_id" ON "push_outbox" ("user_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_push_tokens_user_id" ON "push_tokens" ("user_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_replies_author_id" ON "replies" ("author_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_replies_post_id" ON "replies" ("post_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_posts_created_at" ON "posts" ("created_at") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_posts_lang" ON "posts" ("lang") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_posts_author_id" ON "posts" ("author_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_posts_status_created" ON "posts" ("status", "created_at") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_posts_author_created" ON "posts" ("author_id", "created_at") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_mentions_mentioned_user_id" ON "mentions" ("mentioned_user_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_mentions_reply_id" ON "mentions" ("reply_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_mentions_post_id" ON "mentions" ("post_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_post_topics_topic_id" ON "post_topics" ("topic_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_post_edges_to_edge_created" ON "post_edges" ("to_post_id", "edge_type", "created_at") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_post_edges_to_post_id" ON "post_edges" ("to_post_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_post_edges_from_post_id" ON "post_edges" ("from_post_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_sessions_expires_at" ON "sessions" ("expires_at") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_sessions_user_id" ON "sessions" ("user_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_topic_follows_topic_id" ON "topic_follows" ("topic_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_topics_created_by" ON "topics" ("created_by") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_topics_slug" ON "topics" ("slug") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE UNIQUE INDEX "IDX_users_public_id" ON "users" ("public_id") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_users_created_at" ON "users" ("created_at") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_users_display_name" ON "users" ("display_name") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `CREATE INDEX "IDX_users_handle" ON "users" ("handle") `,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "account_deletion_requests" ADD CONSTRAINT "FK_account_deletion_requests_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "blocks" ADD CONSTRAINT "FK_blocks_blocker" FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "blocks" ADD CONSTRAINT "FK_blocks_blocked" FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "collections" ADD CONSTRAINT "FK_collections_owner" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "collection_items" ADD CONSTRAINT "FK_collection_items_collection" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "collection_items" ADD CONSTRAINT "FK_collection_items_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "data_exports" ADD CONSTRAINT "FK_data_exports_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "dm_messages" ADD CONSTRAINT "FK_dm_messages_thread" FOREIGN KEY ("thread_id") REFERENCES "dm_threads"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "dm_messages" ADD CONSTRAINT "FK_dm_messages_sender" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "dm_threads" ADD CONSTRAINT "FK_dm_threads_user_a" FOREIGN KEY ("user_a") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "dm_threads" ADD CONSTRAINT "FK_dm_threads_user_b" FOREIGN KEY ("user_b") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "email_change_requests" ADD CONSTRAINT "FK_email_change_requests_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "external_sources" ADD CONSTRAINT "FK_external_sources_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "follow_requests" ADD CONSTRAINT "FK_follow_requests_requester" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "follow_requests" ADD CONSTRAINT "FK_follow_requests_target" FOREIGN KEY ("target_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "follows" ADD CONSTRAINT "FK_follows_follower" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "follows" ADD CONSTRAINT "FK_follows_followee" FOREIGN KEY ("followee_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "invites" ADD CONSTRAINT "FK_invites_creator" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "invites" ADD CONSTRAINT "FK_invites_used_by" FOREIGN KEY ("used_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "keeps" ADD CONSTRAINT "FK_keeps_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "keeps" ADD CONSTRAINT "FK_keeps_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "likes" ADD CONSTRAINT "FK_likes_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "likes" ADD CONSTRAINT "FK_likes_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "mutes" ADD CONSTRAINT "FK_mutes_muter" FOREIGN KEY ("muter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "mutes" ADD CONSTRAINT "FK_mutes_muted" FOREIGN KEY ("muted_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "notification_prefs" ADD CONSTRAINT "FK_notification_prefs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "post_reads" ADD CONSTRAINT "FK_post_reads_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "post_reads" ADD CONSTRAINT "FK_post_reads_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "push_outbox" ADD CONSTRAINT "FK_push_outbox_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "push_tokens" ADD CONSTRAINT "FK_push_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "reply_likes" ADD CONSTRAINT "FK_reply_likes_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "reply_likes" ADD CONSTRAINT "FK_reply_likes_reply" FOREIGN KEY ("reply_id") REFERENCES "replies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "replies" ADD CONSTRAINT "FK_replies_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "replies" ADD CONSTRAINT "FK_replies_author" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "replies" ADD CONSTRAINT "FK_replies_parent" FOREIGN KEY ("parent_reply_id") REFERENCES "replies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "posts" ADD CONSTRAINT "FK_posts_author" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "mentions" ADD CONSTRAINT "FK_mentions_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "mentions" ADD CONSTRAINT "FK_mentions_reply" FOREIGN KEY ("reply_id") REFERENCES "replies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "mentions" ADD CONSTRAINT "FK_mentions_mentioned_user" FOREIGN KEY ("mentioned_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "post_topics" ADD CONSTRAINT "FK_post_topics_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "post_topics" ADD CONSTRAINT "FK_post_topics_topic" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "post_edges" ADD CONSTRAINT "FK_post_edges_from" FOREIGN KEY ("from_post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "post_edges" ADD CONSTRAINT "FK_post_edges_to" FOREIGN KEY ("to_post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "sessions" ADD CONSTRAINT "FK_sessions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "topic_follows" ADD CONSTRAINT "FK_topic_follows_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await runIgnoreMissing(
      queryRunner,
      `ALTER TABLE "topic_follows" ADD CONSTRAINT "FK_topic_follows_topic" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
