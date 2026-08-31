/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VerifyProofForm } from "../verify-proof-form";
import { apiClient } from "@/lib/api/client";

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/lib/api/client", () => ({
  apiClient: jest.fn(),
}));

const mockedApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

const VALID_RESULT = {
  result: "VALID",
  status: "valid" as const,
  credential: {
    id: "cred-1",
    schemaVersion: "1",
    subject: { walletHash: "wh_abc" },
    claim: {
      operator: "gte" as const,
      thresholdAmount: "100",
      assetCode: "USDC",
      assetIssuer: null,
      periodStart: "2026-08-01T00:00:00.000Z",
      periodEnd: "2026-08-31T23:59:59.000Z",
      qualifyingPaymentCount: 3,
    },
    privacy: { exactIncomeHidden: true, sourceTransactionsHidden: true },
    issuedAt: "2026-08-01T00:00:00.000Z",
    expiresAt: "2026-09-01T00:00:00.000Z",
    proof: { type: "MinimumIncomeProof", credentialHash: "hash_1", signature: "sig_1" },
  },
  proof: {
    id: "EP-8A42-91DC",
    type: "MinimumIncomeProof",
    schemaVersion: "1",
    network: "Stellar Testnet",
    issuedAt: "2026-08-01T00:00:00.000Z",
    expiresAt: "2026-09-01T00:00:00.000Z",
    revokedAt: null,
  },
};

describe("VerifyProofForm loading state", () => {
  beforeEach(() => {
    mockedApiClient.mockReset();
  });

  it("shows the result skeleton (not the empty panel) while a lookup is in flight", async () => {
    let resolveLookup!: (value: typeof VALID_RESULT) => void;
    mockedApiClient.mockReturnValue(
      new Promise((resolve) => {
        resolveLookup = resolve;
      }),
    );

    const user = userEvent.setup();
    render(<VerifyProofForm />);

    await user.type(screen.getByLabelText("Proof ID"), "EP-8A42-91DC");
    await user.click(screen.getByRole("button", { name: "Verify proof" }));

    const region = await screen.findByRole("status");
    expect(region).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Looking up proof...")).toBeInTheDocument();

    resolveLookup(VALID_RESULT);

    await waitFor(() => {
      expect(screen.queryByText("Looking up proof...")).not.toBeInTheDocument();
    });
  });

  it("renders the loaded result after the lookup resolves, matching the skeleton's field count", async () => {
    mockedApiClient.mockResolvedValue(VALID_RESULT);

    const user = userEvent.setup();
    render(<VerifyProofForm />);

    await user.type(screen.getByLabelText("Proof ID"), "EP-8A42-91DC");
    await user.click(screen.getByRole("button", { name: "Verify proof" }));

    await waitFor(() => {
      expect(screen.getByText("valid")).toBeInTheDocument();
    });

    expect(screen.getByText("EP-8A42-91DC")).toBeInTheDocument();
    expect(screen.queryByText("Looking up proof...")).not.toBeInTheDocument();
  });

  it("disables the submit button and shows checking-text while loading", async () => {
    let resolveLookup!: (value: typeof VALID_RESULT) => void;
    mockedApiClient.mockReturnValue(
      new Promise((resolve) => {
        resolveLookup = resolve;
      }),
    );

    const user = userEvent.setup();
    render(<VerifyProofForm />);

    await user.type(screen.getByLabelText("Proof ID"), "EP-8A42-91DC");
    await user.click(screen.getByRole("button", { name: "Verify proof" }));

    expect(screen.getByRole("button", { name: "Checking..." })).toBeDisabled();

    resolveLookup(VALID_RESULT);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Verify proof" })).toBeInTheDocument();
    });
  });
});
