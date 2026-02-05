/**
 * Single AI agent: OpenAI chat with function calling. Executes tools against the Cite API.
 */

import OpenAI from 'openai';
import { GoogleGenAI, createPartFromFunctionResponse } from '@google/genai';
import type { ApiClient } from './api-client.js';
import { AGENT_TOOLS, type AgentToolName } from './tools.js';
import type { CharacterDef } from './characters.js';
import { pixabaySearch, pexelsSearch } from './image-provider.js';

import type { ImageProviderConfig } from './image-provider.js';

const ACTION_TOOLS: Set<AgentToolName> = new Set([
  'create_post',
  'reply_to_post',
  'quote_post',
  'follow_user',
  'like_post',
  'keep_post',
  'send_dm',
  // search_image and upload are not "actions" that count against limit, they are utilities
]);

function toolResultHasError(result: string): boolean {
  try {
    const parsed = JSON.parse(result) as { error?: string };
    return typeof parsed?.error === 'string' && parsed.error.length > 0;
  } catch {
    return false;
  }
}

export interface PersonaProfile {
  displayName: string;
  handle: string;
  bio: string;
  behavior: string;
}

export interface AgentContext {
  token: string;
  handle: string;
  displayName: string;
  character: CharacterDef;
  persona: PersonaProfile;
  imageConfig?: ImageProviderConfig;
}

const FORMAT_DOC = `
## Post and content format (Cite API – same as app composer)
- **Content**: Write realistic, standalone articles about real topics that fit your character. Do not mention the platform, app, feed, or "being online"—content must stand on its own.
- **External links**: Sometimes reference real websites and URLs to make posts more realistic. Use the format **[https://url](link text)**: URL in square brackets, link text in parentheses (e.g. [https://lindner.de](click here), [https://wikipedia.org](read more)). Use real, plausible URLs when they fit the topic; link text max 40 chars.
Use ONLY these markdown (no H4+, no strikethrough, no other syntax):
- **Headers**: # (H1), ## (H2), ### (H3) only. Headline (first # line) and H2/H3 lines: max 40 chars each.
- **Inline**: **bold**, _italic_, \`code\`, fenced code \`\`\`...\`\`\`, > blockquote, - or 1. lists.
- **Wikilinks**: [[Topic]], [[post:UUID]] (UUID = real id from get_feed/get_explore_*/get_user_posts; never invent), [[post:UUID|alias]], [[https://url|label]]. Link/wikilink alias text: max 40 chars.
- **Links**: [https://url](link text)—URL in brackets, link text in parentheses (e.g. [https://example.com](click here)). Link text max 40 chars.
- **Mentions**: @handle (lowercase letters, numbers, underscore only).
- **Body**: max 10000 chars. First line "# Title" is the post title (max 40 chars).
- **Replies**: Short text or same markdown, no title. Be concise.
- **Quote**: quote_post with real post_id; body can use [[post:POST_ID]] with that same real id.
- **Handle**: Lowercase letters, numbers, underscore only. No spaces.

## Images
- **Profile picture**: Set at account setup (you already have it). You cannot change it during the session. There is no profile header.
- **Post title image**: In about **half** of your posts, attach a title/header image: call upload_header_image_from_url with a public image URL (e.g. Pixabay or Pexels), then pass the returned header_image_key to create_post. The image can be anything that fits the post.
`;

export type AgentVersion = 'default' | 'posts';

