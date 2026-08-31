/**
 * @jest-environment jsdom
 */

import {
  validatePaymentReceiptProofRequest,
  formatDisclosureChoice,
  getPrivacyImpactMessage,
} from "../payment-receipt-proofs";

describe("Payment Receipt Proof Utilities", () => {
  describe("validatePaymentReceiptProofRequest", () => {
    it("returns null for valid request", () => {
      const validRequest = {
        paymentId: "payment_123",
        discloseSender: false,
        discloseAmount: true,
        expiresInDays: 30,
      };
      expect(validatePaymentReceiptProofRequest(validRequest)).toBeNull();
    });

    it("requires payment ID", () => {
      const request = {
        paymentId: "",
        discloseSender: false,
        discloseAmount: false,
      };
      expect(validatePaymentReceiptProofRequest(request)).toBe("Payment selection is required");
    });

    it("requires boolean disclosure preferences", () => {
      const request = {
        paymentId: "payment_123",
        discloseSender: undefined as any,
        discloseAmount: false,
      };
      expect(validatePaymentReceiptProofRequest(request)).toBe("Sender disclosure preference is required");

      const request2 = {
        paymentId: "payment_123",
        discloseSender: false,
        discloseAmount: undefined as any,
      };
      expect(validatePaymentReceiptProofRequest(request2)).toBe("Amount disclosure preference is required");
    });

    it("validates expiry days range", () => {
      const request = {
        paymentId: "payment_123",
        discloseSender: false,
        discloseAmount: false,
        expiresInDays: 0,
      };
      expect(validatePaymentReceiptProofRequest(request)).toBe("Expiry must be between 1 and 365 days");

      const request2 = {
        paymentId: "payment_123",
        discloseSender: false,
        discloseAmount: false,
        expiresInDays: 366,
      };
      expect(validatePaymentReceiptProofRequest(request2)).toBe("Expiry must be between 1 and 365 days");
    });

    it("allows undefined expiry days", () => {
      const request = {
        paymentId: "payment_123",
        discloseSender: false,
        discloseAmount: false,
        expiresInDays: undefined,
      };
      expect(validatePaymentReceiptProofRequest(request)).toBeNull();
    });

    it("trims payment ID whitespace", () => {
      const request = {
        paymentId: "   ",
        discloseSender: false,
        discloseAmount: false,
      };
      expect(validatePaymentReceiptProofRequest(request)).toBe("Payment selection is required");
    });
  });

  describe("formatDisclosureChoice", () => {
    it("formats disclosed field correctly", () => {
      expect(formatDisclosureChoice(true, "Sender")).toBe("Sender will be visible to verifiers");
      expect(formatDisclosureChoice(true, "Amount")).toBe("Amount will be visible to verifiers");
    });

    it("formats hidden field correctly", () => {
      expect(formatDisclosureChoice(false, "Sender")).toBe("Sender will remain private");
      expect(formatDisclosureChoice(false, "Amount")).toBe("Amount will remain private");
    });
  });

  describe("getPrivacyImpactMessage", () => {
    it("describes both disclosed correctly", () => {
      const message = getPrivacyImpactMessage(true, true);
      expect(message).toBe("Both sender and amount information will be visible to anyone who verifies this proof.");
    });

    it("describes sender only disclosed correctly", () => {
      const message = getPrivacyImpactMessage(true, false);
      expect(message).toBe("Sender information will be visible to verifiers, but the exact amount will remain private.");
    });

    it("describes amount only disclosed correctly", () => {
      const message = getPrivacyImpactMessage(false, true);
      expect(message).toBe("Amount information will be visible to verifiers, but the sender will remain private.");
    });

    it("describes both hidden correctly", () => {
      const message = getPrivacyImpactMessage(false, false);
      expect(message).toBe("Both sender and amount will remain private. Only the payment occurrence and asset type will be verified.");
    });
  });
});