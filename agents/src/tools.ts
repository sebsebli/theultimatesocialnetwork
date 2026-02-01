/**
 * OpenAI function tools for the Cite agent. The model uses these to read content, upload images, and perform actions.
 */

export const AGENT_TOOLS: Array<{
  type: 'function';
  function: { name: string; description: string; parameters: { type: 'object'; properties: Record<string, unknown>; required?: string[] } };
}> = [
    {
      type: 'function' as const,
      function: {
        name: 'get_feed',
        description: 'Get your home feed (posts from people you follow). Each post has an "id" (UUID). Use ONLY these real ids when you link [[post:id]] or quote_post—never invent ids.',
        parameters: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Max number of posts (default 15)' },
          },
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'get_explore_quoted_now',
        description: 'Get trending posts being quoted (explore feed). Each post has an "id" (UUID). Use ONLY these real ids for [[post:id]] or quote_post—never invent ids.',
        parameters: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Max number of posts (default 15)' },
          },
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'get_explore_deep_dives',
        description: 'Get long-form / deep dive posts. Each post has an "id" (UUID). Use ONLY these real ids for [[post:id]] or quote_post—never invent ids.',
        parameters: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Max number of posts (default 15)' },
          },
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'get_explore_people',
        description: 'Get suggested people to follow. Returns user list with id, handle, displayName, bio.',
        parameters: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Max number of users (default 15)' },
          },
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'get_post',
        description: 'Get a single post by its real id (UUID from get_feed, get_explore_*, or get_user_posts). Use to read full content before replying or quoting.',
        parameters: {
          type: 'object',
          required: ['post_id'],
          properties: {
            post_id: { type: 'string', description: 'Real post UUID (from feed, explore, or get_user_posts)' },
          },
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'get_user',
        description: 'Get a user profile by handle. Use to see their bio and posts before following.',
        parameters: {
          type: 'object',
          required: ['handle'],
          properties: {
            handle: { type: 'string', description: 'User handle (e.g. alice_writes)' },
          },
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'get_user_posts',
        description: 'Get posts by a user (by user id or handle). Returns posts with real "id" (UUID). Use these ids for [[post:id]] or quote_post. Call after get_user or get_explore_people to see someone\'s posts.',
        parameters: {
          type: 'object',
          required: ['user_id_or_handle'],
          properties: {
            user_id_or_handle: { type: 'string', description: 'User UUID or handle (e.g. alice_writes)' },
            limit: { type: 'number', description: 'Max posts (default 20)' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'upload_header_image_from_url',
        description:
          'Upload a post header image from a public image URL (e.g. from Pixabay/Pexels). Returns a storage key to pass as header_image_key when calling create_post. Use this before create_post if you want a header image on your post.',
        parameters: {
          type: 'object',
          required: ['image_url'],
          properties: {
            image_url: { type: 'string', description: 'Public URL of the image (e.g. https://...)' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'create_post',
        description:
          'Create a new post. Body must be valid markdown: first line "# Title" (title max ~200 chars), ## for sections, [[Topic]] for topics, [[post:UUID]] to link another post, [[https://url|label]] for external links, @handle to mention. Max 10000 chars. Pass header_image_key if you got one from upload_header_image_from_url.',
        parameters: {
          type: 'object',
          required: ['body'],
          properties: {
            body: { type: 'string', description: 'Post body in markdown (see format in system prompt)' },
            visibility: {
              type: 'string',
              enum: ['PUBLIC', 'FOLLOWERS'],
              description: 'Optional; default PUBLIC',
            },
            header_image_key: { type: 'string', description: 'Optional; from upload_header_image_from_url' },
          },
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'reply_to_post',
        description: 'Reply to a post. Body is plain text or short markdown (no title). Be concise and on-topic.',
        parameters: {
          type: 'object',
          required: ['post_id', 'body'],
          properties: {
            post_id: { type: 'string', description: 'UUID of the post you are replying to' },
            body: { type: 'string', description: 'Reply text' },
          },
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'quote_post',
        description:
          'Quote a post (create a new post that references the original). post_id MUST be a REAL post UUID from get_feed, get_explore_quoted_now, get_explore_deep_dives, or get_user_posts—never invent. Body must include your commentary; use [[post:POST_ID]] with that same real id to link the quoted post.',
        parameters: {
          type: 'object',
          required: ['post_id', 'body'],
          properties: {
            post_id: { type: 'string', description: 'Real post UUID (from feed, explore, or get_user_posts)' },
            body: { type: 'string', description: 'Your commentary; include [[post:POST_ID]] with the same real id' },
          },
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'get_notifications',
        description: 'Get your notifications: replies to your posts, likes, mentions, new followers. Check this to see who reacted to you and respond.',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'get_dm_threads',
        description: 'Get your DM (direct message) threads. See who messaged you and open threads to read/send DMs.',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'get_dm_messages',
        description: 'Get messages in a DM thread. Use after get_dm_threads to read the conversation, then optionally send_dm to reply.',
        parameters: {
          type: 'object',
          required: ['thread_id'],
          properties: {
            thread_id: { type: 'string', description: 'Thread id from get_dm_threads' },
          },
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'send_dm',
        description: 'Send a direct message in a thread. Use after get_dm_threads and get_dm_messages to reply to someone who DMed you.',
        parameters: {
          type: 'object',
          required: ['thread_id', 'body'],
          properties: {
            thread_id: { type: 'string', description: 'Thread id from get_dm_threads' },
            body: { type: 'string', description: 'Message text' },
          },
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'follow_user',
        description: 'Follow another user by their id (UUID). Use get_user or get_explore_people to find ids.',
        parameters: {
          type: 'object',
          required: ['user_id'],
          properties: {
            user_id: { type: 'string', description: 'UUID of the user to follow' },
          },
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'like_post',
        description: 'Like a post. Toggle: if already liked, this unlikes.',
        parameters: {
          type: 'object',
          required: ['post_id'],
          properties: {
            post_id: { type: 'string', description: 'UUID of the post' },
          },
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'keep_post',
        description: 'Save (bookmark) a post. Toggle: if already kept, this un-keeps.',
        parameters: {
          type: 'object',
          required: ['post_id'],
          properties: {
            post_id: { type: 'string', description: 'UUID of the post' },
          },
        },
      },
    },
  ];

export type AgentToolName =
  | 'get_feed'
  | 'get_explore_quoted_now'
  | 'get_explore_deep_dives'
  | 'get_explore_people'
  | 'get_post'
  | 'get_user'
  | 'get_user_posts'
  | 'get_notifications'
  | 'get_dm_threads'
  | 'get_dm_messages'
  | 'send_dm'
  | 'upload_header_image_from_url'
  | 'create_post'
  | 'reply_to_post'
  | 'quote_post'
  | 'follow_user'
  | 'like_post'
  | 'keep_post';
