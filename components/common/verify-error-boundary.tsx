"use client";

import { Component, createRef, type ErrorInfo, type ReactNode } from "react";
import Link from "next/link";
import { appConfig } from "@/config/app";

type VerifyErrorBoundaryProps = {
  children: ReactNode;
};

type VerifyErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

/**
 * Granular error boundary for the public verification flow
 * (app/verify/page.tsx: proof-ID lookup, credential upload, QR scan).
 *
 * Scoped narrower than the route-level app/error.tsx: a crash inside the
 * verification form/panel is caught here instead of tearing down the
 * whole page, so surrounding chrome stays intact and the user gets
 * recovery options specific to verification (retry the lookup, go back
 * to the verify landing page, or bail out to system status / support)
 * rather than the generic global fallback.
 *
 * Must be a class component — React error boundaries have no hook
 * equivalent (getDerivedStateFromError / componentDidCatch only exist on
 * the class API).
 */
export class VerifyErrorBoundary extends Component<
  VerifyErrorBoundaryProps,
  VerifyErrorBoundaryState
> {
  private headingRef = createRef<HTMLHeadingElement>();

  constructor(props: VerifyErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): VerifyErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log without crashing — in production this would report to an error
    // tracking service. Never render errorInfo.componentStack to the user;
    // it can include implementation detail not meant for end users.
    console.error("VerifyErrorBoundary caught an error:", error, errorInfo);

    // Move focus to the error heading once the fallback commits, so
    // keyboard/screen-reader users land on the error instead of losing
    // focus to <body> when the crashed subtree unmounts. componentDidCatch
    // fires on both an initial-mount throw and a later-update throw (unlike
    // componentDidUpdate, which never runs on the initial mount), so this
    // covers both cases. Deferred to a microtask since the fallback DOM
    // hasn't committed yet at the point componentDidCatch itself runs.
    queueMicrotask(() => this.headingRef.current?.focus());
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        aria-live="assertive"
        className="rounded-lg border border-rose-300/50 bg-rose-300/10 p-5 sm:p-6"
        role="alert"
      >
        <h2
          className="text-xl font-semibold text-rose-100 focus-visible:outline-none"
          ref={this.headingRef}
          tabIndex={-1}
        >
          Verification hit a problem
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Something went wrong while verifying this proof. No credential
          data was changed — you can try the lookup again below.
        </p>

        {process.env.NODE_ENV === "development" && this.state.error ? (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-slate-400 hover:text-slate-300">
              Developer details
            </summary>
            <pre className="mt-2 overflow-auto rounded bg-slate-900/50 p-3 text-xs text-slate-400">
              {this.state.error.message}
            </pre>
          </details>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            className="inline-flex h-10 items-center justify-center rounded-lg border border-cyan-300/50 bg-cyan-300 px-6 text-sm font-medium text-slate-950 transition hover:bg-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            onClick={this.handleRetry}
            type="button"
          >
            Try again
          </button>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-lg border border-white/15 px-6 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            href="/verify"
          >
            Go back to verification
          </Link>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-lg border border-white/15 px-6 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            href="/status"
          >
            Check system status
          </Link>
        </div>

        <p className="mt-4 text-sm text-slate-400">
          Still stuck?{" "}
          <a
            className="text-cyan-200 underline underline-offset-4 hover:text-cyan-100"
            href={appConfig.helpUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Contact support
          </a>
          .
        </p>
      </div>
    );
  }
}
