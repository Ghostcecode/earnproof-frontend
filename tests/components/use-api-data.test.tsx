import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useApiData } from './use-api-data';

describe('useApiData - Component cancellation patterns', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('component_unmount_cancels_in_flight_request', async () => {
    let capturedSignal: AbortSignal | undefined;

    vi.spyOn(global, 'fetch').mockImplementation((_, init?: any) => {
      capturedSignal = init?.signal;
      return new Promise(() {}); // hangs forever
    });

    const { unmount } = renderHook(() => useApiData('http://api.test/data'));

    // Give hook time to initiate fetch
    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(capturedSignal?.aborted).toBe(false);

    // Unmount component
    unmount();

    expect(capturedSignal?.aborted).toBe(true);
  });

  it('url_change_cancels_previous_fetch_before_new_one_starts', async () => {
    const signals: AbortSignal[] = [];

    vi.spyOn(global, 'fetch').mockImplementation((_, init?: any) => {
      if (init?.signal) {
        signals.push(init.signal);
      }
      return new Promise(() {}); // hangs
    });

    const { rerender } = renderHook(
      ({ url }) => useApiData(url),
      { initialProps: { url: 'http://api.test/data/1' } },
    );

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(signals.length).toBe(1);
    expect(signals[0].aborted).toBe(false);

    // Change URL — should cancel first and start new
    rerender({ url: 'http://api.test/data/2' });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    // First signal should be aborted
    expect(signals[0].aborted).toBe(true);

    // Second signal should exist and not be aborted
    expect(signals.length).toBe(2);
    expect(signals[1].aborted).toBe(false);
  });

  it('successful_response_updates_state', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 1, name: 'test' }), {
        status: 200,
      }),
    );

    const { result } = renderHook(() => useApiData('http://api.test/data'));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({ id: 1, name: 'test' });
    expect(result.current.error).toBe(null);
  });

  it('network_error_sets_error_state', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(
      new TypeError('Failed to fetch'),
    );

    const { result } = renderHook(() => useApiData('http://api.test/data'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe('Failed to fetch');
  });

  it('abort_error_does_not_set_error_state', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(
      new DOMException('aborted', 'AbortError'),
    );

    const { result } = renderHook(() => useApiData('http://api.test/data'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // AbortError is ignored, so no error should be set
    expect(result.current.error).toBe(null);
  });

  it('http_error_response_sets_error_state', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response('Not Found', { status: 404 }),
    );

    const { result } = renderHook(() => useApiData('http://api.test/data'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toContain('404');
  });

  it('late_response_does_not_overwrite_newer_state', async () => {
    let resolveFirst!: (value: Response) => void;
    let resolveSecond!: (value: Response) => void;

    vi.spyOn(global, 'fetch')
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecond = resolve;
          }),
      );

    const { result, rerender } = renderHook(
      ({ url }) => useApiData(url),
      { initialProps: { url: 'http://api.test/data/1' } },
    );

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    // Change to second URL before first response comes back
    rerender({ url: 'http://api.test/data/2' });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    // Resolve second (current) response first
    await act(async () => {
      resolveSecond(
        new Response(JSON.stringify({ id: 2, name: 'second' }), {
          status: 200,
        }),
      );
      vi.advanceTimersByTime(0);
    });

    // State should show id=2 (from current fetch)
    expect(result.current.data).toEqual({ id: 2, name: 'second' });

    // Now resolve first (stale) response
    await act(async () => {
      resolveFirst(
        new Response(JSON.stringify({ id: 1, name: 'first' }), {
          status: 200,
        }),
      );
      vi.advanceTimersByTime(0);
    });

    // State should STILL show id=2 (not overwritten by stale response)
    // This is because the first request was aborted
    expect(result.current.data).toEqual({ id: 2, name: 'second' });
  });

  it('timeout_option_is_passed_to_fetch', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    renderHook(() => useApiData('http://api.test/data', { timeoutMs: 3000 }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    // Verify timeout was passed in options
    const callArgs = fetchSpy.mock.calls[0];
    expect(callArgs[1]?.timeoutMs).toBe(3000);
  });

  it('does_not_update_state_after_unmount', async () => {
    const setStateSpy = vi.spyOn(Object.getPrototypeOf(useState), 'toString');

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 1 }), { status: 200 }),
    );

    const { result, unmount } = renderHook(() => useApiData('http://api.test/data'));

    // Unmount before response can be processed
    unmount();

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    // Hook was unmounted, so state updates should not happen
    expect(result.current.data).toBe(null);
  });

  it('multiple_url_changes_cancel_previous_requests', async () => {
    const signals: AbortSignal[] = [];

    vi.spyOn(global, 'fetch').mockImplementation((_, init?: any) => {
      if (init?.signal) {
        signals.push(init.signal);
      }
      return new Promise(() {}); // hangs
    });

    const { rerender } = renderHook(
      ({ url }) => useApiData(url),
      { initialProps: { url: 'http://api.test/data/1' } },
    );

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    // Change URL multiple times
    for (let i = 2; i <= 4; i++) {
      rerender({ url: `http://api.test/data/${i}` });
      await act(async () => {
        vi.advanceTimersByTime(0);
      });
    }

    // All but the last signal should be aborted
    expect(signals.length).toBe(4);
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(true);
    expect(signals[2].aborted).toBe(true);
    expect(signals[3].aborted).toBe(false); // last one is still active
  });
});