export function buildSystemPrompt(character: CharacterDef, persona: PersonaProfile, version: AgentVersion = 'default'): string {
  const postFocus =
    version === 'posts'
      ? '\n\n**POST-FOCUSED RUN**: This session is configured so you MUST prioritize creating new posts (create_post). The majority of your actions must be create_post. Use reply, quote, follow, like, keep, or DM only sparingly. Write substantive new posts first; then optionally engage with others.'
      : '';
  return `You are an agent on a social reading network (like a mix of Twitter and a wiki). Your profile and behavior were created from your persona. You interact organically: surf the network (feed, explore, notifications, DMs), then create posts, reply, quote, follow, like, keep, or send DMs.${postFocus}

Your character type: ${character.label}. ${character.description}

Your persona (how you actually behave): ${persona.behavior}

**Topics and content**: Come up with great topics that fit your personality and character type—specific, real-world themes (e.g. a chef: recipes, ingredients, restaurants, techniques; a traveler: destinations, tips, stories; a bookworm: specific books, genres, reading habits). Use these when writing posts. Each post should be about a concrete subject that fits who you are.

**Realistic, standalone articles**: Your posts must read like real articles, essays, or blog posts—substantive content about real subjects, ideas, experiences, or expertise. Write in first person when it fits. **Do not mention the social network, the app, the feed, "here", "this platform", following, likes, or the fact that you're posting online.** The content must not be about the platform at all; it must stand on its own (as if it could appear in a newsletter or blog).

You MUST **interact with the network**:
1.  **Find People**: If your feed is empty, use \`get_explore_people\` or \`get_explore_deep_dives\` to find active users.
2.  **Read & React**: Read their posts (\`get_user_posts\` or \`get_post\`). If you find something interesting, **reply** or **quote** it. Do not just post into the void.
3.  **Cite Real Content**: When you write a post, link to other users' posts using \`[[post:UUID]]\` (use the REAL ID you found). Mention them with \`@handle\`.
4.  **Use Real External Links**: Include plausible external links \`[https://url](text)\` to Wikipedia, news sites, or tools relevant to your topic.
5.  **Collections for your profile**: Create at least one collection from your own posts. Use \`get_my_posts\` to list your posts, then \`create_collection\` with a title (and optional description) that fits your persona (e.g. "Best recipes", "Travel highlights", "Recommended reads"). Use \`add_post_to_collection\` to add some of your posts (by their real post id) to that collection. This makes your profile more realistic and organized.

**Real post IDs only**: \`[[post:UUID]]\` and \`quote_post\`/\`reply_to_post\` require a real post id from \`get_feed\`, \`get_explore_*\`, or \`get_user_posts\`. Never invent post ids.

You MUST create at least the required number of new posts (create_post) during this session. The rest of your actions can be replies, quotes, follows, likes, etc., but never fewer than the required create_post count.

Use the provided tools to read content first (get_feed, get_explore_*, get_user_posts, get_my_posts, get_post, get_user, get_notifications, get_dm_threads), then ONE action per turn: create_post, reply_to_post, quote_post, follow_user, like_post, keep_post, or send_dm. For create_post you may call upload_header_image_from_url first. Each of those actions counts toward your goal. You can also use get_my_posts, get_my_collections, create_collection, and add_post_to_collection to build at least one collection from your own posts (does not count toward the action limit).

When creating posts: write substantive, realistic content about your chosen topic; use \`[[Topic]]\` for topics, \`[[post:UUID]]\` only with real UUIDs; sometimes include real external links as \`[https://url](link text)\` (e.g. \`[https://example.com](click here)\`) for sources, tools, or sites that fit the topic to make posts feel realistic; \`@handle\` to mention others when relevant. Keep replies short. When quoting, use a real post_id and add real commentary—reference the author with \`@handle\` when relevant. Never write posts about "this network", "the app", or "being on here".
${FORMAT_DOC}

After each tool result, either call another tool (e.g. get_post to read full content) or perform one action. Continue until you have used the required number of actions or have nothing left to do.`;
}

function formatActionSummary(name: AgentToolName, args: Record<string, unknown>): string {
  switch (name) {
    case 'create_post':
      return 'Created a post';
    case 'reply_to_post':
      return `Replied to post ${(args.post_id as string)?.slice(0, 8) ?? '?'}...`;
    case 'quote_post':
      return `Quoted post ${(args.post_id as string)?.slice(0, 8) ?? '?'}...`;
    case 'follow_user':
      return `Followed user ${(args.user_id as string)?.slice(0, 8) ?? '?'}...`;
    case 'like_post':
      return `Liked post ${(args.post_id as string)?.slice(0, 8) ?? '?'}...`;
    case 'keep_post':
      return `Kept post ${(args.post_id as string)?.slice(0, 8) ?? '?'}...`;
    case 'send_dm':
      return `Sent DM in thread ${(args.thread_id as string)?.slice(0, 8) ?? '?'}...`;
    default:
      return name;
  }
}

