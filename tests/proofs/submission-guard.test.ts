import { createSubmissionGuard } from "@/lib/proofs/submission-guard";

describe("createSubmissionGuard", () => {
  it("allows a submission to begin when none is active", () => {
    const guard = createSubmissionGuard();
    const id = guard.begin();
    expect(id).not.toBeNull();
    expect(guard.isActive()).toBe(true);
  });

  it("rejects a second submission while one is active (at most one active submission)", () => {
    const guard = createSubmissionGuard();
    const first = guard.begin();
    const second = guard.begin();

    expect(first).not.toBeNull();
    expect(second).toBeNull();
  });

  it("rejects every additional begin() call across many rapid attempts", () => {
    const guard = createSubmissionGuard();
    const first = guard.begin();
    const attempts = Array.from({ length: 10 }, () => guard.begin());

    expect(first).not.toBeNull();
    expect(attempts.every((id) => id === null)).toBe(true);
  });

  it("only the active submission id is current", () => {
    const guard = createSubmissionGuard();
    const id = guard.begin();
    expect(id).not.toBeNull();
    expect(guard.isCurrent(id as number)).toBe(true);
    expect(guard.isCurrent((id as number) + 1)).toBe(false);
  });

  it("allows a new submission after end(), and the old id is no longer current", () => {
    const guard = createSubmissionGuard();
    const first = guard.begin() as number;
    guard.end(first);

    expect(guard.isActive()).toBe(false);
    expect(guard.isCurrent(first)).toBe(false);

    const second = guard.begin();
    expect(second).not.toBeNull();
    expect(second).not.toBe(first);
  });

  it("end() is a no-op for an id that is not the active one", () => {
    const guard = createSubmissionGuard();
    const first = guard.begin() as number;
    guard.end(first + 1);

    // The real active submission is untouched.
    expect(guard.isActive()).toBe(true);
    expect(guard.isCurrent(first)).toBe(true);
  });

  it("invalidate() clears the active submission and its response is no longer current", () => {
    const guard = createSubmissionGuard();
    const first = guard.begin() as number;

    guard.invalidate();

    expect(guard.isActive()).toBe(false);
    expect(guard.isCurrent(first)).toBe(false);

    // A new submission can start immediately.
    const second = guard.begin();
    expect(second).not.toBeNull();
  });

  it("only the response belonging to the current submission is treated as current, even out of order", () => {
    const guard = createSubmissionGuard();

    const first = guard.begin() as number;
    guard.end(first);
    const second = guard.begin() as number;

    // Simulate the first (superseded) request finally resolving after the
    // second one already started.
    expect(guard.isCurrent(first)).toBe(false);
    expect(guard.isCurrent(second)).toBe(true);
  });
});
