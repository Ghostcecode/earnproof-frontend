import { intentSignature, resolveIdempotencyKey, type ProofIntent } from "@/lib/proofs/idempotency";

const baseIntent: ProofIntent = {
  selectedPaymentIds: ["pay_2", "pay_1"],
  thresholdAmount: "100",
  assetCode: "USDC",
  assetIssuer: "ISSUER123",
  periodStart: "2026-08-01T00:00:00.000Z",
  periodEnd: "2026-08-31T23:59:59.000Z",
};

describe("intentSignature", () => {
  it("is stable regardless of selected-payment-id order", () => {
    const a = intentSignature({ ...baseIntent, selectedPaymentIds: ["pay_1", "pay_2"] });
    const b = intentSignature({ ...baseIntent, selectedPaymentIds: ["pay_2", "pay_1"] });
    expect(a).toBe(b);
  });

  it("changes when the selected payments change", () => {
    const a = intentSignature(baseIntent);
    const b = intentSignature({ ...baseIntent, selectedPaymentIds: ["pay_1", "pay_3"] });
    expect(a).not.toBe(b);
  });

  it("changes when the threshold changes", () => {
    const a = intentSignature(baseIntent);
    const b = intentSignature({ ...baseIntent, thresholdAmount: "200" });
    expect(a).not.toBe(b);
  });

  it("changes when the period changes", () => {
    const a = intentSignature(baseIntent);
    const b = intentSignature({ ...baseIntent, periodEnd: "2026-09-30T23:59:59.000Z" });
    expect(a).not.toBe(b);
  });
});

describe("resolveIdempotencyKey", () => {
  it("mints a new key when there is no previous attempt", () => {
    const resolved = resolveIdempotencyKey(null, baseIntent);
    expect(resolved.key).toEqual(expect.any(String));
    expect(resolved.key.length).toBeGreaterThan(0);
    expect(resolved.signature).toBe(intentSignature(baseIntent));
  });

  it("reuses the previous key when the intent is unchanged (a retry)", () => {
    const first = resolveIdempotencyKey(null, baseIntent);
    const retry = resolveIdempotencyKey(first, baseIntent);

    expect(retry.key).toBe(first.key);
  });

  it("reuses the previous key even when selected-payment-id order differs but the set is the same", () => {
    const first = resolveIdempotencyKey(null, baseIntent);
    const retry = resolveIdempotencyKey(first, {
      ...baseIntent,
      selectedPaymentIds: [...baseIntent.selectedPaymentIds].reverse(),
    });

    expect(retry.key).toBe(first.key);
  });

  it("mints a new key when the intent changes (a genuinely new submission)", () => {
    const first = resolveIdempotencyKey(null, baseIntent);
    const changed = resolveIdempotencyKey(first, {
      ...baseIntent,
      thresholdAmount: "500",
    });

    expect(changed.key).not.toBe(first.key);
  });

  it("produces different keys across repeated calls with no previous state", () => {
    const a = resolveIdempotencyKey(null, baseIntent);
    const b = resolveIdempotencyKey(null, baseIntent);
    expect(a.key).not.toBe(b.key);
  });
});
