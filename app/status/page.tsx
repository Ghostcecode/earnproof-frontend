"use client";

import { DataPanel, MetricGrid, StatusBadge, pageContainer } from "@/components/common/production-ui";
import { PageHeading } from "@/components/common/page-heading";
import { PublicShell } from "@/components/layout/public-shell";
import { StatusCheckSkeleton } from "@/components/common/skeleton/status-check-skeleton";
import { useHealthCheck } from "@/lib/health-check";

type StatusRow = {
  primary: string;
  secondary: string;
  tertiary: string;
  status: string;
  tone?: "success" | "warning";
};

function deriveStatusRow(
  label: string,
  region: string,
  value: string | null,
): StatusRow {
  if (value === null) {
    return {
      primary: label,
      secondary: region,
      tertiary: "Unknown",
      status: "Unknown",
      tone: "warning",
    };
  }
  const ok = value === "ok";
  return {
    primary: label,
    secondary: region,
    tertiary: "Just now",
    status: ok ? "Active" : "Error",
    tone: ok ? undefined : "warning",
  };
}

function formatRelative(date: Date | null): string {
  if (!date) return "Never";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
}

export default function StatusPage() {
  const {
    data,
    loading,
    error,
    lastChecked,
    lastUpdated,
    refetch,
  } = useHealthCheck();

  const isOperational =
    data !== null &&
    data.status === "ok" &&
    data.database === "ok" &&
    !error;

  const httpStatus = deriveStatusRow(
    "EarnProof API",
    "Global",
    data?.status ?? null,
  );

  const dbStatus = deriveStatusRow(
    "Database",
    "Global",
    data?.database ?? null,
  );

  const stellarStatus: StatusRow = {
    primary: "Stellar indexer",
    secondary: "Testnet",
    tertiary: data?.timestamp ? "Last seen" : "Unknown",
    status: data?.timestamp ? "Active" : "Unknown",
    tone: data?.timestamp ? undefined : "warning",
  };

  const contractsStatus: StatusRow = {
    primary: "Smart contracts",
    secondary: "Testnet",
    tertiary: "Unknown",
    status: "Unknown",
    tone: "warning",
  };

  const webhooksStatus: StatusRow = {
    primary: "Webhook delivery",
    secondary: "Global",
    tertiary: "Unknown",
    status: "Unknown",
    tone: "warning",
  };

  const allRows: StatusRow[] = [
    httpStatus,
    dbStatus,
    stellarStatus,
    contractsStatus,
    webhooksStatus,
  ];

  const activeCount = allRows.filter(
    (r) => r.status === "Active",
  ).length;
  const totalCount = allRows.length;

  const metricValue = loading && !data
    ? "..."
    : `${activeCount}/${totalCount}`;

  return (
    <PublicShell>
      <div className={pageContainer}>
        <PageHeading
          title="System status"
          description="Live health for the EarnProof API, indexer, Stellar providers, contracts, and webhooks."
        />

        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-300/30 bg-amber-300/10 px-4 py-3">
            <StatusBadge tone="warning">
              {error === "Request timed out" ? "Timeout" : "Unreachable"}
            </StatusBadge>
            <span className="text-sm text-slate-300">{error}</span>
            <button
              className="ml-auto rounded-lg border border-white/15 px-3 py-1 text-sm font-medium transition hover:bg-white/10"
              onClick={refetch}
              type="button"
            >
              Retry
            </button>
          </div>
        )}

        {loading && !data ? (
          <StatusCheckSkeleton rows={allRows.length} />
        ) : (
          <>
            <MetricGrid
              items={[
                { value: metricValue, label: "Services online" },
                {
                  value: isOperational ? "0" : data ? "1" : "...",
                  label: "Open incidents",
                },
                {
                  value: isOperational ? "Up" : data ? "Degraded" : "...",
                  label: "API status",
                },
              ]}
            />

            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span>Last checked: {formatRelative(lastChecked)}</span>
              {lastUpdated && (
                <span>
                  API timestamp:{" "}
                  {new Date(data?.timestamp ?? lastUpdated).toLocaleTimeString()}
                </span>
              )}
            </div>

            <DataPanel
              headers={["Service", "Region", "Checked", "Status"]}
              rows={allRows}
              searchPlaceholder="Search services"
            />
          </>
        )}
      </div>
    </PublicShell>
  );
}
