/**
 * Server-side authenticated fetch with automatic token refresh.
 *
 * Use in Next.js API routes (server components / route handlers) instead of
 * manually reading cookies and calling fetch. Handles:
 *
 * 1. Reading the access token from the httpOnly "token" cookie
 * 2. On 401: transparently refreshing via the "refreshToken" cookie
 * 3. Rotating both cookies on successful refresh
 * 4. Returning the backend response (or 401 if refresh also fails)
 */
import { cookies } from "next/headers";
import { getApiUrl } from "@/lib/security";

const API_URL = getApiUrl();

/**
 * Try to refresh the access token using the refresh token cookie.
 * Returns the new access token on success, null on failure.
 */
async function tryRefresh(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): Promise<string | null> {
  const refreshToken = cookieStore.get("refreshToken")?.value;
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const { accessToken, refreshToken: newRefreshToken } = data;
    if (!accessToken || typeof accessToken !== "string") return null;

    const isProduction = process.env.NODE_ENV === "production";

    cookieStore.set("token", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 60 * 15,
      path: "/",
    });

    if (newRefreshToken && typeof newRefreshToken === "string") {
      cookieStore.set("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }

    return accessToken;
  } catch {
    return null;
  }
}

export interface ServerFetchOptions {
  /** HTTP method. Default: GET */
  method?: string;
  /** JSON body (will be stringified). */
  body?: unknown;
  /** Raw body (e.g. FormData). Takes precedence over `body`. */
  rawBody?: BodyInit;
  /** Extra headers to merge. */
  headers?: Record<string, string>;
  /** If true, do NOT require authentication (pass token if available). */
  optional?: boolean;
}

export interface ServerFetchResult {
  /** Whether the request ultimately succeeded (2xx). */
  ok: boolean;
  /** HTTP status code of the final response. */
  status: number;
  /** Parsed JSON body, or null if empty / non-JSON. */
  data: unknown;
  /** Raw Response object for advanced use (e.g. streaming). */
  response: Response;
}

/**
 * Make an authenticated request to the backend API.
 *
 * @param path  API path, e.g. `/posts/123`
 * @param opts  Options
 */
export async function serverFetch(
  path: string,
  opts: ServerFetchOptions = {},
): Promise<ServerFetchResult> {
  const cookieStore = await cookies();
  let token = cookieStore.get("token")?.value ?? null;

  // If no access token but refresh token exists, try refresh before first attempt
  if (!token && cookieStore.get("refreshToken")?.value) {
    token = await tryRefresh(cookieStore);
  }

  if (!token && !opts.optional) {
    return {
      ok: false,
      status: 401,
      data: { error: "Unauthorized" },
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      }),
    };
  }

  const buildHeaders = (t: string | null): Record<string, string> => {
    const h: Record<string, string> = { ...opts.headers };
    if (t) h["Authorization"] = `Bearer ${t}`;
    if (
      opts.body !== undefined &&
      opts.rawBody === undefined &&
      !h["Content-Type"]
    ) {
      h["Content-Type"] = "application/json";
    }
    return h;
  };

  const buildInit = (t: string | null): RequestInit => ({
    method: opts.method ?? "GET",
    headers: buildHeaders(t),
    body:
      opts.rawBody ??
      (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
  });

  let res = await fetch(`${API_URL}${path}`, buildInit(token));

  // On 401, attempt silent refresh and retry once
  if (res.status === 401 && !opts.optional) {
    const newToken = await tryRefresh(cookieStore);
    if (newToken) {
      res = await fetch(`${API_URL}${path}`, buildInit(newToken));
    } else {
      // Both tokens are invalid — clear cookies
      cookieStore.delete("token");
      cookieStore.delete("refreshToken");
    }
  }

  let data: unknown = null;
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  return { ok: res.ok, status: res.status, data, response: res };
}
