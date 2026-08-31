import {
  allowedOriginsFromEnv,
  toSafeExternalHref,
} from "@/lib/validation/external-url";

describe("toSafeExternalHref", () => {
  const allowedOrigins = [
    "https://earnproof.app",
    "https://stellar.expert",
  ];

  it("allows trusted HTTPS URLs", () => {
    const result = toSafeExternalHref(
      "https://stellar.expert/explorer/public/account/GABC",
      {
        allowedOrigins,
        requireHttps: true,
      },
    );

    expect(result).toEqual({
      ok: true,
      href: "https://stellar.expert/explorer/public/account/GABC",
      origin: "https://stellar.expert",
      rel: "noopener noreferrer",
    });
  });

  it.each([
    "javascript:alert(document.domain)",
    "javascript%3Aalert(1)",
    "data:text/html,<script>alert(1)</script>",
    "file:///etc/passwd",
    "blob:https://earnproof.app/test",
    "vbscript:msgbox(1)",
    "about:blank",
  ])("blocks dangerous URL: %s", (payload) => {
    const result = toSafeExternalHref(payload, {
      allowedOrigins,
      requireHttps: true,
    });

    expect(result.ok).toBe(false);
  });

  it("rejects untrusted origins", () => {
    const result = toSafeExternalHref(
      "https://attacker.example/phishing",
      {
        allowedOrigins,
        requireHttps: true,
      },
    );

    expect(result).toEqual({
      ok: false,
      reason: "untrusted-origin",
    });
  });

  it("rejects HTTP when HTTPS is required", () => {
    const result = toSafeExternalHref(
      "http://stellar.expert/explorer",
      {
        allowedOrigins,
        requireHttps: true,
      },
    );

    expect(result).toEqual({
      ok: false,
      reason: "non-http",
    });
  });

  it("trims harmless surrounding whitespace", () => {
    const result = toSafeExternalHref(
      "  https://stellar.expert/explorer  ",
      {
        allowedOrigins,
        requireHttps: true,
      },
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.href).toBe(
        "https://stellar.expert/explorer",
      );
    }
  });

  it("handles malformed URLs without throwing", () => {
    expect(() =>
      toSafeExternalHref("not a url", {
        allowedOrigins,
        requireHttps: true,
      }),
    ).not.toThrow();

    expect(
      toSafeExternalHref("not a url", {
        allowedOrigins,
        requireHttps: true,
      }),
    ).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("returns safe external-link opener attributes", () => {
    const result = toSafeExternalHref(
      "https://stellar.expert/explorer",
      {
        allowedOrigins,
        requireHttps: true,
      },
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.rel).toBe("noopener noreferrer");
    }
  });
});

describe("allowedOriginsFromEnv", () => {
  it("removes undefined values", () => {
    expect(
      allowedOriginsFromEnv([
        "https://earnproof.app",
        undefined,
        "https://stellar.expert",
      ]),
    ).toEqual([
      "https://earnproof.app",
      "https://stellar.expert",
    ]);
  });
});
