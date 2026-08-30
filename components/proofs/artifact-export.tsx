"use client";

import { useId, useState } from "react";
import {
  copyTextToClipboard,
  downloadTextFile,
  type ArtifactExportPlan,
} from "@/lib/credentials/export";

export function ArtifactExport({
  plan,
  title,
}: {
  plan: ArtifactExportPlan | null;
  title: string;
}) {
  const dialogId = useId();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!plan) {
    return null;
  }

  function close() {
    setOpen(false);
  }

  async function copy() {
    setError(null);
    try {
      await copyTextToClipboard(plan!.body);
      setStatus("Copied to clipboard.");
      setOpen(false);
    } catch {
      setError("Clipboard copy was blocked. You can retry or download the file instead.");
    }
  }

  function download() {
    setError(null);
    try {
      downloadTextFile(plan!);
      setStatus("Download started.");
      setOpen(false);
    } catch {
      setError("Download failed. Check browser permissions and try again.");
    }
  }

  return (
    <div className="grid gap-2">
      <button
        className="h-10 w-fit rounded-md border border-white/15 px-4 text-xs font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        type="button"
      >
        {title}
      </button>
      <div aria-live="polite" className="sr-only" role="status">
        {status}
      </div>
      {error ? (
        <p className="text-sm text-rose-200" role="alert">
          {error}
        </p>
      ) : null}
      {status && !open ? <p className="text-sm text-slate-300">{status}</p> : null}

      {open ? (
        <div
          aria-labelledby={dialogId}
          aria-modal="true"
          className="rounded-lg border border-cyan-300/50 bg-slate-950 p-4"
          role="dialog"
        >
          <h3 className="text-sm font-semibold text-white" id={dialogId}>
            Confirm export
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            This file includes only fields returned by the public or owned EarnProof APIs.
            Filename: <span className="text-cyan-200">{plan.filename}</span>
          </p>
          <p className="mt-3 text-xs font-semibold uppercase text-slate-400">Included fields</p>
          <ul className="mt-1 grid gap-1 text-xs text-slate-300">
            {plan.includedFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
          {plan.warnings.length > 0 ? (
            <div className="mt-3 rounded-md border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">
              {plan.warnings.map((warning) => (
                <p key={warning.field}>{warning.message}</p>
              ))}
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="h-9 rounded-md bg-cyan-300 px-4 text-xs font-semibold text-slate-950"
              onClick={() => void copy()}
              type="button"
            >
              Copy
            </button>
            <button
              className="h-9 rounded-md border border-white/15 px-4 text-xs font-semibold text-white"
              onClick={download}
              type="button"
            >
              Download
            </button>
            <button
              className="h-9 rounded-md px-4 text-xs font-semibold text-slate-300"
              onClick={close}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
