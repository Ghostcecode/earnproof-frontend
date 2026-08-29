"use client";

import { useMemo } from "react";

type PaymentClassification = "INCOME" | "REIMBURSEMENT" | "PERSONAL_TRANSFER" | "UNKNOWN" | "EXCLUDED";

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

type Asset = {
  code: string;
  issuer: string | null;
};

export function RecurringPaymentSelection({
  payments,
  availableAssets,
  selectedPaymentIds,
  selectedAsset,
  onPaymentSelection,
  onAssetSelection,
  onSyncPayments,
  onRefreshPayments,
  loading,
}: {
  payments: Payment[];
  availableAssets: Asset[];
  selectedPaymentIds: string[];
  selectedAsset: Asset | null;
  onPaymentSelection: (paymentIds: string[]) => void;
  onAssetSelection: (asset: Asset | null) => void;
  onSyncPayments: () => void;
  onRefreshPayments: () => void;
  loading: boolean;
}) {
  const assetKey = (asset: Asset) => `${asset.code}:${asset.issuer || 'native'}`;

  return (
    <section className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-white">Payment Selection</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Choose payments that demonstrate your recurring income pattern. Only eligible income payments are shown.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="h-10 rounded-md border border-white/15 px-4 text-xs font-semibold text-white disabled:opacity-50"
            disabled={loading}
            onClick={onRefreshPayments}
            type="button"
          >
            Refresh
          </button>
          <button
            className="h-10 rounded-md bg-cyan-300 px-4 text-xs font-semibold text-slate-950 disabled:opacity-50"
            disabled={loading}
            onClick={onSyncPayments}
            type="button"
          >
            Sync New
          </button>
        </div>
      </div>

      {availableAssets.length > 0 && (
        <div>
          <label htmlFor="asset-select" className="block text-sm font-medium text-slate-200">
            Asset Type
          </label>
          <select
            id="asset-select"
            className="mt-1 h-11 w-full max-w-sm rounded-md border border-white/10 bg-slate-900 px-4 text-white"
            value={selectedAsset ? assetKey(selectedAsset) : ""}
            onChange={(e) => {
              const [code, issuer] = e.target.value.split(':');
              onAssetSelection(e.target.value ? { code, issuer: issuer === 'native' ? null : issuer } : null);
            }}
          >
            <option value="">Select asset type</option>
            {availableAssets.map((asset) => (
              <option key={assetKey(asset)} value={assetKey(asset)}>
                {asset.code} {asset.issuer ? `(${asset.issuer.slice(0, 8)}...)` : '(Native)'}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-3">
        {loading ? (
          <p className="rounded-md border border-white/10 bg-slate-950 p-4 text-sm text-slate-400">
            Connect your wallet to load payments.
          </p>
        ) : !selectedAsset ? (
          <p className="rounded-md border border-white/10 bg-slate-950 p-4 text-sm text-slate-400">
            Select an asset type to view eligible payments.
          </p>
        ) : payments.length === 0 ? (
          <div className="rounded-md border border-white/10 bg-slate-950 p-4">
            <p className="text-sm text-slate-400">No eligible income payments found for this asset.</p>
          </div>
        ) : (
          <fieldset>
            <legend className="sr-only">Select payments</legend>
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-md">
                <span className="text-sm font-medium text-slate-300">
                  {selectedPaymentIds.length} of {payments.length} payments selected
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onPaymentSelection(payments.map(p => p.id))}
                    className="text-xs text-cyan-300 hover:text-cyan-200"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => onPaymentSelection([])}
                    className="text-xs text-slate-400 hover:text-slate-300"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              
              {payments.map((payment) => (
                <PaymentCard
                  key={payment.id}
                  payment={payment}
                  isSelected={selectedPaymentIds.includes(payment.id)}
                  onToggle={() => {
                    if (selectedPaymentIds.includes(payment.id)) {
                      onPaymentSelection(selectedPaymentIds.filter(id => id !== payment.id));
                    } else {
                      onPaymentSelection([...selectedPaymentIds, payment.id]);
                    }
                  }}
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
  onToggle,
}: {
  payment: Payment;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <label className={`block cursor-pointer rounded-md border p-4 transition ${
      isSelected
        ? "border-cyan-300/50 bg-cyan-300/5"
        : "border-white/10 bg-slate-950 hover:border-white/20"
    }`}>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="h-4 w-4"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-white">{payment.assetCode} Income</h3>
            <time className="text-xs text-slate-400">
              {new Date(payment.occurredAt).toLocaleDateString()}
            </time>
          </div>
          <p className="mt-1 text-xs font-mono text-slate-400 break-all">
            {payment.stellarTransactionHash.slice(0, 16)}...
          </p>
        </div>
      </div>
    </label>
  );
}