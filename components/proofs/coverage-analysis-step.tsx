"use client";

import { formatInterval, getCoverageStatus, getCoverageStatusColor, formatCoveragePercentage, type IntervalUnit, type IntervalCoverageAnalysis } from "@/lib/api/recurring-income-proofs";

export function CoverageAnalysisStep({
  intervalUnit,
  intervalCount,
  periodStart,
  periodEnd,
  selectedPaymentIds,
  coverageAnalysis,
  onAnalyzeCoverage,
  loading,
}: {
  intervalUnit: IntervalUnit;
  intervalCount: number;
  periodStart: string;
  periodEnd: string;
  selectedPaymentIds: string[];
  coverageAnalysis: IntervalCoverageAnalysis | null;
  onAnalyzeCoverage: () => void;
  loading: boolean;
}) {
  const canAnalyze = selectedPaymentIds.length > 0;
  const coverageStatus = coverageAnalysis ? getCoverageStatus(coverageAnalysis.coverage) : null;

  return (
    <section className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <div>
        <h2 className="text-xl font-semibold text-white">Coverage Analysis</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Analyze how well your selected payments cover the expected recurring intervals.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="rounded-lg border border-cyan-300/50 bg-cyan-300/5 p-4">
          <h3 className="text-sm font-semibold text-cyan-100">Configuration Summary</h3>
          <div className="mt-2 grid gap-1 text-sm text-cyan-200">
            <div><strong>Interval:</strong> Every {formatInterval(intervalUnit, intervalCount)}</div>
            <div><strong>Period:</strong> {new Date(periodStart).toLocaleDateString()} - {new Date(periodEnd).toLocaleDateString()}</div>
            <div><strong>Selected Payments:</strong> {selectedPaymentIds.length}</div>
          </div>
        </div>

        {!coverageAnalysis ? (
          <div className="text-center">
            <button
              onClick={onAnalyzeCoverage}
              disabled={!canAnalyze || loading}
              className="h-12 rounded-md bg-cyan-300 px-6 text-sm font-semibold text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-200 transition"
            >
              {loading ? "Analyzing Coverage..." : "Analyze Coverage"}
            </button>
            {!canAnalyze && (
              <p className="mt-2 text-xs text-slate-400">
                Select payments in the previous step to analyze coverage
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="rounded-lg border border-white/10 bg-slate-950 p-4">
              <h3 className="text-lg font-semibold text-white">Coverage Results</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getCoverageStatusColor(coverageStatus!)}`}>
                    {formatCoveragePercentage(coverageAnalysis.coverage)}
                  </div>
                  <div className="text-xs text-slate-400">Coverage</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-300">
                    {coverageAnalysis.coveredIntervals}
                  </div>
                  <div className="text-xs text-slate-400">Covered Intervals</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-300">
                    {coverageAnalysis.totalIntervals}
                  </div>
                  <div className="text-xs text-slate-400">Total Intervals</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300">Interval Coverage</span>
                  <span className="text-sm text-slate-400">
                    {coverageAnalysis.gappedIntervals} gaps
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      coverageStatus === "complete" ? "bg-emerald-500" :
                      coverageStatus === "partial" ? "bg-amber-500" :
                      "bg-rose-500"
                    }`}
                    style={{ width: `${Math.min(100, coverageAnalysis.coverage)}%` }}
                  />
                </div>
              </div>

              <div className={`mt-4 p-3 rounded-md border ${
                coverageStatus === "complete" 
                  ? "border-emerald-300/30 bg-emerald-300/10" :
                coverageStatus === "partial"
                  ? "border-amber-300/30 bg-amber-300/10" :
                  "border-rose-300/30 bg-rose-300/10"
              }`}>
                <div className="flex items-start gap-2">
                  <div className={`mt-0.5 ${getCoverageStatusColor(coverageStatus!)}`}>
                    {coverageStatus === "complete" ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h4 className={`text-sm font-semibold ${
                      coverageStatus === "complete" ? "text-emerald-100" :
                      coverageStatus === "partial" ? "text-amber-100" :
                      "text-rose-100"
                    }`}>
                      {coverageStatus === "complete" && "Excellent Coverage"}
                      {coverageStatus === "partial" && "Partial Coverage"}
                      {coverageStatus === "insufficient" && "Insufficient Coverage"}
                    </h4>
                    <p className={`mt-1 text-xs ${
                      coverageStatus === "complete" ? "text-emerald-200" :
                      coverageStatus === "partial" ? "text-amber-200" :
                      "text-rose-200"
                    }`}>
                      {coverageStatus === "complete" && 
                        "Your payments demonstrate consistent recurring income that meets or exceeds the expected pattern."}
                      {coverageStatus === "partial" && 
                        "Your payments show a recurring pattern but with some gaps. This may still be acceptable for proof creation."}
                      {coverageStatus === "insufficient" && 
                        "Your payments have significant gaps in the recurring pattern. Consider adjusting the interval or selecting additional payments."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onAnalyzeCoverage}
              disabled={loading}
              className="h-10 w-fit rounded-md border border-white/15 px-4 text-xs font-semibold text-white disabled:opacity-50 hover:bg-white/5 transition"
            >
              {loading ? "Re-analyzing..." : "Re-analyze Coverage"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}