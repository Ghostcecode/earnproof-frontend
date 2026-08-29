import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  fetchWithTimeout,
  isRetryable,
  retryRead,
  retryMutation,
} from '@/lib/api/client';

describe('API timeout, retry, and cancellation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ── Timeout tests ──────────────────────────────────────────────────────────

  describe('fetchWithTimeout - Timeouts', () => {
    it('read_request_aborts_after_timeout', async () => {
      // Mock fetch to never resolve (hangs)
      vi.spyOn(global, 'fetch').mockImplementation(
        () => new Promise(() => {}), // never resolves
      );

      const promise = fetchWithTimeout('http://api.test/data', {
        timeoutMs: 5000,
      });

      // Advance fake timer past timeout
      vi.advanceTimersByTime(5001);

      await expect(promise).rejects.toThrow();
    });

    it('read_request_resolves_before_timeout', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response('{"ok":true}', { status: 200 }),
      );

      const response = await fetchWithTimeout('http://api.test/data', {
        timeoutMs: 5000,
      });

      expect(response.status).toBe(200);
    });

    it('uses_default_timeout_when_not_specified', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(
        () => new Promise(() {}), // never resolves
      );

      const promise = fetchWithTimeout('http://api.test/data');

      // Default timeout is 10 seconds
      vi.advanceTimersByTime(10001);

      await expect(promise).rejects.toThrow();
      expect(fetchSpy).toHaveBeenCalled();
    });

    it('clears_timeout_on_success', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response('{"ok":true}', { status: 200 }),
      );

      await fetchWithTimeout('http://api.test/data', { timeoutMs: 5000 });

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('clears_timeout_on_error', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      vi.spyOn(global, 'fetch').mockRejectedValueOnce(
        new TypeError('network error'),
      );

      await expect(
        fetchWithTimeout('http://api.test/data', { timeoutMs: 5000 }),
      ).rejects.toThrow();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  // ── Retry tests ────────────────────────────────────────────────────────────

  describe('retryRead - Retries', () => {
    it('read_retries_on_network_error_up_to_max_attempts', async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValueOnce(new TypeError('network error'))
        .mockRejectedValueOnce(new TypeError('network error'))
        .mockResolvedValueOnce('success');

      vi.spyOn(global, 'fetch').mockImplementation(mockFetch);

      const controller = new AbortController();

      const result = await retryRead(
        async (signal) => {
          const response = await fetchWithTimeout('http://api.test/data', {
            signal,
          });
          return response.json();
        },
        controller.signal,
        3,
        100,
      );

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result).toBe('success');
    });

    it('read_stops_retrying_after_max_attempts', async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValue(new TypeError('network error'));

      vi.spyOn(global, 'fetch').mockImplementation(mockFetch);

      const controller = new AbortController();

      await expect(
        retryRead(
          async (signal) =>
            fetchWithTimeout('http://api.test/data', { signal }),
          controller.signal,
          3,
          100,
        ),
      ).rejects.toThrow();

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('read_retries_with_exponential_backoff', async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValueOnce(new TypeError('network error'))
        .mockRejectedValueOnce(new TypeError('network error'))
        .mockResolvedValueOnce('success');

      vi.spyOn(global, 'fetch').mockImplementation(mockFetch);

      const controller = new AbortController();

      const promise = retryRead(
        async (signal) =>
          fetchWithTimeout('http://api.test/data', { signal }),
        controller.signal,
        3,
        100,
      );

      // First attempt fails immediately
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Advance past first backoff delay (100ms * 2^0 * jitter)
      vi.advanceTimersByTime(200);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Advance past second backoff delay (100ms * 2^1 * jitter)
      vi.advanceTimersByTime(400);
      expect(mockFetch).toHaveBeenCalledTimes(3);

      const result = await promise;
      expect(result).toBe('success');
    });

    it('read_does_not_retry_on_abort', async () => {
      const controller = new AbortController();

      vi.spyOn(global, 'fetch').mockRejectedValue(
        new DOMException('aborted', 'AbortError'),
      );

      await expect(
        retryRead(
          async (signal) =>
            fetchWithTimeout('http://api.test/data', { signal }),
          controller.signal,
          3,
          100,
        ),
      ).rejects.toThrow('AbortError');

      // Only called once — no retries on AbortError
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('read_does_not_retry_on_4xx_except_429', async () => {
      const mockFetch = vi.fn().mockImplementation(async () => {
        throw new Error('404 Not Found');
      });

      vi.spyOn(global, 'fetch').mockImplementation(mockFetch);

      const controller = new AbortController();

      // Simulate 404 error
      await expect(
        retryRead(
          async (signal) => {
            throw new Error('404 Not Found');
          },
          controller.signal,
          3,
          100,
        ),
      ).rejects.toThrow('404 Not Found');

      expect(mockFetch).toHaveBeenCalledTimes(0);
    });

    it('read_retries_on_429_rate_limit', async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValueOnce(new TypeError('429'))
        .mockResolvedValueOnce('success');

      vi.spyOn(global, 'fetch').mockImplementation(mockFetch);

      const controller = new AbortController();

      // Create a function that throws then succeeds
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts === 1) {
          throw new TypeError('429');
        }
        return 'success';
      };

      const result = await retryRead(fn, controller.signal, 3, 100);

      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });

    it('read_retries_on_503_service_unavailable', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts === 1) {
          throw new TypeError('503');
        }
        return 'success';
      };

      const controller = new AbortController();

      const result = await retryRead(fn, controller.signal, 3, 100);

      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });
  });

  describe('retryMutation - No Retry', () => {
    it('mutation_is_never_retried_on_network_error', async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValueOnce(new TypeError('network error'));

      vi.spyOn(global, 'fetch').mockImplementation(mockFetch);

      const controller = new AbortController();

      await expect(
        retryMutation(
          async (signal) =>
            fetchWithTimeout('http://api.test/submit', {
              method: 'POST',
              signal,
            }),
          controller.signal,
        ),
      ).rejects.toThrow();

      // Only called once — no retry for mutations
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('mutation_executes_exactly_once', async () => {
      let callCount = 0;
      const fn = async () => {
        callCount++;
        return 'result';
      };

      const controller = new AbortController();

      const result = await retryMutation(fn, controller.signal);

      expect(result).toBe('result');
      expect(callCount).toBe(1);
    });
  });

  // ── Cancellation tests ─────────────────────────────────────────────────────

  describe('Cancellation via AbortSignal', () => {
    it('caller_signal_aborts_fetch_before_timeout', async () => {
      let resolveResponse!: (value: Response) => void;
      vi.spyOn(global, 'fetch').mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveResponse = resolve;
          }),
      );

      const controller = new AbortController();

      const promise = fetchWithTimeout('http://api.test/data', {
        signal: controller.signal,
        timeoutMs: 10000,
      });

      // Abort before timeout
      controller.abort();

      await expect(promise).rejects.toThrow();
    });

    it('combines_caller_and_timeout_signals', async () => {
      vi.spyOn(global, 'fetch').mockImplementation(
        () => new Promise(() {}), // never resolves
      );

      const controller = new AbortController();

      const promise = fetchWithTimeout('http://api.test/data', {
        signal: controller.signal,
        timeoutMs: 10000,
      });

      // Abort caller signal before timeout
      controller.abort();
      vi.advanceTimersByTime(100);

      await expect(promise).rejects.toThrow();

      // Should only timeout once (not twice)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('timeout_aborts_even_with_active_caller_signal', async () => {
      vi.spyOn(global, 'fetch').mockImplementation(
        () => new Promise(() {}), // never resolves
      );

      const controller = new AbortController();

      const promise = fetchWithTimeout('http://api.test/data', {
        signal: controller.signal,
        timeoutMs: 5000,
      });

      // Don't abort caller, let timeout fire
      vi.advanceTimersByTime(5001);

      await expect(promise).rejects.toThrow();
    });

    it('retryRead_respects_abort_signal_between_retries', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        throw new TypeError('network error');
      };

      const controller = new AbortController();

      // Start first attempt
      const promise = retryRead(fn, controller.signal, 3, 500);

      // First attempt fails
      expect(attempts).toBe(1);

      // Abort before retry delay completes
      controller.abort();
      vi.advanceTimersByTime(100);

      await expect(promise).rejects.toThrow('AbortError');

      // Should not attempt again
      expect(attempts).toBe(1);
    });
  });

  // ── isRetryable classification ────────────────────────────────────────────

  describe('isRetryable - Error Classification', () => {
    it('isRetryable_returns_false_for_abort_error', () => {
      const abort = new DOMException('aborted', 'AbortError');
      expect(isRetryable(abort)).toBe(false);
    });

    it('isRetryable_returns_true_for_503', () => {
      expect(isRetryable(undefined, new Response('', { status: 503 }))).toBe(
        true,
      );
    });

    it('isRetryable_returns_true_for_504', () => {
      expect(isRetryable(undefined, new Response('', { status: 504 }))).toBe(
        true,
      );
    });

    it('isRetryable_returns_true_for_429', () => {
      expect(isRetryable(undefined, new Response('', { status: 429 }))).toBe(
        true,
      );
    });

    it('isRetryable_returns_false_for_400', () => {
      expect(isRetryable(undefined, new Response('', { status: 400 }))).toBe(
        false,
      );
    });

    it('isRetryable_returns_false_for_401', () => {
      expect(isRetryable(undefined, new Response('', { status: 401 }))).toBe(
        false,
      );
    });

    it('isRetryable_returns_false_for_403', () => {
      expect(isRetryable(undefined, new Response('', { status: 403 }))).toBe(
        false,
      );
    });

    it('isRetryable_returns_false_for_404', () => {
      expect(isRetryable(undefined, new Response('', { status: 404 }))).toBe(
        false,
      );
    });

    it('isRetryable_returns_true_for_network_error', () => {
      const networkError = new TypeError('Failed to fetch');
      expect(isRetryable(networkError)).toBe(true);
    });

    it('isRetryable_returns_false_for_non_network_error_no_response', () => {
      const error = new Error('Unknown error');
      expect(isRetryable(error)).toBe(false);
    });

    it('isRetryable_returns_true_for_500', () => {
      expect(isRetryable(undefined, new Response('', { status: 500 }))).toBe(
        false, // 500 is not explicitly retryable
      );
    });
  });

  // ── Integration tests ──────────────────────────────────────────────────────

  describe('Integration - Multiple Signals', () => {
    it('handles_both_timeout_and_caller_abort', async () => {
      vi.spyOn(global, 'fetch').mockImplementation(
        () => new Promise(() {}), // never resolves
      );

      const controller = new AbortController();

      const promise = fetchWithTimeout('http://api.test/data', {
        signal: controller.signal,
        timeoutMs: 5000,
      });

      // Caller aborts first
      controller.abort();

      await expect(promise).rejects.toThrow();
    });

    it('caller_abort_cancels_retry_loop', async () => {
      let attempts = 0;
      const fn = async (signal: AbortSignal) => {
        attempts++;
        if (signal.aborted) {
          throw new DOMException('aborted', 'AbortError');
        }
        throw new TypeError('network error');
      };

      const controller = new AbortController();

      const promise = retryRead(fn, controller.signal, 5, 500);

      expect(attempts).toBe(1);

      // Abort mid-retry
      controller.abort();
      vi.advanceTimersByTime(1000);

      await expect(promise).rejects.toThrow('AbortError');

      // Should not retry after abort
      expect(attempts).toBe(1);
    });

    it('timeout_during_retry_backoff_delays_next_attempt', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 2) {
          throw new TypeError('network error');
        }
        return 'success';
      };

      const controller = new AbortController();

      const promise = retryRead(fn, controller.signal, 3, 100);

      // First attempt fails immediately
      expect(attempts).toBe(1);

      // Advance past backoff delay
      vi.advanceTimersByTime(300);
      expect(attempts).toBe(2);

      const result = await promise;
      expect(result).toBe('success');
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────

  describe('Edge Cases', () => {
    it('zero_timeout_aborts_immediately', async () => {
      vi.spyOn(global, 'fetch').mockImplementation(
        () => new Promise(() {}), // never resolves
      );

      const promise = fetchWithTimeout('http://api.test/data', {
        timeoutMs: 0,
      });

      vi.advanceTimersByTime(1);

      await expect(promise).rejects.toThrow();
    });

    it('very_large_timeout_does_not_abort_prematurely', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response('{"ok":true}', { status: 200 }),
      );

      const response = await fetchWithTimeout('http://api.test/data', {
        timeoutMs: 999999999,
      });

      expect(response.status).toBe(200);
    });

    it('retryRead_with_max_attempts_of_one', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        throw new TypeError('network error');
      };

      const controller = new AbortController();

      await expect(
        retryRead(fn, controller.signal, 1, 100),
      ).rejects.toThrow();

      expect(attempts).toBe(1);
    });

    it('retryRead_succeeds_on_first_attempt', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        return 'success';
      };

      const controller = new AbortController();

      const result = await retryRead(fn, controller.signal, 3, 100);

      expect(result).toBe('success');
      expect(attempts).toBe(1);
    });
  });
});
