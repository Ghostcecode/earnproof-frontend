# Accessibility testing

This document describes the automated accessibility gate in CI, what it
covers, and the manual checks it cannot replace.

## What's automated

Automated coverage lives under `e2e/accessibility/` and runs with
Playwright (`npm run test:e2e:a11y`), gated in CI by the `accessibility`
job in `.github/workflows/ci.yml`.

### Routes scanned

Every route currently shipped in `app/` is scanned (see
`e2e/accessibility/routes.ts`, the single place to add a new route):

- `/` — home
- `/how-it-works`
- `/faq`
- `/developers`
- `/issuers`
- `/privacy`
- `/terms`
- `/status`
- `/proofs/create` — the closest current analog to an authenticated
  flow: wallet connect (Freighter) + income payment selection + proof
  creation
- `/verify` — public proof verification by ID
- `/verify/credential` — public proof verification by uploaded credential
  JSON
- a 404 (error page)

**Not yet covered:** dedicated "payments", "proof history", and "proof
detail" pages do not exist in the app yet (`app/` has no such routes as of
this PR). They are intentionally left out of `routes.ts` rather than
faked. Once those pages ship, add one entry per route to
`e2e/accessibility/routes.ts` and they'll be scanned automatically by the
existing `scans.spec.ts` loop — no new harness work required.

### axe rules

`e2e/accessibility/fixtures/axe.ts` runs `@axe-core/playwright` with the
`wcag2a`, `wcag2aa`, `wcag21a`, and `wcag21aa` tag sets (covers missing
accessible names, invalid ARIA usage, landmark/heading structure,
color-contrast, label associations, and similar). A test fails only on
violations with `critical` or `serious` impact; `minor`/`moderate`
findings are still recorded in the attached JSON report (and the HTML
report Playwright produces in CI) but don't fail the build, so the gate
stays actionable rather than noisy. Every failure message names the route,
the axe rule id, the impact level, and the specific DOM node(s) involved.

### Dynamic states

`e2e/accessibility/dynamic-states.spec.ts` drives real interactions
(mocked wallet via `fixtures/mock-freighter.ts`, mocked API via
`fixtures/mock-api.ts`) to scan states beyond the initial HTML:

- `/proofs/create`: wallet-connected state, payment-sync success, the
  in-progress "Creating signed minimum-income proof..." loading state, a
  failed proof-creation error state, and the completed success state.
- `/verify` and `/verify/credential`: the loading state, a valid-result
  success state, and validation-error states (empty input / invalid JSON).

### Keyboard interaction tests

`e2e/accessibility/keyboard.spec.ts` uses real `page.keyboard` automation
(not axe, which cannot verify actual tab order or key handling):

- **Skip link**: tabbing from a fresh page load reveals "Skip to main
  content" as the first focus stop, and activating it moves focus to
  `#main-content`.
- **Disclosures**: the FAQ accordion opens/closes with Enter/Space,
  `aria-expanded` toggles correctly, and focus stays on the trigger.
- **Form error announcements**: submitting invalid input on the verify,
  verify-credential, and proof-creation forms moves focus to a
  `role="alert"` region and the submitting control's `aria-describedby`
  points at it.
- **Focus restoration**: clearing the FAQ search restores focus to the
  search field, and disconnecting the wallet on `/proofs/create` restores
  focus to "Connect Freighter" — both fixed as part of this change, since
  neither previously restored focus and would otherwise drop keyboard
  users' focus to `<body>`.

**No current subject (harness ready, not faked):**

- **Nav menu / dropdown**: `components/layout/public-nav.tsx` has no
  dropdown or mobile-menu disclosure yet — nav links are simply hidden
  below the `md` breakpoint with no mobile alternative. This is a real gap
  worth its own follow-up (mobile users currently have no way to reach
  nav links other than the logo), but adding a mobile menu is a UI change
  outside the scope of "enforce accessibility checks in CI." Flagged here
  so it isn't missed.
- **Dialogs/modals**: none exist in the app yet. The moment one is added,
  a focus-trap / focus-return test belongs in `keyboard.spec.ts` next to
  the disclosure and focus-restoration tests already there.

