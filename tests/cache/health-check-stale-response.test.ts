/**
 * @jest-environment jsdom
 */

// These tests cover the "revalidation cannot replace newer state with an
// older response" requirement specifically for out-of-order network
// resolution: an earlier, superseded request finishing *after* a newer one
// already updated state. lib/__tests__/health-check.test.ts already covers
// the AbortController wiring (that refetch() calls abort() on the previous
// controller); these tests instead simulate environments where the
// superseded request's promise still settles despite the abort signal,
// which is the case the isCurrent() guard in lib/health-check.ts exists
// for.

import { renderHook, waitFor, act } from "@testing-library/react";
import { useHealthCheck } from "@/lib/health-check";

function healthBody(overrides: Partial<Record<string, string>> = {}) {
  return {
    status: "ok",
    service: "earnproof-api",
    database: "ok",
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  jest.useRealTimers();
});

describe("useHealthCheck stale-response ordering", () => {
  it("does not let a slow first request overwrite a faster, newer request's success", async () => {
    let resolveFirst!: (value: unknown) => void;
    let callCount = 0;

    global.fetch = jest.fn().mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return new Promise((resolve) => {
          resolveFirst = resolve;
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => healthBody(),
      });
    });

    const { result } = renderHook(() => useHealthCheck(999_999));

    await waitFor(() => expect(callCount).toBe(1));

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(callCount).toBe(2));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(result.current.data).not.toBeNull());

    const dataAfterSecondRequest = result.current.data;
    const lastUpdatedAfterSecondRequest = result.current.lastUpdated;

    // The first request now resolves with a *different* stale payload,
    // simulating a slow response arriving after a newer one already won.
    act(() => {
      resolveFirst({
        ok: true,
        json: async () => healthBody({ database: "error" }),
      });
    });

    // Flush microtasks the stale resolution's .then chain needs to run.
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.data).toEqual(dataAfterSecondRequest);
    expect(result.current.lastUpdated).toBe(lastUpdatedAfterSecondRequest);
    expect(result.current.error).toBeNull();
  });

  it("does not let a slow first request's late failure overwrite a newer request's success", async () => {
    let rejectFirst!: (reason: unknown) => void;
    let callCount = 0;

    global.fetch = jest.fn().mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return new Promise((_resolve, reject) => {
          rejectFirst = reject;
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => healthBody(),
      });
    });

    const { result } = renderHook(() => useHealthCheck(999_999));

    await waitFor(() => expect(callCount).toBe(1));

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(callCount).toBe(2));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(result.current.data).not.toBeNull());

    expect(result.current.error).toBeNull();

    act(() => {
      rejectFirst(new DOMException("The operation was aborted.", "AbortError"));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    // The superseded request's failure must not resurrect an error state
    // once a newer request already succeeded.
    expect(result.current.error).toBeNull();
    expect(result.current.data?.status).toBe("ok");
  });

  it("marks retained data as not live once the latest check fails, and live again once it recovers", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => healthBody(),
    });

    const { result } = renderHook(() => useHealthCheck(999_999));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isDataLive).toBe(true);
    expect(result.current.data).not.toBeNull();

    (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await act(async () => {
      await result.current.refetch();
    });

    // Data from the prior successful check is retained (so the UI can show
    // "last known status") but must be labeled as no longer live.
    expect(result.current.data).not.toBeNull();
    expect(result.current.isDataLive).toBe(false);
    expect(result.current.error).toBe("Failed to fetch");

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => healthBody(),
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.isDataLive).toBe(true);
    expect(result.current.error).toBeNull();
  });
});
