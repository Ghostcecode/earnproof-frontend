import { act, renderHook, waitFor } from "@testing-library/react";
import { useHealthCheck } from "@/lib/health-check";

jest.mock("@/config/app", () => ({
  appConfig: {
    apiUrl: "https://api.earnproof.example",
  },
}));

describe("useHealthCheck", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const healthyResponse = {
    status: "ok",
    service: "earnproof-api",
    database: "ok",
    timestamp: new Date().toISOString(),
  };

  it("reports a successful health check", async () => {
    jest.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(healthyResponse), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    const { result } = renderHook(() => useHealthCheck(60_000));

    await act(async () => {
      jest.runOnlyPendingTimers();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(healthyResponse);
    expect(result.current.error).toBeNull();
    expect(result.current.isDataLive).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.earnproof.example/health",
      expect.objectContaining({
        cache: "no-store",
        headers: {
          "Cache-Control": "no-store",
        },
      }),
    );
  });

  it("reports HTTP failures", async () => {
    jest.mocked(fetch).mockResolvedValue(
      new Response("Service unavailable", {
        status: 503,
      }),
    );

    const { result } = renderHook(() => useHealthCheck(60_000));

    await act(async () => {
      jest.runOnlyPendingTimers();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("HTTP 503");
    expect(result.current.isDataLive).toBe(false);
  });

  it("reports network failures", async () => {
    jest.mocked(fetch).mockRejectedValue(
      new Error("Network unavailable"),
    );

    const { result } = renderHook(() => useHealthCheck(60_000));

    await act(async () => {
      jest.runOnlyPendingTimers();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Network unavailable");
    expect(result.current.isDataLive).toBe(false);
  });

  it("rejects malformed health responses", async () => {
    jest.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          service: "earnproof-api",
        }),
        { status: 200 },
      ),
    );

    const { result } = renderHook(() => useHealthCheck(60_000));

    await act(async () => {
      jest.runOnlyPendingTimers();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Malformed response");
    expect(result.current.isDataLive).toBe(false);
  });

  it("times out an unresolved request", async () => {
    jest.mocked(fetch).mockImplementation(
      () => new Promise(() => undefined),
    );

    const { result } = renderHook(() => useHealthCheck(60_000));

    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    await act(async () => {
      jest.advanceTimersByTime(10_000);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Request timed out");
    });

    expect(result.current.isDataLive).toBe(false);
  });

  it("marks unhealthy service responses with an error", async () => {
    jest.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          ...healthyResponse,
          status: "degraded",
        }),
        { status: 200 },
      ),
    );

    const { result } = renderHook(() => useHealthCheck(60_000));

    await act(async () => {
      jest.runOnlyPendingTimers();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Status: degraded");
  });

  it("cleans up polling on unmount", async () => {
    jest.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(healthyResponse), {
        status: 200,
      }),
    );

    const { unmount } = renderHook(() => useHealthCheck(60_000));

    unmount();

    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    expect(fetch).not.toHaveBeenCalled();
  });
});
