import type { HTMLAttributes } from "react";

/**
 * Lowest-level building block for loading skeletons: a single pulsing
 * placeholder block. Compose these into layout-matching skeletons rather
 * than reaching for `animate-pulse` + a div inline — keeps every skeleton
 * in the app using the same timing and shape language.
 *
 * Decorative only: `aria-hidden` so screen readers skip the placeholder
 * shapes themselves. The container that renders a list of these should
 * carry the `aria-busy`/`aria-live` region — see `SkeletonContainer`.
 */
export function SkeletonBlock({
  className = "",
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-white/[0.06] ${className}`}
      {...rest}
    />
  );
}

/**
 * Wraps a group of `SkeletonBlock`s with the ARIA plumbing screen readers
 * need to announce a loading state once and then go quiet:
 *
 * - `aria-busy="true"` marks the region as still loading.
 * - `aria-live="polite"` + `role="status"` announce the `label` once,
 *   without interrupting whatever the user is doing.
 * - The skeleton shapes are `aria-hidden` (see `SkeletonBlock`), so the
 *   only thing actually announced is the visually-hidden `label` text —
 *   not a wall of empty divs.
 */
export function SkeletonContainer({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={className}
      role="status"
    >
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
