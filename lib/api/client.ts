import { appConfig } from "@/config/app";

type ApiClientOptions = RequestInit & {
  path: string;
};

export async function apiClient<TResponse>({
  path,
  headers,
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
    },
  });

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