### Viewports

Every spec runs under two Playwright projects (`playwright.config.ts`):
Desktop Chrome (1280x800) and Mobile Chrome (Pixel 5 emulation), so
contrast, spacing, and interaction assertions are checked at both sizes.

### Fixtures / determinism

- `fixtures/mock-api.ts` intercepts EarnProof API calls
  (`NEXT_PUBLIC_API_URL`) with `page.route` and returns fixed JSON
  fixtures, so payment lists, proof IDs, hashes, and dates never vary
  between runs.
- `fixtures/mock-freighter.ts` answers the Freighter extension's
  `window.postMessage` protocol directly (the extension isn't installed
  in the Playwright browser), so wallet connect/sign can be exercised
  deterministically without a real Freighter install. See the comment in
  that file for the exact message protocol this reverse-engineers from
  `@stellar/freighter-api`.

## What requires manual verification

Automation (axe + scripted keyboard interaction) cannot prove the
following. Review these periodically — after any significant UI change,
and at minimum before each release — using a real screen reader.

### Manual test checklist

Run with at least one of NVDA (Windows/Firefox or Chrome), VoiceOver
(macOS Safari), or JAWS (Windows).

1. **Announcement quality, not just presence.** axe confirms an
   accessible name exists; it can't judge whether the name is clear or
   redundant. Navigate every scanned route by screen reader and confirm:
   - Headings read in a sensible order and describe their section.
   - Buttons/links announce their purpose without needing surrounding
     context (e.g. "Connect Freighter", not "Button").
   - The FAQ accordion announces expanded/collapsed state and the
     question/answer relationship clearly when toggled.
2. **Reading order vs. DOM order.** Confirm the order content is
   announced in on `/proofs/create` (wallet → payments → proof form →
   feedback) and `/verify` (form → privacy notice → result panel)
   matches the visual reading order at both viewport sizes, especially
   after the CSS grid reflows on mobile.
