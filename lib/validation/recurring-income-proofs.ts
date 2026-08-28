import { z } from "zod";
import type { IntervalUnit } from "@/lib/api/recurring-income-proofs";

export const intervalUnitSchema = z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);

export const createRecurringIncomeProofSchema = z.object({
  selectedPaymentIds: z
    .array(z.string())
    .min(1, "At least one payment must be selected"),
  intervalUnit: intervalUnitSchema,
  intervalCount: z
    .number()
    .int()
    .min(1, "Interval count must be at least 1"),
  periodStart: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), "Invalid start date"),
  periodEnd: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), "Invalid end date"),
  assetCode: z
    .string()
    .min(1, "Asset code is required"),
  assetIssuer: z
    .string()
    .optional(),
  expiresInDays: z
    .number()
    .int()
    .min(1, "Expiry must be at least 1 day")
    .max(365, "Expiry cannot exceed 365 days")
    .optional(),
}).refine(
  (data) => {
    const start = new Date(data.periodStart);
    const end = new Date(data.periodEnd);
    return start < end;
  },
  {
    message: "Period end must be after period start",
    path: ["periodEnd"],
  }
).refine(
  (data) => {
    // Validate interval count limits by unit
    const limits: Record<IntervalUnit, number> = {
      DAILY: 365,
      WEEKLY: 52,
      MONTHLY: 12,
      YEARLY: 5,
    };
    return data.intervalCount <= limits[data.intervalUnit];
  },
  {
    message: "Interval count exceeds maximum for the selected unit",
    path: ["intervalCount"],
  }
);

export type CreateRecurringIncomeProofInput = z.infer<typeof createRecurringIncomeProofSchema>;

export const WIZARD_STEPS = {
  INTERVAL_CONFIG: "interval-config",
  PERIOD_CONFIG: "period-config", 
  PAYMENT_SELECTION: "payment-selection",
  COVERAGE_ANALYSIS: "coverage-analysis",
  CONFIRMATION: "confirmation",
} as const;

export type WizardStep = typeof WIZARD_STEPS[keyof typeof WIZARD_STEPS];

export const STEP_LABELS: Record<WizardStep, string> = {
  [WIZARD_STEPS.INTERVAL_CONFIG]: "Interval Configuration",
  [WIZARD_STEPS.PERIOD_CONFIG]: "Period Configuration",
  [WIZARD_STEPS.PAYMENT_SELECTION]: "Payment Selection",
  [WIZARD_STEPS.COVERAGE_ANALYSIS]: "Coverage Analysis",
  [WIZARD_STEPS.CONFIRMATION]: "Confirmation",
};

export const DEFAULT_VALUES = {
  intervalUnit: "MONTHLY" as IntervalUnit,
  intervalCount: 1,
  expiresInDays: 90,
} as const;