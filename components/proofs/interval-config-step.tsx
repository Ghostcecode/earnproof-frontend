"use client";

import { SUPPORTED_INTERVAL_UNITS, validateIntervalConfiguration, formatInterval, type IntervalUnit } from "@/lib/api/recurring-income-proofs";

export function IntervalConfigStep({
  intervalUnit,
  intervalCount,
  onIntervalUnitChange,
  onIntervalCountChange,
}: {
  intervalUnit: IntervalUnit;
  intervalCount: number;
  onIntervalUnitChange: (unit: IntervalUnit) => void;
  onIntervalCountChange: (count: number) => void;
}) {
  const validationError = validateIntervalConfiguration(intervalUnit, intervalCount);

  const getMaxCount = (unit: IntervalUnit): number => {
    switch (unit) {
      case "DAILY": return 365;
      case "WEEKLY": return 52;
      case "MONTHLY": return 12;
      case "YEARLY": return 5;
      default: return 12;
    }
  };

  return (
    <section className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <div>
        <h2 className="text-xl font-semibold text-white">Interval Configuration</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Configure how often you expect to receive income payments. This defines the recurring pattern that will be verified.
        </p>
      </div>

      <div className="grid gap-6">
        <div>
          <fieldset>
            <legend className="text-sm font-medium text-slate-200 mb-3">
              Interval Unit
            </legend>
            <div className="grid gap-3 md:grid-cols-2">
              {SUPPORTED_INTERVAL_UNITS.map((unit) => (
                <label
                  key={unit.value}
                  className={`flex gap-3 rounded-md border p-4 cursor-pointer transition ${
                    intervalUnit === unit.value
                      ? "border-cyan-300/50 bg-cyan-300/5"
                      : "border-white/10 bg-slate-950 hover:bg-slate-900"
                  }`}
                >
                  <input
                    type="radio"
                    name="interval-unit"
                    value={unit.value}
                    checked={intervalUnit === unit.value}
                    onChange={(e) => onIntervalUnitChange(e.target.value as IntervalUnit)}
                    className="mt-1 h-4 w-4"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">
                      {unit.label}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {unit.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div>
          <label htmlFor="interval-count" className="block text-sm font-medium text-slate-200">
            Interval Count
          </label>
          <div className="mt-1 flex items-center gap-4">
            <input
              id="interval-count"
              type="number"
              min="1"
              max={getMaxCount(intervalUnit)}
              className="h-11 w-32 rounded-md border border-white/10 bg-slate-900 px-4 text-white"
              value={intervalCount}
              onChange={(e) => onIntervalCountChange(parseInt(e.target.value) || 1)}
            />
            <div className="text-sm text-slate-300">
              {intervalUnit && intervalCount > 0 && (
                <span>
                  Every <strong>{formatInterval(intervalUnit, intervalCount)}</strong>
                </span>
              )}
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            How frequently you expect to receive payments. Maximum: {getMaxCount(intervalUnit)} for {intervalUnit.toLowerCase()} intervals.
          </p>
        </div>

        {validationError && (
          <div className="rounded-md border border-rose-300/30 bg-rose-300/10 p-3">
            <p className="text-sm text-rose-200" role="alert">
              {validationError}
            </p>
          </div>
        )}

        {!validationError && intervalUnit && intervalCount > 0 && (
          <div className="rounded-md border border-emerald-300/30 bg-emerald-300/10 p-3">
            <div className="flex items-start gap-3">
              <svg className="h-4 w-4 text-emerald-100 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h4 className="text-sm font-semibold text-emerald-100">Interval Configured</h4>
                <p className="mt-1 text-xs text-emerald-200">
                  You'll create a proof showing income received every <strong>{formatInterval(intervalUnit, intervalCount)}</strong>. 
                  The system will analyze your payment history to verify this pattern.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}