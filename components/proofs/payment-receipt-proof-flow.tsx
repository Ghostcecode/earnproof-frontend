"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PaymentSelection } from "./payment-selection";
import { PrivacyControls } from "./privacy-controls";
import { ProofConfirmation } from "./proof-confirmation";
import { ArtifactExport } from "./artifact-export";
import { createPaymentReceiptProof, getPrivacyImpactMessage, type PaymentReceiptProof } from "@/lib/api/payment-receipt-proofs";
import { apiClient, bearer } from "@/lib/api/client";
import { appConfig } from "@/config/app";
import { buildCredentialExport, buildVerificationLinkExport } from "@/lib/credentials/export";

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

export function PaymentReceiptProofFlow() {
  const initialSession = useMemo(() => readStoredSession(), []);
  const [token, setToken] = useState<string | null>(
    () => initialSession?.token ?? null,
  );
  const [user, setUser] = useState<SessionUser | null>(
    () => initialSession?.user ?? null,
  );
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [discloseSender, setDiscloseSender] = useState(false);
  const [discloseAmount, setDiscloseAmount] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [proof, setProof] = useState<PaymentReceiptProof | null>(null);
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

  const selectedPayment = useMemo(
    () => payments.find(p => p.id === selectedPaymentId) || null,
    [payments, selectedPaymentId]
  );

  const eligiblePayments = useMemo(
    () => payments.filter(p => p.isEligible && p.classification !== "EXCLUDED"),
    [payments]
  );

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

  async function createProof(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !selectedPaymentId) {
      setError("Please select a payment before creating a proof.");
      return;
    }

    // Final eligibility check
    const payment = payments.find(p => p.id === selectedPaymentId);
    if (!payment || !payment.isEligible || payment.classification === "EXCLUDED") {
      setError("The selected payment is not eligible for proof creation.");
      return;
    }

    setError(null);
    setProof(null);
    setStatus("Creating payment receipt proof...");

    try {
      const controller = new AbortController();
      const created = await createPaymentReceiptProof(token, {
        paymentId: selectedPaymentId,
        discloseSender,
        discloseAmount,
        expiresInDays,
      }, controller.signal);

      setProof(created);
      setStatus("Payment receipt proof created.");
    } catch (err) {
      setStatus(null);
      if (err instanceof Error && err.message.includes("not eligible")) {
        setError("The selected payment is no longer eligible for proof creation. Please refresh and try another payment.");
      } else {
        setError("Proof creation failed. Please verify the payment is still eligible and try again.");
      }
    }
  }

  function disconnect() {
    window.localStorage.removeItem(SESSION_KEY);
    setToken(null);
    setUser(null);
    setPayments([]);
    setSelectedPaymentId(null);
    setProof(null);
    setStatus(null);
    setError(null);
    setDiscloseSender(false);
    setDiscloseAmount(false);
  }

  return (
    <div className="grid gap-8 sm:gap-10">
      <section className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5">
        <div>
          <h2 className="text-xl font-semibold text-white">Wallet</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Authenticate with a Stellar testnet wallet to access your payments.
          </p>
        </div>
        {user ? (
          <div className="grid gap-3 text-sm text-slate-300">
            <p className="break-words">
              Connected as <span className="text-cyan-200">{user.walletAddress}</span>
            </p>
            <button
              className="h-10 w-fit rounded-md border border-white/15 px-4 text-xs font-semibold text-white"
              onClick={disconnect}
              type="button"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            className="h-10 w-fit rounded-md bg-cyan-300 px-4 text-xs font-semibold text-slate-950"
            onClick={connectWallet}
            ref={connectButtonRef}
            type="button"
          >
            Connect Freighter
          </button>
        )}
      </section>

      <PaymentSelection
        payments={eligiblePayments}
        selectedPaymentId={selectedPaymentId}
        onPaymentSelect={setSelectedPaymentId}
        onSyncPayments={syncPayments}
        onRefreshPayments={() => refreshPayments()}
        loading={!token}
        disabled={!token}
      />

      <PrivacyControls
        discloseSender={discloseSender}
        discloseAmount={discloseAmount}
        onDiscloseSenderChange={setDiscloseSender}
        onDiscloseAmountChange={setDiscloseAmount}
        disabled={!selectedPayment}
      />

      <form
        className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5"
        onSubmit={createProof}
      >
        <div>
          <h2 className="text-xl font-semibold text-white">Create Proof</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Review your selections and create a verifiable payment receipt proof.
          </p>
        </div>

        {selectedPayment && (
          <ProofConfirmation
            payment={selectedPayment}
            discloseSender={discloseSender}
            discloseAmount={discloseAmount}
            expiresInDays={expiresInDays}
          />
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="expires-days" className="block text-sm font-medium text-slate-200">
              Expires In (Days)
            </label>
            <input
              id="expires-days"
              type="number"
              min="1"
              max="365"
              className="mt-1 h-11 w-full rounded-md border border-white/10 bg-slate-900 px-4 text-white placeholder:text-slate-400"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 30)}
            />
          </div>
        </div>

        <button
          aria-describedby={error ? "create-proof-feedback" : undefined}
          className="h-10 w-fit rounded-md bg-cyan-300 px-4 text-xs font-semibold text-slate-950 disabled:opacity-50"
          disabled={!token || !selectedPaymentId}
          type="submit"
        >
          Create Payment Receipt Proof
        </button>
      </form>

      {status || error || proof ? (
        <section
          className="rounded-lg border border-white/10 bg-slate-950 p-5 text-sm leading-6"
          id="create-proof-feedback"
        >
          {status ? (
            <p aria-live="polite" className="text-slate-300">
              {status}
            </p>
          ) : null}
          {error ? (
            <p
              aria-live="assertive"
              className="text-rose-200 focus-visible:outline-none"
              id="create-proof-error"
              ref={errorRef}
              role="alert"
              tabIndex={-1}
            >
              {error}
            </p>
          ) : null}
          {proof ? (
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
          ) : null}
        </section>
      ) : null}
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

// Import Freighter wallet functions (same as in create-proof-flow.tsx)
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