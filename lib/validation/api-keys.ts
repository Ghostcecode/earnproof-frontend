import { z } from "zod";
import { AVAILABLE_SCOPES } from "@/lib/api/keys";

export const createApiKeySchema = z.object({
  name: z
    .string()
    .min(3, "API key name must be at least 3 characters")
    .max(64, "API key name must be less than 64 characters")
    .regex(
      /^[a-zA-Z0-9\s\-_.]+$/,
      "API key name can only contain letters, numbers, spaces, hyphens, underscores, and periods"
    ),
  scopes: z
    .array(z.enum(AVAILABLE_SCOPES))
    .min(1, "At least one scope is required"),
  expiresInDays: z
    .number()
    .int()
    .min(1, "Expiry must be at least 1 day")
    .max(365, "Expiry cannot exceed 365 days")
    .optional(),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;

export const SCOPE_DESCRIPTIONS: Record<string, { title: string; description: string }> = {
  "verification:read": {
    title: "Verification Read",
    description: "Verify proof credentials and read verification status"
  },
  "proofs:create": {
    title: "Proof Creation",
    description: "Create new income and payment proofs"
  },
  "proofs:read": {
    title: "Proof Read",
    description: "Read proof metadata and status"
  },
  "webhooks:manage": {
    title: "Webhook Management", 
    description: "Create, update, and delete webhook endpoints"
  }
};