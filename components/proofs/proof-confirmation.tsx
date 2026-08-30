"use client";

import { formatDisclosureChoice } from "@/lib/api/payment-receipt-proofs";

type Payment = {
  id: string;
  stellarTransactionHash: string;
  sourceAddress: string;
  assetCode: string;
  assetIssuer: string | null;
  occurredAt: string;
  classification: string;
  isEligible: boolean;
};

export function ProofConfirmation({
  payment,
  discloseSender,
  discloseAmount,
  expiresInDays,
}: {
  payment: Payment;
  discloseSender: boolean;
  discloseAmount: boolean;
  expiresInDays: number;
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
    return `${hash.slice(0, 12)}...${hash.slice(-12)}`;
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  return (
    <div className="rounded-lg border border-cyan-300/50 bg-cyan-300/5 p-4">
      <h3 className="text-lg font-semibold text-white">Proof Preview</h3>
      <p className="mt-1 text-sm text-slate-300">
        Review what will be included in your payment receipt proof before creation.
      </p>

      <div className="mt-4 grid gap-4">
        {/* Payment Information */}
        <div>
          <h4 className="text-sm font-semibold text-slate-200">Payment Details</h4>
          <dl className="mt-2 grid gap-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-400">Asset:</dt>
              <dd className="text-slate-200">{payment.assetCode}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Date:</dt>
              <dd className="text-slate-200">{formatDate(payment.occurredAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Transaction:</dt>
              <dd className="text-slate-200 font-mono text-xs">
                {truncateHash(payment.stellarTransactionHash)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Privacy Disclosure */}
        <div>
          <h4 className="text-sm font-semibold text-slate-200">Privacy Settings</h4>
          <div className="mt-2 grid gap-2">
            <div className="flex items-center justify-between p-2 rounded border border-white/10 bg-slate-950">
              <div className="text-sm text-slate-300">Sender Information:</div>
              <div className="flex items-center gap-2">
                {discloseSender ? (
                  <>
                    <svg className="h-4 w-4 text-amber-300" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs text-amber-200 font-medium">Visible</span>
                    <span className="text-xs text-slate-400 font-mono">
                      {truncateAddress(payment.sourceAddress)}
                    </span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 text-emerald-300" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                    <span className="text-xs text-emerald-200 font-medium">Private</span>
                    <span className="text-xs text-slate-400">Hidden from verifiers</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded border border-white/10 bg-slate-950">
              <div className="text-sm text-slate-300">Payment Amount:</div>
              <div className="flex items-center gap-2">
                {discloseAmount ? (
                  <>
                    <svg className="h-4 w-4 text-amber-300" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs text-amber-200 font-medium">Visible</span>
                    <span className="text-xs text-slate-400">Exact amount disclosed</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 text-emerald-300" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                    <span className="text-xs text-emerald-200 font-medium">Private</span>
                    <span className="text-xs text-slate-400">Hidden from verifiers</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Proof Metadata */}
        <div>
          <h4 className="text-sm font-semibold text-slate-200">Proof Configuration</h4>
          <dl className="mt-2 grid gap-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-400">Expires in:</dt>
              <dd className="text-slate-200">{expiresInDays} days</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Proof type:</dt>
              <dd className="text-slate-200">Payment Receipt</dd>
            </div>
          </dl>
        </div>

        {/* Warning for disclosed information */}
        {(discloseSender || discloseAmount) && (
          <div className="rounded-md border border-amber-300/30 bg-amber-300/10 p-3">
            <div className="flex items-start gap-2">
              <svg className="h-4 w-4 text-amber-100 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <h5 className="text-xs font-semibold text-amber-100">Information Disclosure Warning</h5>
                <p className="mt-1 text-xs text-amber-200">
                  You have chosen to disclose{" "}
                  {discloseSender && discloseAmount
                    ? "both sender and amount information"
                    : discloseSender
                    ? "sender information"
                    : "amount information"}
                  . This information will be permanently visible to anyone who verifies this proof.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}