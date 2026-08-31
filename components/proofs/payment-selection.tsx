"use client";

import { useMemo } from "react";

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

export function PaymentSelection({
  payments,
  selectedPaymentId,
  onPaymentSelect,
  onSyncPayments,
  onRefreshPayments,
  loading,
  disabled,
}: {
  payments: Payment[];
  selectedPaymentId: string | null;
  onPaymentSelect: (paymentId: string | null) => void;
  onSyncPayments: () => void;
  onRefreshPayments: () => void;
  loading: boolean;
  disabled: boolean;
}) {
  const eligiblePayments = useMemo(
    () => payments.filter(p => p.isEligible && p.classification !== "EXCLUDED"),
    [payments]
  );

  return (
    <section className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-white">Select Payment</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Choose one eligible payment to create a receipt proof for. Only payments you own and that are eligible can be selected.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="h-10 rounded-md border border-white/15 px-4 text-xs font-semibold text-white disabled:opacity-50"
            disabled={disabled || loading}
            onClick={onRefreshPayments}
            type="button"
          >
            Refresh
          </button>
          <button
            className="h-10 rounded-md bg-cyan-300 px-4 text-xs font-semibold text-slate-950 disabled:opacity-50"
            disabled={disabled || loading}
            onClick={onSyncPayments}
            type="button"
          >
            Sync New
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        {loading ? (
          <p className="rounded-md border border-white/10 bg-slate-950 p-4 text-sm text-slate-400">
            Connect your wallet to load payments.
          </p>
        ) : eligiblePayments.length === 0 ? (
          <div className="rounded-md border border-white/10 bg-slate-950 p-4">
            <p className="text-sm text-slate-400">
              No eligible payments found.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Sync your payments or ensure you have eligible payments that aren't excluded from proof creation.
            </p>
          </div>
        ) : (
          <fieldset>
            <legend className="sr-only">Select a payment</legend>
            <div className="grid gap-3">
              {eligiblePayments.map((payment) => (
                <PaymentCard
                  key={payment.id}
                  payment={payment}
                  isSelected={selectedPaymentId === payment.id}
                  onSelect={() => onPaymentSelect(payment.id)}
                />
              ))}
            </div>
          </fieldset>
        )}
      </div>
    </section>
  );
}

function PaymentCard({
  payment,
  isSelected,
  onSelect,
}: {
  payment: Payment;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  const getClassificationColor = (classification: PaymentClassification) => {
    switch (classification) {
      case "INCOME":
        return "text-emerald-300";
      case "REIMBURSEMENT":
        return "text-blue-300";
      case "PERSONAL_TRANSFER":
        return "text-purple-300";
      default:
        return "text-slate-300";
    }
  };

  return (
    <label
      className={`block cursor-pointer rounded-md border p-4 transition ${
        isSelected
          ? "border-cyan-300/50 bg-cyan-300/5"
          : "border-white/10 bg-slate-950 hover:border-white/20 hover:bg-slate-900"
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="radio"
          name="selected-payment"
          checked={isSelected}
          onChange={onSelect}
          className="mt-1 h-4 w-4"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-white">
                {payment.assetCode} Payment
              </h3>
              <p className="mt-1 text-xs font-mono text-slate-400 break-all">
                {truncateHash(payment.stellarTransactionHash)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-300">
                {formatDate(payment.occurredAt)}
              </p>
              <p className={`mt-1 text-xs font-medium ${getClassificationColor(payment.classification)}`}>
                {payment.classification.replace("_", " ")}
              </p>
            </div>
          </div>
          
          <div className="mt-3 grid gap-1 text-xs text-slate-400">
            <div>
              <span className="font-medium">From:</span> {payment.sourceAddress}
            </div>
            {payment.assetIssuer && (
              <div>
                <span className="font-medium">Issuer:</span> {payment.assetIssuer}
              </div>
            )}
          </div>
          
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {payment.isEligible ? (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Eligible
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Not Eligible
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </label>
  );
}