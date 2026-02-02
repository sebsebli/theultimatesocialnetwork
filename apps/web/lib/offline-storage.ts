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

export function getOfflinePost(id: string): OfflinePost | null {
  if (typeof window === "undefined") return null;
  const json = localStorage.getItem(STORAGE_KEY_PREFIX + id);
  return json ? JSON.parse(json) : null;
}

export function savePostForOffline(post: OfflinePost): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + post.id, JSON.stringify(post));
    updateIndex(post.id, post);
  } catch (e) {
    console.error("Failed to save offline post", e);
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
  const index = JSON.parse(indexJson) as string[];
  return index
    .map((id) => getOfflinePost(id))
    .filter((p): p is OfflinePost => p !== null);
}

export function clearAllOfflinePosts(): void {
  if (typeof window === "undefined") return;
  const indexJson = localStorage.getItem(INDEX_KEY);
  if (indexJson) {
    const index = JSON.parse(indexJson) as string[];
    index.forEach((id) => localStorage.removeItem(STORAGE_KEY_PREFIX + id));
  }
  localStorage.removeItem(INDEX_KEY);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature kept for API consistency
function updateIndex(id: string, _post: OfflinePost) {
  const indexJson = localStorage.getItem(INDEX_KEY);
  const index: string[] = indexJson ? JSON.parse(indexJson) : [];
  if (!index.includes(id)) {
    index.unshift(id); // Newest first
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  }
}

function removeFromIndex(id: string) {
  const indexJson = localStorage.getItem(INDEX_KEY);
  if (!indexJson) return;
  let index: string[] = JSON.parse(indexJson);
  index = index.filter((i) => i !== id);
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}
