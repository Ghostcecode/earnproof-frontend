import {
  buildCredentialExport,
  buildVerificationLinkExport,
  collectDisclosureWarnings,
  downloadTextFile,
  isSafeExportFilename,
  serializeCredentialJson,
  CREDENTIAL_EXPORT_FILENAME,
  VERIFICATION_LINK_EXPORT_FILENAME,
} from "@/lib/credentials/export";

describe("credential export utilities", () => {
  const credential = {
    id: "cred-123",
    type: "RecurringIncomeCredential",
    schemaVersion: "1",
    issuer: "issuer.example",
    subject: {
      walletHash: "wallet-hash-123",
    },
    claim: {
      operator: "stellar",
      thresholdAmount: "100",
      assetCode: "USDC",
      assetIssuer: "issuer",
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      qualifyingPaymentCount: 3,
      amount: "250",
      sender: "sender-secret",
      sourceAddress: "source-secret",
    },
    privacy: {
      exactIncomeHidden: false,
      sourceTransactionsHidden: false,
    },
    issuedAt: "2026-08-01T00:00:00.000Z",
    expiresAt: "2026-09-01T00:00:00.000Z",
    proof: {
      type: "Ed25519Signature",
      credentialHash: "hash-123",
      signature: "signature-123",
    },
  };

  const proof = {
    id: "proof-123",
    type: "income-proof",
    schemaVersion: "1",
    network: "stellar",
    issuedAt: "2026-08-01T00:00:00.000Z",
    expiresAt: "2026-09-01T00:00:00.000Z",
    revokedAt: null,
  };

  describe("serializeCredentialJson", () => {
    it("serializes credential values as JSON", () => {
      const value = {
        credential: {
          id: "cred-123",
        },
      };

      const result = serializeCredentialJson({ value });

      expect(JSON.parse(result)).toEqual(value);
    });

    it("preserves valid raw JSON without reformatting", () => {
      const rawJson = '{"credential":{"id":"cred-123"}}';

      expect(
        serializeCredentialJson({
          value: {},
          rawJson,
        }),
      ).toBe(rawJson);
    });

    it("rejects raw JSON that does not contain an object", () => {
      expect(() =>
        serializeCredentialJson({
          value: {},
          rawJson: "null",
        }),
      ).toThrow("Credential JSON must be an object.");
    });

    it("rejects malformed raw JSON", () => {
      expect(() =>
        serializeCredentialJson({
          value: {},
          rawJson: "{invalid",
        }),
      ).toThrow();
    });
  });

  describe("buildCredentialExport", () => {
    it("creates the expected credential export structure", () => {
      const plan = buildCredentialExport({
        credential,
        proof,
      });

      expect(plan.filename).toBe(CREDENTIAL_EXPORT_FILENAME);
      expect(plan.mimeType).toBe("application/json");

      const exported = JSON.parse(plan.body);

      expect(exported).toEqual({
        credential: {
          id: "cred-123",
          type: "RecurringIncomeCredential",
          schemaVersion: "1",
          issuer: "issuer.example",
          subject: {
            walletHash: "wallet-hash-123",
          },
          claim: {
            operator: "stellar",
            thresholdAmount: "100",
            assetCode: "USDC",
            assetIssuer: "issuer",
            periodStart: "2026-08-01",
            periodEnd: "2026-08-31",
            qualifyingPaymentCount: 3,
            amount: "250",
            sender: "sender-secret",
            sourceAddress: "source-secret",
          },
          privacy: {
            exactIncomeHidden: false,
            sourceTransactionsHidden: false,
          },
          issuedAt: "2026-08-01T00:00:00.000Z",
          expiresAt: "2026-09-01T00:00:00.000Z",
          proof: {
            type: "Ed25519Signature",
            credentialHash: "hash-123",
            signature: "signature-123",
          },
        },
        proof,
      });
    });

    it("does not invent undefined credential fields", () => {
      const plan = buildCredentialExport({
        credential: {
          id: "cred-only",
        },
      });

      const exported = JSON.parse(plan.body);

      expect(exported.credential).toEqual({
        id: "cred-only",
      });
    });

    it("generates the expected filename", () => {
      const plan = buildCredentialExport({
        credential,
      });

      expect(plan.filename).toBe("earnproof-credential.json");
    });

    it("includes public field metadata", () => {
      const plan = buildCredentialExport({
        credential,
        proof,
      });

      expect(plan.includedFields).toContain("credential.id");
      expect(plan.includedFields).toContain("credential.proof.signature");
      expect(plan.includedFields).toContain("proof.id");
      expect(plan.includedFields).toContain("proof.network");
    });

    it("reports disclosure warnings when sensitive optional fields are included", () => {
      const warnings = collectDisclosureWarnings(credential);

      expect(warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "amount" }),
          expect.objectContaining({ field: "sender" }),
        ]),
      );
    });

    it("returns no disclosure warnings for an undefined credential", () => {
      expect(collectDisclosureWarnings(undefined)).toEqual([]);
    });
  });

  describe("buildVerificationLinkExport", () => {
    it("creates a text verification-link export", () => {
      const url = "https://earnproof.example/verify?proof=proof-123";

      const plan = buildVerificationLinkExport(url);

      expect(plan.filename).toBe(VERIFICATION_LINK_EXPORT_FILENAME);
      expect(plan.mimeType).toBe("text/plain");
      expect(plan.body).toBe(url);
      expect(plan.includedFields).toEqual(["verificationUrl"]);
      expect(plan.warnings).toEqual([]);
    });
  });

  describe("filename security", () => {
    it("accepts only the two approved export filenames", () => {
      expect(isSafeExportFilename(CREDENTIAL_EXPORT_FILENAME)).toBe(true);
      expect(isSafeExportFilename(VERIFICATION_LINK_EXPORT_FILENAME)).toBe(true);
    });

    it("rejects arbitrary filenames", () => {
      expect(isSafeExportFilename("credential.json")).toBe(false);
      expect(isSafeExportFilename("../../credential.json")).toBe(false);
      expect(isSafeExportFilename("credential-${wallet}.json")).toBe(false);
    });

    it("rejects filenames containing credential identifiers", () => {
      expect(
        isSafeExportFilename(
          "GABC1234567890123456789012345678901234567890123456789012345.json",
        ),
      ).toBe(false);
    });
  });

  describe("downloadTextFile", () => {
    afterEach(() => {
      jest.restoreAllMocks();
      document.body.innerHTML = "";
    });

    it("creates a blob and triggers a download", () => {
      const createObjectURL = jest
        .spyOn(URL, "createObjectURL")
        .mockReturnValue("blob:earnproof-test");

      const revokeObjectURL = jest
        .spyOn(URL, "revokeObjectURL")
        .mockImplementation(() => undefined);

      const click = jest
        .spyOn(HTMLAnchorElement.prototype, "click")
        .mockImplementation(() => undefined);

      const plan = buildVerificationLinkExport(
        "https://earnproof.example/verify?proof=proof-123",
      );

      downloadTextFile(plan);

      expect(createObjectURL).toHaveBeenCalledTimes(1);
      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:earnproof-test");

      const anchor = click.mock.instances[0] as HTMLAnchorElement;

      expect(anchor.download).toBe(VERIFICATION_LINK_EXPORT_FILENAME);
      expect(anchor.rel).toBe("noopener");
    });

    it("rejects unsafe filenames before starting a download", () => {
      const createObjectURL = jest.spyOn(URL, "createObjectURL");

      expect(() =>
        downloadTextFile({
          filename: "../../secrets.txt",
          includedFields: [],
          warnings: [],
          body: "secret",
          mimeType: "text/plain",
        }),
      ).toThrow("Refusing to download an unsafe filename.");

      expect(createObjectURL).not.toHaveBeenCalled();
    });
  });
});
