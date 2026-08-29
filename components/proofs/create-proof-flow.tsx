"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { getAddress, requestAccess, signMessage } from "@stellar/freighter-api";
import { ArtifactExport } from "@/components/proofs/artifact-export";
import { PaymentListSkeleton } from "@/components/common/skeleton/payment-list-skeleton";
import { appConfig } from "@/config/app";
import { apiClient, bearer } from "@/lib/api/client";
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

type ProofResponse = {
  proofId: string;
  status: string;
  verificationUrl: string;
  credential: {
    proof: {
      credentialHash: string;
      signature: string;
    };
  };
};

const SESSION_KEY = "earnproof.session";

export function CreateProofFlow() {
  const initialSession = useMemo(() => readStoredSession(), []);
  const [token, setToken] = useState<string | null>(
    () => initialSession?.token ?? null,
  );
  const [user, setUser] = useState<SessionUser | null>(
    () => initialSession?.user ?? null,
  );
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [thresholdAmount, setThresholdAmount] = useState("100");
  const [periodStart, setPeriodStart] = useState("2026-08-01");
  const [periodEnd, setPeriodEnd] = useState("2026-08-31");
  const [proof, setProof] = useState<ProofResponse | null>(null);
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

  // Restore focus to the "Connect Freighter" button after disconnecting so
  // keyboard focus doesn't fall back to <body> when the "Disconnect"
  // button it was on unmounts. Only fires on the connected -> disconnected
  // transition, not on initial mount.
  useEffect(() => {
    if (user) {
      wasConnectedRef.current = true;
    } else if (wasConnectedRef.current) {
      wasConnectedRef.current = false;
      connectButtonRef.current?.focus();
    }
  }, [user]);

  const selectedIncomePayments = useMemo(
    () =>
      payments.filter(
        (payment) =>
          selected.includes(payment.id) &&
          payment.classification === "INCOME" &&
          payment.isEligible,
      ),
    [payments, selected],
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
    setPaymentsLoading(true);

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
    } finally {
      setPaymentsLoading(false);
    }
  }

  async function refreshPayments(activeToken = token) {
    if (!activeToken) {
      return;
    }

    setPaymentsLoading(true);
    try {
      const response = await apiClient<Payment[]>({
        path: "/payments",
        headers: bearer(activeToken),
      });
      setPayments(response);
    } catch {
      setError("Could not load payments. Try again.");
    } finally {
      setPaymentsLoading(false);
    }
  }

  async function updateClassification(
    paymentId: string,
    classification: PaymentClassification,
  ) {
    if (!token) {
      return;
    }

    setError(null);
    try {
      await apiClient<Payment>({
        path: `/payments/${paymentId}/classification`,
        method: "PATCH",
        headers: bearer(token),
        body: JSON.stringify({ classification }),
      });
      await refreshPayments(token);
    } catch {
      setError("Could not update the payment classification. Try again.");
    }
  }

  async function createProof(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setError("Connect a wallet before creating a proof.");
      return;
    }

    if (selectedIncomePayments.length === 0) {
      setError("Select at least one eligible income payment.");
      return;
    }

    setError(null);
    setProof(null);
    setStatus("Creating signed minimum-income proof...");

    try {
      const created = await apiClient<ProofResponse>({
        path: "/proofs/minimum-income",
        method: "POST",
        headers: bearer(token),
        body: JSON.stringify({
          selectedPaymentIds: selectedIncomePayments.map((payment) => payment.id),
          thresholdAmount,
          assetCode: selectedIncomePayments[0].assetCode,
          assetIssuer: selectedIncomePayments[0].assetIssuer ?? undefined,
          periodStart: `${periodStart}T00:00:00.000Z`,
          periodEnd: `${periodEnd}T23:59:59.000Z`,
          expiresInDays: 30,
        }),
      });

      setProof(created);
      setStatus("Proof created.");
    } catch {
      setStatus(null);
      setError("Proof creation failed. Check the selected payments and try again.");
    }
  }

  function disconnect() {
    window.localStorage.removeItem(SESSION_KEY);
    setToken(null);
    setUser(null);
    setPayments([]);
    setSelected([]);
    setProof(null);
    setStatus(null);
    setError(null);
  }

  return (
    <div className="grid gap-8 sm:gap-10">
      <section className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5">
        <div>
          <h2 className="text-xl font-semibold text-white">Wallet</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Authenticate with a Stellar testnet wallet before syncing payments.
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

      <section className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold text-white">Payments</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Sync incoming payments, mark qualifying income, then select the
              payments to include in the proof calculation.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="h-10 rounded-md border border-white/15 px-4 text-xs font-semibold text-white disabled:opacity-50"
              disabled={!token}
              onClick={() => refreshPayments()}
              type="button"
            >
              Refresh
            </button>
            <button
              className="h-10 rounded-md bg-cyan-300 px-4 text-xs font-semibold text-slate-950 disabled:opacity-50"
              disabled={!token}
              onClick={syncPayments}
              type="button"
            >
              Sync
            </button>
          </div>
        </div>

        <div className="grid gap-3">
          {paymentsLoading ? (
            <PaymentListSkeleton />
          ) : payments.length === 0 ? (
            <p className="rounded-md border border-white/10 bg-slate-950 p-4 text-sm text-slate-400">
              No payments loaded yet.
            </p>
          ) : (
            payments.map((payment) => (
              <PaymentRow
                isSelected={selected.includes(payment.id)}
                key={payment.id}
                onClassify={(classification) =>
                  updateClassification(payment.id, classification)
                }
                onToggle={() =>
                  setSelected((current) =>
                    current.includes(payment.id)
                      ? current.filter((id) => id !== payment.id)
                      : [...current, payment.id],
                  )
                }
                payment={payment}
              />
            ))
          )}
        </div>
      </section>

      <form
        className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5"
        onSubmit={createProof}
      >
        <div>
          <h2 className="text-xl font-semibold text-white">Minimum Income Proof</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            The public credential discloses the threshold, period, asset,
            qualifying payment count, wallet hash, and proof status.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field
            label="Threshold"
            onChange={setThresholdAmount}
            type="text"
            value={thresholdAmount}
          />
          <Field
            label="Period start"
            onChange={setPeriodStart}
            type="date"
            value={periodStart}
          />
          <Field
            label="Period end"
            onChange={setPeriodEnd}
            type="date"
            value={periodEnd}
          />
        </div>
        <button
          aria-describedby={error ? "create-proof-feedback" : undefined}
          className="h-10 w-fit rounded-md bg-cyan-300 px-4 text-xs font-semibold text-slate-950 disabled:opacity-50"
          disabled={!token || selectedIncomePayments.length === 0}
          type="submit"
        >
          Create proof
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
                plan={buildVerificationLinkExport(
                  `${appConfig.appUrl}/verify?proof=${encodeURIComponent(proof.proofId)}`,
                )}
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

function PaymentRow({
  payment,
  isSelected,
  onToggle,
  onClassify,
}: {
  payment: Payment;
  isSelected: boolean;
  onToggle: () => void;
  onClassify: (classification: PaymentClassification) => void;
}) {
  const canSelect = payment.classification === "INCOME" && payment.isEligible;

  return (
    <div className="grid gap-3 rounded-md border border-white/10 bg-slate-950 p-4 text-sm text-slate-300 sm:min-h-24 sm:grid-cols-[auto_1fr_auto] sm:items-center">
      <input
        aria-label="Select payment"
        checked={isSelected}
        disabled={!canSelect}
        onChange={onToggle}
        type="checkbox"
      />
      <div className="min-w-0">
        <p className="font-medium text-white">
          {payment.assetCode} incoming payment
        </p>
        <p className="mt-1 break-words text-xs text-slate-400">
          {payment.stellarTransactionHash}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {new Date(payment.occurredAt).toLocaleString()}
        </p>
      </div>
      <select
        aria-label="Payment classification"
        className="h-10 rounded-md border border-white/10 bg-slate-900 px-3 text-white"
        onChange={(event) =>
          onClassify(event.target.value as PaymentClassification)
        }
        value={payment.classification}
      >
        <option value="UNKNOWN">Unknown</option>
        <option value="INCOME">Income</option>
        <option value="REIMBURSEMENT">Reimbursement</option>
        <option value="PERSONAL_TRANSFER">Personal transfer</option>
        <option value="EXCLUDED">Excluded</option>
      </select>
    </div>
  );
}

function Field({
  label,
  value,
  type,
  onChange,
}: {
  label: string;
  value: string;
  type: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-200">
      {label}
      <input
        className="h-11 rounded-md border border-white/10 bg-slate-900 px-4 text-white"
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}

// The Freighter wallet SDK is loaded on demand, only once a worker actually
// starts the connect flow on this route. This keeps `@stellar/freighter-api`
// out of the initial First Load JS for /proofs/create (and, by construction,
// out of every public route that never renders this component).
async function loadFreighter(): Promise<{
  getAddress: typeof getAddress;
  requestAccess: typeof requestAccess;
  signMessage: typeof signMessage;
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
