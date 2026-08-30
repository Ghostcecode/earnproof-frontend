import {
  allowedOriginsFromEnv,
  toSafeExternalHref,
} from "@/lib/validation/external-url";

const options = {
  allowedOrigins: ["https://earnproof.example"],
};

describe("external URL validation", () => {
  it("accepts an allowed HTTPS URL", () => {
    expect(
      toSafeExternalHref(
        "https://earnproof.example/verify?proof=123",
        options,
      ),
    ).toEqual({
      ok: true,
      href: "https://earnproof.example/verify?proof=123",
      origin: "https://earnproof.example",
      rel: "noopener noreferrer",
    });
  });

  it("trims surrounding whitespace", () => {
    const result = toSafeExternalHref(
      "  https://earnproof.example/verify  ",
      options,
    );

    expect(result).toMatchObject({
      ok: true,
      origin: "https://earnproof.example",
    });
  });

  it.each([
    "javascript:alert(document.cookie)",
    "data:text/html,<script>alert(1)</script>",
    "file:///etc/passwd",
    "blob:https://earnproof.example/test",
    "vbscript:msgbox(1)",
    "about:blank",
  ])("blocks dangerous scheme: %s", (url) => {
    expect(toSafeExternalHref(url, options)).toMatchObject({
      ok: false,
      reason: "blocked-scheme",
    });
  });

  it("rejects malformed URLs", () => {
    expect(
      toSafeExternalHref("not a url", options),
    ).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("rejects non-HTTP protocols", () => {
    expect(
      toSafeExternalHref("ftp://earnproof.example/file", options),
    ).toEqual({
      ok: false,
      reason: "non-http",
    });
  });

  it("rejects an untrusted origin", () => {
    expect(
      toSafeExternalHref(
        "https://evil.example/verify",
        options,
      ),
    ).toEqual({
      ok: false,
      reason: "untrusted-origin",
    });
  });

  it("supports an explicit HTTPS-only policy", () => {
    expect(
      toSafeExternalHref(
        "http://earnproof.example/verify",
        {
          ...options,
          requireHttps: true,
        },
      ),
    ).toEqual({
      ok: false,
      reason: "non-http",
    });
  });

  it("normalizes configured origins", () => {
    expect(
      toSafeExternalHref(
        "https://earnproof.example/path",
        {
          allowedOrigins: ["https://earnproof.example/some/path"],
        },
      ),
    ).toMatchObject({
      ok: true,
      origin: "https://earnproof.example",
    });
  });

  it("filters undefined environment values", () => {
    expect(
      allowedOriginsFromEnv([
        undefined,
        "https://earnproof.example",
        undefined,
      ]),
    ).toEqual(["https://earnproof.example"]);
  });
});
