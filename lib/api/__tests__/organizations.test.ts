/**
 * @jest-environment jsdom
 */

import {
  validateOrganizationName,
  validateOrganizationSlug,
  validateWebsiteUrl,
  formatOrganizationStatus,
  getStatusTone,
} from "../organizations";

describe("Organization Utilities", () => {
  describe("validateOrganizationName", () => {
    it("returns null for valid names", () => {
      expect(validateOrganizationName("Acme Corporation")).toBeNull();
      expect(validateOrganizationName("Tech Startup Inc.")).toBeNull();
      expect(validateOrganizationName("Λβ")).toBeNull(); // Unicode characters
    });

    it("requires non-empty name", () => {
      expect(validateOrganizationName("")).toBe("Organization name is required");
      expect(validateOrganizationName("   ")).toBe("Organization name is required");
    });

    it("requires minimum length", () => {
      expect(validateOrganizationName("A")).toBe("Organization name must be at least 2 characters");
    });

    it("enforces maximum length", () => {
      const longName = "a".repeat(101);
      expect(validateOrganizationName(longName)).toBe("Organization name must be less than 100 characters");
    });

    it("trims whitespace", () => {
      expect(validateOrganizationName("  Valid Org  ")).toBeNull();
    });
  });

  describe("validateOrganizationSlug", () => {
    it("returns null for valid slugs", () => {
      expect(validateOrganizationSlug("acme-corp")).toBeNull();
      expect(validateOrganizationSlug("tech-startup-2024")).toBeNull();
      expect(validateOrganizationSlug("simple123")).toBeNull();
    });

    it("requires non-empty slug", () => {
      expect(validateOrganizationSlug("")).toBe("Organization slug is required");
      expect(validateOrganizationSlug("   ")).toBe("Organization slug is required");
    });

    it("requires minimum length", () => {
      expect(validateOrganizationSlug("ab")).toBe("Slug must be at least 3 characters");
    });

    it("enforces maximum length", () => {
      const longSlug = "a".repeat(51);
      expect(validateOrganizationSlug(longSlug)).toBe("Slug must be less than 50 characters");
    });

    it("only allows valid characters", () => {
      expect(validateOrganizationSlug("invalid_slug")).toBe(
        "Slug can only contain lowercase letters, numbers, and hyphens"
      );
      expect(validateOrganizationSlug("Invalid-Slug")).toBe(
        "Slug can only contain lowercase letters, numbers, and hyphens"
      );
      expect(validateOrganizationSlug("slug@invalid")).toBe(
        "Slug can only contain lowercase letters, numbers, and hyphens"
      );
    });

    it("cannot start or end with hyphen", () => {
      expect(validateOrganizationSlug("-invalid")).toBe("Slug cannot start or end with a hyphen");
      expect(validateOrganizationSlug("invalid-")).toBe("Slug cannot start or end with a hyphen");
    });

    it("cannot contain consecutive hyphens", () => {
      expect(validateOrganizationSlug("invalid--slug")).toBe("Slug cannot contain consecutive hyphens");
    });

    it("trims whitespace", () => {
      expect(validateOrganizationSlug("  valid-slug  ")).toBeNull();
    });
  });

  describe("validateWebsiteUrl", () => {
    it("returns null for valid URLs", () => {
      expect(validateWebsiteUrl("https://example.com")).toBeNull();
      expect(validateWebsiteUrl("http://example.org")).toBeNull();
      expect(validateWebsiteUrl("https://subdomain.example.com/path")).toBeNull();
    });

    it("returns null for empty URL (optional field)", () => {
      expect(validateWebsiteUrl("")).toBeNull();
      expect(validateWebsiteUrl("   ")).toBeNull();
    });

    it("requires valid URL format", () => {
      expect(validateWebsiteUrl("not-a-url")).toBe("Please enter a valid website URL");
      expect(validateWebsiteUrl("invalid.url")).toBe("Please enter a valid website URL");
    });

    it("requires http or https protocol", () => {
      expect(validateWebsiteUrl("ftp://example.com")).toBe(
        "Website URL must use http or https protocol"
      );
      expect(validateWebsiteUrl("file://example.com")).toBe(
        "Website URL must use http or https protocol"
      );
    });
  });

  describe("formatOrganizationStatus", () => {
    it("formats status correctly", () => {
      expect(formatOrganizationStatus("ACTIVE")).toBe("Active");
      expect(formatOrganizationStatus("PENDING")).toBe("Pending");
      expect(formatOrganizationStatus("SUSPENDED")).toBe("Suspended");
      expect(formatOrganizationStatus("REVOKED")).toBe("Revoked");
      expect(formatOrganizationStatus("DELETED")).toBe("Deleted");
    });

    it("returns original value for unknown status", () => {
      expect(formatOrganizationStatus("UNKNOWN" as any)).toBe("UNKNOWN");
    });
  });

  describe("getStatusTone", () => {
    it("returns correct tones for status", () => {
      expect(getStatusTone("ACTIVE")).toBe("success");
      expect(getStatusTone("PENDING")).toBe("warning");
      expect(getStatusTone("SUSPENDED")).toBe("warning");
      expect(getStatusTone("REVOKED")).toBe("warning");
      expect(getStatusTone("DELETED")).toBe("warning");
    });

    it("returns accent for unknown status", () => {
      expect(getStatusTone("UNKNOWN" as any)).toBe("accent");
    });
  });
});