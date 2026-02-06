import { File, Paths, Directory } from 'expo-file-system';

const OFFLINE_DIR_NAME = 'offline_posts';

let offlineDir: Directory | null = null;

function getOfflineDir(): Directory {
  if (!offlineDir) offlineDir = new Directory(Paths.document, OFFLINE_DIR_NAME);
  return offlineDir;
}

function postFile(id: string): File {
  const safe = id.replace(/[^a-zA-Z0-9-_]/g, '_');
  return new File(getOfflineDir(), `post_${safe}.json`);
}

const INDEX_FILE = new File(Paths.document, 'offline_posts_index.json');

async function readIndex(): Promise<string[]> {
  try {
    if (!INDEX_FILE.exists) return [];
    const data = await INDEX_FILE.text();
    const arr = data ? JSON.parse(data) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

async function writeIndex(ids: string[]): Promise<void> {
  try {
    INDEX_FILE.create({ overwrite: true });
    INDEX_FILE.write(JSON.stringify(ids));
  } catch (e) {
    if (__DEV__) console.warn('offlineStorage writeIndex failed', e);
  }
}

export interface OfflinePost {
  id: string;
  title?: string | null;
  body: string;
  createdAt: string;
  headerImageKey?: string | null;
  author?: { id?: string; displayName?: string; handle?: string };
  lang?: string | null;
  savedAt: number;
}

/** Save a post for offline reading. */
export async function savePostForOffline(post: OfflinePost): Promise<void> {
  try {
    const dir = getOfflineDir();
    if (!dir.exists) dir.create({ idempotent: true });
    const f = postFile(post.id);
    const payload: OfflinePost = {
      ...post,
      savedAt: Date.now(),
    };
    f.create({ overwrite: true });
    f.write(JSON.stringify(payload));
    const ids = await readIndex();
    if (!ids.includes(post.id)) {
      await writeIndex([...ids, post.id]);
    }
  } catch (e) {
    if (__DEV__) console.warn('offlineStorage savePostForOffline failed', e);
  }
}

/** Get a post from offline storage, or null. */
export async function getOfflinePost(id: string): Promise<OfflinePost | null> {
  try {
    const f = postFile(id);
    if (!f.exists) return null;
    const data = await f.text();
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/** List all downloaded post IDs. */
export async function getDownloadedPostIds(): Promise<string[]> {
  return readIndex();
}

/** Get all offline posts (for manage screen). */
export async function getAllOfflinePosts(): Promise<OfflinePost[]> {
  const ids = await getDownloadedPostIds();
  const posts: OfflinePost[] = [];
  for (const id of ids) {
    const p = await getOfflinePost(id);
    if (p) posts.push(p);
  }
  posts.sort((a, b) => b.savedAt - a.savedAt);
  return posts;
}

/** Remove one post from offline storage. */
export async function removeOfflinePost(id: string): Promise<void> {
  try {
    const f = postFile(id);
    if (f.exists) f.delete();
    const ids = await readIndex();
    await writeIndex(ids.filter((x) => x !== id));
  } catch (e) {
    if (__DEV__) console.warn('offlineStorage removeOfflinePost failed', e);
  }
}

/** Remove all offline posts. */
export async function clearAllOfflinePosts(): Promise<void> {
  try {
    const ids = await getDownloadedPostIds();
    for (const id of ids) {
      const f = postFile(id);
      if (f.exists) f.delete();
    }
    await writeIndex([]);
  } catch (e) {
    if (__DEV__) console.warn('offlineStorage clearAllOfflinePosts failed', e);
  }
}

/** Check if a post is downloaded. */
export async function isPostDownloaded(id: string): Promise<boolean> {
  const f = postFile(id);
  return f.exists;
}

const OFFLINE_SETTING_KEY = 'offline_download_saved';

/** Toggle setting: download saved (bookmarked) content for offline. */
export async function getDownloadSavedForOffline(): Promise<boolean> {
  try {
    const { getItemAsync } = await import('expo-secure-store');
    const v = await getItemAsync(OFFLINE_SETTING_KEY);
    return v === 'true';
  } catch {
    return false;
  }
}

export async function setDownloadSavedForOffline(value: boolean): Promise<void> {
  try {
    const { setItemAsync, deleteItemAsync } = await import('expo-secure-store');
    if (value) await setItemAsync(OFFLINE_SETTING_KEY, 'true');
    else await deleteItemAsync(OFFLINE_SETTING_KEY);
  } catch (e) {
    if (__DEV__) console.warn('offlineStorage setDownloadSavedForOffline failed', e);
  }
}

/** Approximate storage info: count and total size in bytes. */
export async function getOfflineStorageInfo(): Promise<{ count: number; sizeBytes: number }> {
  let sizeBytes = 0;
  try {
    const ids = await readIndex();
    for (const id of ids) {
      const f = postFile(id);
      if (f.exists) sizeBytes += f.size ?? 0;
    }
    return { count: ids.length, sizeBytes };
  } catch {
    return { count: 0, sizeBytes: 0 };
  }
}
