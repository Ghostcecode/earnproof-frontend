import { appConfig } from "@/config/app";

const DEFAULT_TIMEOUT_MS = 10_000; // 10 seconds

type ApiClientOptions = RequestInit & {
  path: string;
  timeoutMs?: number;
};

/**
 * Executes a fetch with:
 * - Bounded timeout (AbortController with timeout)
 * - Caller-provided signal for cancellation (navigation/unmount)
 * - Combined signal: request aborts if either times out OR caller cancels
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal: callerSignal,
    ...rest
  } = options;

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

  // Combine caller signal + timeout signal
  let signal: AbortSignal;
  if (callerSignal) {
    signal = AbortSignal.any([callerSignal, timeoutController.signal]);
  } else {
    signal = timeoutController.signal;
  }

  try {
    const response = await fetch(url, { ...rest, signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Retry policy for READ requests only.
 * Mutations are NEVER retried automatically — see retryRead() vs retryMutation().
 *
 * Retryable: network errors, 429, 503, 504
 * Not retryable: 4xx (except 429), aborted requests, mutations
 */
export function isRetryable(error: unknown, response?: Response): boolean {
  // Never retry aborted requests (user navigated away, unmounted)
  if (error instanceof DOMException && error.name === "AbortError") {
    return false;
  }

  // Never retry if no response but error is not a network error
  if (response) {
    if (response.status === 429) return true; // rate limited — retry with backoff
    if (response.status === 503 || response.status === 504) return true;
    if (response.status >= 400 && response.status < 500) return false; // 4xx not retryable
  }

  // Network failure (no response)
  if (!response && error instanceof TypeError) {
    return true;
  }

  return false;
}

export async function retryRead<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  signal: AbortSignal,
  maxAttempts = 3,
  baseDelayMs = 500,
): Promise<T> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn(signal);
    } catch (error) {
      const isLast = attempt === maxAttempts - 1;

      // Don't retry if caller already aborted, or error is not retryable
      if (signal.aborted || !isRetryable(error)) {
        throw error;
      }

      if (isLast) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay =
        baseDelayMs *
        Math.pow(2, attempt) *
        (0.5 + Math.random() * 0.5);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("retryRead: unreachable");
}

/**
 * Mutations are never retried — idempotency must be guaranteed externally
 */
export async function retryMutation<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  return fn(signal); // single attempt, no retry
}

export async function apiClient<TResponse>({
  path,
  headers,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  ...init
}: ApiClientOptions): Promise<TResponse> {
  const response = await fetch(`${appConfig.apiUrl}${path}`, {
    ...init,
    // Every response through this client is either wallet-authenticated,
    // payment/proof data, or a verification lookup — none of it is safe
    // for Next.js's fetch data cache, a browser HTTP cache, or a shared
    // intermediary cache to store or replay. `cache: "no-store"` opts the
    // request itself out of Next's fetch cache; the explicit request
    // header is a defense-in-depth signal for any caching proxy sitting in
    // front of the API that respects request Cache-Control. See
    // docs/cache-policy.md.
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...headers,
  const response = await fetchWithTimeout(
    `${appConfig.apiUrl}${path}`,
    {
      ...init,
      timeoutMs,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`EarnProof API request failed with ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}

export function bearer(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}
