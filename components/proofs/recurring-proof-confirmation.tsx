"use client";

import { formatInterval, getCoverageStatus, getCoverageStatusColor, formatCoveragePercentage, type IntervalUnit, type IntervalCoverageAnalysis } from "@/lib/api/recurring-income-proofs";

type Asset = {
  code: string;
  issuer: string | null;
};

export function RecurringProofConfirmation({
  intervalUnit,
  intervalCount,
  periodStart,
  periodEnd,
  selectedAsset,
  selectedPaymentCount,
  coverageAnalysis,
  expiresInDays,
  onExpiresInDaysChange,
  onCreateProof,
  loading,
}: {
  intervalUnit: IntervalUnit;
  intervalCount: number;
  periodStart: string;
  periodEnd: string;
  selectedAsset: Asset | null;
  selectedPaymentCount: number;
  coverageAnalysis: IntervalCoverageAnalysis | null;
  expiresInDays: number;
  onExpiresInDaysChange: (days: number) => void;
  onCreateProof: () => void;
  loading: boolean;
}) {
  const coverageStatus = coverageAnalysis ? getCoverageStatus(coverageAnalysis.coverage) : null;
  const canCreateProof = selectedAsset && selectedPaymentCount > 0 && coverageAnalysis;

  return (
    <section className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <div>
        <h2 className="text-xl font-semibold text-white">Create Proof</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Review your configuration and create the recurring income proof.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="rounded-lg border border-cyan-300/30 bg-cyan-300/5 p-4">
          <h3 className="text-lg font-semibold text-white">Proof Summary</h3>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-400">Recurring Pattern:</dt>
              <dd className="text-slate-200">Every {formatInterval(intervalUnit, intervalCount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Time Period:</dt>
              <dd className="text-slate-200">
                {new Date(periodStart).toLocaleDateString()} - {new Date(periodEnd).toLocaleDateString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Asset:</dt>
              <dd className="text-slate-200">
                {selectedAsset?.code} {selectedAsset?.issuer ? `(${selectedAsset.issuer.slice(0, 8)}...)` : '(Native)'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Selected Payments:</dt>
              <dd className="text-slate-200">{selectedPaymentCount}</dd>
            </div>
            {coverageAnalysis && (
              <div className="flex justify-between">
                <dt className="text-slate-400">Coverage:</dt>
                <dd className={`font-semibold ${getCoverageStatusColor(coverageStatus!)}`}>
                  {formatCoveragePercentage(coverageAnalysis.coverage)}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div>
          <label htmlFor="expires-days" className="block text-sm font-medium text-slate-200">
            Proof Validity (Days)
          </label>
          <input
            id="expires-days"
            type="number"
            min="1"
            max="365"
            className="mt-1 h-11 w-32 rounded-md border border-white/10 bg-slate-900 px-4 text-white"
            value={expiresInDays}
            onChange={(e) => onExpiresInDaysChange(parseInt(e.target.value) || 90)}
          />
          <p className="mt-1 text-xs text-slate-400">
            How long the proof should remain valid (1-365 days)
          </p>
        </div>

        {coverageStatus === "insufficient" && (
          <div className="rounded-md border border-rose-300/30 bg-rose-300/10 p-3">
            <div className="flex items-start gap-2">
              <svg className="h-4 w-4 text-rose-100 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <h4 className="text-sm font-semibold text-rose-100">Low Coverage Warning</h4>
                <p className="mt-1 text-xs text-rose-200">
                  Your payment coverage is below the recommended threshold. The proof may be created but might not be as convincing to verifiers.
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onCreateProof}
          disabled={!canCreateProof || loading}
          className="h-12 w-fit rounded-md bg-cyan-300 px-6 text-sm font-semibold text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-200 transition"
        >
          {loading ? "Creating Proof..." : "Create Recurring Income Proof"}
        </button>
      </div>
    </section>
  );
}