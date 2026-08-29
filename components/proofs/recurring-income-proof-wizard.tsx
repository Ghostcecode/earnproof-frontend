"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WizardSteps } from "./wizard-steps";
import { IntervalConfigStep } from "./interval-config-step";
import { PeriodConfigStep } from "./period-config-step";
import { RecurringPaymentSelection } from "./recurring-payment-selection";
import { CoverageAnalysisStep } from "./coverage-analysis-step";
import { RecurringProofConfirmation } from "./recurring-proof-confirmation";
import { ArtifactExport } from "./artifact-export";
import { createRecurringIncomeProof, analyzeIntervalCoverage, type RecurringIncomeProof, type IntervalUnit, type IntervalCoverageAnalysis } from "@/lib/api/recurring-income-proofs";
import { apiClient, bearer } from "@/lib/api/client";
import { appConfig } from "@/config/app";
import { buildCredentialExport, buildVerificationLinkExport } from "@/lib/credentials/export";
import { WIZARD_STEPS, DEFAULT_VALUES, type WizardStep } from "@/lib/validation/recurring-income-proofs";

type SessionUser = {
  id: string;
  walletAddress: string;
  walletHash: string;
  role: string;
};

type PaymentClassification =
  | "INCOME"
  | "REIMBURSEMENT"
  | "PERSONAL_TRANSFER"
  | "UNKNOWN"
  | "EXCLUDED";

type Payment = {
  id: string;
  stellarTransactionHash: string;
  sourceAddress: string;
  assetCode: string;
  assetIssuer: string | null;
  occurredAt: string;
  classification: PaymentClassification;
  isEligible: boolean;
};

const SESSION_KEY = "earnproof.session";

