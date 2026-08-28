/**
 * @jest-environment jsdom
 */

import {
  validateIssuerName,
  formatIssuerStatus,
  getIssuerStatusTone,
} from "../issuers";

describe("Issuer Utilities", () => {
  describe("validateIssuerName", () => {
    it("returns null for valid names", () => {
      expect(validateIssuerName("Veridatum Labs")).toBeNull();
      expect(validateIssuerName("Stellar Community Fund")).toBeNull();
      expect(validateIssuerName("AB")).toBeNull(); // Minimum length
    });

    it("requires non-empty name", () => {
      expect(validateIssuerName("")).toBe("Issuer name is required");
      expect(validateIssuerName("   ")).toBe("Issuer name is required");
    });

    it("requires minimum length", () => {
      expect(validateIssuerName("A")).toBe("Issuer name must be at least 2 characters");
    });

    it("enforces maximum length", () => {
      const longName = "a".repeat(101);
      expect(validateIssuerName(longName)).toBe("Issuer name must be less than 100 characters");
    });

    it("trims whitespace", () => {
      expect(validateIssuerName("  Valid Issuer  ")).toBeNull();
    });
  });

  describe("formatIssuerStatus", () => {
    it("formats status correctly", () => {
      expect(formatIssuerStatus("ACTIVE")).toBe("Active");
      expect(formatIssuerStatus("PENDING")).toBe("Pending");
      expect(formatIssuerStatus("SUSPENDED")).toBe("Suspended");
      expect(formatIssuerStatus("REVOKED")).toBe("Revoked");
    });

    it("returns original value for unknown status", () => {
      expect(formatIssuerStatus("UNKNOWN" as any)).toBe("UNKNOWN");
    });
  });

  describe("getIssuerStatusTone", () => {
    it("returns correct tones for status", () => {
      expect(getIssuerStatusTone("ACTIVE")).toBe("success");
      expect(getIssuerStatusTone("PENDING")).toBe("warning");
      expect(getIssuerStatusTone("SUSPENDED")).toBe("warning");
      expect(getIssuerStatusTone("REVOKED")).toBe("warning");
    });

    it("returns accent for unknown status", () => {
      expect(getIssuerStatusTone("UNKNOWN" as any)).toBe("accent");
    });
  });
});