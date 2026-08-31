import { apiClient } from "@/lib/api/client";

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true }),
  });
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe("apiClient cache policy", () => {
  it("opts every request out of Next's fetch cache", async () => {
    await apiClient({ path: "/proofs/EP-1/verify" });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.cache).toBe("no-store");
  });

  it("sends an explicit no-store Cache-Control request header", async () => {
    await apiClient({ path: "/payments" });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers["Cache-Control"]).toBe("no-store");
  });

  it("keeps no-store even when the caller passes its own headers", async () => {
    await apiClient({
      path: "/auth/verify",
      method: "POST",
      headers: { Authorization: "Bearer test-token" },
    });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers["Cache-Control"]).toBe("no-store");
    expect(init.headers.Authorization).toBe("Bearer test-token");
  });

  it("does not let a caller override no-store by passing its own cache mode", async () => {
    await apiClient({
      path: "/payments",
      cache: "force-cache",
    });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.cache).toBe("no-store");
  });
});
