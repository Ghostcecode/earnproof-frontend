/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { PrivacyControls } from "../privacy-controls";

describe("PrivacyControls", () => {
  const mockOnDiscloseSenderChange = jest.fn();
  const mockOnDiscloseAmountChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with default privacy settings (both hidden)", () => {
    render(
      <PrivacyControls
        discloseSender={false}
        discloseAmount={false}
        onDiscloseSenderChange={mockOnDiscloseSenderChange}
        onDiscloseAmountChange={mockOnDiscloseAmountChange}
        disabled={false}
      />
    );

    expect(screen.getByText("Privacy Controls")).toBeInTheDocument();
    expect(screen.getAllByText("Keep Private (Recommended)")).toHaveLength(2);
    
    // Check that "Keep Private" options are selected by default
    const senderPrivateRadio = screen.getAllByDisplayValue("false")[0];
    const amountPrivateRadio = screen.getAllByDisplayValue("false")[1];
    expect(senderPrivateRadio).toBeChecked();
    expect(amountPrivateRadio).toBeChecked();
  });

  it("reflects disclosure settings in UI", () => {
    render(
      <PrivacyControls
        discloseSender={true}
        discloseAmount={true}
        onDiscloseSenderChange={mockOnDiscloseSenderChange}
        onDiscloseAmountChange={mockOnDiscloseAmountChange}
        disabled={false}
      />
    );

    // When both are disclosed, the "Disclose to Verifiers" options should be selected
    const radioButtons = screen.getAllByRole("radio");
    const discloseSenderRadio = radioButtons.find(radio => 
      radio.getAttribute("name") === "sender-disclosure" && radio.getAttribute("value") !== "false"
    );
    const discloseAmountRadio = radioButtons.find(radio => 
      radio.getAttribute("name") === "amount-disclosure" && radio.getAttribute("value") !== "false"
    );
    
    expect(discloseSenderRadio).toBeChecked();
    expect(discloseAmountRadio).toBeChecked();
  });

  it("calls onDiscloseSenderChange when sender disclosure changes", () => {
    render(
      <PrivacyControls
        discloseSender={false}
        discloseAmount={false}
        onDiscloseSenderChange={mockOnDiscloseSenderChange}
        onDiscloseAmountChange={mockOnDiscloseAmountChange}
        disabled={false}
      />
    );

    // Find and click the "Disclose to Verifiers" option for sender
    const senderSection = screen.getByText("Sender Information").closest("div");
    const discloseRadio = senderSection?.querySelector('input[type="radio"]:not([value="false"])') as HTMLElement;
    
    fireEvent.click(discloseRadio);

    expect(mockOnDiscloseSenderChange).toHaveBeenCalledWith(true);
  });

  it("calls onDiscloseAmountChange when amount disclosure changes", () => {
    render(
      <PrivacyControls
        discloseSender={false}
        discloseAmount={false}
        onDiscloseSenderChange={mockOnDiscloseSenderChange}
        onDiscloseAmountChange={mockOnDiscloseAmountChange}
        disabled={false}
      />
    );

    // Find and click the "Disclose to Verifiers" option for amount
    const amountSection = screen.getByText("Payment Amount").closest("div");
    const discloseRadio = amountSection?.querySelector('input[type="radio"]:not([value="false"])') as HTMLElement;
    
    fireEvent.click(discloseRadio);

    expect(mockOnDiscloseAmountChange).toHaveBeenCalledWith(true);
  });

  it("shows maximum privacy impact when both are hidden", () => {
    render(
      <PrivacyControls
        discloseSender={false}
        discloseAmount={false}
        onDiscloseSenderChange={mockOnDiscloseSenderChange}
        onDiscloseAmountChange={mockOnDiscloseAmountChange}
        disabled={false}
      />
    );

    expect(screen.getByText(/Both sender and amount will remain private/)).toBeInTheDocument();
    expect(screen.getByText("Privacy Impact")).toBeInTheDocument();
  });

  it("shows disclosure warning when information is disclosed", () => {
    render(
      <PrivacyControls
        discloseSender={true}
        discloseAmount={false}
        onDiscloseSenderChange={mockOnDiscloseSenderChange}
        onDiscloseAmountChange={mockOnDiscloseAmountChange}
        disabled={false}
      />
    );

    expect(screen.getByText(/Sender information will be visible to verifiers/)).toBeInTheDocument();
  });

  it("disables all inputs when disabled prop is true", () => {
    render(
      <PrivacyControls
        discloseSender={false}
        discloseAmount={false}
        onDiscloseSenderChange={mockOnDiscloseSenderChange}
        onDiscloseAmountChange={mockOnDiscloseAmountChange}
        disabled={true}
      />
    );

    const fieldset = screen.getByRole("group");
    expect(fieldset).toBeDisabled();
    
    expect(screen.getByText("Select a payment above to configure privacy settings.")).toBeInTheDocument();
  });

  it("includes accessibility labels and descriptions", () => {
    render(
      <PrivacyControls
        discloseSender={false}
        discloseAmount={false}
        onDiscloseSenderChange={mockOnDiscloseSenderChange}
        onDiscloseAmountChange={mockOnDiscloseAmountChange}
        disabled={false}
      />
    );

    // Check for fieldset legend
    expect(screen.getByText("Disclosure Preferences")).toBeInTheDocument();
    
    // Check for radio group names
    const radioButtons = screen.getAllByRole("radio");
    expect(radioButtons.some(radio => radio.getAttribute("name") === "sender-disclosure")).toBe(true);
    expect(radioButtons.some(radio => radio.getAttribute("name") === "amount-disclosure")).toBe(true);
  });

  it("shows detailed explanations for each disclosure option", () => {
    render(
      <PrivacyControls
        discloseSender={false}
        discloseAmount={false}
        onDiscloseSenderChange={mockOnDiscloseSenderChange}
        onDiscloseAmountChange={mockOnDiscloseAmountChange}
        disabled={false}
      />
    );

    // Should show explanatory text for each option
    expect(screen.getByText(/sender's identity will remain completely private/)).toBeInTheDocument();
    expect(screen.getByText(/payment amount will remain completely private/)).toBeInTheDocument();
    expect(screen.getByText(/sender's wallet address and identity.*will be visible/)).toBeInTheDocument();
    expect(screen.getByText(/exact payment amount will be visible/)).toBeInTheDocument();
  });
});