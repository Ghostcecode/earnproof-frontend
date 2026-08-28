"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiKey } from "@/lib/api/generated/v1";

export function OneTimeSecret({
  apiKey,
  secret,
  onDismiss,
}: {
  apiKey: ApiKey;
  secret: string;
  onDismiss: () => void;
}) {
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const secretRef = useRef<HTMLInputElement>(null);
  const dismissButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-focus the dismiss button when component mounts
  useEffect(() => {
    dismissButtonRef.current?.focus();
  }, []);

  // Clear the secret from memory when component unmounts
  useEffect(() => {
    return () => {
      if (secretRef.current) {
        secretRef.current.value = "";
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    setCopyError(null);
    setCopyStatus(null);

    try {
      await navigator.clipboard.writeText(secret);
      setCopyStatus("Copied to clipboard");
      
      // Clear status after 3 seconds
      setTimeout(() => setCopyStatus(null), 3000);
    } catch (error) {
      setCopyError("Failed to copy to clipboard. Please copy manually.");
    }
  }, [secret]);

  const handleSelectAll = useCallback(() => {
    if (secretRef.current) {
      secretRef.current.select();
    }
  }, []);

  return (
    <section 
      className="rounded-lg border border-emerald-300/30 bg-emerald-300/10 p-5"
      role="region"
      aria-labelledby="secret-heading"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-300/20">
            <svg className="h-4 w-4 text-emerald-100" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h2 id="secret-heading" className="text-lg font-semibold text-emerald-100">
            API Key Created Successfully
          </h2>
          <p className="mt-1 text-sm text-emerald-200">
            Your API key <strong>{apiKey.name}</strong> has been created. 
            <strong className="block mt-1">This is the only time the secret will be displayed.</strong>
            Copy it now and store it securely.
          </p>

          <div className="mt-4 grid gap-3">
            <div>
              <label htmlFor="api-secret" className="block text-xs font-semibold text-emerald-100">
                API Secret
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  id="api-secret"
                  ref={secretRef}
                  className="flex-1 h-10 rounded-md border border-emerald-300/30 bg-emerald-900/20 px-3 text-sm font-mono text-emerald-100 selection:bg-emerald-300/30"
                  readOnly
                  value={secret}
                  onClick={handleSelectAll}
                />
                <button
                  className="h-10 rounded-md border border-emerald-300/30 bg-emerald-300 px-4 text-xs font-semibold text-slate-950 hover:bg-emerald-200 transition"
                  onClick={handleCopy}
                  type="button"
                >
                  Copy
                </button>
              </div>
              {copyStatus && (
                <p className="mt-1 text-xs text-emerald-200" aria-live="polite">
                  {copyStatus}
                </p>
              )}
              {copyError && (
                <p className="mt-1 text-xs text-rose-200" role="alert">
                  {copyError}
                </p>
              )}
            </div>

            <div className="grid gap-2 text-xs text-emerald-200">
              <div>
                <span className="font-semibold">Key ID:</span> {apiKey.id}
              </div>
              <div>
                <span className="font-semibold">Prefix:</span> {apiKey.prefix}
              </div>
              <div>
                <span className="font-semibold">Scopes:</span> {apiKey.scopes.join(", ")}
              </div>
              {apiKey.expiresAt && (
                <div>
                  <span className="font-semibold">Expires:</span> {new Date(apiKey.expiresAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <button
              ref={dismissButtonRef}
              className="h-10 rounded-md border border-emerald-300/30 px-4 text-xs font-semibold text-emerald-100 hover:bg-emerald-300/10 transition"
              onClick={onDismiss}
              type="button"
            >
              I've saved the secret, dismiss this
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}