export function RecurringIncomeProofWizard() {
  const initialSession = useMemo(() => readStoredSession(), []);
  const [token, setToken] = useState<string | null>(
    () => initialSession?.token ?? null,
  );
  const [user, setUser] = useState<SessionUser | null>(
    () => initialSession?.user ?? null,
  );
  const [currentStep, setCurrentStep] = useState<WizardStep>(WIZARD_STEPS.INTERVAL_CONFIG);
  const [payments, setPayments] = useState<Payment[]>([]);
  
  // Wizard state
  const [intervalUnit, setIntervalUnit] = useState<IntervalUnit>(DEFAULT_VALUES.intervalUnit);
  const [intervalCount, setIntervalCount] = useState(DEFAULT_VALUES.intervalCount);
  const [periodStart, setPeriodStart] = useState("2026-08-01");
  const [periodEnd, setPeriodEnd] = useState("2026-11-30");
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<{ code: string; issuer: string | null } | null>(null);
  const [expiresInDays, setExpiresInDays] = useState(DEFAULT_VALUES.expiresInDays);
  
  // Analysis and results
  const [coverageAnalysis, setCoverageAnalysis] = useState<IntervalCoverageAnalysis | null>(null);
  const [proof, setProof] = useState<RecurringIncomeProof | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const connectButtonRef = useRef<HTMLButtonElement>(null);
  const wasConnectedRef = useRef(Boolean(initialSession?.user));

  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  // Restore focus to the "Connect Freighter" button after disconnecting
  useEffect(() => {
    if (user) {
      wasConnectedRef.current = true;
    } else if (wasConnectedRef.current) {
      wasConnectedRef.current = false;
      connectButtonRef.current?.focus();
    }
  }, [user]);

  const eligibleIncomePayments = useMemo(
    () => payments.filter(p => 
      p.isEligible && 
      p.classification === "INCOME" &&
      (!selectedAsset || (p.assetCode === selectedAsset.code && p.assetIssuer === selectedAsset.issuer))
    ),
    [payments, selectedAsset]
  );

  const availableAssets = useMemo(() => {
    const assets = new Map<string, { code: string; issuer: string | null }>();
    
    payments
      .filter(p => p.isEligible && p.classification === "INCOME")
      .forEach(p => {
        const key = `${p.assetCode}:${p.assetIssuer || 'native'}`;
        assets.set(key, { code: p.assetCode, issuer: p.assetIssuer });
      });
    
    return Array.from(assets.values());
  }, [payments]);

  async function connectWallet() {
    setError(null);
    setStatus("Requesting Freighter wallet access...");

    try {
      const walletAddress = await getFreighterAddress();
      if (!walletAddress) {
        setStatus(null);
        setError("Freighter was not found or did not return a Stellar address.");
        return;
      }

      const challenge = await apiClient<{
        id: string;
        message: string;
        expiresAt: string;
      }>({
        path: "/auth/challenge",
        method: "POST",
        body: JSON.stringify({ walletAddress }),
      });

      setStatus("Waiting for wallet signature...");
      const signature = await signFreighterMessage(challenge.message, walletAddress);
      if (!signature) {
        setStatus(null);
        setError("Wallet did not return a signature for the challenge.");
        return;
      }

      const verified = await apiClient<{
        user: SessionUser;
        session: { token: string; tokenType: "Bearer" };
      }>({
        path: "/auth/verify",
        method: "POST",
        body: JSON.stringify({
          challengeId: challenge.id,
          walletAddress,
          signature,
        }),
      });

      window.localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ token: verified.session.token, user: verified.user }),
      );
      setToken(verified.session.token);
      setUser(verified.user);
      setStatus("Wallet authenticated.");
    } catch {
      setStatus(null);
      setError("Wallet connection failed. Check Freighter and try again.");
    }
  }

  async function syncPayments() {
    if (!token) {
      return;
    }

    setError(null);
    setStatus("Syncing incoming Stellar testnet payments...");

    try {
      await apiClient({
        path: "/payments/sync",
        method: "POST",
        headers: bearer(token),
      });
      await refreshPayments(token);
      setStatus("Payments synced.");
    } catch {
      setStatus(null);
      setError("Payment sync failed. Try again.");
    }
  }

  async function refreshPayments(activeToken = token) {
    if (!activeToken) {
      return;
    }

    try {
      const response = await apiClient<Payment[]>({
        path: "/payments",
        headers: bearer(activeToken),
      });
      setPayments(response);
    } catch {
      setError("Could not load payments. Try again.");
    }
  }

  const analyzeCoverage = useCallback(async () => {
    if (!token || selectedPaymentIds.length === 0) {
      return;
    }

    setError(null);
    setStatus("Analyzing interval coverage...");

    try {
      const controller = new AbortController();
      const analysis = await analyzeIntervalCoverage(token, {
        paymentIds: selectedPaymentIds,
        intervalUnit,
        intervalCount,
        periodStart: `${periodStart}T00:00:00.000Z`,
        periodEnd: `${periodEnd}T23:59:59.000Z`,
      }, controller.signal);
      
      setCoverageAnalysis(analysis);
      setStatus("Coverage analysis complete.");
    } catch (err) {
      setStatus(null);
      setError("Coverage analysis failed. Please try again.");
    }
  }, [token, selectedPaymentIds, intervalUnit, intervalCount, periodStart, periodEnd]);

  async function createProof() {
    if (!token || !selectedAsset || selectedPaymentIds.length === 0) {
      setError("Please complete all wizard steps before creating the proof.");
      return;
    }

    setError(null);
    setProof(null);
    setStatus("Creating recurring income proof...");

    try {
      const controller = new AbortController();
      const created = await createRecurringIncomeProof(token, {
        selectedPaymentIds,
        intervalUnit,
        intervalCount,
        periodStart: `${periodStart}T00:00:00.000Z`,
        periodEnd: `${periodEnd}T23:59:59.000Z`,
        assetCode: selectedAsset.code,
        assetIssuer: selectedAsset.issuer || undefined,
        expiresInDays,
      }, controller.signal);

      setProof(created);
      setStatus("Recurring income proof created.");
    } catch (err) {
      setStatus(null);
      setError("Proof creation failed. Please verify your configuration and try again.");
    }
  }

  function disconnect() {
    window.localStorage.removeItem(SESSION_KEY);
    setToken(null);
    setUser(null);
    setPayments([]);
    setSelectedPaymentIds([]);
    setSelectedAsset(null);
    setCoverageAnalysis(null);
    setProof(null);
    setStatus(null);
    setError(null);
    setCurrentStep(WIZARD_STEPS.INTERVAL_CONFIG);
  }

  const canProceedToNextStep = (step: WizardStep): boolean => {
    switch (step) {
      case WIZARD_STEPS.INTERVAL_CONFIG:
        return intervalUnit !== undefined && intervalCount > 0;
      case WIZARD_STEPS.PERIOD_CONFIG:
        return !!periodStart && !!periodEnd && new Date(periodStart) < new Date(periodEnd);
      case WIZARD_STEPS.PAYMENT_SELECTION:
        return selectedPaymentIds.length > 0 && selectedAsset !== null;
      case WIZARD_STEPS.COVERAGE_ANALYSIS:
        return coverageAnalysis !== null;
      case WIZARD_STEPS.CONFIRMATION:
        return true;
      default:
        return false;
    }
  };

  const renderCurrentStep = () => {
    if (!user) {
      return (
        <section className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <div>
            <h2 className="text-xl font-semibold text-white">Wallet Connection Required</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Connect your Stellar testnet wallet to access the recurring income proof wizard.
            </p>
          </div>
          <button
            className="h-10 w-fit rounded-md bg-cyan-300 px-4 text-xs font-semibold text-slate-950"
            onClick={connectWallet}
            ref={connectButtonRef}
            type="button"
          >
            Connect Freighter
          </button>
        </section>
      );
    }

    switch (currentStep) {
      case WIZARD_STEPS.INTERVAL_CONFIG:
        return (
          <IntervalConfigStep
            intervalUnit={intervalUnit}
            intervalCount={intervalCount}
            onIntervalUnitChange={setIntervalUnit}
            onIntervalCountChange={setIntervalCount}
          />
        );
      case WIZARD_STEPS.PERIOD_CONFIG:
        return (
          <PeriodConfigStep
            periodStart={periodStart}
            periodEnd={periodEnd}
            intervalUnit={intervalUnit}
            intervalCount={intervalCount}
            onPeriodStartChange={setPeriodStart}
            onPeriodEndChange={setPeriodEnd}
          />
        );
      case WIZARD_STEPS.PAYMENT_SELECTION:
        return (
          <RecurringPaymentSelection
            payments={eligibleIncomePayments}
            availableAssets={availableAssets}
            selectedPaymentIds={selectedPaymentIds}
            selectedAsset={selectedAsset}
            onPaymentSelection={setSelectedPaymentIds}
            onAssetSelection={setSelectedAsset}
            onSyncPayments={syncPayments}
            onRefreshPayments={() => refreshPayments()}
            loading={!token}
          />
        );
      case WIZARD_STEPS.COVERAGE_ANALYSIS:
        return (
          <CoverageAnalysisStep
            intervalUnit={intervalUnit}
            intervalCount={intervalCount}
            periodStart={periodStart}
            periodEnd={periodEnd}
            selectedPaymentIds={selectedPaymentIds}
            coverageAnalysis={coverageAnalysis}
            onAnalyzeCoverage={analyzeCoverage}
            loading={!!status}
          />
        );
      case WIZARD_STEPS.CONFIRMATION:
        return (
          <RecurringProofConfirmation
            intervalUnit={intervalUnit}
            intervalCount={intervalCount}
            periodStart={periodStart}
            periodEnd={periodEnd}
            selectedAsset={selectedAsset}
            selectedPaymentCount={selectedPaymentIds.length}
            coverageAnalysis={coverageAnalysis}
            expiresInDays={expiresInDays}
            onExpiresInDaysChange={setExpiresInDays}
            onCreateProof={createProof}
            loading={!!status}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid gap-8 sm:gap-10">
      {/* Wallet Status */}
      {user && (
        <section className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
              <span className="text-sm text-slate-300">
                Connected as <span className="text-cyan-200 font-mono">{user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-8)}</span>
              </span>
            </div>
            <button
              className="text-xs text-slate-400 hover:text-slate-300 transition"
              onClick={disconnect}
              type="button"
            >
              Disconnect
            </button>
          </div>
        </section>
      )}

      <WizardSteps 
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        canProceedToStep={canProceedToNextStep}
      />

      {renderCurrentStep()}

      {/* Status and Results */}
      {(status || error || proof) && (
        <section
          className="rounded-lg border border-white/10 bg-slate-950 p-5 text-sm leading-6"
          id="wizard-feedback"
        >
          {status && (
            <p aria-live="polite" className="text-slate-300">
              {status}
            </p>
          )}
          {error && (
            <p
              aria-live="assertive"
              className="text-rose-200 focus-visible:outline-none"
              ref={errorRef}
              role="alert"
              tabIndex={-1}
            >
              {error}
            </p>
          )}
          {proof && (
            <div className="mt-4 grid gap-2 text-slate-300">
              <p>
                Proof ID: <span className="text-cyan-200">{proof.proofId}</span>
              </p>
              <p className="break-words">
                Credential hash:{" "}
                <span className="text-cyan-200">
                  {proof.credential.proof.credentialHash}
                </span>
              </p>
              <a
                className="w-fit text-cyan-200 underline underline-offset-4"
                href={`/verify?proof=${encodeURIComponent(proof.proofId)}`}
              >
                Open public verification
              </a>
              <ArtifactExport
                plan={buildVerificationLinkExport(proof.verificationUrl)}
                title="Export verification link"
              />
              <ArtifactExport
                plan={buildCredentialExport({
                  credential: proof.credential,
                })}
                title="Export credential JSON"
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function readStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(SESSION_KEY);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as { token: string; user: SessionUser };
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

// Import Freighter wallet functions (same as in other proof flows)
async function loadFreighter(): Promise<{
  getAddress: any;
  requestAccess: any;
  signMessage: any;
}> {
  return import("@stellar/freighter-api");
}

async function getFreighterAddress() {
  const freighter = await loadFreighter();
  const access = await freighter.requestAccess().catch(() => null);
  if (access?.address) {
    return access.address;
  }

  const address = await freighter.getAddress().catch(() => null);
  return address?.address ?? null;
}

async function signFreighterMessage(message: string, walletAddress: string) {
  const freighter = await loadFreighter();
  const response = await freighter
    .signMessage(message, {
      networkPassphrase: appConfig.stellarNetworkPassphrase,
      address: walletAddress,
    })
    .catch(() => null);

  if (!response?.signedMessage) {
    return null;
  }

  if (typeof response.signedMessage === "string") {
    return response.signedMessage;
  }

  return bytesToBase64(response.signedMessage);
}

function bytesToBase64(value: Uint8Array) {
  let binary = "";
  value.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}