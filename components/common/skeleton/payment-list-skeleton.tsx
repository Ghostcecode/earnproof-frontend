import { SkeletonBlock, SkeletonContainer } from "@/components/common/skeleton/skeleton-base";

/**
 * Placeholder for the payments list in `CreateProofFlow` while a payment
 * sync is in flight. Mirrors `PaymentRow`'s layout (checkbox + two-line
 * label + classification select, in a bordered row) so the page doesn't
 * jump when real rows replace it.
 */
export function PaymentListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <SkeletonContainer
      className="grid gap-3"
      label="Loading payments..."
    >
      {Array.from({ length: rows }).map((_, index) => (
        <div
          className="grid gap-3 rounded-md border border-white/10 bg-slate-950 p-4 sm:min-h-24 sm:grid-cols-[auto_1fr_auto] sm:items-center"
          key={index}
        >
          <SkeletonBlock className="h-4 w-4" />
          <div className="min-w-0 grid gap-2">
            <SkeletonBlock className="h-4 w-40" />
            <SkeletonBlock className="h-3 w-56" />
            <SkeletonBlock className="h-3 w-32" />
          </div>
          <SkeletonBlock className="h-10 w-full sm:w-36" />
        </div>
      ))}
    </SkeletonContainer>
  );
}
