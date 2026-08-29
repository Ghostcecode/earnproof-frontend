import { render, screen } from "@testing-library/react";

import {
  ResultItem,
  VerificationPanel,
  type VerifyProofResponse,
} from "@/components/verification/verification-panel";

describe("malicious content rendering", () => {
  it.each([
    "<script>alert('xss')</script>",
    "<img src=x onerror=alert(1)>",
    "<svg onload=alert(1)>",
    "<iframe src='javascript:alert(1)'></iframe>",
    "</div><script>alert(document.domain)</script>",
    "\u0000\u0001\u0002 malicious-control-text",
  ])("renders attacker-controlled text as inert content: %s", (payload) => {
    render(
      <ResultItem
        label="Proof ID"
        value={payload}
      />,
    );

    expect(
      screen.getByText(payload),
    ).toBeInTheDocument();

    expect(
      document.querySelector("script"),
    ).not.toBeInTheDocument();

    expect(
      document.querySelector("img"),
    ).not.toBeInTheDocument();

    expect(
      document.querySelector("svg"),
    ).not.toBeInTheDocument();
  });

  it("does not create executable markup from malicious verification data", () => {
    const malicious =
      "<img src=x onerror=alert('xss')>";

    const result: VerifyProofResponse = {
      result: "VALID",
      status: "valid",
      credential: {
        id: malicious,
        schemaVersion: "1",
        subject: {
          walletHash: malicious,
        },
        claim: {
          operator: "gte",
          thresholdAmount: malicious,
          assetCode: malicious,
          assetIssuer: malicious,
          periodStart: "2026-01-01T00:00:00.000Z",
          periodEnd: "2026-12-31T00:00:00.000Z",
          qualifyingPaymentCount: 1,
        },
        privacy: {
          exactIncomeHidden: true,
          sourceTransactionsHidden: true,
        },
        issuedAt: "2026-01-01T00:00:00.000Z",
        expiresAt: "2027-01-01T00:00:00.000Z",
        proof: {
          type: "income",
          credentialHash: malicious,
          signature: malicious,
        },
      },
      proof: {
        id: malicious,
        type: "income",
        schemaVersion: "1",
        network: malicious,
        issuedAt: "2026-01-01T00:00:00.000Z",
        expiresAt: "2027-01-01T00:00:00.000Z",
        revokedAt: null,
      },
    };

    render(<VerificationPanel result={result} />);

    expect(
      screen.getAllByText(malicious).length,
    ).toBeGreaterThan(0);

    expect(
      document.querySelector("script"),
    ).not.toBeInTheDocument();

    expect(
      document.querySelector("img"),
    ).not.toBeInTheDocument();

    expect(
      document.querySelector("svg[onload]"),
    ).not.toBeInTheDocument();
  });

  it("does not interpolate server error text as HTML", () => {
    const maliciousError =
      "<script>window.__xss = true</script>";

    render(
      <p role="alert">{maliciousError}</p>,
    );

    expect(
      screen.getByRole("alert"),
    ).toHaveTextContent(maliciousError);

    expect(
      document.querySelector("script"),
    ).not.toBeInTheDocument();
  });
});
