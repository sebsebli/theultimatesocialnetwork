import { REAL_USERS, TOPICS } from './simulation-data';

// --- Configuration ---
const API_URL = process.env.API_URL || 'http://localhost:3000';
const ADMIN_KEY = process.env.CITE_ADMIN_SECRET || 'dev-admin-change-me';
const DEEP_DIVE_COUNT = 50;
const USER_PASSWORD_TOKEN = '123456';

// --- Helpers ---
const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = <T>(arr: T[]): T => arr[randomInt(0, arr.length - 1)];
const randomBool = (prob = 0.5) => Math.random() < prob;

// --- Data ---
const sentences = [
  'The quick brown fox jumps over the lazy dog.',
  'Urban planning is essential for sustainable cities.',
  'Technology is rapidly changing the way we live.',
  'Philosophy teaches us how to think, not what to think.',
  'Science is the poetry of reality.',
  'History repeats itself, first as tragedy, then as farce.',
  'Art is the lie that enables us to realize the truth.',
];

// --- State ---
interface UserState {
  id: string;
  email: string;
  token: string;
  handle: string;
  displayName: string;
}
const users: UserState[] = [];
const postIds: string[] = [];

// --- API Wrappers ---
async function apiPost<T = unknown>(
  url: string,
  body: Record<string, unknown>,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${url}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${url} failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

async function apiGet<T = unknown>(url: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${url}`, { headers });
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (e) {
    console.error(`Failed to fetch image ${url}:`, e);
    return null;
  }
}

interface UploadResponse {
  key: string;
}

async function upload(
  url: string,
  fieldName: string,
  buffer: Buffer,
  filename: string,
  token: string,
): Promise<UploadResponse> {
  const form = new FormData();
  form.append(
    fieldName,
    new Blob([new Uint8Array(buffer)], { type: 'image/jpeg' }),
    filename,
  );

  const res = await fetch(`${API_URL}${url}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`UPLOAD ${url} failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<UploadResponse>;
}

async function disableBeta() {
  console.log('Disabling beta mode...');
  try {
    const res = await fetch(`${API_URL}/admin/set-beta`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': ADMIN_KEY,
      },
      body: JSON.stringify({ enabled: false }),
    });
    if (!res.ok) throw new Error(`Failed to disable beta: ${res.status}`);
    console.log('Beta mode disabled.');
  } catch (err) {
    console.error('Error disabling beta:', err);
  }
}

interface AuthVerifyResponse {
  user: { id: string };
  accessToken: string;
}

async function loginExistingUsers() {
  console.log('Logging in existing/hero users...');
  for (const u of REAL_USERS) {
    const email = `${u.handle}@example.com`;
    try {
      const tokens = await apiPost<AuthVerifyResponse>('/auth/verify', {
        email,
        token: USER_PASSWORD_TOKEN,
      });
      users.push({
        id: tokens.user.id,
        email,
        token: tokens.accessToken,
        handle: u.handle,
        displayName: `${u.firstName} ${u.lastName}`,
      });
    } catch {
      // Skip if login fails (e.g. user not seeded)
    }
  }
  console.log(`Logged in ${users.length} hero users.`);
}

interface PostRef {
  id: string;
}

interface CreatePostResponse {
  id: string;
}

async function fetchExistingPosts() {
  console.log('Fetching existing posts for reference...');
  try {
    const recent = await apiGet<PostRef[]>('/explore/quoted-now');
    for (const p of recent) {
      postIds.push(p.id);
    }
    console.log(`Found ${postIds.length} existing posts to Citewalk.`);
  } catch (err) {
    console.error('Failed to fetch existing posts', err);
  }
}

async function createDeepDives() {
  console.log(`Creating ${DEEP_DIVE_COUNT} Deep Dive articles...`);

  for (let i = 0; i < DEEP_DIVE_COUNT; i++) {
    const author = randomItem(users);
    const topic = randomItem(TOPICS);
    const citedPostId = postIds.length > 0 ? randomItem(postIds) : null;
    const mentionedUser = randomItem(users);

    // Build Long Form Content
    let body = `# The Future of ${topic} and its Implications\n\n`;

    // Intro
    body += `We are standing at a crossroads. As we consider the trajectory of [[${topic}]], it becomes clear that traditional models are failing. ${randomItem(sentences)} ${randomItem(sentences)}\n\n`;

    // Section 1
    body += `## The Core Problem\n\n`;
    body += `${randomItem(sentences)} ${randomItem(sentences)} ${randomItem(sentences)}\n\n`;
    body += `> "Complexity is the enemy of execution."\n\n`;
    body += `I was discussing this with @${mentionedUser.handle} the other day, and we agreed that the fundamental issue is structural.\n\n`;

    // Section 2 (Citation)
    if (citedPostId) {
      body += `## Evidence from the Field\n\n`;
      body += `A recent discussion highlighted this perfectly: [[post:${citedPostId}]]\n\n`;
      body += `If you read that analysis, you'll see why [[${randomItem(TOPICS)}]] is also relevant here. ${randomItem(sentences)}\n\n`;
    }

    // Conclusion
    body += `## Moving Forward\n\n`;
    body += `We need to embrace uncertainty. ${randomItem(sentences)} What do you think?\n\n`;

    try {
      // 20% chance of header image
      let headerImageKey = undefined;
      if (randomBool(0.2)) {
        try {
          const buf = await fetchImageBuffer(
            `https://picsum.photos/seed/${topic}${i}/1200/600`,
          );
          if (buf) {
            const uploadRes = await upload(
              '/upload/header-image',
              'image',
              buf,
              'header.jpg',
              author.token,
            );
            headerImageKey = uploadRes.key;
          }
        } catch {
          // Ignore single image fetch failure
        }
      }

      const postRes = await apiPost<CreatePostResponse>(
        '/posts',
        { body, headerImageKey },
        author.token,
      );
      postIds.push(postRes.id);
      process.stdout.write('D');
    } catch (err) {
      console.error('Deep dive creation failed', err);
    }
  }
  console.log('\nDeep dives created.');
}

async function main() {
  await disableBeta();
  await loginExistingUsers(); // Reuse heroes
  await fetchExistingPosts(); // Populate pool
  await createDeepDives();
  console.log('Simulation extension complete!');
}

main().catch(console.error);
