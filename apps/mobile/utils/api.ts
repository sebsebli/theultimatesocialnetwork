import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import Constants from "expo-constants";
// Legacy API: copyAsync works with photo library URIs (ph://) on iOS
import * as FileSystemLegacy from "expo-file-system/legacy";

/** In dev, use Metro host so device/simulator can reach the API. When host is an IP, use port 80 so Docker (nginx) works; set EXPO_PUBLIC_API_BASE_URL to host:3000/api if you run the API with npm on the host. */
function getDevApiUrlFromMetroHost(): string | null {
  try {
    const hostUri =
      (Constants.expoConfig as { hostUri?: string } | undefined)?.hostUri ??
      (Constants.manifest as { hostUri?: string } | undefined)?.hostUri;
    if (typeof hostUri === "string") {
      const host = hostUri.split(":")[0];
      // Use Metro host when it's an IP so physical device can reach API. Port 80 = Docker/nginx; for npm-run API use EXPO_PUBLIC_API_BASE_URL=http://<ip>:3000/api
      if (host && /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
        return `http://${host}`;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

// Get API URL from environment or use default
const getApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (envUrl) {
    // In production, enforce HTTPS
    if (!__DEV__ && !envUrl.startsWith("https://")) {
      throw new Error("EXPO_PUBLIC_API_BASE_URL must use HTTPS in production");
    }
    return envUrl.replace(/\/$/, "");
  }

  // Development: prefer Metro host so app on device/simulator can reach API.
  // Nest uses setGlobalPrefix('api') – dev base must end with /api so /posts and /images/* work.
  if (__DEV__) {
    const withApi = (base: string) =>
      base.endsWith("/api")
        ? base.replace(/\/$/, "")
        : `${base.replace(/\/$/, "")}/api`;
    const metroHostUrl = getDevApiUrlFromMetroHost();
    if (metroHostUrl) return withApi(metroHostUrl);
    if (Platform.OS === "ios") return withApi("http://localhost:3000");
    if (Platform.OS === "android") return withApi("http://10.0.2.2:3000");
  }

  // Production fallback - should be set via environment variable
  throw new Error("EXPO_PUBLIC_API_BASE_URL must be set in production");
};

// Lazy so Expo Constants.hostUri is available by first request (e.g. when opening app on device)
let _apiUrl: string | null = null;
function getApiUrlCached(): string {
  if (_apiUrl == null) _apiUrl = getApiUrl();
  return _apiUrl ?? getApiUrl();
}

/** Base URL of the API (e.g. for RSS feed links). */
export function getApiBaseUrl(): string {
  return getApiUrlCached();
}

/** Base URL of the web app for share links (profile, post, etc.). */
export function getWebAppBaseUrl(): string {
  const envWeb = process.env.EXPO_PUBLIC_WEB_BASE_URL;
  if (envWeb) return envWeb.replace(/\/$/, "");
  const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "";
  // Only strip "api." when it is the host prefix (e.g. https://api.citewalk.app -> https://citewalk.app)
  if (/^https?:\/\/api\./i.test(apiUrl))
    return apiUrl.replace(/^https?:\/\/api\./i, "https://");
  return "https://citewalk.com";
}

/** URL for an image stored by key; use so images load via API (works on device/emulator). */
export function getImageUrl(key: string): string {
  if (!key || typeof key !== "string" || !key.trim()) return "";
  let base = getApiBaseUrl().replace(/\/$/, "");
  // Nest uses setGlobalPrefix('api') – ensure image path is /api/images/key so requests hit the right route
  if (!base.endsWith("/api")) {
    base = `${base}/api`;
  }
  return `${base}/images/${encodeURIComponent(key.trim())}`;
}

/** Avatar URI for a user. Prefer building from avatarKey so the URL uses this app's API base (works on device/simulator when API is on another host). Fall back to API-provided avatarUrl only when no key. */
export function getAvatarUri(
  user:
    | { avatarKey?: string | null; avatarUrl?: string | null }
    | null
    | undefined,
): string | null {
  if (!user) return null;
  if (
    user.avatarKey &&
    typeof user.avatarKey === "string" &&
    user.avatarKey.trim()
  ) {
    return getImageUrl(user.avatarKey.trim());
  }
  if (
    user.avatarUrl &&
    typeof user.avatarUrl === "string" &&
    user.avatarUrl.trim()
  ) {
    return user.avatarUrl.trim();
  }
  return null;
}

/** Post header image URI. Prefer building from headerImageKey so the URL uses this app's API base (works on device/simulator when API is on another host). Fall back to API-provided headerImageUrl only when no key. */
export function getPostHeaderImageUri(
  post:
    | {
        headerImageUrl?: string | null;
        headerImageKey?: string | null;
      }
    | null
    | undefined,
): string | null {
  if (!post) return null;
  if (
    post.headerImageKey &&
    typeof post.headerImageKey === "string" &&
    post.headerImageKey.trim()
  ) {
    return getImageUrl(post.headerImageKey.trim());
  }
  if (
    post.headerImageUrl &&
    typeof post.headerImageUrl === "string" &&
    post.headerImageUrl.trim()
  ) {
    return post.headerImageUrl.trim();
  }
  return null;
}

/** Topic/card recent image URI. Prefer keys so URL uses this app's API base; fall back to API-provided URLs. */
export function getTopicRecentImageUri(
  item:
    | {
        recentPostImageUrl?: string | null;
        recentPostImageKey?: string | null;
        recentPost?: {
          headerImageUrl?: string | null;
          headerImageKey?: string | null;
        } | null;
      }
    | null
    | undefined,
): string | null {
  if (!item) return null;
  if (
    item.recentPostImageKey &&
    typeof item.recentPostImageKey === "string" &&
    item.recentPostImageKey.trim()
  ) {
    return getImageUrl(item.recentPostImageKey.trim());
  }
  if (
    item.recentPost?.headerImageKey &&
    typeof item.recentPost.headerImageKey === "string" &&
    item.recentPost.headerImageKey.trim()
  ) {
    return getImageUrl(item.recentPost.headerImageKey.trim());
  }
  if (
    item.recentPostImageUrl &&
    typeof item.recentPostImageUrl === "string" &&
    item.recentPostImageUrl.trim()
  ) {
    return item.recentPostImageUrl.trim();
  }
  if (
    item.recentPost?.headerImageUrl &&
    typeof item.recentPost.headerImageUrl === "string" &&
    item.recentPost.headerImageUrl.trim()
  ) {
    return item.recentPost.headerImageUrl.trim();
  }
  return null;
}

/** Collection preview image URI. Prefer keys so URL uses this app's API base; fall back to API-provided URLs. */
export function getCollectionPreviewImageUri(
  collection:
    | {
        previewImageUrl?: string | null;
        previewImageKey?: string | null;
        recentPost?: {
          headerImageUrl?: string | null;
          headerImageKey?: string | null;
        } | null;
      }
    | null
    | undefined,
): string | null {
  if (!collection) return null;
  if (
    collection.previewImageKey &&
    typeof collection.previewImageKey === "string" &&
    collection.previewImageKey.trim()
  ) {
    return getImageUrl(collection.previewImageKey.trim());
  }
  if (
    collection.recentPost?.headerImageKey &&
    typeof collection.recentPost?.headerImageKey === "string" &&
    collection.recentPost.headerImageKey.trim()
  ) {
    return getImageUrl(collection.recentPost.headerImageKey.trim());
  }
  if (
    collection.previewImageUrl &&
    typeof collection.previewImageUrl === "string" &&
    collection.previewImageUrl.trim()
  ) {
    return collection.previewImageUrl.trim();
  }
  if (
    collection.recentPost?.headerImageUrl &&
    typeof collection.recentPost.headerImageUrl === "string" &&
    collection.recentPost.headerImageUrl.trim()
  ) {
    return collection.recentPost.headerImageUrl.trim();
  }
  return null;
}

/** Profile header (banner) image URI. Prefer building from profileHeaderKey so the URL uses this app's API base. */
export function getProfileHeaderUri(
  user:
    | { profileHeaderKey?: string | null; profileHeaderUrl?: string | null }
    | null
    | undefined,
): string | null {
  if (!user) return null;
  if (
    user.profileHeaderKey &&
    typeof user.profileHeaderKey === "string" &&
    user.profileHeaderKey.trim()
  ) {
    return getImageUrl(user.profileHeaderKey.trim());
  }
  if (
    user.profileHeaderUrl &&
    typeof user.profileHeaderUrl === "string" &&
    user.profileHeaderUrl.trim()
  ) {
    return user.profileHeaderUrl.trim();
  }
  return null;
}

const TOKEN_KEY = "jwt";
const ONBOARDING_KEY = "onboarding_complete";
const ONBOARDING_STAGE_KEY = "onboarding_stage";

export type OnboardingStage = "languages" | "profile" | "starter-packs";

export const setAuthToken = async (token: string) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getAuthToken = async () => {
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const clearAuthToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

export const getOnboardingComplete = async (): Promise<boolean> => {
  const v = await SecureStore.getItemAsync(ONBOARDING_KEY);
  return v === "true";
};

export const setOnboardingComplete = async () => {
  await SecureStore.setItemAsync(ONBOARDING_KEY, "true");
  await SecureStore.deleteItemAsync(ONBOARDING_STAGE_KEY);
};

export const clearOnboardingComplete = async () => {
  await SecureStore.deleteItemAsync(ONBOARDING_KEY);
  await SecureStore.deleteItemAsync(ONBOARDING_STAGE_KEY);
};

export const getOnboardingStage = async (): Promise<OnboardingStage | null> => {
  const v = await SecureStore.getItemAsync(ONBOARDING_STAGE_KEY);
  if (v === "languages" || v === "profile" || v === "starter-packs") return v;
  return null;
};

export const setOnboardingStage = async (stage: OnboardingStage) => {
  await SecureStore.setItemAsync(ONBOARDING_STAGE_KEY, stage);
};

export class ApiError extends Error {
  status?: number;
  /** Response body for 4xx (e.g. 403 with author info for private post). */
  data?: Record<string, unknown>;
  constructor(
    message: string,
    status?: number,
    data?: Record<string, unknown>,
  ) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// Global API error toast – show error to user; never auto sign-out from here
let onApiErrorToast: ((message: string) => void) | null = null;

export const setApiErrorToastHandler = (
  handler: ((message: string) => void) | null,
) => {
  onApiErrorToast = handler;
};

function showApiErrorToast(message: string) {
  if (onApiErrorToast) {
    try {
      onApiErrorToast(message);
    } catch {
      // ignore
    }
  }
}

/** Called when any request returns 401 (invalid/expired token or revoked session). Use to sign out and redirect to welcome. */
let onUnauthorized: (() => void | Promise<void>) | null = null;

export const setOnUnauthorized = (
  handler: (() => void | Promise<void>) | null,
) => {
  onUnauthorized = handler;
};

function triggerUnauthorized() {
  if (onUnauthorized) {
    try {
      const result = onUnauthorized();
      if (result && typeof (result as Promise<void>).catch === "function") {
        (result as Promise<void>).catch(() => {});
      }
    } catch {
      // ignore
    }
  }
}

/** @deprecated No longer used – we never sign out on API errors; use setApiErrorToastHandler for toasts */
export const setAuthErrorHandler = (_handler: () => void) => {
  // No-op: we never sign out the user on API errors
};

const RETRY_MAX = 2;
const RETRY_INITIAL_MS = 500;
const RETRY_MAX_MS = 4000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status >= 500 && status < 600;
}

class ApiClient {
  private async requestOnce(
    endpoint: string,
    options: RequestInit,
    headers: Record<string, string>,
  ): Promise<Response> {
    return fetch(`${getApiUrlCached()}${endpoint}`, {
      ...options,
      headers,
    });
  }

  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const method = (options.method || "GET").toUpperCase();
    const isGet = method === "GET";
    let lastError: any;
    let lastResponse: Response | undefined;

    for (let attempt = 0; attempt <= (isGet ? RETRY_MAX : 0); attempt++) {
      try {
        const token = await getAuthToken();

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(options.headers as Record<string, string>),
        };

        if (options.body instanceof FormData) {
          delete headers["Content-Type"];
        }

        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await this.requestOnce(endpoint, options, headers);

        if (response.status === 401) {
          showApiErrorToast("Session issue. Please try again.");
          triggerUnauthorized();
          throw new ApiError("Unauthorized", 401);
        }

        if (!response.ok) {
          const retryable = isGet && isRetryableStatus(response.status);
          if (retryable && attempt < RETRY_MAX) {
            lastResponse = response;
            const backoff = Math.min(
              RETRY_INITIAL_MS * Math.pow(2, attempt),
              RETRY_MAX_MS,
            );
            await delay(backoff);
            continue;
          }
          const errorText = await response.text();
          let errorMessage: string = `API Error: ${response.status}`;
          let errorData: Record<string, unknown> | undefined;
          try {
            const errorJson = JSON.parse(errorText) as Record<string, unknown>;
            const errObj = errorJson.error as
              | Record<string, unknown>
              | undefined;
            const m = (errObj?.message ?? errorJson["message"]) as
              | string
              | string[]
              | unknown;
            const raw =
              typeof m === "string"
                ? m
                : Array.isArray(m)
                  ? m[0]
                  : m != null &&
                      typeof (m as object) === "object" &&
                      "message" in (m as object)
                    ? (m as { message?: unknown }).message
                    : undefined;
            errorMessage =
              typeof raw === "string" ? raw : `API Error: ${response.status}`;
            errorData = errorJson;
          } catch (e) {
            // Keep default errorMessage
          }
          if (response.status !== 403) showApiErrorToast(errorMessage);
          throw new ApiError(errorMessage, response.status, errorData);
        }

        if (response.status === 204) return null;

        const text = await response.text();
        if (!text || text.trim() === "") return null;
        try {
          return JSON.parse(text);
        } catch {
          throw new ApiError(
            "Invalid JSON response from server",
            response.status,
          );
        }
      } catch (error: any) {
        lastError = error;
        lastResponse = undefined;
        if (error instanceof ApiError) throw error;

        const isNetwork =
          error?.message === "Network request failed" ||
          error?.message?.includes("Network") ||
          error?.name === "TypeError";
        if (isGet && isNetwork && attempt < RETRY_MAX) {
          const backoff = Math.min(
            RETRY_INITIAL_MS * Math.pow(2, attempt),
            RETRY_MAX_MS,
          );
          await delay(backoff);
          continue;
        }

        console.error(`API Request Failed: ${endpoint}`, error);

        if (error.message === "Auth check timeout") {
          const msg =
            "Connection timed out. Please check your internet connection.";
          showApiErrorToast(msg);
          throw new ApiError(msg, 0);
        }

        if (isNetwork) {
          const hint = __DEV__
            ? ` Can't reach the API at ${getApiUrlCached()}. Ensure the API is running and reachable from this device (e.g. listen on 0.0.0.0).`
            : " Please check your internet connection.";
          const msg = "Network error." + hint;
          showApiErrorToast(msg);
          throw new ApiError(msg, 0);
        }

        const msg = error?.message ?? "Something went wrong.";
        showApiErrorToast(msg);
        throw error;
      }
    }

    throw lastError ?? new ApiError("Request failed", 0);
  }

  async get<T = any>(endpoint: string): Promise<T> {
    return this.request(endpoint, { method: "GET" });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request(endpoint, { method: "DELETE" });
  }

  async upload<T = any>(endpoint: string, file: any): Promise<T> {
    let uri = file.uri;
    if (!uri || typeof uri !== "string") {
      throw new Error("Upload file must have a uri");
    }
    // On iOS, photo library assets (ph://) are not readable by fetch; copy to cache first.
    const isFileUri = uri.startsWith("file://");
    const cacheDir = FileSystemLegacy.cacheDirectory;
    if (
      !isFileUri &&
      cacheDir &&
      typeof FileSystemLegacy.copyAsync === "function"
    ) {
      try {
        const ext = uri.split("?")[0].includes(".")
          ? (uri.split(".").pop()?.toLowerCase() ?? "jpg")
          : "jpg";
        const safeExt =
          ext === "png" || ext === "gif" || ext === "webp" ? ext : "jpg";
        const destUri = `${cacheDir}upload_${Date.now()}.${safeExt}`;
        await FileSystemLegacy.copyAsync({ from: uri, to: destUri });
        uri = destUri;
      } catch (e) {
        console.warn("Copy asset to cache failed, trying original uri", e);
      }
    }
    // React Native iOS: some versions need uri without file:// for FormData to attach the body correctly.
    const uploadUri =
      Platform.OS === "ios" && uri.startsWith("file://")
        ? uri.replace("file://", "")
        : uri;

    const formData = new FormData();
    const pathSegment = uri.split("?")[0];
    const ext = pathSegment.includes(".")
      ? (pathSegment.split(".").pop()?.toLowerCase() ?? "jpg")
      : "jpg";
    const safeExt =
      ext === "png" || ext === "gif" || ext === "webp" ? ext : "jpg";
    const fileName =
      file.fileName && typeof file.fileName === "string"
        ? file.fileName
        : `photo.${safeExt}`;
    let mime =
      file.mimeType ??
      (file.type && String(file.type).includes("/") ? file.type : null) ??
      `image/${safeExt}`;
    if (!mime || !mime.includes("/")) mime = `image/${safeExt}`;

    formData.append("image", {
      uri: uploadUri,
      name: fileName,
      type: mime,
    } as any);

    return this.request(endpoint, {
      method: "POST",
      body: formData,
    });
  }
}

export const api = new ApiClient();
