import { SkeletonBlock, SkeletonContainer } from "@/components/common/skeleton/skeleton-base";

/**
 * Placeholder for `VerificationPanel` while a proof lookup is in flight.
 * Mirrors its layout — a status pill, a two-column grid of label/value
 * pairs, then an export-buttons row — so the panel doesn't jump when the
 * real result replaces it.
 */
export function VerifyResultSkeleton() {
  return (
    <SkeletonContainer
      className="rounded-lg border border-white/10 bg-white/[0.04] p-5"
      label="Looking up proof..."
    >
      <SkeletonBlock className="h-7 w-24 rounded-md" />

      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <div className="min-w-0 grid gap-2" key={index}>
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-4 w-full max-w-48" />
          </div>
        ))}
      </dl>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <SkeletonBlock className="h-10 w-full" />
        <SkeletonBlock className="h-10 w-full" />
      </div>
    </SkeletonContainer>
  );
}
