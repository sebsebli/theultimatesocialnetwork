import { Post } from '../entities/post.entity';
import { Reply } from '../entities/reply.entity';
import { User } from '../entities/user.entity';

/** Extract post IDs referenced in body via [[post:id]] or [[post:id|alias]]. */
export function extractLinkedPostIds(body: string | null | undefined): string[] {
  if (!body || typeof body !== 'string') return [];
  const re = /\[\[post:([^\]\|]+)(?:\|[^\]]*)?\]\]/gi;
  const ids: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const id = m[1].trim();
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

/** Author shape for JSON (avoids TypeORM/circular refs). Optionally add avatarUrl from avatarKey. */
export function authorPlain(
  a:
    | {
        id?: string;
        handle?: string;
        displayName?: string;
        avatarKey?: string | null;
      }
    | null
    | undefined,
  getImageUrl?: (key: string) => string,
) {
  if (!a || typeof a !== 'object') return undefined;
  const base: Record<string, unknown> = {
    id: a.id ?? '',
    handle: a.handle ?? '',
    displayName: a.displayName ?? '',
  };
  if (a.avatarKey != null && a.avatarKey !== '') base.avatarKey = a.avatarKey;
  if (a.avatarKey && getImageUrl) base.avatarUrl = getImageUrl(a.avatarKey);
  return base;
}

export type ReferenceMetadata = Record<string, { title?: string }>;

/** Post as plain object so response is always JSON-serializable. getImageUrl for author.avatarUrl and post.headerImageUrl. referenceMetadata for linked post titles ([[post:id]] display text). */
export function postToPlain(
  p: Post | null | undefined,
  getImageUrl?: (key: string) => string,
  referenceMetadata?: ReferenceMetadata | null,
): Record<string, unknown> | null {
  if (!p || typeof p !== 'object') return null;
  const headerImageUrl =
    p.headerImageKey && getImageUrl ? getImageUrl(p.headerImageKey) : undefined;
  const out: Record<string, unknown> = {
    id: p.id ?? '',
    authorId: p.authorId ?? '',
    author: authorPlain(p.author ?? null, getImageUrl),
    visibility: p.visibility ?? 'PUBLIC',
    body: p.body ?? '',
    title: p.title ?? null,
    headerImageKey: p.headerImageKey ?? null,
    headerImageUrl: headerImageUrl ?? null,
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
  if (referenceMetadata != null && Object.keys(referenceMetadata).length > 0) {
    out.referenceMetadata = referenceMetadata;
  }
  return out;
}

export function replyToPlain(
  r: Reply | null | undefined,
  getImageUrl?: (key: string) => string,
): Record<string, unknown> | null {
  if (!r || typeof r !== 'object') return null;
  return {
    id: r.id ?? '',
    postId: r.postId ?? '',
    authorId: r.authorId ?? '',
    author: authorPlain(r.author ?? null, getImageUrl),
    parentReplyId: r.parentReplyId ?? null,
    body: r.body ?? '',
    createdAt:
      r.createdAt != null ? new Date(r.createdAt).toISOString() : undefined,
    post: postToPlain(r.post ?? null, getImageUrl),
  };
}

/** User optionally with loaded posts relation. */
type UserWithPosts = User & { posts?: Post[] };

export function userToPlain(
  u: UserWithPosts | User | null | undefined,
): Record<string, unknown> | null {
  if (!u || typeof u !== 'object') return null;
  // Strip email, preferences, publicId; keep rest for safe serialization
  const uRecord = u as unknown as Record<string, unknown>;
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(uRecord)) {
    if (k !== 'email' && k !== 'preferences' && k !== 'publicId') safe[k] = v;
  }
  const userWithPosts = u as UserWithPosts;
  return {
    ...safe,
    createdAt:
      u.createdAt != null ? new Date(u.createdAt).toISOString() : undefined,
    posts: Array.isArray(userWithPosts.posts)
      ? userWithPosts.posts.map((p) => postToPlain(p))
      : undefined,
  };
}
