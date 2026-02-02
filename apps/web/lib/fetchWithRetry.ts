/**
 * Fetch with retry and exponential backoff for transient 5xx/network errors.
 * Use for feed, explore, search and other critical GETs.
 */

const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_INITIAL_MS = 500;
const DEFAULT_MAX_MS = 4000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(status: number): boolean {
  return status >= 500 && status < 600;
}

export interface FetchWithRetryOptions extends RequestInit {
  /** Max retry attempts (default 2). */
  maxRetries?: number;
  /** Initial backoff ms (default 500). */
  initialMs?: number;
  /** Max backoff ms (default 4000). */
  maxMs?: number;
  /** Only retry on 5xx (default true). Set false to also retry on 408/429. */
  retryOnly5xx?: boolean;
}

/**
 * Same as fetch, but retries on 5xx or network failure with exponential backoff.
 * Non-2xx non-5xx responses are not retried.
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  options: FetchWithRetryOptions = {},
): Promise<Response> {
  const {
    maxRetries = DEFAULT_MAX_RETRIES,
    initialMs = DEFAULT_INITIAL_MS,
    maxMs = DEFAULT_MAX_MS,
    retryOnly5xx = true,
    ...init
  } = options;

  let lastError: unknown;
  let lastResponse: Response | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(input, init);
      if (res.ok) return res;
      lastResponse = res;
      const retryable =
        isRetryable(res.status) ||
        (!retryOnly5xx && (res.status === 408 || res.status === 429));
      if (!retryable || attempt === maxRetries) return res;
    } catch (e) {
      lastError = e;
      lastResponse = undefined;
      if (attempt === maxRetries) throw e;
    }
    const backoff = Math.min(initialMs * Math.pow(2, attempt), maxMs);
    await delay(backoff);
  }

  if (lastResponse) return lastResponse;
  throw lastError;
}
