"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeading } from "@/components/common/page-heading";
import { pageContainer } from "@/components/common/production-ui";
import { PublicShell } from "@/components/layout/public-shell";
import { apiClient } from "@/lib/api/client";
import type { VerifyProofResponse } from "@/lib/api/generated/v1";

type VerificationState = {
  loading: boolean;
  result: VerifyProofResponse | null;
  error: string | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function ResultItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase text-slate-400">{label}</dt>
      <dd className="mt-1 break-words text-slate-100">{value}</dd>
    </div>
  );
}

const statusStyles: Record<VerifyProofResponse["status"], { bg: string; text: string; border: string }> = {
  valid: {
    bg: "bg-emerald-300/10",
    text: "text-emerald-100",
    border: "border-emerald-300/30"
  },
  expired: {
    bg: "bg-amber-300/10", 
    text: "text-amber-100",
    border: "border-amber-300/30"
  },
  revoked: {
    bg: "bg-rose-300/10",
    text: "text-rose-100", 
    border: "border-rose-300/30"
  },
  unknown: {
    bg: "bg-slate-300/10",
    text: "text-slate-100",
    border: "border-slate-300/20"
  },
  invalid: {
    bg: "bg-rose-300/10",
    text: "text-rose-100",
    border: "border-rose-300/30"
  }
};

function getStatusMessage(result: VerifyProofResponse["result"]): string {
  switch (result) {
    case "VALID":
      return "This proof has been successfully verified and is currently valid.";
    case "EXPIRED":
      return "This proof has expired and is no longer valid for verification.";
    case "REVOKED": 
      return "This proof has been revoked and is no longer valid.";
    case "INVALID_SIGNATURE":
      return "The cryptographic signature for this proof is invalid.";
    case "UNKNOWN_PROOF":
      return "No matching proof was found for this identifier.";
    case "UNVERIFIED_ISSUER":
      return "The issuer of this proof could not be verified.";
    default:
      return "The verification status could not be determined.";
  }
}

function LoadingState() {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-8">
      <div className="flex items-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-cyan-300 border-t-transparent"></div>
        <span className="text-slate-300">Verifying proof...</span>
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-rose-300/30 bg-rose-300/10 p-6">
      <h3 className="text-lg font-semibold text-rose-100 mb-3">Verification failed</h3>
      <p className="text-sm text-slate-300 mb-4">{error}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onRetry}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-cyan-300/30 bg-cyan-300 px-6 text-sm font-medium text-slate-950 transition hover:bg-cyan-200"
        >
          Try again
        </button>
        <Link
          href="/status"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-white/15 px-6 text-sm font-medium text-white transition hover:bg-white/10"
        >
          Check system status
        </Link>
      </div>
    </div>
  );
}

