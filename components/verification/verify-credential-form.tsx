"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api/client";
import {
  VerificationPanel,
  VerifyProofResponse,
} from "@/components/verification/verification-panel";
import { VerifyResultSkeleton } from "@/components/common/skeleton/verify-result-skeleton";

const MAX_FILE_BYTES = 32 * 1024; // 32 KB

export function VerifyCredentialForm() {
  const [jsonInput, setJsonInput] = useState("");
  const [result, setResult] = useState<VerifyProofResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_BYTES) {
      setError(`File exceeds the 32 KB limit (${(file.size / 1024).toFixed(1)} KB). Paste the credential JSON instead.`);
      // Reset so the same file can be reselected after fixing
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        setJsonInput(text);
        setError(null);
      }
    };
    reader.readAsText(file);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    const trimmed = jsonInput.trim();
    if (!trimmed) {
      setError("Enter valid credential JSON.");
      return;
    }

    // Parse JSON — never throw unhandled
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      setError("Enter valid credential JSON.");
      return;
    }

    // Only extract the id field — discard all other claim fields
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("id" in parsed) ||
      typeof (parsed as Record<string, unknown>).id !== "string" ||
      !(parsed as Record<string, unknown>).id
    ) {
      setError("Credential JSON must include a valid id.");
      return;
    }

    const id = (parsed as Record<string, string>).id;

    setIsLoading(true);
    try {
      const response = await apiClient<VerifyProofResponse>({
        path: `/proofs/${encodeURIComponent(id)}/verify`,
      });
      setResult(response);
    } catch {
      setError("Verification request failed. Check the credential and API URL.");
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
          <h2 className="text-2xl font-semibold leading-8">Upload credential</h2>
          <p className="mt-2 text-sm leading-5 text-slate-300">
            Files are processed for verification and are not retained by this page.
          </p>
        </div>

        {/* Credential JSON input */}
        <div className="grid gap-[7px]">
          <label
            className="text-xs font-semibold text-slate-300"
            htmlFor="credential-json"
          >
            Credential JSON
          </label>
          <input
            className="h-[46px] rounded-lg border border-white/15 bg-transparent px-3 text-sm font-normal text-white placeholder:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            id="credential-json"
            onChange={(e) => {
              setJsonInput(e.target.value);
              setError(null);
            }}
            placeholder="Paste a signed credential"
            type="text"
            value={jsonInput}
          />
          {/* File upload — secondary option, visually subtle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300">or</span>
            <button
              className="text-xs text-cyan-200 underline underline-offset-2 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              upload a .json file
            </button>
            <input
              accept=".json,application/json"
              aria-label="Upload credential JSON file"
              className="sr-only"
              onChange={handleFileChange}
              ref={fileInputRef}
              type="file"
            />
          </div>
        </div>

        {/* Network — disabled, mirrors VerifyProofForm's "Verification method" */}
        <label className="grid gap-[7px] text-xs font-semibold text-slate-300">
          Network
          <input
            className="h-[46px] rounded-lg border border-white/15 bg-transparent px-3 text-sm font-normal text-slate-400"
            disabled
            value="Stellar Testnet"
          />
        </label>

        {/* Privacy info box — same copy and style as VerifyProofForm */}
        <div className="rounded-lg border border-cyan-300/50 bg-cyan-300/10 p-3 text-sm leading-5">
          <p className="font-medium text-cyan-200">Privacy protected</p>
          <p className="mt-1.5 text-slate-300">
            Only the fields shown in the disclosure summary can be shared.
          </p>
        </div>

        {error ? (
          <p
            aria-live="assertive"
            className="text-sm text-rose-200 focus-visible:outline-none"
            id="verify-credential-error"
            ref={errorRef}
            role="alert"
            tabIndex={-1}
          >
            {error}
          </p>
        ) : null}

        <button
          aria-describedby={error ? "verify-credential-error" : undefined}
          className="h-11 w-full rounded-lg bg-cyan-300 px-6 text-sm font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 sm:h-10 sm:w-fit"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? "Checking..." : "Validate credential"}
        </button>
      </form>

      {isLoading ? <VerifyResultSkeleton /> : <VerificationPanel result={result} />}
    </div>
  );
}
