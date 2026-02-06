export interface OfflinePost {
  id: string;
  title?: string;
  body: string;
  author: {
    displayName: string;
    handle: string;
  };
  savedAt: number;
}

const STORAGE_KEY_PREFIX = "citewalk_offline_post_";
const INDEX_KEY = "citewalk_offline_index";
const DOWNLOAD_SAVED_KEY = "citewalk_download_saved_offline";

export function getDownloadSavedForOffline(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DOWNLOAD_SAVED_KEY) === "true";
}

export function setDownloadSavedForOffline(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DOWNLOAD_SAVED_KEY, String(enabled));
}

export function getOfflineStorageCount(): number {
  if (typeof window === "undefined") return 0;
  return getAllOfflinePosts().length;
}

export function getOfflinePost(id: string): OfflinePost | null {
  if (typeof window === "undefined") return null;
  const json = localStorage.getItem(STORAGE_KEY_PREFIX + id);
  if (!json) return null;
  try {
    return JSON.parse(json) as OfflinePost;
  } catch {
    return null;
  }
}

export function savePostForOffline(post: OfflinePost): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + post.id, JSON.stringify(post));
    updateIndex(post.id, post);
  } catch (e) {
    if (process.env.NODE_ENV !== "production") console.error("Failed to save offline post", e);
    alert("Storage full. Please remove some offline articles.");
  }
}

export function removeOfflinePost(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY_PREFIX + id);
  removeFromIndex(id);
}

export function getAllOfflinePosts(): OfflinePost[] {
  if (typeof window === "undefined") return [];
  const indexJson = localStorage.getItem(INDEX_KEY);
  if (!indexJson) return [];
  let index: string[];
  try {
    index = JSON.parse(indexJson) as string[];
  } catch {
    return [];
  }
  return index
    .map((id) => getOfflinePost(id))
    .filter((p): p is OfflinePost => p !== null);
}

export function clearAllOfflinePosts(): void {
  if (typeof window === "undefined") return;
  const indexJson = localStorage.getItem(INDEX_KEY);
  if (indexJson) {
    try {
      const index = JSON.parse(indexJson) as string[];
      index.forEach((id) => localStorage.removeItem(STORAGE_KEY_PREFIX + id));
    } catch {
      // Invalid JSON, just clear the index key
    }
  }
  localStorage.removeItem(INDEX_KEY);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature kept for API consistency
function updateIndex(id: string, _post: OfflinePost) {
  const indexJson = localStorage.getItem(INDEX_KEY);
  let index: string[];
  try {
    index = indexJson ? (JSON.parse(indexJson) as string[]) : [];
  } catch {
    index = [];
  }
  if (!index.includes(id)) {
    index.unshift(id); // Newest first
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  }
}

function removeFromIndex(id: string) {
  const indexJson = localStorage.getItem(INDEX_KEY);
  if (!indexJson) return;
  let index: string[];
  try {
    index = JSON.parse(indexJson) as string[];
  } catch {
    return; // Invalid JSON, can't update index
  }
  index = index.filter((i) => i !== id);
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}
