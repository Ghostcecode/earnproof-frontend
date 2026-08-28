/**
 * @jest-environment jsdom
 */

import {
  validateIntervalConfiguration,
  validatePeriodConfiguration,
  formatInterval,
  formatCoveragePercentage,
  getCoverageStatus,
  getCoverageStatusColor,
} from "../recurring-income-proofs";

describe("Recurring Income Proof Utilities", () => {
  describe("validateIntervalConfiguration", () => {
    it("returns null for valid configurations", () => {
      expect(validateIntervalConfiguration("MONTHLY", 1)).toBeNull();
      expect(validateIntervalConfiguration("WEEKLY", 2)).toBeNull();
      expect(validateIntervalConfiguration("DAILY", 7)).toBeNull();
    });

    it("requires interval unit", () => {
      expect(validateIntervalConfiguration(undefined, 1)).toBe("Interval unit is required");
    });

    it("requires interval count", () => {
      expect(validateIntervalConfiguration("MONTHLY", undefined)).toBe("Interval count must be at least 1");
      expect(validateIntervalConfiguration("MONTHLY", 0)).toBe("Interval count must be at least 1");
    });

    it("enforces maximum limits by unit", () => {
      expect(validateIntervalConfiguration("DAILY", 366)).toBe("daily interval count cannot exceed 365");
      expect(validateIntervalConfiguration("WEEKLY", 53)).toBe("weekly interval count cannot exceed 52");
      expect(validateIntervalConfiguration("MONTHLY", 13)).toBe("monthly interval count cannot exceed 12");
      expect(validateIntervalConfiguration("YEARLY", 6)).toBe("yearly interval count cannot exceed 5");
    });
  });

  describe("validatePeriodConfiguration", () => {
    it("returns null for valid periods", () => {
      expect(validatePeriodConfiguration("2026-01-01", "2026-12-31")).toBeNull();
      expect(validatePeriodConfiguration("2026-08-01", "2026-08-31", "MONTHLY", 1)).toBeNull();
    });

    it("requires period start", () => {
      expect(validatePeriodConfiguration(undefined, "2026-12-31")).toBe("Period start date is required");
    });

    it("requires period end", () => {
      expect(validatePeriodConfiguration("2026-01-01", undefined)).toBe("Period end date is required");
    });

    it("validates date format", () => {
      expect(validatePeriodConfiguration("invalid", "2026-12-31")).toBe("Invalid date format");
      expect(validatePeriodConfiguration("2026-01-01", "invalid")).toBe("Invalid date format");
    });

    it("requires end after start", () => {
      expect(validatePeriodConfiguration("2026-12-31", "2026-01-01")).toBe("Period end must be after period start");
      expect(validatePeriodConfiguration("2026-01-01", "2026-01-01")).toBe("Period end must be after period start");
    });

    it("validates minimum period duration", () => {
      // Daily interval should require at least 2 cycles (2 days minimum)
      expect(validatePeriodConfiguration("2026-01-01", "2026-01-02", "DAILY", 1))
        .toBe("Period must span at least 2 days for the selected interval");
      
      // Weekly interval should require at least 2 cycles (14 days minimum)  
      expect(validatePeriodConfiguration("2026-01-01", "2026-01-10", "WEEKLY", 1))
        .toBe("Period must span at least 14 days for the selected interval");
    });
  });

  describe("formatInterval", () => {
    it("formats singular intervals correctly", () => {
      expect(formatInterval("DAILY", 1)).toBe("dai");
      expect(formatInterval("WEEKLY", 1)).toBe("week");
      expect(formatInterval("MONTHLY", 1)).toBe("month");
      expect(formatInterval("YEARLY", 1)).toBe("year");
    });

    it("formats plural intervals correctly", () => {
      expect(formatInterval("DAILY", 2)).toBe("2 dais");
      expect(formatInterval("WEEKLY", 3)).toBe("3 weeks");
      expect(formatInterval("MONTHLY", 6)).toBe("6 months");
      expect(formatInterval("YEARLY", 2)).toBe("2 years");
    });
  });

  describe("formatCoveragePercentage", () => {
    it("formats percentages correctly", () => {
      expect(formatCoveragePercentage(100)).toBe("100%");
      expect(formatCoveragePercentage(85.5)).toBe("85.5%");
      expect(formatCoveragePercentage(0)).toBe("0%");
    });

    it("rounds to 2 decimal places", () => {
      expect(formatCoveragePercentage(85.555)).toBe("85.56%");
      expect(formatCoveragePercentage(85.554)).toBe("85.55%");
    });
  });

  describe("getCoverageStatus", () => {
    it("returns correct status for coverage levels", () => {
      expect(getCoverageStatus(100)).toBe("complete");
      expect(getCoverageStatus(95)).toBe("complete");
      expect(getCoverageStatus(85)).toBe("partial");
      expect(getCoverageStatus(80)).toBe("partial");
      expect(getCoverageStatus(75)).toBe("insufficient");
      expect(getCoverageStatus(0)).toBe("insufficient");
    });
  });

  describe("getCoverageStatusColor", () => {
    it("returns correct colors for status", () => {
      expect(getCoverageStatusColor("complete")).toBe("text-emerald-300");
      expect(getCoverageStatusColor("partial")).toBe("text-amber-300");
      expect(getCoverageStatusColor("insufficient")).toBe("text-rose-300");
    });

    it("returns default color for unknown status", () => {
      expect(getCoverageStatusColor("unknown" as any)).toBe("text-slate-300");
    });
  });
});