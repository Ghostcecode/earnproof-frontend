"use client";

import { useEffect, useRef } from "react";

export function ConfirmationDialog({
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "primary",
  onConfirm,
  onCancel,
  isProcessing = false,
}: {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "primary" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Focus the cancel button when dialog opens
  useEffect(() => {
    cancelButtonRef.current?.focus();
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isProcessing) {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onCancel, isProcessing]);

  const confirmButtonClass = confirmVariant === "danger"
    ? "bg-rose-600 hover:bg-rose-700 text-white"
    : "bg-cyan-300 hover:bg-cyan-200 text-slate-950";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        className="w-full max-w-md rounded-lg border border-white/10 bg-slate-900 p-6 shadow-xl"
      >
        <h2 id="dialog-title" className="text-lg font-semibold text-white">
          {title}
        </h2>
        <p id="dialog-description" className="mt-2 text-sm leading-6 text-slate-300">
          {message}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelButtonRef}
            onClick={onCancel}
            disabled={isProcessing}
            className="h-10 rounded-md border border-white/15 px-4 text-sm font-medium text-white hover:bg-white/5 disabled:opacity-50 transition"
            type="button"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className={`h-10 rounded-md px-4 text-sm font-medium disabled:opacity-50 transition ${confirmButtonClass}`}
            type="button"
          >
            {isProcessing ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}