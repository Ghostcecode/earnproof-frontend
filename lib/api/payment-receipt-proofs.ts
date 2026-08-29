import { apiClient, bearer, retryMutation } from "./client";

export type CreatePaymentReceiptProofRequest = {
  paymentId: string;
  discloseSender: boolean;
  discloseAmount: boolean;
  expiresInDays?: number;
};

export type PaymentReceiptProof = {
  proofId: string;
  status: string;
  verificationUrl: string;
  credential: {
    id: string;
    type: string;
    schemaVersion: string;
    subject: {
      walletHash: string;
    };
    claim: {
      paymentId: string;
      assetCode: string;
      assetIssuer?: string | null;
      occurredAt: string;
      // Optional disclosed fields
      amount?: string;
      sender?: string;
      sourceAddress?: string;
    };
    privacy: {
      exactAmountHidden: boolean;
      senderHidden: boolean;
      sourceTransactionsHidden: boolean;
    };
    issuedAt: string;
    expiresAt: string;
    proof: {
      type: string;
      credentialHash: string;
      signature: string;
    };
  };
};

export async function createPaymentReceiptProof(
  token: string,
  request: CreatePaymentReceiptProofRequest,
  signal: AbortSignal
): Promise<PaymentReceiptProof> {
  return retryMutation(async (signal) => {
    return apiClient<PaymentReceiptProof>({
      path: "/proofs/payment-receipt",
      method: "POST",
      headers: bearer(token),
      body: JSON.stringify(request),
      signal,
    });
  }, signal);
}

export function validatePaymentReceiptProofRequest(
  request: Partial<CreatePaymentReceiptProofRequest>
): string | null {
  if (!request.paymentId?.trim()) {
    return "Payment selection is required";
  }
  
  if (typeof request.discloseSender !== "boolean") {
    return "Sender disclosure preference is required";
  }
  
  if (typeof request.discloseAmount !== "boolean") {
    return "Amount disclosure preference is required";
  }
  
  if (request.expiresInDays !== undefined) {
    if (request.expiresInDays < 1 || request.expiresInDays > 365) {
      return "Expiry must be between 1 and 365 days";
    }
  }
  
  return null;
}

export function formatDisclosureChoice(disclosed: boolean, fieldName: string): string {
  return disclosed 
    ? `${fieldName} will be visible to verifiers`
    : `${fieldName} will remain private`;
}

export function getPrivacyImpactMessage(discloseSender: boolean, discloseAmount: boolean): string {
  if (discloseSender && discloseAmount) {
    return "Both sender and amount information will be visible to anyone who verifies this proof.";
  } else if (discloseSender) {
    return "Sender information will be visible to verifiers, but the exact amount will remain private.";
  } else if (discloseAmount) {
    return "Amount information will be visible to verifiers, but the sender will remain private.";
  } else {
    return "Both sender and amount will remain private. Only the payment occurrence and asset type will be verified.";
  }
}