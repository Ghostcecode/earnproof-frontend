/**
 * Framework-free submission lock + response-correlation guard for a form
 * that must have at most one active submission at a time, and must only
 * let the response belonging to the *current* submission update state.
 *
 * This intentionally has no dependency on React, fetch, or any particular
 * form — components/proofs/create-proof-flow.tsx holds one instance in a
 * ref for the lifetime of the component.
 */
export type SubmissionGuard = {
  /**
   * Starts a new submission if none is active. Returns the new
   * submission's id, or `null` if a submission is already in flight (the
   * caller should treat that as "ignore this click" rather than firing a
   * second request).
   */
  begin(): number | null;
  /**
   * True if `id` is still the active submission — i.e. no newer `begin()`
   * has started, and neither `end()` nor `invalidate()` has been called
   * since. A response handler should check this before applying its
   * result to state.
   */
  isCurrent(id: number): boolean;
  /** Marks `id`'s submission as finished. No-ops if it is not the active one. */
  end(id: number): void;
  /**
   * Clears the active submission regardless of its id, without starting a
   * new one. Use this when something outside the normal submit/response
   * cycle invalidates whatever is in flight (for example, the user
   * disconnects their wallet while a proof-creation request is still
   * pending) — any response for the invalidated submission will then fail
   * its `isCurrent` check, and `begin()` becomes available again
   * immediately instead of staying locked on a request that may never
   * resolve.
   */
  invalidate(): void;
  isActive(): boolean;
};

export function createSubmissionGuard(): SubmissionGuard {
  let activeId: number | null = null;
  let nextId = 1;

  return {
    begin() {
      if (activeId !== null) {
        return null;
      }
      activeId = nextId;
      nextId += 1;
      return activeId;
    },
    isCurrent(id) {
      return activeId === id;
    },
    end(id) {
      if (activeId === id) {
        activeId = null;
      }
    },
    invalidate() {
      activeId = null;
    },
    isActive() {
      return activeId !== null;
    },
  };
}