function VerificationResult({ result }: { result: VerifyProofResponse }) {
  const statusStyle = statusStyles[result.status];

  return (
    <div className="space-y-6">
      <div className={`inline-flex rounded-md border px-4 py-2 text-sm font-semibold uppercase ${statusStyle.border} ${statusStyle.bg} ${statusStyle.text}`}>
        {result.status}
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
        <p className="text-sm leading-6 text-slate-300 mb-4">
          {getStatusMessage(result.result)}
        </p>

        {result.credential && result.proof ? (
          <dl className="grid gap-4 text-sm text-slate-300 sm:grid-cols-2">
            <ResultItem label="Proof ID" value={result.proof.id} />
            <ResultItem label="Network" value={result.proof.network} />
            <ResultItem
              label="Claim type"
              value="Minimum income verification"
            />
            <ResultItem
              label="Threshold"
              value={`≥ ${result.credential.claim.thresholdAmount} ${result.credential.claim.assetCode}`}
            />
            <ResultItem
              label="Qualifying payments"
              value={String(result.credential.claim.qualifyingPaymentCount)}
            />
            <ResultItem
              label="Verification period"
              value={`${formatDate(result.credential.claim.periodStart)} to ${formatDate(result.credential.claim.periodEnd)}`}
            />
            <ResultItem 
              label="Issued" 
              value={formatDate(result.credential.issuedAt)} 
            />
            <ResultItem 
              label="Expires" 
              value={formatDate(result.credential.expiresAt)} 
            />
            {result.proof.revokedAt && (
              <ResultItem 
                label="Revoked" 
                value={formatDate(result.proof.revokedAt)} 
              />
            )}
            <ResultItem
              label="Wallet hash"
              value={`${result.credential.subject.walletHash.substring(0, 16)}...`}
            />
          </dl>
        ) : (
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold text-white mb-2">No proof details available</h3>
            <p className="text-sm text-slate-300">
              The proof identifier was not found or the credential details are not accessible.
            </p>
          </div>
        )}
      </div>

      {result.credential?.privacy && (
        <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/5 p-4">
          <h3 className="text-sm font-semibold text-cyan-200 mb-2">Privacy notice</h3>
          <ul className="space-y-1 text-xs text-slate-300">
            {result.credential.privacy.exactIncomeHidden && (
              <li className="flex items-start gap-2">
                <span className="text-cyan-300 mt-0.5">•</span>
                <span>Exact income amounts are hidden to protect financial privacy</span>
              </li>
            )}
            {result.credential.privacy.sourceTransactionsHidden && (
              <li className="flex items-start gap-2">
                <span className="text-cyan-300 mt-0.5">•</span>
                <span>Source transaction details are hidden to protect payment privacy</span>
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/verify"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-white/15 px-6 text-sm font-medium text-white transition hover:bg-white/10"
        >
          Verify another proof
        </Link>
        <Link
          href="/proofs/create"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-cyan-300/30 bg-cyan-300 px-6 text-sm font-medium text-slate-950 transition hover:bg-cyan-200"
        >
          Create your own proof
        </Link>
      </div>
    </div>
  );
}

export default function VerifyProofPage({ params }: { params: { proofId: string } }) {
  const [state, setState] = useState<VerificationState>({
    loading: true,
    result: null,
    error: null
  });

  const verifyProof = useCallback(async () => {
    setState({ loading: true, result: null, error: null });

    try {
      const encodedProofId = encodeURIComponent(params.proofId);
      const result = await apiClient<VerifyProofResponse>({
        path: `/proofs/${encodedProofId}/verify`,
        method: "GET"
      });

      setState({ loading: false, result, error: null });
    } catch (err) {
      let errorMessage = "Unable to verify proof. Please check your connection and try again.";
      
      if (err instanceof Error) {
        if (err.message.includes("404")) {
          errorMessage = "Proof not found. Please check the proof identifier and try again.";
        } else if (err.message.includes("500")) {
          errorMessage = "Server error occurred during verification. Please try again later.";
        } else if (err.message.includes("timeout")) {
          errorMessage = "Request timed out. Please check your connection and try again.";
        }
      }

      setState({ loading: false, result: null, error: errorMessage });
    }
  }, [params.proofId]);

  useEffect(() => {
    let cancelled = false;
    
    const loadProof = async () => {
      setState({ loading: true, result: null, error: null });

      try {
        const encodedProofId = encodeURIComponent(params.proofId);
        const result = await apiClient<VerifyProofResponse>({
          path: `/proofs/${encodedProofId}/verify`,
          method: "GET"
        });

        if (!cancelled) {
          setState({ loading: false, result, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          let errorMessage = "Unable to verify proof. Please check your connection and try again.";
          
          if (err instanceof Error) {
            if (err.message.includes("404")) {
              errorMessage = "Proof not found. Please check the proof identifier and try again.";
            } else if (err.message.includes("500")) {
              errorMessage = "Server error occurred during verification. Please try again later.";
            } else if (err.message.includes("timeout")) {
              errorMessage = "Request timed out. Please check your connection and try again.";
            }
          }

          setState({ loading: false, result: null, error: errorMessage });
        }
      }
    };

    loadProof();

    return () => {
      cancelled = true;
    };
  }, [params.proofId]);

  return (
    <PublicShell>
      <div className={pageContainer}>
        <PageHeading
          title={`Proof verification`}
          description={`Verification result for proof ${params.proofId}`}
        />

        {state.loading && <LoadingState />}

        {state.error && (
          <ErrorState error={state.error} onRetry={verifyProof} />
        )}

        {state.result && <VerificationResult result={state.result} />}
      </div>
    </PublicShell>
  );
}