/**
 * User-facing messages for API errors (rate limits, server errors, etc.).
 * Use when showing toast or error UI after a failed fetch.
 */
export interface ApiErrorBody {
  message?: string;
  error?: string;
}

/**
 * Returns a short, user-friendly message for a failed API response.
 * Prefers body.message or body.error; falls back to status-based messages (e.g. 429).
 */
export function getApiErrorMessage(
  status: number,
  body?: ApiErrorBody | null,
): string {
  const fromBody =
    (body?.message && body.message.trim()) ||
    (body?.error && body.error.trim()) ||
    "";
  if (fromBody) return fromBody;

  switch (status) {
    case 429:
      return "Too many requests. Please try again later.";
    case 403:
      return "You don’t have permission to do that.";
    case 404:
      return "Not found.";
    case 401:
      return "Please sign in again.";
    case 400:
      return "Invalid request. Please check and try again.";
    default:
      if (status >= 500) return "Something went wrong. Please try again.";
      return "Request failed. Please try again.";
  }
}

/**
 * Parse response and return user-facing error message.
 * Call after checking !res.ok; optionally pass in already-parsed body.
 */
export async function getErrorMessageFromResponse(
  res: Response,
  parsedBody?: ApiErrorBody | null,
): Promise<string> {
  const body =
    parsedBody ?? (await res.json().catch((): ApiErrorBody | null => null));
  return getApiErrorMessage(res.status, body);
}
