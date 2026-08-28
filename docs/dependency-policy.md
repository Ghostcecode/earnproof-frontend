# Dependency Upgrade Policy

This document defines how `earnproof-frontend` evaluates and validates
upgrades to its framework, wallet, QR, and browser-API-adjacent
dependencies, and how emergency security patches are handled outside the
normal review cadence. It complements
[docs/browser-support.md](./browser-support.md), which defines the browser
matrix these upgrades must keep working.

Framework, wallet, and browser-API upgrades can silently change runtime
behavior (a new Next.js major changes routing/headers semantics, a new
Freighter API version changes the wallet handshake, a browser dropping a
feature changes what "supported" means) without ever failing a type check.
This policy exists so those changes get a deliberate compatibility decision
instead of riding through as a routine `npm update`.

<!-- doc-freshness:start -->
Reviewed against: next 16.3.0, react 19.2.4, @stellar/freighter-api ^6.0.1
Last reviewed: 2026-08-28
<!-- doc-freshness:end -->

## Dependency tiers

| Tier | Packages | Why | Required regression coverage before merge |
| --- | --- | --- | --- |
| Critical (framework) | `next`, `react`, `react-dom`, `typescript` | Everything renders through these; a major bump can change routing, headers, hydration, or the type system | Full suite: `npm run lint`, `npm run test -- --runInBand`, `npm run test:contracts`, `npm run build`, `npm run test:e2e`, `npm run test:e2e:a11y`, `npm run test:e2e:visual`, `node scripts/performance/check-budgets.js` |
| High-risk (wallet) | `@stellar/freighter-api` | Governs the challenge/sign/verify handshake that authenticates every proof-creation session | `npm run test:e2e` (wallet-auth.spec.ts, proof-creation.spec.ts), plus a manual Freighter smoke test per [docs/browser-support.md](./browser-support.md) — CI cannot exercise a real wallet extension |
| High-risk (browser-API-adjacent) | none pinned today (`BarcodeDetector`/`getUserMedia`/`clipboard`/`sendBeacon` are native browser APIs, not npm packages) — this tier exists for when a QR/camera/clipboard *polyfill* package is added | A polyfill changing scan/copy/telemetry behavior | `npm run test:e2e:a11y` (scans.spec.ts) plus the manual fallback spot-check in [docs/browser-support.md](./browser-support.md#validation) |
| Standard | `@tanstack/react-query`, `react-hook-form`, `zod`, `tailwindcss`, `eslint`, `eslint-config-next`, `jest` and testing-library packages, `@playwright/test`, `@axe-core/playwright`, `tsx` | Development/build tooling or well-isolated runtime libraries | `npm run lint`, `npm run test -- --runInBand`, `npm run build` |

If a package could plausibly belong to more than one tier (for example, a
`react-hook-form` bump that changes validation timing on the proof-creation
form), treat it as the higher tier.

## Update evidence requirements

- **Lockfile-only updates** (patch/minor within an existing major, no
  `package.json` range change): run the tier's required coverage above and
  paste the command output (or CI run link) into the PR. No separate
  compatibility write-up is required.
- **Major-version updates**, and any update to a Critical or High-risk tier
  package regardless of semver level: the PR description must include
  reproducible evidence, not just "tests pass" — attach the actual command
  output for every command in the tier's required coverage, plus a short
  note on what was manually verified (Freighter handshake, QR fallback,
  etc.) and on which browser from the [browser-support matrix](./browser-support.md#supported-browsers).
  A green CI badge alone is not sufficient evidence for these updates.
- Every dependency update PR must run `node scripts/check-doc-freshness.js`
  (wired into CI) — if the bump touches `next`, `react`, or
  `@stellar/freighter-api`, the check fails until this file and
  [docs/browser-support.md](./browser-support.md) are updated to match, so
  a version bump can't merge without a human re-reading the compatibility
  notes above.

## Emergency patch handling

A security advisory affecting a dependency in this project (via
`npm audit`, GitHub Dependabot alerts, or an upstream CVE) is handled
outside the normal review cadence in [MAINTAINERS.md](../MAINTAINERS.md):

1. Confirm the advisory actually affects a code path this app exercises
   (many advisories are in transitive dev-only dependencies with no
   production impact) before treating it as urgent.
2. If it does, patch to the minimum version that resolves the advisory —
   do not bundle an unrelated major bump into the same emergency PR.
3. Run the tier's required coverage from the table above; for a Critical or
   High-risk tier package, still attach the evidence required by "Major
   version updates" above even though this is time-pressured — a broken
   emergency patch is worse than a slightly slower one.
4. Escalate and merge per the emergency path in
   [SECURITY.md](../SECURITY.md) rather than waiting for the standard
   two-business-day triage window in
   [MAINTAINERS.md](../MAINTAINERS.md#review-expectations).
5. Follow the release runbook (`docs/release-runbook.md`, tracked
   separately — see issue #83) for promotion and rollback — an emergency
   patch does not skip the pre-release checklist, it skips the queue.

## Keeping this current

Run:

```bash
node scripts/check-doc-freshness.js
```

Same check described in
[docs/browser-support.md](./browser-support.md#keeping-this-current) — it
reads the `doc-freshness` block above and fails if `package.json` has moved
on without this document being updated. CI runs it as part of the
`frontend` job in [.github/workflows/ci.yml](../.github/workflows/ci.yml).
