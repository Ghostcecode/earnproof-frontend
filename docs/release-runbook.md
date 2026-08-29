# Frontend Release Runbook

This runbook is specific to `earnproof-frontend`. It defines what a maintainer
must check before promoting a preview deployment to production, how to run
the pre-release smoke matrix, and how to roll back a bad release safely.

It exists because a passing preview build only proves the app compiled and
rendered — it does not prove configuration, dependent-API compatibility,
security headers, or the core wallet/proof flows are correct for production
traffic. Use this document, in order, for every release.

## 1. Ownership and escalation

- Release approver: the on-call maintainer listed in [MAINTAINERS.md](../MAINTAINERS.md).
  There is no dashboard-only owner list — MAINTAINERS.md is the source of truth.
- Deployment platform: Vercel, driven by `VERCEL_ENV` (`production` /
  `preview`), consumed by [`resolveDeploymentProfile`](../lib/validation/env.ts).
  There is no separate manual deploy dashboard step to know about beyond the
  GitHub merge that triggers it.
- If a release must be blocked or reverted and the on-call maintainer is
  unreachable within one business day (per the response times in
  [MAINTAINERS.md](../MAINTAINERS.md)), escalate by opening a `SECURITY.md`
  report if the issue is security-relevant, otherwise open a repository issue
  tagged `release-blocker` and ping every listed maintainer.
- Anyone performing a release must have push access to `main` and a Vercel
  role that can trigger a promote/rollback; this document does not grant
  either — request access through the maintainers first.

## 2. Pre-release checklist

Run this checklist against the exact commit being promoted, not an older
preview build of the same branch.

### 2.1 Configuration

- [ ] `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_STELLAR_NETWORK`,
      `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE`, and `NEXT_PUBLIC_STELLAR_HORIZON_URL`
      are all set in the target Vercel environment. Production and preview both
      fail closed (build throws) if any are missing — see
      [`loadPublicEnv`](../lib/validation/env.ts). A successful build is
      itself evidence this passed; attach the build log link as evidence.
- [ ] `NEXT_PUBLIC_STELLAR_NETWORK` is `testnet` (the only supported value
      today). If a release intends to change this, treat it as a breaking
      change requiring its own sign-off, not a routine release.
- [ ] Confirm no secret keys or signing material were added to any
      `NEXT_PUBLIC_*` variable or committed file (manual verification —
      `git grep -n "SECRET\|PRIVATE_KEY" -- ':!node_modules'` on the release
      commit as a fast check, not a substitute for review).

### 2.2 Dependent-API compatibility (migrations in `earnproof-backend`)

This repository has no database of its own; "migrations" here means the
paired `earnproof-backend` API contract this frontend consumes.

- [ ] `npm run test:contracts` passes locally against the release commit —
      it runs `scripts/check-api-drift.js` and regenerates
      `lib/api/generated/v1.ts` in check mode, failing if the checked-in
      OpenAPI contract (`lib/api/openapi/earnproof-api.v1.json`) has drifted
      from generated types.
- [ ] If `earnproof-backend` is deploying a breaking API change alongside
      this release, confirm with the backend maintainer which deploys first.
      A backend-first deploy must keep the previous response shape until this
      frontend release is live; a frontend-first deploy must tolerate the
      current backend contract. (Manual verification — coordinate in the
      release issue or PR thread; there is no automated cross-repo check.)

### 2.3 Browser support

- [ ] Confirm the release was validated on the current minimum supported
      browser matrix: latest two stable releases of Chrome, Firefox, Safari,
      and Edge on desktop, plus latest stable Safari on iOS and Chrome on
      Android. If `docs/browser-support.md` exists in this repository at
      release time, use its matrix instead — that document supersedes this
      list when the two disagree.
- [ ] Freighter wallet flows (`/proofs/create`) were smoke-tested in a
      Chromium-based browser with the Freighter extension installed — this
      is the only supported wallet browser environment; other browsers must
      show the no-wallet-detected fallback state instead of a broken flow.

### 2.4 Security headers

- [ ] Fetch the deployed preview and confirm the response headers match
      [`config/security-headers.ts`](../config/security-headers.ts):
      `Content-Security-Policy` (nonce-based `script-src`/`style-src`, no
      `unsafe-inline`, no `*` wildcards), plus the remaining headers from
      `nextHeaderList`. Example check:
      ```bash
      curl -sI https://<preview-url>/ | grep -i "content-security-policy\|x-frame-options\|strict-transport-security"
      ```
- [ ] Confirm `connect-src` in the CSP only lists the app origin, API origin,
      Stellar Horizon origin, and (if configured) the web-vitals origin —
      no unexpected third-party hosts. See [SECURITY.md](../SECURITY.md) for
      the nonce/`strict-dynamic` justification if a header looks wrong.

### 2.5 Core flows

Run the automated suites, then the manual smoke matrix in section 3 against
the actual preview URL:

```bash
npm run lint
npm run test -- --runInBand
npm run test:contracts
npm run build
npm run test:e2e
npm run test:e2e:a11y
npm run test:e2e:visual
node scripts/performance/check-budgets.js
```

These are the same commands CI runs in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
(`frontend`, `e2e`, and `visual-regression` jobs). CI green is required but
is not a substitute for the manual preview smoke matrix below, since CI runs
against local dev servers and stubbed fixtures, not the deployed preview
environment or a real Freighter extension.

## 3. Preview smoke matrix

Run every row against the actual preview deployment URL (not `localhost`).
"Evidence" is what to attach to the release record (issue/PR comment):
screenshot, response header dump, or console output as noted.

