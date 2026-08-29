import { useState, useEffect } from 'react';
import { fetchWithTimeout } from '@/lib/api/client';

/**
 * Example hook demonstrating the correct cancellation pattern.
 * This hook properly cancels in-flight requests on unmount or dependency change.
 */
export function useApiData<T>(
  url: string,
  options?: { timeoutMs?: number },
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchWithTimeout(url, {
          signal: controller.signal,
          timeoutMs: options?.timeoutMs,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();

        // Only update state if component is still mounted
        if (isMounted) {
          setData(json);
        }
      } catch (err) {
        // Ignore abort errors — component unmounted or cancelled
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }

        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    // Cleanup: cancel request on unmount or URL change
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [url, options?.timeoutMs]);

  return { data, loading, error };
}
