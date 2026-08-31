import {
  QR_MAX_PAYLOAD_BYTES,
  generateVerificationQrJson,
  generateVerificationQrPayload,
  isApprovedProofId,
  parseQrPayload,
  scanDiagnosticToLogLine,
  toScanDiagnostic,
} from "@/lib/validation/qr-payload";

const APP_URL = "https://earnproof.example";

describe("qr-payload validation", () => {
  describe("isApprovedProofId", () => {
    it("accepts valid proof identifiers", () => {
      expect(isApprovedProofId("proof-123")).toBe(true);
      expect(isApprovedProofId("EP-abc_123:xyz")).toBe(true);
    });

    it("rejects empty identifiers", () => {
      expect(isApprovedProofId("")).toBe(false);
    });

    it("rejects identifiers containing unsafe characters", () => {
      expect(isApprovedProofId("proof<script>")).toBe(false);
      expect(isApprovedProofId("proof id")).toBe(false);
    });

    it("rejects identifiers longer than the maximum", () => {
      expect(isApprovedProofId("a".repeat(65))).toBe(false);
    });
  });

  describe("generateVerificationQrPayload", () => {
    it("generates the approved verification URL", () => {
      expect(
        generateVerificationQrPayload({
          appUrl: APP_URL,
          proofId: "proof-123",
        }),
      ).toBe("https://earnproof.example/verify?proof=proof-123");
    });

    it("trims proof IDs", () => {
      expect(
        generateVerificationQrPayload({
          appUrl: APP_URL,
          proofId: "  proof-123  ",
        }),
      ).toContain("proof-123");
    });

    it("rejects invalid proof IDs", () => {
      expect(() =>
        generateVerificationQrPayload({
          appUrl: APP_URL,
          proofId: "javascript:alert(1)",
        }),
      ).toThrow();
    });
  });

  describe("generateVerificationQrJson", () => {
    it("generates a versioned JSON payload", () => {
      const result = JSON.parse(
        generateVerificationQrJson({
          appUrl: APP_URL,
          proofId: "proof-123",
        }),
      );

      expect(result).toEqual({
        v: 1,
        typ: "earnproof.verify",
        proof: "proof-123",
      });
    });
  });

  describe("parseQrPayload", () => {
    it("accepts a raw proof ID", () => {
      expect(parseQrPayload("proof-123", APP_URL)).toEqual({
        ok: true,
        format: "raw-id",
        version: 1,
        proofId: "proof-123",
        verifyPath: "/verify?proof=proof-123",
      });
    });

    it("accepts an approved verification URL", () => {
      expect(
        parseQrPayload(
          "https://earnproof.example/verify?proof=proof-123",
          APP_URL,
        ),
      ).toEqual({
        ok: true,
        format: "url",
        version: 1,
        proofId: "proof-123",
        verifyPath: "/verify?proof=proof-123",
      });
    });

    it("accepts the alternate verification route", () => {
      const result = parseQrPayload(
        "https://earnproof.example/verify/proof-123",
        APP_URL,
      );

      expect(result).toMatchObject({
        ok: true,
        format: "url",
        proofId: "proof-123",
      });
    });

    it("accepts valid JSON payloads", () => {
      const result = parseQrPayload(
        JSON.stringify({
          v: 1,
          typ: "earnproof.verify",
          proof: "proof-123",
        }),
        APP_URL,
      );

      expect(result).toMatchObject({
        ok: true,
        format: "json",
        proofId: "proof-123",
      });
    });

    it("rejects empty payloads", () => {
      expect(parseQrPayload("   ", APP_URL)).toEqual({
        ok: false,
        reason: "empty",
      });
    });

    it("rejects oversized payloads", () => {
      const payload = "a".repeat(QR_MAX_PAYLOAD_BYTES + 1);

      expect(parseQrPayload(payload, APP_URL)).toEqual({
        ok: false,
        reason: "oversized",
      });
    });

    it.each([
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "file:///etc/passwd",
      "blob:https://earnproof.example/test",
      "vbscript:msgbox(1)",
      "about:blank",
    ])("rejects unsafe scheme %s", (payload) => {
      expect(parseQrPayload(payload, APP_URL)).toEqual({
        ok: false,
        reason: "unsafe-scheme",
      });
    });

    it("rejects a different origin", () => {
      expect(
        parseQrPayload(
          "https://evil.example/verify?proof=proof-123",
          APP_URL,
        ),
      ).toEqual({
        ok: false,
        reason: "origin-mismatch",
      });
    });

    it("rejects unapproved routes", () => {
      expect(
        parseQrPayload(
          "https://earnproof.example/admin?proof=proof-123",
          APP_URL,
        ),
      ).toEqual({
        ok: false,
        reason: "route-mismatch",
      });
    });

    it("rejects malformed JSON", () => {
      expect(
        parseQrPayload(
          '{"v":1,"typ":"earnproof.verify","proof":',
          APP_URL,
        ),
      ).toEqual({
        ok: false,
        reason: "malformed",
      });
    });

    it("rejects unsupported JSON versions", () => {
      expect(
        parseQrPayload(
          JSON.stringify({
            v: 99,
            typ: "earnproof.verify",
            proof: "proof-123",
          }),
          APP_URL,
        ),
      ).toEqual({
        ok: false,
        reason: "unsupported-version",
      });
    });

    it("rejects malicious proof IDs", () => {
      expect(
        parseQrPayload(
          JSON.stringify({
            v: 1,
            typ: "earnproof.verify",
            proof: "javascript:alert(1)",
          }),
          APP_URL,
        ),
      ).toEqual({
        ok: false,
        reason: "invalid-proof-id",
      });
    });
  });

  describe("privacy-safe diagnostics", () => {
    it("does not include the scanned body or proof ID", () => {
      const diagnostic = toScanDiagnostic({
        outcome: "accepted",
        format: "url",
        payloadBytes: 42,
      });

      const line = scanDiagnosticToLogLine(diagnostic);

      expect(line).not.toContain("proof-123");
      expect(line).not.toContain("earnproof.example");
      expect(JSON.parse(line)).toEqual(diagnostic);
    });
  });
});