| Route | State to force | Expected result | Evidence |
| --- | --- | --- | --- |
| `/` | default | Landing page renders, active Stellar network badge visible, no console errors | Screenshot |
| `/how-it-works` | default | Static content renders, no console errors | Screenshot |
| `/privacy` | default | Static content renders | Screenshot |
| `/developers` | default | Developer setup content renders | Screenshot |
| `/status` | default | Status shell renders without throwing on missing backend data | Screenshot + console log |
| `/verify` | default | Verification entry page renders | Screenshot |
| `/verify` | submit a known-valid credential/proof id | `VerificationResult: "VALID"`, status styled with the `valid` treatment (emerald) in [`verification-panel.tsx`](../components/verification/verification-panel.tsx) | Screenshot showing the valid badge |
| `/verify` | submit a known-expired proof id | `"EXPIRED"` result, amber treatment, no amount/claim data beyond what the credential discloses | Screenshot |
| `/verify` | submit a known-revoked proof id | `"REVOKED"` result, rose treatment | Screenshot |
| `/verify` | submit a tampered/invalid signature payload | `"INVALID_SIGNATURE"` result, rose treatment, no partial credential rendered | Screenshot |
| `/verify` | submit an id from an issuer not in the registry | `"UNVERIFIED_ISSUER"` result, distinct from `VALID` | Screenshot |
| `/verify/credential` | upload a well-formed signed JSON credential | Credential renders through `VerifyCredentialForm` without exposing unrelated wallet data | Screenshot |
| `/verify/credential` | upload a malformed JSON file | Client-side validation error, no unhandled exception in console | Console log |
| `/verify/scan` | scan/paste a valid QR-encoded proof reference | Resolves to the same result states as `/verify` above | Screenshot |
| `/proofs/create` | no Freighter extension installed | Explicit "wallet not detected" state, no silent failure | Screenshot |
| `/proofs/create` | Freighter installed, wallet challenge signed | Authenticated payment sync and minimum-income proof creation form become available | Screenshot |
| `/proofs/create` | disclosure preview step | Disclosure preview is shown before the proof is created; amounts hidden by default per [README.md Privacy and UX Requirements](../README.md#privacy-and-ux-requirements) | Screenshot |
| `/issuers` | default | Issuer directory shell renders | Screenshot |
| any route | — | Response headers match section 2.4 | `curl -sI` output |
| any route | — | No `console.error` in the browser devtools console on load | Console log |

If a row cannot be exercised (for example, no revoked-proof fixture exists
in the target environment), mark it "manual verification skipped — reason"
in the release record rather than silently omitting it.

## 4. Rollback procedure

### 4.1 Decision points

Roll back immediately, without further investigation first, if any of the
following are true post-promotion:

- Security headers from section 2.4 are missing or weakened (e.g. CSP
  falls back to a permissive default).
- `/proofs/create` or `/verify` throws an unhandled client error on load,
  or renders sensitive data (full wallet history, hidden amounts) beyond
  what [README.md Privacy and UX Requirements](../README.md#privacy-and-ux-requirements)
  allows.
- Verification states are indistinguishable or misreported (e.g. a revoked
  proof renders as valid).
- CI on `main` is red after the merge that triggered the release.

Otherwise, prefer a fast-follow fix over a rollback for cosmetic issues that
do not affect security, privacy, or the core flows above — document the
decision either way in the release record.

### 4.2 Steps

1. Identify the last known-good production deployment in the Vercel
   dashboard's deployment list for this project (the deployment tied to the
   previous release's commit SHA — cross-reference against `git log main`).
2. Promote that prior deployment back to production ("Promote to
   Production" in Vercel), rather than reverting and re-deploying, so the
   rollback is immediate and does not depend on a fresh build succeeding.
3. In parallel, open a revert PR against `main` for the offending commit(s)
   so the repository history reflects the rollback, even though the Vercel
   promotion already restored traffic.
4. Notify the on-call maintainer and, if `earnproof-backend` was deployed
   in coordination with this release (section 2.2), notify the backend
   maintainer so both sides roll back together if the contract changed.

### 4.3 Post-rollback validation

- [ ] Re-run the section 2.4 header check against production.
- [ ] Re-run the `/verify` rows of the smoke matrix (section 3) against
      production to confirm the previous, known-good behavior is restored.
- [ ] Confirm `npm run test:contracts` still passes against whichever
      `earnproof-backend` version is now live in production.
- [ ] Record the rollback (commit reverted, time, evidence links) in the
      release issue so the next release picks up the fix with full context.

## 5. Evidence template

Copy this into the release issue or PR before promoting:

```markdown
## Release evidence — <date> — <commit SHA>

### Configuration (2.1)
- Build log:
- Env vars confirmed in target environment: yes / no

### Dependent API (2.2)
- `npm run test:contracts` output:
- Backend deploy coordination needed: yes / no — details:

### Browser support (2.3)
- Matrix followed: docs/browser-support.md (if present) or the section 2.3 default matrix
- Freighter smoke-tested: yes / no

### Security headers (2.4)
- `curl -sI` output attached: yes / no

### Automated suites (2.5)
- `npm run lint`:
- `npm run test -- --runInBand`:
- `npm run test:contracts`:
- `npm run build`:
- `npm run test:e2e`:
- `npm run test:e2e:a11y`:
- `npm run test:e2e:visual`:
- `node scripts/performance/check-budgets.js`:

### Smoke matrix (3)
- Rows completed: n / n
- Rows skipped and why:
- Screenshots/logs attached: yes / no

### Decision
- Promoted: yes / no
- Rolled back: yes / no — reason:
```