3. **Live region behavior in practice.** `aria-live="assertive"` error
   regions and `aria-live="polite"` status regions are wired
   programmatically, but confirm by ear that:
   - The error is announced promptly without repeating itself.
   - Status updates ("Requesting Freighter wallet access...", "Payments
     synced.") don't talk over each other or get skipped when they change
     quickly.
4. **Alt text semantics.** The EarnProof logo `<Image>` uses `alt="EarnProof"`
   — confirm this (and any future imagery) describes purpose, not just
   appearance, and that purely decorative graphics (the FAQ chevron icon,
   status badges) stay `aria-hidden` and are correctly skipped.
5. **Cognitive load / plain-language clarity.** Read the proof-creation
   copy, error messages, and privacy notices aloud. Confirm:
   - Error messages describe what to do next, not just what failed.
   - Technical terms (credential hash, wallet hash, classification
     values) have enough surrounding context for a first-time user.
6. **Zoom / reflow.** Set browser zoom to 200% and confirm no content is
   clipped or requires horizontal scrolling on the scanned routes.
7. **Color contrast in context.** axe's `color-contrast` rule is included
   in the automated run, but spot-check text over gradients/borders
   (e.g. status badges, the cyan accent on dark backgrounds) visually,
   since axe can miss contrast issues on non-solid backgrounds.

Record findings from this checklist (route, issue, screen reader/browser
combo) as GitHub issues tagged `accessibility` so they can be triaged
against the automated gate above.

## Manual contrast audit: status badges and cyan accents

A manual WCAG 2.1 AA contrast audit of the status badge component
(`StatusBadge` in `components/common/production-ui.tsx`, used on `/status`
and throughout the proofs/verification flows) and the cyan accent colors
defined in `app/globals.css` was carried out using the [WCAG 2.1
relative-luminance contrast formula](https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio)
(the same algorithm `@axe-core/playwright` uses for its `color-contrast`
rule), computed against this app's actual rendered colors — the
`--background: #020617` page background and the `bg-white/[0.04]` panel
surface most badges and bordered cards sit on. There is no
`tailwind.config.ts` in this repo; Tailwind v4's CSS-based `@theme` config
lives entirely in `app/globals.css`, so that file was the audit's only
source of truth for color values.

### Results

| Element | Before | After | Requirement | Result |
| --- | --- | --- | --- | --- |
| `StatusBadge` text (`text-cyan-200`) on any tone's translucent fill | 13.7–13.9:1 | unchanged | 4.5:1 (normal text) | Pass (no change needed) |
| Decorative/structural borders using `border-cyan-300/30` (badges, info panels, buttons, the skip link's focus-visible border) | 2.11:1 | 3.98:1 (`border-cyan-300/50`) | 3:1 (non-text UI component boundary, WCAG 1.4.11) | **Failed → fixed** |
| Focus outline (`outline-color: #22d3ee` in `app/globals.css`, and `outline-cyan-300` utility) | 11.16:1 | unchanged | 3:1 (focus indicators, WCAG 1.4.11) | Pass (no change needed) |
| Secondary/tertiary body text (`text-slate-500`, matches `--text-tertiary: #64748b`) rendered directly as content (labels, "Hidden from verifiers" copy, disabled-input values, "Coming soon" text) | 3.07–4.24:1 depending on surface | 5.71–7.87:1 (`text-slate-400`) | 4.5:1 (normal text, WCAG 1.4.3) | **Failed → fixed** |

`text-slate-500` on `placeholder:` attributes (form input placeholders)
was left unchanged: WCAG 1.4.3 applies to rendered text content, and
placeholder text is conventionally treated as a UI hint rather than
required reading — but it's worth a follow-up pass with a screen reader
per item 1 of the manual checklist above, since some users do rely on it.

### Fix applied

- `border-cyan-300/30` → `border-cyan-300/50` everywhere it draws a
  decorative or structural border (badges, bordered panels/buttons, the
  skip link), in `app/error.tsx`, `app/not-found.tsx`,
  `app/verify/[proofId]/page.tsx`, `app/faq/page.tsx`, `app/about/page.tsx`,
  `app/accessibility/page.tsx`, `app/proof-types/page.tsx`,
  `components/contact/contact-form.tsx`,
  `components/proofs/artifact-export.tsx`,
  `components/proofs/recurring-proof-confirmation.tsx`,
  `components/proofs/coverage-analysis-step.tsx`,
  `components/proofs/proof-confirmation.tsx`,
  `components/proofs/period-config-step.tsx`,
  `components/verification/verify-credential-form.tsx`,
  `components/common/skip-link.tsx`,
  `components/verification/verify-proof-form.tsx`,
  `components/common/network-badge.tsx`, and
  `components/common/production-ui.tsx` (the `StatusBadge` component
  itself), plus the matching test assertion in
  `app/proof-types/__tests__/page.test.tsx`.
- `text-slate-500` → `text-slate-400` for rendered text content (not
  placeholders) in `app/proof-types/page.tsx`,
  `components/proofs/payment-selection.tsx`,
  `components/proofs/proof-confirmation.tsx`,
  `components/proofs/artifact-export.tsx`,
  `components/proofs/wizard-steps.tsx`,
  `components/verification/verify-proof-form.tsx`,
  `components/verification/verify-credential-form.tsx`, and
  `components/common/external-link.tsx`. `slate-400` was already the
  established convention for this same purpose elsewhere in
  `app/proof-types/page.tsx`, so this also removes an inconsistency
  between two shades doing the same job.

### Known follow-up (out of scope for this pass)

The same 2:1–2.1:1 non-text-contrast shortfall exists on the `/30`-opacity
borders used for amber/emerald/rose status alert boxes (warning/error/
success panels) across roughly twenty files, e.g. `border-amber-300/30`,
`border-emerald-300/30`, `border-rose-300/30` in
`components/verification/verification-panel.tsx`,
`components/organizations/organization-list.tsx`,
`components/developers/api-key-list.tsx`, and others. This audit's scope
was status badges and the cyan accent per the originating issue; the
amber/emerald/rose alert borders should get the same `/30` → `/50`
treatment in a dedicated follow-up so the whole alert-box family is
consistent, rather than folding an unrelated ~20-file change into this
pass.
