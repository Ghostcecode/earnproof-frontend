import { z } from "zod";

export const createPaymentReceiptProofSchema = z.object({
  paymentId: z
    .string()
    .min(1, "Payment selection is required"),
  discloseSender: z
    .boolean(),
  discloseAmount: z
    .boolean(),
  expiresInDays: z
    .number()
    .int()
    .min(1, "Expiry must be at least 1 day")
    .max(365, "Expiry cannot exceed 365 days")
    .optional(),
});

export type CreatePaymentReceiptProofInput = z.infer<typeof createPaymentReceiptProofSchema>;

export const PRIVACY_DEFAULTS = {
  discloseSender: false,
  discloseAmount: false,
} as const;

export const DISCLOSURE_EXPLANATIONS = {
  sender: {
    disclosed: "The sender's wallet address and identity (if known) will be visible to anyone who verifies this proof.",
    hidden: "The sender's identity will remain completely private. Verifiers will only know that a payment occurred."
  },
  amount: {
    disclosed: "The exact payment amount will be visible to anyone who verifies this proof.",
    hidden: "The payment amount will remain completely private. Verifiers will only know that a payment occurred."
  }
} as const;