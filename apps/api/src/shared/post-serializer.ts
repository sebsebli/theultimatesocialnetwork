import { Post } from '../entities/post.entity';
import { Reply } from '../entities/reply.entity';
import { User } from '../entities/user.entity';

/** Author shape for JSON (avoids TypeORM/circular refs). */
export function authorPlain(
  a: { id?: string; handle?: string; displayName?: string } | null | undefined,
) {
  if (!a || typeof a !== 'object') return undefined;
  return {
    id: a.id ?? '',
    handle: a.handle ?? '',
    displayName: a.displayName ?? '',
  };
}

/** Post as plain object so response is always JSON-serializable. */
export function postToPlain(
  p: Post | null | undefined,
): Record<string, unknown> | null {
  if (!p || typeof p !== 'object') return null;
  return {
    id: p.id ?? '',
    authorId: p.authorId ?? '',
    author: authorPlain(p.author ?? null),
    visibility: p.visibility ?? 'PUBLIC',
    body: p.body ?? '',
    title: p.title ?? null,
    headerImageKey: p.headerImageKey ?? null,
    headerImageBlurhash: p.headerImageBlurhash ?? null,
    lang: p.lang ?? null,
    createdAt:
      p.createdAt != null ? new Date(p.createdAt).toISOString() : undefined,
    updatedAt:
      p.updatedAt != null ? new Date(p.updatedAt).toISOString() : undefined,
    replyCount: p.replyCount ?? 0,
    quoteCount: p.quoteCount ?? 0,
    privateLikeCount: p.privateLikeCount ?? 0,
    viewCount: p.viewCount ?? 0,
    readingTimeMinutes: p.readingTimeMinutes ?? 0,
  };
}

export function replyToPlain(
  r: Reply | null | undefined,
): Record<string, unknown> | null {
  if (!r || typeof r !== 'object') return null;
  return {
    id: r.id ?? '',
    postId: r.postId ?? '',
    authorId: r.authorId ?? '',
    author: authorPlain(r.author ?? null),
    parentReplyId: r.parentReplyId ?? null,
    body: r.body ?? '',
    createdAt:
      r.createdAt != null ? new Date(r.createdAt).toISOString() : undefined,
    post: postToPlain(r.post ?? null),
  };
}

export function userToPlain(
  u: User | null | undefined,
): Record<string, unknown> | null {
  if (!u || typeof u !== 'object') return null;
  // Strip email and other sensitive internal fields
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { email, preferences, ...safe } = u;
  return {
    ...safe,
    createdAt:
      u.createdAt != null ? new Date(u.createdAt).toISOString() : undefined,
    // eslint-disable-next-line
    posts: Array.isArray((u as any).posts) ? (u as any).posts.map(postToPlain) : undefined,
  };
}
