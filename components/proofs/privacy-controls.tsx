"use client";

import { getPrivacyImpactMessage } from "@/lib/api/payment-receipt-proofs";
import { DISCLOSURE_EXPLANATIONS } from "@/lib/validation/payment-receipt-proofs";

export function PrivacyControls({
  discloseSender,
  discloseAmount,
  onDiscloseSenderChange,
  onDiscloseAmountChange,
  disabled,
}: {
  discloseSender: boolean;
  discloseAmount: boolean;
  onDiscloseSenderChange: (disclose: boolean) => void;
  onDiscloseAmountChange: (disclose: boolean) => void;
  disabled: boolean;
}) {
  return (
    <section className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <div>
        <h2 className="text-xl font-semibold text-white">Privacy Controls</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Choose what information to disclose in your payment receipt proof. 
          <strong className="text-white"> Both fields default to hidden for maximum privacy.</strong>
        </p>
      </div>

      <div className="grid gap-6">
        <fieldset disabled={disabled} className="grid gap-4">
          <legend className="text-sm font-medium text-slate-200">
            Disclosure Preferences
          </legend>
          
          <div className="grid gap-4 md:grid-cols-2">
            {/* Sender Disclosure */}
            <div className={`rounded-lg border p-4 ${
              disabled 
                ? "border-white/5 bg-slate-900/50" 
                : "border-white/10 bg-slate-950"
            }`}>
              <h3 className="text-sm font-medium text-white">Sender Information</h3>
              <p className="mt-1 text-xs text-slate-400">
                Control whether the sender's identity is revealed to verifiers.
              </p>
              
              <div className="mt-3 grid gap-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="sender-disclosure"
                    checked={!discloseSender}
                    onChange={() => onDiscloseSenderChange(false)}
                    disabled={disabled}
                    className="mt-1 h-4 w-4"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">
                      Keep Private (Recommended)
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {DISCLOSURE_EXPLANATIONS.sender.hidden}
                    </div>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="sender-disclosure"
                    checked={discloseSender}
                    onChange={() => onDiscloseSenderChange(true)}
                    disabled={disabled}
                    className="mt-1 h-4 w-4"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">
                      Disclose to Verifiers
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {DISCLOSURE_EXPLANATIONS.sender.disclosed}
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Amount Disclosure */}
            <div className={`rounded-lg border p-4 ${
              disabled 
                ? "border-white/5 bg-slate-900/50" 
                : "border-white/10 bg-slate-950"
            }`}>
              <h3 className="text-sm font-medium text-white">Payment Amount</h3>
              <p className="mt-1 text-xs text-slate-400">
                Control whether the exact payment amount is revealed to verifiers.
              </p>
              
              <div className="mt-3 grid gap-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="amount-disclosure"
                    checked={!discloseAmount}
                    onChange={() => onDiscloseAmountChange(false)}
                    disabled={disabled}
                    className="mt-1 h-4 w-4"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">
                      Keep Private (Recommended)
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {DISCLOSURE_EXPLANATIONS.amount.hidden}
                    </div>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="amount-disclosure"
                    checked={discloseAmount}
                    onChange={() => onDiscloseAmountChange(true)}
                    disabled={disabled}
                    className="mt-1 h-4 w-4"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">
                      Disclose to Verifiers
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {DISCLOSURE_EXPLANATIONS.amount.disclosed}
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </fieldset>

        {/* Privacy Impact Summary */}
        <div className={`rounded-md border p-3 ${
          discloseSender || discloseAmount
            ? "border-amber-300/30 bg-amber-300/10"
            : "border-emerald-300/30 bg-emerald-300/10"
        }`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {discloseSender || discloseAmount ? (
                <svg className="h-4 w-4 text-amber-100" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-emerald-100" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h4 className={`text-sm font-semibold ${
                discloseSender || discloseAmount ? "text-amber-100" : "text-emerald-100"
              }`}>
                Privacy Impact
              </h4>
              <p className={`mt-1 text-xs ${
                discloseSender || discloseAmount ? "text-amber-200" : "text-emerald-200"
              }`}>
                {getPrivacyImpactMessage(discloseSender, discloseAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {disabled && (
        <div className="rounded-md border border-slate-600 bg-slate-800 p-3">
          <p className="text-sm text-slate-400">
            Select a payment above to configure privacy settings.
          </p>
        </div>
      )}
    </section>
  );
}