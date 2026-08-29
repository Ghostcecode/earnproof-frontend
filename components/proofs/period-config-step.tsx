"use client";

import { validatePeriodConfiguration, formatInterval, type IntervalUnit } from "@/lib/api/recurring-income-proofs";

export function PeriodConfigStep({
  periodStart,
  periodEnd,
  intervalUnit,
  intervalCount,
  onPeriodStartChange,
  onPeriodEndChange,
}: {
  periodStart: string;
  periodEnd: string;
  intervalUnit: IntervalUnit;
  intervalCount: number;
  onPeriodStartChange: (date: string) => void;
  onPeriodEndChange: (date: string) => void;
}) {
  const validationError = validatePeriodConfiguration(periodStart, periodEnd, intervalUnit, intervalCount);

  const calculateExpectedIntervals = () => {
    if (!periodStart || !periodEnd) return null;
    
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    let intervalDays: number;
    switch (intervalUnit) {
      case "DAILY":
        intervalDays = intervalCount;
        break;
      case "WEEKLY":
        intervalDays = intervalCount * 7;
        break;
      case "MONTHLY":
        intervalDays = intervalCount * 30; // Approximate
        break;
      case "YEARLY":
        intervalDays = intervalCount * 365; // Approximate
        break;
      default:
        return null;
    }
    
    return Math.floor(totalDays / intervalDays);
  };

  const expectedIntervals = calculateExpectedIntervals();

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const getDateConstraints = () => {
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    const sixMonthsFromNow = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate());
    
    return {
      min: formatDateForInput(oneYearAgo),
      max: formatDateForInput(sixMonthsFromNow),
    };
  };

  const constraints = getDateConstraints();

  return (
    <section className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <div>
        <h2 className="text-xl font-semibold text-white">Period Configuration</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Define the time period over which your recurring income pattern will be verified.
          Make sure the period is long enough to include multiple payment intervals.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="rounded-lg border border-cyan-300/30 bg-cyan-300/5 p-4">
          <h3 className="text-sm font-semibold text-cyan-100">Selected Interval</h3>
          <p className="mt-1 text-sm text-cyan-200">
            Payments expected every <strong>{formatInterval(intervalUnit, intervalCount)}</strong>
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="period-start" className="block text-sm font-medium text-slate-200">
              Period Start
            </label>
            <input
              id="period-start"
              type="date"
              min={constraints.min}
              max={constraints.max}
              className="mt-1 h-11 w-full rounded-md border border-white/10 bg-slate-900 px-4 text-white"
              value={periodStart}
              onChange={(e) => onPeriodStartChange(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="period-end" className="block text-sm font-medium text-slate-200">
              Period End
            </label>
            <input
              id="period-end"
              type="date"
              min={constraints.min}
              max={constraints.max}
              className="mt-1 h-11 w-full rounded-md border border-white/10 bg-slate-900 px-4 text-white"
              value={periodEnd}
              onChange={(e) => onPeriodEndChange(e.target.value)}
            />
          </div>
        </div>

        {validationError && (
          <div className="rounded-md border border-rose-300/30 bg-rose-300/10 p-3">
            <p className="text-sm text-rose-200" role="alert">
              {validationError}
            </p>
          </div>
        )}

        {!validationError && periodStart && periodEnd && expectedIntervals !== null && (
          <div className="rounded-md border border-emerald-300/30 bg-emerald-300/10 p-3">
            <div className="flex items-start gap-3">
              <svg className="h-4 w-4 text-emerald-100 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h4 className="text-sm font-semibold text-emerald-100">Period Analysis</h4>
                <div className="mt-1 grid gap-1 text-xs text-emerald-200">
                  <div>
                    <strong>Duration:</strong> {Math.ceil((new Date(periodEnd).getTime() - new Date(periodStart).getTime()) / (1000 * 60 * 60 * 24))} days
                  </div>
                  <div>
                    <strong>Expected intervals:</strong> {expectedIntervals} payments
                  </div>
                  <div>
                    <strong>Frequency:</strong> Every {formatInterval(intervalUnit, intervalCount)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-md border border-amber-300/30 bg-amber-300/10 p-3">
          <div className="flex items-start gap-2">
            <svg className="h-4 w-4 text-amber-100 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <h4 className="text-xs font-semibold text-amber-100">Period Guidelines</h4>
              <p className="mt-1 text-xs text-amber-200">
                Choose a period that includes at least 2-3 payment intervals to demonstrate the recurring pattern. 
                Too short a period may not provide sufficient evidence of regularity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}