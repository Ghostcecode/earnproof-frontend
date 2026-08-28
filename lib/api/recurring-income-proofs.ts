import { apiClient, bearer, retryMutation } from "./client";

export type IntervalUnit = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export type CreateRecurringIncomeProofRequest = {
  selectedPaymentIds: string[];
  intervalUnit: IntervalUnit;
  intervalCount: number;
  periodStart: string; // ISO date
  periodEnd: string; // ISO date
  assetCode: string;
  assetIssuer?: string;
  expiresInDays?: number;
};

export type RecurringIncomeProof = {
  proofId: string;
  status: string;
  verificationUrl: string;
  credential: {
    id: string;
    type: string;
    schemaVersion: string;
    subject: {
      walletHash: string;
    };
    claim: {
      intervalUnit: IntervalUnit;
      intervalCount: number;
      periodStart: string;
      periodEnd: string;
      assetCode: string;
      assetIssuer?: string | null;
      qualifyingPaymentCount: number;
      totalIntervals: number;
      coveredIntervals: number;
    };
    privacy: {
      exactIncomeHidden: boolean;
      sourceTransactionsHidden: boolean;
    };
    issuedAt: string;
    expiresAt: string;
    proof: {
      type: string;
      credentialHash: string;
      signature: string;
    };
  };
};

export type IntervalCoverageAnalysis = {
  totalIntervals: number;
  coveredIntervals: number;
  gappedIntervals: number;
  coverage: number; // percentage 0-100
  intervals: Array<{
    start: string;
    end: string;
    covered: boolean;
    paymentCount: number;
  }>;
};

export async function createRecurringIncomeProof(
  token: string,
  request: CreateRecurringIncomeProofRequest,
  signal: AbortSignal
): Promise<RecurringIncomeProof> {
  return retryMutation(async (signal) => {
    return apiClient<RecurringIncomeProof>({
      path: "/proofs/recurring-income",
      method: "POST",
      headers: bearer(token),
      body: JSON.stringify(request),
      signal,
    });
  }, signal);
}

export async function analyzeIntervalCoverage(
  token: string,
  request: {
    paymentIds: string[];
    intervalUnit: IntervalUnit;
    intervalCount: number;
    periodStart: string;
    periodEnd: string;
  },
  signal: AbortSignal
): Promise<IntervalCoverageAnalysis> {
  return retryMutation(async (signal) => {
    return apiClient<IntervalCoverageAnalysis>({
      path: "/proofs/recurring-income/analyze-coverage",
      method: "POST",
      headers: bearer(token),
      body: JSON.stringify(request),
      signal,
    });
  }, signal);
}

export const SUPPORTED_INTERVAL_UNITS: Array<{ value: IntervalUnit; label: string; description: string }> = [
  { value: "DAILY", label: "Daily", description: "Payments every day(s)" },
  { value: "WEEKLY", label: "Weekly", description: "Payments every week(s)" },
  { value: "MONTHLY", label: "Monthly", description: "Payments every month(s)" },
  { value: "YEARLY", label: "Yearly", description: "Payments every year(s)" },
];

export function validateIntervalConfiguration(
  unit: IntervalUnit | undefined,
  count: number | undefined
): string | null {
  if (!unit) {
    return "Interval unit is required";
  }

  if (!count || count < 1) {
    return "Interval count must be at least 1";
  }

  // Validate reasonable limits for each unit
  const limits = {
    DAILY: { min: 1, max: 365 },
    WEEKLY: { min: 1, max: 52 },
    MONTHLY: { min: 1, max: 12 },
    YEARLY: { min: 1, max: 5 },
  };

  const limit = limits[unit];
  if (count > limit.max) {
    return `${unit.toLowerCase()} interval count cannot exceed ${limit.max}`;
  }

  return null;
}

export function validatePeriodConfiguration(
  periodStart: string | undefined,
  periodEnd: string | undefined,
  intervalUnit?: IntervalUnit,
  intervalCount?: number
): string | null {
  if (!periodStart) {
    return "Period start date is required";
  }

  if (!periodEnd) {
    return "Period end date is required";
  }

  const start = new Date(periodStart);
  const end = new Date(periodEnd);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return "Invalid date format";
  }

  if (start >= end) {
    return "Period end must be after period start";
  }

  // Validate minimum period duration based on interval
  if (intervalUnit && intervalCount) {
    const minDurationDays = getMinimumPeriodDays(intervalUnit, intervalCount);
    const actualDurationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (actualDurationDays < minDurationDays) {
      return `Period must span at least ${minDurationDays} days for the selected interval`;
    }
  }

  return null;
}

function getMinimumPeriodDays(unit: IntervalUnit, count: number): number {
  switch (unit) {
    case "DAILY":
      return count * 2; // At least 2 cycles
    case "WEEKLY":
      return count * 7 * 2; // At least 2 cycles
    case "MONTHLY":
      return count * 30 * 2; // Approximate 2 cycles
    case "YEARLY":
      return count * 365 * 2; // At least 2 cycles
    default:
      return 30;
  }
}

export function formatInterval(unit: IntervalUnit, count: number): string {
  const unitLabel = SUPPORTED_INTERVAL_UNITS.find(u => u.value === unit)?.label.toLowerCase() || unit.toLowerCase();
  
  if (count === 1) {
    return unitLabel.slice(0, -2); // Remove 'ly' suffix for singular
  }
  
  return `${count} ${unitLabel.slice(0, -2)}${count > 1 ? 's' : ''}`;
}

export function formatCoveragePercentage(coverage: number): string {
  return `${Math.round(coverage * 100) / 100}%`;
}

export function getCoverageStatus(coverage: number): "complete" | "partial" | "insufficient" {
  if (coverage >= 100) return "complete";
  if (coverage >= 80) return "partial";
  return "insufficient";
}

export function getCoverageStatusColor(status: "complete" | "partial" | "insufficient"): string {
  switch (status) {
    case "complete":
      return "text-emerald-300";
    case "partial":
      return "text-amber-300";
    case "insufficient":
      return "text-rose-300";
    default:
      return "text-slate-300";
  }
}