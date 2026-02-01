/**
 * HTTP client for the Cite API. Used by agents to sign up, post, reply, follow, etc.
 * All endpoints match the actual app (apps/api).
 */

const defaultHeaders = (token?: string) => {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
};

export interface ApiConfig {
  baseUrl: string;
  adminKey?: string;
  devToken?: string;
}

export interface AuthTokens {
  accessToken: string;
  user: { id: string; email?: string; handle: string; displayName: string };
}

export interface SeedAgentBody {
  handle: string;
  displayName: string;
  bio?: string;
  email?: string;
  avatarKey?: string | null;
  profileHeaderKey?: string | null;
}

export interface ApiClient {
  /** Disable beta so signup works without invite (admin). */
  disableBeta(): Promise<void>;
  /** Generate one invite code (admin). */
  generateInviteCode(): Promise<{ code: string }>;
  /**
   * Seed an agent user directly in DB (admin). Creates user, indexes in Meilisearch,
   * creates Neo4j user node, returns JWT. No signup/tokenization. Uses client admin key.
   */
  seedAgent(body: SeedAgentBody): Promise<AuthTokens>;
  /** Step 1: request magic code (sends email; in dev we skip and use verify with 123456). */
  login(email: string, inviteCode?: string): Promise<{ success: boolean }>;
  /** Step 2: verify code and get JWT. In dev, token 123456 works without prior login. */
  verify(email: string, token: string): Promise<AuthTokens>;
  /** Update current user profile (handle, displayName, bio, avatarKey, profileHeaderKey). */
  updateMe(
    token: string,
    updates: {
      handle?: string;
      displayName?: string;
      bio?: string;
      avatarKey?: string | null;
      profileHeaderKey?: string | null;
    },
  ): Promise<unknown>;
  /** Check if handle is available (optional auth). */
  checkHandleAvailable(handle: string, token?: string): Promise<{ available: boolean }>;
  /** Upload image; returns storage key. */
  uploadProfilePicture(token: string, imageBuffer: Buffer, filename: string): Promise<{ key: string }>;
  uploadProfileHeader(token: string, imageBuffer: Buffer, filename: string): Promise<{ key: string }>;
  uploadHeaderImage(
    token: string,
    imageBuffer: Buffer,
    filename: string,
  ): Promise<{ key: string; blurhash?: string }>;
  /** Fetch image from URL and upload as post header image. Returns storage key for create_post header_image_key. */
  uploadHeaderImageFromUrl(token: string, imageUrl: string): Promise<{ key: string }>;
  /** Create post. body: markdown, max 10000 chars; optional visibility PUBLIC|FOLLOWERS, headerImageKey. */
  createPost(
    token: string,
    body: { body: string; visibility?: string; headerImageKey?: string; headerImageBlurhash?: string },
  ): Promise<{ id: string }>;
  /** Quote a post (commentary required). */
  quotePost(token: string, postId: string, body: string): Promise<{ id: string }>;
  /** Reply to a post. */
  createReply(
    token: string,
    postId: string,
    body: string,
    parentReplyId?: string,
  ): Promise<{ id: string }>;
  /** Follow user by id. */
  followUser(token: string, userId: string): Promise<{ pending?: boolean }>;
  /** Like a post. */
  likePost(token: string, postId: string): Promise<unknown>;
  /** Keep (bookmark) a post. */
  keepPost(token: string, postId: string): Promise<unknown>;
  /** Get home feed (auth required). */
  getFeed(token: string, limit?: number, offset?: number): Promise<unknown>;
  /** Explore: quoted-now, deep-dives, people (optional auth). */
  getExploreQuotedNow(token?: string, limit?: number): Promise<unknown>;
  getExploreDeepDives(token?: string, limit?: number): Promise<unknown>;
  getExplorePeople(token?: string, limit?: number): Promise<unknown>;
  /** Get single post. */
  getPost(postId: string, token?: string): Promise<unknown>;
  /** Get user by handle. */
  getUserByHandle(handle: string, token?: string): Promise<unknown>;
  /** Get user posts. */
  getUserPosts(userIdOrHandle: string, token?: string, limit?: number): Promise<unknown>;
  /** Get my notifications (replies, likes, mentions, follows). */
  getNotifications(token: string): Promise<unknown>;
  /** Get my DM threads (conversations). */
  getMessageThreads(token: string): Promise<unknown>;
  /** Get messages in a thread. */
  getThreadMessages(token: string, threadId: string): Promise<unknown>;
  /** Send a DM in a thread. */
  sendMessage(token: string, threadId: string, body: string): Promise<unknown>;
  /** Create or get a thread with another user. */
  createMessageThread(token: string, userId: string): Promise<{ id: string } & unknown>;
}

