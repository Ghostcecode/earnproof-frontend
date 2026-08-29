# EarnProof Frontend Architecture

This document describes the current frontend implementation, focusing on production readiness, state ownership, and developer guidelines.

## Architecture Overview

The EarnProof frontend is built with **Next.js 16** using the App Router pattern. The architecture follows these principles:

- **Server Components by default** - Leverage React Server Components for better performance
- **Client Components when needed** - Only for interactivity, browser APIs, or state
- **TypeScript throughout** - Full type safety across the codebase
- **Tailwind CSS** - Utility-first styling with design tokens
- **React Query** - Server state management
- **Zod** - Runtime type validation

### Project Structure

```
earnproof-frontend/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Home page
│   └── [routes]/          # Feature routes
├── components/            # Reusable UI components
│   ├── common/           # Shared components
│   ├── layout/           # Layout components
│   └── [feature]/        # Feature-specific components
├── lib/                  # Utility libraries
│   ├── api/             # API client and types
│   ├── storage/         # Browser storage utilities
│   ├── validation/      # Zod schemas
│   └── [domain]/        # Domain-specific logic
├── config/              # Application configuration
├── scripts/             # Build and validation scripts
├── e2e/                 # Playwright end-to-end tests
├── tests/               # Jest unit tests
└── docs/               # Documentation
```

## Production Route Map

### Public Indexable Routes
| Route | Purpose | Data Source | Rendering | State Owner |
|-------|---------|-------------|-----------|-------------|
| `/` | Home page | Static | Server | N/A |
| `/about` | About page | Static | Server | N/A |
| `/how-it-works` | Protocol explanation | Static | Server | N/A |
| `/faq` | Frequently asked questions | Static | Server | N/A |
| `/developers` | Developer resources | Static | Server | N/A |
| `/issuers` | Issuer directory | API | Server | API Cache |
| `/issuers/veridatum-labs` | Specific issuer | API | Server | API Cache |
| `/privacy` | Privacy policy | Static | Server | N/A |
| `/terms` | Terms of service | Static | Server | N/A |
| `/status` | System status | API | Server | API Cache |
| `/accessibility` | Accessibility info | Static | Server | N/A |
| `/contact` | Contact information | Static | Server | N/A |
| `/proof-types` | Proof type explanations | Static | Server | N/A |

### Public Non-Indexable Routes
| Route | Purpose | Data Source | Rendering | State Owner |
|-------|---------|-------------|-----------|-------------|
| `/verify` | Proof verification form | User input | Client | Form State |
| `/verify/credential` | Credential upload verification | User input | Client | Form State |
| `/verify/scan` | QR code verification | Camera API | Client | Camera State |
| `/verify/[proofId]` | Proof result display | API | Server | API Cache |

### Private/Workflow Routes
| Route | Purpose | Data Source | Rendering | State Owner |
|-------|---------|-------------|-----------|-------------|
| `/proofs` | Proof creation hub | Static | Server | N/A |
| `/proofs/minimum-income` | Minimum income proof | API + Wallet | Client | Session + Form |
| `/proofs/payment-receipt` | Payment receipt proof | API + Wallet | Client | Session + Form |
| `/proofs/recurring-income` | Recurring income proof | API + Wallet | Client | Session + Form |
| `/settings` | User settings | API | Client | Session |
| `/settings/issuers` | Issuer management | API | Client | Session |
| `/settings/organizations` | Organization management | API | Client | Session |
| `/developers/api-keys` | API key management | API | Client | Session |

## Server/Client Boundaries

### Server Components (`app/` by default)
**Use for:**
- Static content rendering
- Data fetching (no browser APIs)
- SEO-critical pages
- Layout components without interactivity

**Examples:**
- `app/page.tsx` - Home page
- `app/about/page.tsx` - About page
- `app/layout.tsx` - Root layout

### Client Components (`"use client"` directive)
**Use for:**
- Interactivity (buttons, forms)
- Browser APIs (`localStorage`, `window`, `document`)
- State management (`useState`, `useEffect`)
- Wallet integration (Freighter API)

**Examples:**
- `components/proofs/create-proof-flow.tsx` - Proof creation wizard
- `components/verification/verify-scan.tsx` - Camera QR scanner
- `lib/health-check.ts` - Browser health checks

### Crossing the Boundary
**Pattern:**
```typescript
// Server Component
export default function Page() {
  return (
    <div>
      <StaticContent />
      <ClientComponentWrapper>
        <InteractivePart />
      </ClientComponentWrapper>
    </div>
  );
}

// Client Component
"use client";
export function InteractivePart() {
  const [state, setState] = useState();
  // Browser APIs here
}
```

## State Ownership

### Wallet State
**Owner:** `@stellar/freighter-api` + Session Storage
**Location:** `components/proofs/*-flow.tsx`
**Management:**
- Wallet connection via Freighter extension
- Session persistence in `localStorage`
- Automatic cleanup on wallet change

### Session/Auth State
**Owner:** `lib/storage/index.ts`
**Location:** `STORAGE_KEYS.SESSION`
**Schema:**
```typescript
{
  version: 1,
  data: {
    token: string,      // JWT from server
    user: {             // User profile
      id: string,
      walletAddress: string,
      email?: string
    }
  }
}
```

