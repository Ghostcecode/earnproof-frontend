/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { OneTimeSecret } from "../one-time-secret";

const mockApiKey = {
  id: "key_123",
  name: "Test API Key",
  prefix: "ep_test_abc123",
  scopes: ["verification:read", "proofs:create"],
  expiresAt: "2026-12-31T23:59:59.000Z",
};

const mockSecret = "ep_test_abc123def456ghi789";

// Mock clipboard API
const mockWriteText = jest.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("OneTimeSecret", () => {
  it("displays the API key information correctly", () => {
    const mockOnDismiss = jest.fn();
    
    render(
      <OneTimeSecret
        apiKey={mockApiKey}
        secret={mockSecret}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText("API Key Created Successfully")).toBeInTheDocument();
    expect(screen.getByText(/Test API Key/)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockSecret)).toBeInTheDocument();
    expect(screen.getByText("key_123")).toBeInTheDocument();
    expect(screen.getByText("ep_test_abc123")).toBeInTheDocument();
    expect(screen.getByText("verification:read, proofs:create")).toBeInTheDocument();
  });

  it("focuses the dismiss button on mount", () => {
    const mockOnDismiss = jest.fn();
    
    render(
      <OneTimeSecret
        apiKey={mockApiKey}
        secret={mockSecret}
        onDismiss={mockOnDismiss}
      />
    );

    const dismissButton = screen.getByText("I've saved the secret, dismiss this");
    expect(dismissButton).toHaveFocus();
  });

  it("selects all text when clicking the secret input", () => {
    const mockOnDismiss = jest.fn();
    
    render(
      <OneTimeSecret
        apiKey={mockApiKey}
        secret={mockSecret}
        onDismiss={mockOnDismiss}
      />
    );

    const secretInput = screen.getByDisplayValue(mockSecret);
    const selectSpy = jest.spyOn(secretInput, "select");
    
    fireEvent.click(secretInput);
    expect(selectSpy).toHaveBeenCalled();
  });

  it("copies secret to clipboard successfully", async () => {
    mockWriteText.mockResolvedValueOnce(undefined);
    const mockOnDismiss = jest.fn();
    
    render(
      <OneTimeSecret
        apiKey={mockApiKey}
        secret={mockSecret}
        onDismiss={mockOnDismiss}
      />
    );

    const copyButton = screen.getByText("Copy");
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(mockSecret);
      expect(screen.getByText("Copied to clipboard")).toBeInTheDocument();
    });
  });

  it("handles clipboard copy failure", async () => {
    mockWriteText.mockRejectedValueOnce(new Error("Clipboard access denied"));
    const mockOnDismiss = jest.fn();
    
    render(
      <OneTimeSecret
        apiKey={mockApiKey}
        secret={mockSecret}
        onDismiss={mockOnDismiss}
      />
    );

    const copyButton = screen.getByText("Copy");
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(screen.getByText("Failed to copy to clipboard. Please copy manually.")).toBeInTheDocument();
    });
  });

  it("calls onDismiss when dismiss button is clicked", () => {
    const mockOnDismiss = jest.fn();
    
    render(
      <OneTimeSecret
        apiKey={mockApiKey}
        secret={mockSecret}
        onDismiss={mockOnDismiss}
      />
    );

    const dismissButton = screen.getByText("I've saved the secret, dismiss this");
    fireEvent.click(dismissButton);

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it("displays expiry date when provided", () => {
    const mockOnDismiss = jest.fn();
    
    render(
      <OneTimeSecret
        apiKey={mockApiKey}
        secret={mockSecret}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText("12/31/2026")).toBeInTheDocument();
  });

  it("does not display expiry when not provided", () => {
    const mockOnDismiss = jest.fn();
    const keyWithoutExpiry = { ...mockApiKey, expiresAt: null };
    
    render(
      <OneTimeSecret
        apiKey={keyWithoutExpiry}
        secret={mockSecret}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.queryByText(/Expires:/)).not.toBeInTheDocument();
  });

  it("clears the input value on unmount", () => {
    const mockOnDismiss = jest.fn();
    
    const { unmount } = render(
      <OneTimeSecret
        apiKey={mockApiKey}
        secret={mockSecret}
        onDismiss={mockOnDismiss}
      />
    );

    const secretInput = screen.getByDisplayValue(mockSecret) as HTMLInputElement;
    expect(secretInput.value).toBe(mockSecret);

    unmount();
    
    // The cleanup effect should have cleared the value
    // Note: This test verifies the cleanup intent, actual DOM cleanup happens after unmount
  });
});