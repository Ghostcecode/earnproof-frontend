import { SkeletonBlock, SkeletonContainer } from "@/components/common/skeleton/skeleton-base";

/**
 * Placeholder for the `/status` page's metrics + service table while the
 * first health check is still in flight (`useHealthCheck`'s initial
 * `loading` state, before any `data` has arrived). Mirrors `MetricGrid`
 * (three metric cards) and `DataPanel`'s row layout so the page doesn't
 * jump once the real health check resolves.
 */
export function StatusCheckSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <SkeletonContainer className="grid gap-4 sm:gap-5" label="Checking system status...">
      <div className="grid w-full gap-3 sm:max-w-[1104px] sm:grid-cols-3 sm:gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            className="rounded-lg border border-white/10 bg-white/[0.04] p-[18px]"
            key={index}
          >
            <SkeletonBlock className="h-8 w-16" />
            <SkeletonBlock className="mt-[7px] h-4 w-24" />
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 sm:p-5">
        <div className="grid gap-3 md:gap-0">
          {Array.from({ length: rows }).map((_, index) => (
            <div
              className="grid gap-2 border border-white/10 p-3 md:min-h-[58px] md:grid-cols-[1.3fr_1fr_1fr_1fr] md:items-center md:gap-2 md:px-2"
              key={index}
            >
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="h-4 w-20" />
              <SkeletonBlock className="h-4 w-20" />
              <SkeletonBlock className="h-7 w-16 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonContainer>
  );
}