### API/Server Data
**Owner:** React Query (`@tanstack/react-query`)
**Location:** `lib/api/client.ts`
**Pattern:**
- Automatic caching and refetching
- Error boundary integration
- Optimistic updates where applicable

### Transient Form State
**Owner:** React Hook Form (`react-hook-form`)
**Location:** Form components
**Management:**
- Local component state
- Validation via Zod schemas
- Submission handling

### Persisted Browser State
**Owner:** `lib/storage/index.ts`
**Location:** Versioned storage utilities
**Rules:**
- All storage must be versioned
- Migration paths required
- Clear retention policies
- Automatic corruption handling

## Trust and Privacy Boundaries

### Wallet Identity
**Boundary:** Freighter extension ↔ Application
**Implementation:** `window.postMessage` protocol
**Security:**
- No private key exposure
- Session token issuance
- Wallet address verification

### Authentication
**Boundary:** Browser storage ↔ API server
**Implementation:** JWT tokens
**Security:**
- HTTPS only
- Server-controlled expiration
- No refresh tokens

### API Communication
**Boundary:** Frontend ↔ Backend API
**Implementation:** `lib/api/client.ts`
**Security:**
- Environment-based configuration
- Error handling and retries
- Request signing (where applicable)

### Browser Persistence
**Boundary:** `localStorage` ↔ Application state
**Implementation:** `lib/storage/index.ts`
**Security:**
- Versioned schemas
- Migration safety
- Clearance on logout

### Sensitive Data Exclusion
**What's NOT stored:**
- Wallet private keys
- Transaction details (beyond hashes)
- Credential bodies
- Personal identification documents

## Extension Rules

### Adding a Route
1. Create `app/[route]/page.tsx`
2. Determine server/client rendering needs
3. Add to route manifest (`scripts/generate-route-manifest.js`)
4. Update accessibility tests (`e2e/accessibility/routes.ts`)
5. Add metadata (title, description)

### Adding a Component
**Server Component:**
```typescript
// No "use client" directive
export function Component() {
  // No browser APIs or state
  return <div>Static content</div>;
}
```

**Client Component:**
```typescript
"use client";
export function Component() {
  const [state, setState] = useState();
  // Browser APIs and state here
}
```

### Adding Shared State
**Application State:** Use React Query for server data
**UI State:** Use React context or component state
**Persisted State:** Use `lib/storage/index.ts` with versioning

### Adding Persisted Browser State
1. Add key to `STORAGE_KEYS` in `lib/storage/index.ts`
2. Define schema in `StorageSchema` interface
3. Set current version in `CURRENT_VERSIONS`
4. Add migration path if needed
5. Document in `docs/privacy.md`

### Adding API/Server Data
1. Add to `lib/api/client.ts` or create domain-specific client
2. Define TypeScript types in `lib/api/generated/v1/`
3. Use React Query for caching
4. Add error handling

### Adding Client-Only Behavior
1. Wrap in `"use client"` component
2. Check `typeof window !== 'undefined'`
3. Handle SSR fallback gracefully
4. Add hydration tests

## Code Links

### Core Files
- [Root Layout](../app/layout.tsx) - Application metadata and shell
- [API Client](../lib/api/client.ts) - HTTP client with retry logic
- [Storage Utilities](../lib/storage/index.ts) - Versioned browser storage
- [App Config](../config/app.ts) - Environment configuration

### Component Examples
- [Server Component](../app/about/page.tsx) - Static about page
- [Client Component](../components/proofs/create-proof-flow.tsx) - Interactive proof flow
- [Form Component](../components/verification/verify-scan.tsx) - Camera integration

### Test Coverage
- [Storage Tests](../lib/storage/__tests__/index.test.ts) - Migration and privacy tests
- [Accessibility Tests](../e2e/accessibility/) - Automated a11y checks
- [Route Validation](../scripts/validate-production-readiness.js) - Production readiness checks

## Performance Guidelines

### Bundle Size
- Lazy load heavy components
- Use dynamic imports for non-critical code
- Monitor bundle budgets (`scripts/performance/check-budgets.js`)

### Rendering Performance
- Server Components for static content
- Client Components only when needed
- Memoization for expensive computations

### Data Fetching
- React Query for caching
- Server Components for initial data
- Optimistic updates for better UX

## Testing Strategy

### Unit Tests (Jest)
- Component behavior
- Utility functions
- Storage migrations

### Integration Tests (Playwright)
- User workflows
- Accessibility checks
- Visual regression

### Production Validation
- Route metadata validation
- Internal link checking
- Storage schema validation
- Hydration regression tests

## Deployment Checklist

Before deploying:
1. Run `npm run validate:production` - Route and metadata checks
2. Run `npm run test` - Unit tests
3. Run `npm run test:e2e:a11y` - Accessibility tests
4. Run `npm run build` - Production build
5. Check bundle budgets - Performance limits

## Maintenance

### Version Updates
- Test storage migrations
- Update route manifest
- Verify accessibility
- Check hydration boundaries

### Dependency Updates
- Review breaking changes
- Test wallet integration
- Verify build output
- Update type definitions