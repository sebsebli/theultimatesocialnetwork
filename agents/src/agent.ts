/**
 * Single AI agent: OpenAI chat with function calling. Executes tools against the Cite API.
 */

import OpenAI from 'openai';
import type { ApiClient } from './api-client.js';
import { AGENT_TOOLS, type AgentToolName } from './tools.js';
import type { CharacterDef } from './characters.js';

const ACTION_TOOLS: Set<AgentToolName> = new Set([
  'create_post',
  'reply_to_post',
  'quote_post',
  'follow_user',
  'like_post',
  'keep_post',
  'send_dm',
]);

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
  /** Persona from first-step creation (behavior drives how they act each round). */
  persona: PersonaProfile;
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

export function buildSystemPrompt(character: CharacterDef, persona: PersonaProfile): string {
  return `You are an agent on a social reading network (like a mix of Twitter and a wiki). Your profile and behavior were created from your persona. You interact organically: surf the network (feed, explore, notifications, DMs), then create posts, reply, quote, follow, like, keep, or send DMs.

Your character type: ${character.label}. ${character.description}

Your persona (how you actually behave): ${persona.behavior}

**Topics and content**: Come up with great topics that fit your personality and character type—specific, real-world themes (e.g. a chef: recipes, ingredients, restaurants, techniques; a traveler: destinations, tips, stories; a bookworm: specific books, genres, reading habits). Use these when writing posts. Each post should be about a concrete subject that fits who you are.

**Realistic, standalone articles**: Your posts must read like real articles, essays, or blog posts—substantive content about real subjects, ideas, experiences, or expertise. Write in first person when it fits. **Do not mention the social network, the app, the feed, "here", "this platform", following, likes, or the fact that you're posting online.** The content must not be about the platform at all; it must stand on its own (as if it could appear in a newsletter or blog). You may use [[Topic]] for discoverability and [[post:UUID]] or @handle when referencing someone else's idea or post, but the body of your post must be about the topic itself—not meta-commentary about the network.

You MUST **reference the network** for discoverability and threads: use [[Topic]] tags (e.g. [[Cooking]], [[AI]], [[Urbanism]]), link to other users' posts with [[post:UUID]] (real id from tools), mention people with @handle when discussing their ideas, and quote/reply to real posts you see in feed or explore. Interact for real: follow users whose posts you like, reply and quote with genuine commentary, like and keep posts, send DMs when it fits.

**Reference each other**: When you create a post, prefer linking to posts you found via get_feed, get_explore_*, or get_user_posts using [[post:UUID]]. Mention other users with @handle when you discuss their ideas. Use [[Topic]] so your post is discoverable. When you quote_post or reply_to_post, use real post ids from the tools and add real commentary—do not invent ids.

**Real post IDs only**: [[post:UUID]] and quote_post/reply_to_post require a real post id from get_feed, get_explore_quoted_now, get_explore_deep_dives, or get_user_posts. Use get_user_posts(handle) after get_explore_people or get_user to get someone's posts and their ids. Never invent post ids.

Use the provided tools to read content first (get_feed, get_explore_*, get_user_posts, get_post, get_user, get_notifications, get_dm_threads), then ONE action per turn: create_post, reply_to_post, quote_post, follow_user, like_post, keep_post, or send_dm. For create_post you may call upload_header_image_from_url first. Each of those actions counts toward your goal.

When creating posts: write substantive, realistic content about your chosen topic; use [[Topic]] for topics, [[post:UUID]] only with real UUIDs; sometimes include real external links as [https://url](link text) (e.g. [https://example.com](click here)) for sources, tools, or sites that fit the topic to make posts feel realistic; @handle to mention others when relevant. Keep replies short. When quoting, use a real post_id and add real commentary—reference the author with @handle when relevant. Never write posts about "this network", "the app", or "being on here".
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
  openai: OpenAI;
  model: string;
  api: ApiClient;
  ctx: AgentContext;
  maxActions: number;
  /** Called after each action; use to track history. */
  onAction?: (name: AgentToolName, args: Record<string, unknown>, summary: string) => void;
}

/** OpenAI chat message type for the loop. */
type ChatMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }> }
  | { role: 'tool'; tool_call_id: string; content: string };

/** Run agent loop until maxActions actions are performed or model stops calling action tools. */
export async function runAgentLoop(options: AgentLoopOptions): Promise<number> {
  const { openai, model, api, ctx, maxActions, onAction } = options;

  const tools = AGENT_TOOLS.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.function.name,
      description: t.function.description,
      parameters: t.function.parameters,
    },
  }));

  const actionHistory: string[] = [];

  const messages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt(ctx.character, ctx.persona) },
    {
      role: 'user',
      content: `You are ${ctx.displayName} (@${ctx.handle}). Your persona: ${ctx.persona.behavior}

You have ${maxActions} actions. Each round: (1) Surf—get_feed, get_explore_*, get_notifications, get_dm_threads/get_dm_messages. (2) Do ONE action: create_post (use [[Topic]], [[post:UUID]] with real ids from the tools, @handle to mention), reply_to_post, quote_post (link to real posts and add commentary), follow_user, like_post, keep_post, or send_dm. Reference other users and their posts: link to posts you see, mention handles, tag topics. Use only REAL post ids from get_feed/get_explore_*/get_user_posts. Start by surfing, then act.`,
    },
  ];

  let actionsUsed = 0;
  const maxTurns = 80;
  let turns = 0;

  while (actionsUsed < maxActions && turns < maxTurns) {
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
          const summary = formatActionSummary(name, args);
          actionHistory.push(summary);
          onAction?.(name, args, summary);
        }
      }
    } else {
      const remaining = maxActions - actionsUsed;
      if (remaining <= 0) break;
      const historyBlurb = actionHistory.length > 0 ? `What you've done so far: ${actionHistory.join('; ')}. ` : '';
      messages.push({
        role: 'user',
        content: `${historyBlurb}You have ${remaining} actions left. Check get_notifications and get_dm_threads for reactions and DMs. Use a tool: surf (get_feed, get_explore_*, get_notifications, get_dm_threads) or perform an action (create_post, reply_to_post, quote_post, follow_user, like_post, keep_post, send_dm).`,
      });
      continue;
    }

    const remaining = maxActions - actionsUsed;
    if (remaining <= 0) break;
    const historyBlurb = actionHistory.length > 0 ? `What you've done so far: ${actionHistory.join('; ')}. ` : '';
    messages.push({
      role: 'user',
      content: `${historyBlurb}You have ${remaining} actions left. Check get_notifications and get_dm_threads for reactions and DMs. Continue: surf if needed, then perform another action (create_post, reply_to_post, quote_post, follow_user, like_post, keep_post, send_dm). Act according to your persona and what you've already done.`,
    });
  }

  return actionsUsed;
}
