# EarnProof Frontend

EarnProof is an open-source, privacy-focused income and payment verification protocol built on Stellar.

This repository contains the Next.js web application for public education, developer-facing setup pages, wallet-authenticated proof creation, public proof verification, and initial shells for issuer discovery and system status.

## Product Positioning

EarnProof helps people prove financial facts without revealing more financial information than necessary.

Primary tagline:

```text
Prove your income, not your entire financial history.
```

The first implementation targets Stellar testnet and Freighter. The application should always make the active network visible and avoid implying that EarnProof provides credit decisions, legal identity verification, tax certification, or loan approval.

## Current Scope

Implemented:

- Next.js App Router application
- TypeScript
- Tailwind CSS
- Public layout shell
- Responsive public navigation
- Footer
- Landing page
- How it works page
- Privacy page
- Developer page
- Public verification page connected to the backend proof verification endpoint
- Worker proof creation route at `/proofs/create`
- Freighter wallet challenge signing flow through `@stellar/freighter-api`
- Authenticated payment sync, payment listing, and manual classification controls
- Minimum-income proof creation form
- Issuer directory shell
- Status page shell
- Shared API client
- Public environment configuration
- EarnProof logo and favicon

Planned next:

- Verification-state component tests
- Proof revocation controls
- Richer worker dashboard around the create-proof flow
- Fixture-backed smoke tests

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Freighter API
- TanStack Query
- React Hook Form
- Zod
- ESLint

## Repository Structure

```text
app/
  developers/
  how-it-works/
  issuers/
  privacy/
  status/
  verify/
components/
  common/
  layout/
config/
hooks/
lib/
  api/
  validation/
public/
```

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Default local URL:

```text
http://localhost:3000
```

If port `3000` is already in use:

```bash
npm run dev -- --port 3001
```

## Environment Variables

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
```

No secret keys belong in this frontend repository or any public environment variable.

## Validation

```bash
npm run lint
npm run build
npm audit --omit=dev
```

## Browser Support and Dependency Policy

Supported browsers/devices, required feature fallbacks, dependency upgrade
tiers, and emergency patch handling are documented in
[docs/browser-support.md](docs/browser-support.md) and
[docs/dependency-policy.md](docs/dependency-policy.md).

## Privacy and UX Requirements

- Show Stellar testnet status on relevant screens.
- Hide sensitive amounts by default.
- Show a disclosure preview before proof creation.
- Clearly distinguish valid, expired, revoked, invalid, and unverified issuer states.
- Do not expose full wallet history on verification pages.
- Do not put secret keys or signing material in client code.
- Keep public verification views limited to intentionally disclosed claim data.

## Related Repositories

- `earnproof-backend`: API, payment indexing, proof generation, credential signing, and verification.
- `earnproof-contracts`: Soroban issuer registry, proof commitment registry, revocation state, and protocol configuration.
- `earnproof-sdk`: Future TypeScript SDK for integrations.
- `earnproof-specification`: Future credential and verification standard.