export async function executeTool(
  name: AgentToolName,
  args: Record<string, unknown>,
  api: ApiClient,
  ctx: AgentContext,
): Promise<string> {
  const token = ctx.token;
  try {
    switch (name) {
      case 'get_feed': {
        const limit = (args.limit as number) ?? 15;
        const data = await api.getFeed(token, limit, 0);
        return JSON.stringify(data, null, 0).slice(0, 8000);
      }
      case 'get_explore_quoted_now': {
        const limit = (args.limit as number) ?? 15;
        const data = await api.getExploreQuotedNow(token, limit);
        return JSON.stringify(data, null, 0).slice(0, 8000);
      }
      case 'get_explore_deep_dives': {
        const limit = (args.limit as number) ?? 15;
        const data = await api.getExploreDeepDives(token, limit);
        return JSON.stringify(data, null, 0).slice(0, 8000);
      }
      case 'get_explore_people': {
        const limit = (args.limit as number) ?? 15;
        const data = await api.getExplorePeople(token, limit);
        return JSON.stringify(data, null, 0).slice(0, 8000);
      }
      case 'get_post': {
        const postId = args.post_id as string;
        if (!postId) return JSON.stringify({ error: 'post_id required' });
        const data = await api.getPost(postId, token);
        return JSON.stringify(data, null, 0).slice(0, 6000);
      }
      case 'get_user': {
        const handle = args.handle as string;
        if (!handle) return JSON.stringify({ error: 'handle required' });
        const data = await api.getUserByHandle(handle, token);
        return JSON.stringify(data, null, 0).slice(0, 4000);
      }
      case 'get_user_posts': {
        const userIdOrHandle = args.user_id_or_handle as string;
        if (!userIdOrHandle) return JSON.stringify({ error: 'user_id_or_handle required' });
        const limit = (args.limit as number) ?? 20;
        const data = await api.getUserPosts(userIdOrHandle, token, limit);
        return JSON.stringify(data, null, 0).slice(0, 8000);
      }
      case 'get_my_posts': {
        const limit = (args.limit as number) ?? 30;
        const page = (args.page as number) ?? 1;
        const data = await api.getMyPosts(token, limit, page);
        return JSON.stringify(data, null, 0).slice(0, 8000);
      }
      case 'get_my_collections': {
        const data = await api.getMyCollections(token);
        return JSON.stringify(data, null, 0).slice(0, 6000);
      }
      case 'create_collection': {
        const title = (args.title as string)?.trim();
        if (!title || title.length > 200) return JSON.stringify({ error: 'title required, max 200 chars' });
        const description = (args.description as string)?.trim();
        const isPublic = args.is_public !== false;
        const res = await api.createCollection(token, {
          title: title.slice(0, 200),
          description: description ? description.slice(0, 1000) : undefined,
          isPublic,
        });
        return JSON.stringify({ success: true, collection_id: res.id });
      }
      case 'add_post_to_collection': {
        const collectionId = args.collection_id as string;
        const postId = args.post_id as string;
        if (!collectionId || !postId) return JSON.stringify({ error: 'collection_id and post_id required' });
        const note = (args.note as string)?.trim();
        await api.addPostToCollection(token, collectionId, postId, note ? note.slice(0, 500) : undefined);
        return JSON.stringify({ success: true });
      }
      case 'get_notifications': {
        const data = await api.getNotifications(token);
        return JSON.stringify(data, null, 0).slice(0, 6000);
      }
      case 'get_dm_threads': {
        const data = await api.getMessageThreads(token);
        return JSON.stringify(data, null, 0).slice(0, 6000);
      }
      case 'get_dm_messages': {
        const threadId = args.thread_id as string;
        if (!threadId) return JSON.stringify({ error: 'thread_id required' });
        const data = await api.getThreadMessages(token, threadId);
        return JSON.stringify(data, null, 0).slice(0, 6000);
      }
      case 'search_image': {
        const query = args.query as string;
        if (!query) return JSON.stringify({ error: 'query required' });
        const config = ctx.imageConfig;
        let url: string | undefined;

        if (config?.pexelsApiKey) {
          const hits = await pexelsSearch(config.pexelsApiKey, query, { orientation: 'landscape', perPage: 1 });
          if (hits?.[0]) url = hits[0].url;
        }
        if (!url && config?.pixabayApiKey) {
          const hits = await pixabaySearch(config.pixabayApiKey, query, { orientation: 'horizontal', perPage: 1 });
          if (hits?.[0]) url = hits[0].url;
        }

        if (!url) {
          url = `https://picsum.photos/seed/${encodeURIComponent(query)}/1200/600`;
        }
        return JSON.stringify({ success: true, image_url: url });
      }
      case 'send_dm': {
        const threadId = args.thread_id as string;
        const body = args.body as string;
        if (!threadId || !body) return JSON.stringify({ error: 'thread_id and body required' });
        await api.sendMessage(token, threadId, body.slice(0, 2000));
        return JSON.stringify({ success: true });
      }
      case 'upload_header_image_from_url': {
        const imageUrl = args.image_url as string;
        if (!imageUrl || !imageUrl.startsWith('http')) return JSON.stringify({ error: 'image_url required (public http(s) URL)' });
        const { key } = await api.uploadHeaderImageFromUrl(token, imageUrl);
        return JSON.stringify({ success: true, header_image_key: key });
      }
      case 'create_post': {
        const body = args.body as string;
        if (!body || body.length > 10000) return JSON.stringify({ error: 'body required, max 10000 chars' });
        const visibility = (args.visibility as string) || 'PUBLIC';
        const headerImageKey = args.header_image_key as string | undefined;
        const res = await api.createPost(token, {
          body: body.slice(0, 10000),
          visibility,
          headerImageKey,
        });
        return JSON.stringify({ success: true, post_id: res.id });
      }
      case 'reply_to_post': {
        const postId = args.post_id as string;
        const body = args.body as string;
        if (!postId || !body) return JSON.stringify({ error: 'post_id and body required' });
        await api.createReply(token, postId, body.slice(0, 2000));
        return JSON.stringify({ success: true });
      }
      case 'quote_post': {
        const postId = args.post_id as string;
        const body = args.body as string;
        if (!postId || !body) return JSON.stringify({ error: 'post_id and body required' });
        const res = await api.quotePost(token, postId, body.slice(0, 10000));
        return JSON.stringify({ success: true, post_id: res.id });
      }
      case 'follow_user': {
        const userId = args.user_id as string;
        if (!userId) return JSON.stringify({ error: 'user_id required' });
        const res = await api.followUser(token, userId);
        return JSON.stringify({ success: true, pending: res.pending });
      }
      case 'like_post': {
        const postId = args.post_id as string;
        if (!postId) return JSON.stringify({ error: 'post_id required' });
        await api.likePost(token, postId);
        return JSON.stringify({ success: true });
      }
      case 'keep_post': {
        const postId = args.post_id as string;
        if (!postId) return JSON.stringify({ error: 'post_id required' });
        await api.keepPost(token, postId);
        return JSON.stringify({ success: true });
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return JSON.stringify({ error: msg });
  }
}

export interface AgentLoopOptions {
  openai?: OpenAI;
  gemini?: GoogleGenAI;
  model: string;
  api: ApiClient;
  ctx: AgentContext;
  maxActions: number;
  /** Each agent must create at least this many posts (create_post). Default 2. */
  minPosts?: number;
  /** When "posts", agents are instructed to prioritize create_post; use with higher minPosts. */
  version?: AgentVersion;
  /** Called after each action; use to track history. */
  onAction?: (name: AgentToolName, args: Record<string, unknown>, summary: string) => void;
}

/** Convert OpenAI tools to Gemini FunctionDeclarations */
function getGeminiTools() {
  return AGENT_TOOLS.map(t => ({
    name: t.function.name,
    description: t.function.description,
    parameters: t.function.parameters as any,
  }));
}

async function runGeminiLoop(options: AgentLoopOptions): Promise<number> {
  const { gemini, model, api, ctx, maxActions, minPosts = 2, onAction } = options;
  if (!gemini) throw new Error('Gemini client not provided');
  const chats = gemini.chats;
  if (!chats) throw new Error('Gemini chats not available');

  const version = options.version ?? 'default';
  const systemInstruction = buildSystemPrompt(ctx.character, ctx.persona, version);
  const tools = [{ functionDeclarations: getGeminiTools() }];

  const chat = chats.create({
    model,
    config: {
      systemInstruction,
      tools,
    },
    history: [
      {
        role: 'user',
        parts: [{
          text: `You are ${ctx.displayName} (@${ctx.handle}). Your persona: ${ctx.persona.behavior}

You have ${maxActions} actions. You MUST create at least ${minPosts} new posts (create_post) during this session.${version === 'posts' ? ' This run is POST-FOCUSED: prioritize create_post; use most of your actions for new posts.' : ''} Each round: (1) Surf—get_feed, get_explore_*, get_notifications, get_dm_threads/get_dm_messages. (2) Do ONE action: create_post (use [[Topic]], [[post:UUID]] with real ids from the tools, @handle to mention), reply_to_post, quote_post (link to real posts and add commentary), follow_user, like_post, keep_post, or send_dm. Reference other users and their posts: link to posts you see, mention handles, tag topics. Use only REAL post ids from get_feed/get_explore_*/get_user_posts. Also create at least one collection from your own posts: get_my_posts → create_collection (title + optional description) → add_post_to_collection for some of your posts. Start by surfing, then act.`
        }],
      },
    ],
  });

  let actionsUsed = 0;
  let createPostCount = 0;
  const maxTurns = 85;
  let turns = 0;
  const actionHistory: string[] = [];

  while ((actionsUsed < maxActions || createPostCount < minPosts) && turns < maxTurns) {
    turns++;

    let userMsgText = '';
    if (turns === 1) {
      userMsgText = "Start interactions.";
    } else {
      const remaining = maxActions - actionsUsed;
      const historyBlurb = actionHistory.length > 0 ? `What you've done so far: ${actionHistory.join('; ')}. ` : '';
      const postReminder =
        createPostCount < minPosts
          ? ` You MUST create at least ${minPosts} posts (create_post). So far you have created ${createPostCount}. Use create_post for your next action if you have not reached the minimum.`
          : '';
      if (remaining <= 0 && createPostCount >= minPosts) break;
      if (remaining > 0) {
        userMsgText = `${historyBlurb}You have ${remaining} actions left.${postReminder} Check get_notifications and get_dm_threads. Continue: surf or act.`;
      } else {
        userMsgText = `${historyBlurb}You have used all actions but you MUST create at least ${minPosts} posts. You have created ${createPostCount}. Use create_post now.`;
      }
    }

    try {
      const result = await chat.sendMessage({ message: userMsgText });
      const response = result as { functionCalls?: Array<{ id?: string; name?: string; args?: Record<string, unknown> }> };
      const calls = response.functionCalls ?? [];
      if (calls.length > 0) {
        const parts: ReturnType<typeof createPartFromFunctionResponse>[] = [];

        for (const call of calls) {
          const name = (call.name ?? '') as AgentToolName;
          const args = (call.args ?? {}) as Record<string, unknown>;

          const outputText = await executeTool(name, args, api, ctx);
          let responseData: unknown;
          try {
            responseData = JSON.parse(outputText);
          } catch {
            responseData = { result: outputText };
          }
          // Gemini expects function response as a JSON object; avoid nested "content" to prevent invalid Part.data
          const responseObj: Record<string, unknown> =
            typeof responseData === 'object' && responseData !== null && !Array.isArray(responseData)
              ? (responseData as Record<string, unknown>)
              : { result: String(responseData) };
          parts.push(createPartFromFunctionResponse(call.id ?? `fc-${parts.length}`, name, responseObj));

          if (ACTION_TOOLS.has(name)) {
            actionsUsed++;
            if (name === 'create_post' && !toolResultHasError(outputText)) createPostCount++;
            const summary = formatActionSummary(name, args);
            actionHistory.push(summary);
            onAction?.(name, args, summary);
          }
        }
        await chat.sendMessage({ message: parts });
      }
    } catch (e) {
      console.error('Gemini loop error', e);
      break;
    }
  }
  return actionsUsed;
}

/** Run agent loop until maxActions actions are performed or model stops calling action tools. */
export async function runAgentLoop(options: AgentLoopOptions): Promise<number> {
  if (options.gemini) {
    return runGeminiLoop(options);
  }

  const { openai, model, api, ctx, maxActions, minPosts = 2, onAction } = options;
  if (!openai) throw new Error('OpenAI client not provided');

  const version = options.version ?? 'default';
  const tools = AGENT_TOOLS.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.function.name,
      description: t.function.description,
      parameters: t.function.parameters,
    },
  }));

  const actionHistory: string[] = [];

  type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;
  const messages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt(ctx.character, ctx.persona, version) },
    {
      role: 'user',
      content: `You are ${ctx.displayName} (@${ctx.handle}). Your persona: ${ctx.persona.behavior}

You have ${maxActions} actions. You MUST create at least ${minPosts} new posts (create_post) during this session.${version === 'posts' ? ' This run is POST-FOCUSED: prioritize create_post; use most of your actions for new posts.' : ''} Each round: (1) Surf—get_feed, get_explore_*, get_notifications, get_dm_threads/get_dm_messages. (2) Do ONE action: create_post (use [[Topic]], [[post:UUID]] with real ids from the tools, @handle to mention), reply_to_post, quote_post (link to real posts and add commentary), follow_user, like_post, keep_post, or send_dm. Reference other users and their posts: link to posts you see, mention handles, tag topics. Use only REAL post ids from get_feed/get_explore_*/get_user_posts. Also create at least one collection from your own posts: get_my_posts → create_collection (title + optional description) → add_post_to_collection for some of your posts. Start by surfing, then act.`,
    },
  ];

  let actionsUsed = 0;
  let createPostCount = 0;
  const maxTurns = 85;
  let turns = 0;

  while ((actionsUsed < maxActions || createPostCount < minPosts) && turns < maxTurns) {
    turns++;

    const response = await openai.chat.completions.create({
      model,
      messages,
      tools,
      tool_choice: 'auto',
    });

    const choice = response.choices?.[0];
    const msg = choice?.message;
    if (!msg) break;

    const toolCalls = msg.tool_calls ?? [];
    messages.push({
      role: 'assistant',
      content: msg.content ?? null,
      tool_calls: toolCalls.length > 0 ? toolCalls.map((tc) => ({
        id: tc.id,
        type: 'function' as const,
        function: {
          name: tc.function?.name ?? '',
          arguments: typeof tc.function?.arguments === 'string' ? tc.function.arguments : JSON.stringify(tc.function?.arguments ?? {}),
        },
      })) : undefined,
    });

    if (toolCalls.length > 0) {
      for (const tc of toolCalls) {
        const name = (tc.function?.name ?? '') as AgentToolName;
        let args: Record<string, unknown> = {};
        const raw = tc.function?.arguments;
        if (typeof raw === 'string' && raw.trim()) {
          try {
            args = JSON.parse(raw) as Record<string, unknown>;
          } catch {
            // leave args empty
          }
        } else if (typeof raw === 'object' && raw != null) {
          args = raw as Record<string, unknown>;
        }
        const result = await executeTool(name, args, api, ctx);
        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: result,
        });
        if (ACTION_TOOLS.has(name)) {
          actionsUsed++;
          const success = !toolResultHasError(result);
          if (name === 'create_post' && success) createPostCount++;
          const summary = formatActionSummary(name, args);
          actionHistory.push(summary);
          onAction?.(name, args, summary);
        }
      }
    } else {
      const remaining = maxActions - actionsUsed;
      const historyBlurb = actionHistory.length > 0 ? `What you've done so far: ${actionHistory.join('; ')}. ` : '';
      const postReminder =
        createPostCount < minPosts
          ? ` You MUST create at least ${minPosts} posts (create_post). So far you have created ${createPostCount}. Use create_post for your next action if you have not reached the minimum.`
          : '';
      if (remaining <= 0 && createPostCount >= minPosts) break;
      if (remaining > 0) {
        messages.push({
          role: 'user',
          content: `${historyBlurb}You have ${remaining} actions left.${postReminder} Check get_notifications and get_dm_threads for reactions and DMs. Use a tool: surf (get_feed, get_explore_*, get_notifications, get_dm_threads) or perform an action (create_post, reply_to_post, quote_post, follow_user, like_post, keep_post, send_dm).`,
        });
      } else {
        messages.push({
          role: 'user',
          content: `${historyBlurb}You have used all actions but you MUST create at least ${minPosts} posts. You have created ${createPostCount}. Use create_post now.`,
        });
      }
      continue;
    }

    const remaining = maxActions - actionsUsed;
    const historyBlurb = actionHistory.length > 0 ? `What you've done so far: ${actionHistory.join('; ')}. ` : '';
    const postReminder =
      createPostCount < minPosts
        ? ` You MUST create at least ${minPosts} posts (create_post). So far you have created ${createPostCount}. Use create_post for your next action if you have not reached the minimum.`
        : '';
    if (remaining <= 0 && createPostCount >= minPosts) break;
    if (remaining > 0) {
      messages.push({
        role: 'user',
        content: `${historyBlurb}You have ${remaining} actions left.${postReminder} Check get_notifications and get_dm_threads for reactions and DMs. Continue: surf if needed, then perform another action (create_post, reply_to_post, quote_post, follow_user, like_post, keep_post, send_dm). Act according to your persona and what you've already done.`,
      });
    } else {
      messages.push({
        role: 'user',
        content: `${historyBlurb}You have used all actions but you MUST create at least ${minPosts} posts. You have created ${createPostCount}. Use create_post now.`,
      });
    }
  }

  return actionsUsed;
}