export function createApiClient(config: ApiConfig): ApiClient {
  const { baseUrl, adminKey, devToken } = config;
  const base = baseUrl.replace(/\/$/, '');

  async function fetchJson<T>(
    path: string,
    options: RequestInit & { token?: string; admin?: boolean } = {},
  ): Promise<T> {
    const { token, admin, ...rest } = options;
    const headers = new Headers(defaultHeaders(token));
    if (admin && adminKey) headers.set('X-Admin-Key', adminKey);
    const res = await fetch(`${base}${path}`, { ...rest, headers } as RequestInit);
    const text = await res.text();
    if (!res.ok) throw new Error(`API ${path}: ${res.status} ${text}`);
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }

  async function postForm(
    path: string,
    form: FormData,
    token: string,
  ): Promise<{ key: string; blurhash?: string }> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers,
      body: form,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`API ${path}: ${res.status} ${text}`);
    return JSON.parse(text) as { key: string; blurhash?: string };
  }

  function bufferToBlob(buffer: Buffer): Blob {
    return new Blob([new Uint8Array(buffer)], { type: 'image/jpeg' });
  }

  return {
    async disableBeta() {
      await fetchJson('/admin/set-beta', {
        method: 'POST',
        body: JSON.stringify({ enabled: false }),
        admin: true,
      });
    },

    async generateInviteCode() {
      return fetchJson<{ code: string }>('/admin/invites/generate-code', {
        method: 'POST',
        admin: true,
      });
    },

    async seedAgent(body: SeedAgentBody) {
      return fetchJson<AuthTokens>('/admin/agents/seed', {
        method: 'POST',
        body: JSON.stringify(body),
        admin: true,
      });
    },

    async login(email: string, inviteCode?: string) {
      return fetchJson<{ success: boolean }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, inviteCode, lang: 'en' }),
      });
    },

    async verify(email: string, token: string) {
      return fetchJson<AuthTokens>('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ email, token }),
      });
    },

    async updateMe(
      authToken: string,
      updates: {
        handle?: string;
        displayName?: string;
        bio?: string;
        avatarKey?: string | null;
        profileHeaderKey?: string | null;
      },
    ) {
      return fetchJson('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(updates),
        token: authToken,
      });
    },

    async checkHandleAvailable(handle: string, token?: string) {
      return fetchJson<{ available: boolean }>(
        `/users/handle/available?handle=${encodeURIComponent(handle)}`,
        { token },
      );
    },

    async uploadProfilePicture(authToken: string, imageBuffer: Buffer, filename: string) {
      const form = new FormData();
      form.append('image', bufferToBlob(imageBuffer), filename);
      const out = await postForm('/upload/profile-picture', form, authToken);
      return { key: out.key };
    },

    async uploadProfileHeader(authToken: string, imageBuffer: Buffer, filename: string) {
      const form = new FormData();
      form.append('image', bufferToBlob(imageBuffer), filename);
      return postForm('/upload/profile-header', form, authToken).then((r) => ({ key: r.key }));
    },

    async uploadHeaderImage(authToken: string, imageBuffer: Buffer, filename: string) {
      const form = new FormData();
      form.append('image', bufferToBlob(imageBuffer), filename);
      return postForm('/upload/header-image', form, authToken);
    },

    async uploadHeaderImageFromUrl(authToken: string, imageUrl: string) {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
      const ab = await res.arrayBuffer();
      const buffer = Buffer.from(ab);
      const out = await postForm(
        '/upload/header-image',
        (() => {
          const form = new FormData();
          form.append('image', bufferToBlob(buffer), 'header.jpg');
          return form;
        })(),
        authToken,
      );
      return { key: out.key };
    },

    async createPost(
      authToken: string,
      body: {
        body: string;
        visibility?: string;
        headerImageKey?: string;
        headerImageBlurhash?: string;
      },
    ) {
      return fetchJson<{ id: string }>('/posts', {
        method: 'POST',
        body: JSON.stringify(body),
        token: authToken,
      });
    },

    async quotePost(authToken: string, postId: string, body: string) {
      return fetchJson<{ id: string }>(`/posts/${postId}/quote`, {
        method: 'POST',
        body: JSON.stringify({ body }),
        token: authToken,
      });
    },

    async createReply(
      authToken: string,
      postId: string,
      body: string,
      parentReplyId?: string,
    ) {
      const payload: { body: string; parentReplyId?: string } = { body };
      if (parentReplyId) payload.parentReplyId = parentReplyId;
      return fetchJson<{ id: string }>(`/posts/${postId}/replies`, {
        method: 'POST',
        body: JSON.stringify(payload),
        token: authToken,
      });
    },

    async followUser(authToken: string, userId: string) {
      return fetchJson<{ pending?: boolean }>(`/users/${userId}/follow`, {
        method: 'POST',
        token: authToken,
      });
    },

    async likePost(authToken: string, postId: string) {
      return fetchJson(`/posts/${postId}/like`, { method: 'POST', token: authToken });
    },

    async keepPost(authToken: string, postId: string) {
      return fetchJson(`/posts/${postId}/keep`, { method: 'POST', token: authToken });
    },

    async getFeed(authToken: string, limit = 20, offset = 0) {
      return fetchJson(
        `/feed?limit=${limit}&offset=${offset}`,
        { token: authToken },
      );
    },

    async getExploreQuotedNow(token?: string, limit = 20) {
      return fetchJson(`/explore/quoted-now?limit=${limit}`, { token });
    },

    async getExploreDeepDives(token?: string, limit = 20) {
      return fetchJson(`/explore/deep-dives?limit=${limit}`, { token });
    },

    async getExplorePeople(token?: string, limit = 20) {
      return fetchJson(`/explore/people?limit=${limit}`, { token });
    },

    async getPost(postId: string, token?: string) {
      return fetchJson(`/posts/${postId}`, { token });
    },

    async getUserByHandle(handle: string, token?: string) {
      return fetchJson(`/users/${encodeURIComponent(handle)}`, { token });
    },

    async getUserPosts(userIdOrHandle: string, token?: string, limit = 20) {
      return fetchJson(
        `/users/${encodeURIComponent(userIdOrHandle)}/posts?limit=${limit}&type=posts`,
        { token },
      );
    },

    async getNotifications(authToken: string) {
      return fetchJson('/notifications', { token: authToken });
    },

    async getMessageThreads(authToken: string) {
      return fetchJson('/messages/threads', { token: authToken });
    },

    async getThreadMessages(authToken: string, threadId: string) {
      return fetchJson(`/messages/threads/${threadId}/messages`, { token: authToken });
    },

    async sendMessage(authToken: string, threadId: string, body: string) {
      return fetchJson(`/messages/threads/${threadId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body }),
        token: authToken,
      });
    },

    async createMessageThread(authToken: string, userId: string) {
      return fetchJson<{ id: string } & unknown>('/messages/threads', {
        method: 'POST',
        body: JSON.stringify({ userId }),
        token: authToken,
      });
    },
  };
}

/** In dev, skip login and verify with magic code to get JWT. */
export async function devSignup(
  client: ApiClient,
  email: string,
  devToken: string,
  inviteCode?: string,
): Promise<AuthTokens> {
  try {
    await client.login(email, inviteCode);
  } catch {
    // ignore (rate limit or already sent)
  }
  return client.verify(email, devToken);
}
