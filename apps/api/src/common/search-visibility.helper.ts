/**
 * Shared visibility logic for search hydration.
 *
 * Both searchPosts and searchAll (in search.controller.ts) need to:
 * 1. Fetch `is_protected` from DB for post authors
 * 2. Check if the viewer follows protected authors
 * 3. Filter posts to only those visible to the viewer
 *
 * This utility extracts that duplicated logic.
 */
import { DataSource, Repository, In } from 'typeorm';
import { Post } from '../entities/post.entity';
import { Follow } from '../entities/follow.entity';

/** Map of userId -> isProtected (true = protected profile). */
export async function getAuthorProtectedMap(
  dataSource: DataSource,
  authorIds: string[],
): Promise<Map<string, boolean>> {
  const result = new Map<string, boolean>();
  if (authorIds.length === 0) return result;

  const placeholders = authorIds.map((_, i) => `$${i + 1}`).join(',');
  const rows = await dataSource.query<
    { id: string; is_protected: boolean | string }[]
  >(
    `SELECT id, is_protected FROM users WHERE id IN (${placeholders})`,
    authorIds,
  );

  for (const row of rows ?? []) {
    result.set(
      row.id,
      row.is_protected === true || row.is_protected === 't',
    );
  }

  return result;
}

/** Set of author IDs that the viewer follows. */
export async function getViewerFollowingSet(
  followRepo: Repository<Follow>,
  viewerId: string | null,
  authorIds: string[],
): Promise<Set<string>> {
  if (!viewerId || authorIds.length === 0) return new Set<string>();

  const follows = await followRepo.find({
    where: { followerId: viewerId, followeeId: In(authorIds) },
    select: ['followeeId'],
  });

  return new Set(follows.map((f) => f.followeeId));
}

/**
 * Returns the set of post IDs that are visible to the given viewer.
 *
 * Visibility rules:
 * - Own posts are always visible
 * - Posts from public profiles are visible to everyone
 * - Posts from protected profiles are visible only to followers and the author
 */
export function getVisiblePostIds(
  posts: Pick<Post, 'id' | 'authorId'>[],
  viewerId: string | null,
  authorProtected: Map<string, boolean>,
  followingSet: Set<string>,
): Set<string> {
  return new Set(
    posts
      .filter((p) => {
        if (!p.authorId) return false;
        // Own post: always visible
        if (viewerId && p.authorId === viewerId) return true;
        // Protected: only if viewer follows the author
        const isProtected = authorProtected.get(p.authorId) === true;
        if (isProtected)
          return viewerId != null && followingSet.has(p.authorId);
        // Public: visible to all
        return true;
      })
      .map((p) => p.id),
  );
}

/**
 * Complete visibility check for a batch of posts.
 * Combines all three operations into a single call.
 */
export async function filterVisiblePosts(
  dataSource: DataSource,
  followRepo: Repository<Follow>,
  posts: Pick<Post, 'id' | 'authorId'>[],
  viewerId: string | null,
): Promise<Set<string>> {
  const authorIds = [
    ...new Set(posts.map((p) => p.authorId).filter(Boolean)),
  ] as string[];

  const [authorProtected, followingSet] = await Promise.all([
    getAuthorProtectedMap(dataSource, authorIds),
    getViewerFollowingSet(followRepo, viewerId, authorIds),
  ]);

  return getVisiblePostIds(posts, viewerId, authorProtected, followingSet);
}
