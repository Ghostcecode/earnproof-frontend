"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import {
  VerificationPanel,
  VerifyProofResponse,
} from "@/components/verification/verification-panel";
import { VerifyResultSkeleton } from "@/components/common/skeleton/verify-result-skeleton";
import { extractProofId } from "@/lib/validation/proof-input";

export function VerifyProofForm() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState(() => searchParams.get("proof") ?? "");
  const [result, setResult] = useState<VerifyProofResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);

  const proofId = useMemo(() => extractProofId(input), [input]);

  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!proofId) {
      setError("Enter a proof ID or verification URL.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient<VerifyProofResponse>({
        path: `/proofs/${encodeURIComponent(proofId)}/verify`,
      });
      setResult(response);
    } catch {
      setError("Verification request failed. Check the proof ID and API URL.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-4">
      <form
        className="grid gap-[18px] rounded-lg border border-white/10 bg-white/[0.04] p-5 sm:p-6"
        onSubmit={onSubmit}
      >
        <div>
          <h2 className="text-2xl font-semibold leading-8">Verify a proof</h2>
          <p className="mt-2 text-sm leading-5 text-slate-300">Complete the information below. Sensitive details remain private unless explicitly disclosed.</p>
        </div>
        <label className="grid gap-[7px] text-xs font-semibold text-slate-300" htmlFor="proof">
          Proof ID
          <input
            className="h-[46px] rounded-lg border border-white/15 bg-transparent px-3 text-sm font-normal text-white placeholder:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            id="proof"
            onChange={(event) => setInput(event.target.value)}
            placeholder="EP-8A42-91DC"
            type="text"
            value={input}
          />
        </label>
        <label className="grid gap-[7px] text-xs font-semibold text-slate-300">
          Verification method
          <input
            className="h-[46px] rounded-lg border border-white/15 bg-transparent px-3 text-sm font-normal text-slate-400"
            disabled
            value="Public proof link"
          />
        </label>
        <div className="rounded-lg border border-cyan-300/50 bg-cyan-300/10 p-3 text-sm leading-5">
          <p className="font-medium text-cyan-200">Privacy protected</p>
          <p className="mt-1.5 text-slate-300">Only the fields shown in the disclosure summary can be shared.</p>
        </div>
        {error ? (
          <p
            aria-live="assertive"
            className="text-sm text-rose-200 focus-visible:outline-none"
            id="verify-proof-error"
            ref={errorRef}
            role="alert"
            tabIndex={-1}
          >
            {error}
          </p>
        ) : null}
        <button
          aria-describedby={error ? "verify-proof-error" : undefined}
          className="h-11 w-fit rounded-lg bg-cyan-300 px-6 text-sm font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 sm:h-10"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? "Checking..." : "Verify proof"}
        </button>
      </form>

      {isLoading ? <VerifyResultSkeleton /> : <VerificationPanel result={result} />}
    </div>
  );
}
