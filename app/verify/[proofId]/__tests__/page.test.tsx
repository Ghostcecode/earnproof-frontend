import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import VerifyProofPage from "../page";
import { apiClient } from "@/lib/api/client";

// Mock the API client
jest.mock("@/lib/api/client");
const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/verify/ep_7F3A"
}));

// Mock Next.js Link component
jest.mock("next/link", () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

const mockValidResponse = {
  result: "VALID" as const,
  status: "valid" as const,
  credential: {
    id: "ep_7F3A",
    schemaVersion: "1.0",
    subject: {
      walletHash: "sha256:7fc0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    },
    claim: {
      operator: "gte" as const,
      thresholdAmount: "100",
      assetCode: "USDC",
      assetIssuer: null,
      periodStart: "2026-08-01T00:00:00.000Z",
      periodEnd: "2026-08-31T23:59:59.000Z",
      qualifyingPaymentCount: 3
    },
    privacy: {
      exactIncomeHidden: true,
      sourceTransactionsHidden: true
    },
    issuedAt: "2026-08-20T10:00:00.000Z",
    expiresAt: "2026-09-19T10:00:00.000Z"
  },
  proof: {
    id: "ep_7F3A",
    type: "MINIMUM_INCOME",
    network: "testnet",
    schemaVersion: "1.0",
    issuedAt: "2026-08-20T10:00:00.000Z",
    expiresAt: "2026-09-19T10:00:00.000Z",
    revokedAt: null
  }
};

const mockUnknownResponse = {
  result: "UNKNOWN_PROOF" as const,
  status: "unknown" as const
};

const mockExpiredResponse = {
  ...mockValidResponse,
  result: "EXPIRED" as const,
  status: "expired" as const
};

const mockRevokedResponse = {
  ...mockValidResponse,
  result: "REVOKED" as const,
  status: "revoked" as const,
  proof: {
    ...mockValidResponse.proof,
    revokedAt: "2026-08-25T10:00:00.000Z"
  }
};

describe("VerifyProofPage", () => {
  const mockParams = { proofId: "ep_7F3A" };

  beforeEach(() => {
    mockApiClient.mockClear();
  });

  it("shows loading state initially", () => {
    mockApiClient.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<VerifyProofPage params={mockParams} />);
    
    expect(screen.getByText("Verifying proof...")).toBeInTheDocument();
  });

  it("displays valid proof result with all details", async () => {
    mockApiClient.mockResolvedValue(mockValidResponse);
    
    render(<VerifyProofPage params={mockParams} />);
    
    await waitFor(() => {
      expect(screen.getByText("valid")).toBeInTheDocument();
    });

    expect(screen.getByText("This proof has been successfully verified and is currently valid.")).toBeInTheDocument();
    expect(screen.getByText("ep_7F3A")).toBeInTheDocument();
    expect(screen.getByText("testnet")).toBeInTheDocument();
    expect(screen.getByText("≥ 100 USDC")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument(); // Qualifying payments
  });

  it("displays unknown proof result", async () => {
    mockApiClient.mockResolvedValue(mockUnknownResponse);
    
    render(<VerifyProofPage params={mockParams} />);
    
    await waitFor(() => {
      expect(screen.getByText("unknown")).toBeInTheDocument();
    });

    expect(screen.getByText("No matching proof was found for this identifier.")).toBeInTheDocument();
    expect(screen.getByText("No proof details available")).toBeInTheDocument();
  });

  it("displays expired proof result", async () => {
    mockApiClient.mockResolvedValue(mockExpiredResponse);
    
    render(<VerifyProofPage params={mockParams} />);
    
    await waitFor(() => {
      expect(screen.getByText("expired")).toBeInTheDocument();
    });

    expect(screen.getByText("This proof has expired and is no longer valid for verification.")).toBeInTheDocument();
  });

  it("displays revoked proof result with revocation date", async () => {
    mockApiClient.mockResolvedValue(mockRevokedResponse);
    
    render(<VerifyProofPage params={mockParams} />);
    
    await waitFor(() => {
      expect(screen.getByText("revoked")).toBeInTheDocument();
    });

    expect(screen.getByText("This proof has been revoked and is no longer valid.")).toBeInTheDocument();
  });

  it("handles network error with retry functionality", async () => {
    const networkError = new Error("EarnProof API request failed with 500");
    mockApiClient.mockRejectedValueOnce(networkError);
    
    render(<VerifyProofPage params={mockParams} />);
    
    await waitFor(() => {
      expect(screen.getByText("Verification failed")).toBeInTheDocument();
    });

    expect(screen.getByText("Server error occurred during verification. Please try again later.")).toBeInTheDocument();
    
    // Test retry functionality
    const retryButton = screen.getByText("Try again");
    expect(retryButton).toBeInTheDocument();
    
    mockApiClient.mockResolvedValueOnce(mockValidResponse);
    fireEvent.click(retryButton);
    
    await waitFor(() => {
      expect(screen.getByText("valid")).toBeInTheDocument();
    });
  });

  it("handles 404 error appropriately", async () => {
    const notFoundError = new Error("EarnProof API request failed with 404");
    mockApiClient.mockRejectedValue(notFoundError);
    
    render(<VerifyProofPage params={mockParams} />);
    
    await waitFor(() => {
      expect(screen.getByText("Proof not found. Please check the proof identifier and try again.")).toBeInTheDocument();
    });
  });

  it("safely encodes proof ID in API request", async () => {
    const specialProofId = "ep_test/with%special&chars";
    mockApiClient.mockResolvedValue(mockValidResponse);
    
    render(<VerifyProofPage params={{ proofId: specialProofId }} />);
    
    await waitFor(() => {
      expect(mockApiClient).toHaveBeenCalledWith({
        path: `/proofs/${encodeURIComponent(specialProofId)}/verify`,
        method: "GET"
      });
    });
  });

  it("protects sensitive information in privacy notice", async () => {
    mockApiClient.mockResolvedValue(mockValidResponse);
    
    render(<VerifyProofPage params={mockParams} />);
    
    await waitFor(() => {
      expect(screen.getByText("Privacy notice")).toBeInTheDocument();
    });

    expect(screen.getByText("Exact income amounts are hidden to protect financial privacy")).toBeInTheDocument();
    expect(screen.getByText("Source transaction details are hidden to protect payment privacy")).toBeInTheDocument();
  });

  it("does not expose full wallet addresses", async () => {
    mockApiClient.mockResolvedValue(mockValidResponse);
    
    render(<VerifyProofPage params={mockParams} />);
    
    await waitFor(() => {
      // Should show truncated wallet hash, not full hash
      expect(screen.getByText("sha256:7fc0123456789abc...")).toBeInTheDocument();
      // Should not show the full hash
      expect(screen.queryByText("sha256:7fc0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")).not.toBeInTheDocument();
    });
  });

  it("provides navigation links to other actions", async () => {
    mockApiClient.mockResolvedValue(mockValidResponse);
    
    render(<VerifyProofPage params={mockParams} />);
    
    await waitFor(() => {
      const verifyAnotherLink = screen.getByText("Verify another proof");
      expect(verifyAnotherLink.closest("a")).toHaveAttribute("href", "/verify");
      
      const createProofLink = screen.getByText("Create your own proof");
      expect(createProofLink.closest("a")).toHaveAttribute("href", "/proofs/create");
    });
  });

  it("includes system status link in error state", async () => {
    const networkError = new Error("Network error");
    mockApiClient.mockRejectedValue(networkError);
    
    render(<VerifyProofPage params={mockParams} />);
    
    await waitFor(() => {
      const statusLink = screen.getByText("Check system status");
      expect(statusLink.closest("a")).toHaveAttribute("href", "/status");
    });
  });
});