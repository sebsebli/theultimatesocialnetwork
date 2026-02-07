import { Post } from '../entities/post.entity';
import { Reply } from '../entities/reply.entity';
import { User } from '../entities/user.entity';
import { isPendingUser } from './is-pending-user';

/** Extract post IDs referenced in body via [[post:id]] or [[post:id|alias]]. */
export function extractLinkedPostIds(
  body: string | null | undefined,
): string[] {
  if (!body || typeof body !== 'string') return [];
  const re = /\[\[post:([^\]|]+)(?:\|[^\]]*)?\]\]/gi;
  const ids: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const id = m[1].trim();
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

/** Author shape for JSON (avoids TypeORM/circular refs). Optionally add avatarUrl from avatarKey. Never expose pending (pre-onboarding) profiles. isProtected included so clients can restrict public URL sharing to public profiles. */
export function authorPlain(
  a:
    | {
      id?: string;
      handle?: string;
      displayName?: string;
      avatarKey?: string | null;
      isProtected?: boolean;
      bio?: string | null;
    }
    | null
    | undefined,
  getImageUrl?: (key: string) => string,
) {
  if (!a || typeof a !== 'object') return undefined;
  if (isPendingUser(a)) return undefined;
  const base: Record<string, unknown> = {
    id: a.id ?? '',
    handle: a.handle ?? '',
    displayName: a.displayName ?? '',
  };
  if (a.avatarKey != null && a.avatarKey !== '') base.avatarKey = a.avatarKey;
  if (a.avatarKey && getImageUrl) base.avatarUrl = getImageUrl(a.avatarKey);
  if (typeof (a as { isProtected?: boolean }).isProtected === 'boolean') {
    base.isProtected = (a as { isProtected: boolean }).isProtected;
  }
  if (typeof a.bio === 'string' && a.bio.trim() !== '') {
    base.bio = a.bio.trim();
  }
  return base;
}

export type ReferenceMetadata = Record<
  string,
  { title?: string; deletedAt?: string }
>;

/** Fresh inline enrichment data for mentions, topics, and post references. */
export interface InlineEnrichment {
  /** handle -> avatarUrl (null if user has no avatar). */
  mentionAvatars?: Record<string, string | null>;
  /** topic slug -> number of posts in that topic. */
  topicPostCounts?: Record<string, number>;
  /** post id (lowercase) -> number of posts that cite it (citedBy). */
  postCiteCounts?: Record<string, number>;
}

/** Extract @mention handles from post body. */
export function extractMentionHandles(
  body: string | null | undefined,
): string[] {
  if (!body || typeof body !== 'string') return [];
  const re = /(?<![a-zA-Z0-9_])@([a-zA-Z0-9_.]{1,30})(?![a-zA-Z0-9_])/g;
  const handles: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const handle = m[1];
    if (handle && !handles.includes(handle)) handles.push(handle);
  }
  return handles;
}

/** Extract topic slugs from wikilinks [[topic]] (excluding post: and http). */
export function extractTopicSlugs(
  body: string | null | undefined,
): string[] {
  if (!body || typeof body !== 'string') return [];
  const re = /\[\[([^\]]+)\]\]/g;
  const slugs: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const content = m[1];
    if (content.includes('](')) continue; // markdown link inside wikilink
    const parts = content.split('|');
    const targetsRaw = parts[0];
    const targetItems = targetsRaw.split(',').map((s) => s.trim());
    for (const target of targetItems) {
      if (target.includes(']')) continue;
      if (target.toLowerCase().startsWith('post:')) continue;
      if (target.startsWith('http')) continue;
      if (target.trim() && !slugs.includes(target.trim())) {
        slugs.push(target.trim());
      }
    }
  }
  return slugs;
}

export type PostViewerState = { isLiked?: boolean; isKept?: boolean };

/** Post as plain object so response is always JSON-serializable. getImageUrl for author.avatarUrl and post.headerImageUrl. referenceMetadata for linked post titles ([[post:id]] display text). viewerState adds isLiked/isKept for the current user when present. inlineEnrichment adds fresh mention avatars, topic post counts, and post cite counts. When viewerCanSeeContent is false or post is deleted, body/title/header are redacted. deletedAt included when set so client can show "deleted on ..." placeholder. */
export function postToPlain(
  p: Post | null | undefined,
  getImageUrl?: (key: string) => string,
  referenceMetadata?: ReferenceMetadata | null,
  viewerState?: PostViewerState | null,
  viewerCanSeeContent = true,
  inlineEnrichment?: InlineEnrichment | null,
): Record<string, unknown> | null {
  if (!p || typeof p !== 'object') return null;
  const deletedAt = (p as { deletedAt?: Date | null }).deletedAt;
  const isDeleted = deletedAt != null;
  const isPrivateStub =
    (p as { isPrivateStub?: boolean }).isPrivateStub === true;
  const canShowContent = viewerCanSeeContent && !isDeleted && !isPrivateStub;
  const headerImageUrl =
    canShowContent && p.headerImageKey && getImageUrl
      ? getImageUrl(p.headerImageKey)
      : undefined;
  const out: Record<string, unknown> = {
    id: p.id ?? '',
    authorId: p.authorId ?? '',
    author: authorPlain(p.author ?? null, getImageUrl),
    visibility: p.visibility ?? 'PUBLIC',
    body: canShowContent ? (p.body ?? '') : '',
    title: canShowContent ? (p.title ?? null) : null,
    headerImageKey: canShowContent ? (p.headerImageKey ?? null) : null,
    headerImageUrl: headerImageUrl ?? null,
    headerImageBlurhash: canShowContent
      ? (p.headerImageBlurhash ?? null)
      : null,
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
    viewerCanSeeContent: canShowContent,
    contentWarning: canShowContent ? ((p as any).contentWarning ?? null) : null,
    ...(isDeleted && { deletedAt: new Date(deletedAt).toISOString() }),
    ...(isPrivateStub && { isPrivateStub: true }),
  };
  if (
    referenceMetadata != null &&
    Object.keys(referenceMetadata).length > 0 &&
    canShowContent
  ) {
    out.referenceMetadata = referenceMetadata;
  }
  if (viewerState != null) {
    if (viewerState.isLiked !== undefined) out.isLiked = viewerState.isLiked;
    if (viewerState.isKept !== undefined) out.isKept = viewerState.isKept;
  }
  if (inlineEnrichment != null && canShowContent) {
    out.inlineEnrichment = inlineEnrichment;
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
