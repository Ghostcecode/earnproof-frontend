# EarnProof Component Guide

This guide documents reusable frontend components, their responsibilities,
props, accessibility behavior, and important implementation constraints.

## Component documentation standard

Every reusable component should document:

- Purpose and responsibility
- Props and their expected values
- Common usage
- Accessibility behavior
- Loading and error states
- Important edge cases
- Security considerations where applicable

## Proof components

### `CreateProofFlow`

**Location:** `components/proofs/create-proof-flow.tsx`

`CreateProofFlow` orchestrates the standard income-proof creation workflow.

Responsibilities include:

- Restoring the existing EarnProof session
- Connecting and disconnecting the user's wallet
- Loading eligible payments
- Selecting payments
- Configuring the threshold and reporting period
- Preventing duplicate submissions
- Managing idempotency state
- Submitting proof creation requests
- Displaying success and error states
- Providing credential and verification-link exports

Example:

```tsx
import { CreateProofFlow } from "@/components/proofs/create-proof-flow";

export default function CreateProofPage() {
  return <CreateProofFlow />;
}
