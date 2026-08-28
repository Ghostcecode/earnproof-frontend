/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { WizardSteps } from "../wizard-steps";
import { WIZARD_STEPS } from "@/lib/validation/recurring-income-proofs";

describe("WizardSteps", () => {
  const mockOnStepChange = jest.fn();
  const mockCanProceedToStep = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all steps with correct labels", () => {
    mockCanProceedToStep.mockReturnValue(false);

    render(
      <WizardSteps
        currentStep={WIZARD_STEPS.INTERVAL_CONFIG}
        onStepChange={mockOnStepChange}
        canProceedToStep={mockCanProceedToStep}
      />
    );

    expect(screen.getByText("Interval Configuration")).toBeInTheDocument();
    expect(screen.getByText("Period Configuration")).toBeInTheDocument();
    expect(screen.getByText("Payment Selection")).toBeInTheDocument();
    expect(screen.getByText("Coverage Analysis")).toBeInTheDocument();
    expect(screen.getByText("Confirmation")).toBeInTheDocument();
  });

  it("shows current step with correct styling", () => {
    mockCanProceedToStep.mockReturnValue(false);

    render(
      <WizardSteps
        currentStep={WIZARD_STEPS.PERIOD_CONFIG}
        onStepChange={mockOnStepChange}
        canProceedToStep={mockCanProceedToStep}
      />
    );

    const stepButtons = screen.getAllByRole("button").filter(button => 
      /^\d+$/.test(button.textContent || "")
    );

    // Second step (Period Config) should be current (index 1)
    expect(stepButtons[1]).toHaveClass("bg-cyan-300");
    expect(stepButtons[1]).toHaveAttribute("aria-current", "step");
  });

  it("shows completed steps with checkmark", () => {
    mockCanProceedToStep.mockReturnValue(false);

    render(
      <WizardSteps
        currentStep={WIZARD_STEPS.COVERAGE_ANALYSIS}
        onStepChange={mockOnStepChange}
        canProceedToStep={mockCanProceedToStep}
      />
    );

    // First three steps should be completed (showing checkmarks)
    const completedSteps = screen.getAllByRole("button").filter(button =>
      button.querySelector("svg")
    );

    expect(completedSteps.length).toBeGreaterThanOrEqual(3);
  });

  it("allows navigation to previous steps", () => {
    mockCanProceedToStep.mockReturnValue(false);

    render(
      <WizardSteps
        currentStep={WIZARD_STEPS.PAYMENT_SELECTION}
        onStepChange={mockOnStepChange}
        canProceedToStep={mockCanProceedToStep}
      />
    );

    // Click on the first step (should be navigable)
    const firstStepButton = screen.getAllByRole("button").filter(button => 
      /^\d+$/.test(button.textContent || "") || button.querySelector("svg")
    )[0];

    fireEvent.click(firstStepButton);

    expect(mockOnStepChange).toHaveBeenCalledWith(WIZARD_STEPS.INTERVAL_CONFIG);
  });

  it("allows navigation to next step when canProceedToStep returns true", () => {
    mockCanProceedToStep.mockImplementation((step) => 
      step === WIZARD_STEPS.INTERVAL_CONFIG
    );

    render(
      <WizardSteps
        currentStep={WIZARD_STEPS.INTERVAL_CONFIG}
        onStepChange={mockOnStepChange}
        canProceedToStep={mockCanProceedToStep}
      />
    );

    const nextButton = screen.getByText("Next");
    fireEvent.click(nextButton);

    expect(mockOnStepChange).toHaveBeenCalledWith(WIZARD_STEPS.PERIOD_CONFIG);
  });

  it("disables next button when cannot proceed", () => {
    mockCanProceedToStep.mockReturnValue(false);

    render(
      <WizardSteps
        currentStep={WIZARD_STEPS.INTERVAL_CONFIG}
        onStepChange={mockOnStepChange}
        canProceedToStep={mockCanProceedToStep}
      />
    );

    const nextButton = screen.getByText("Next");
    expect(nextButton).toBeDisabled();
  });

  it("shows Previous button as disabled on first step", () => {
    mockCanProceedToStep.mockReturnValue(false);

    render(
      <WizardSteps
        currentStep={WIZARD_STEPS.INTERVAL_CONFIG}
        onStepChange={mockOnStepChange}
        canProceedToStep={mockCanProceedToStep}
      />
    );

    const previousButton = screen.getByText("Previous");
    expect(previousButton).toBeDisabled();
  });

  it("navigates to previous step when Previous is clicked", () => {
    mockCanProceedToStep.mockReturnValue(false);

    render(
      <WizardSteps
        currentStep={WIZARD_STEPS.PERIOD_CONFIG}
        onStepChange={mockOnStepChange}
        canProceedToStep={mockCanProceedToStep}
      />
    );

    const previousButton = screen.getByText("Previous");
    fireEvent.click(previousButton);

    expect(mockOnStepChange).toHaveBeenCalledWith(WIZARD_STEPS.INTERVAL_CONFIG);
  });

  it("shows Complete button on last step", () => {
    mockCanProceedToStep.mockReturnValue(false);

    render(
      <WizardSteps
        currentStep={WIZARD_STEPS.CONFIRMATION}
        onStepChange={mockOnStepChange}
        canProceedToStep={mockCanProceedToStep}
      />
    );

    expect(screen.getByText("Complete")).toBeInTheDocument();
    expect(screen.queryByText("Next")).not.toBeInTheDocument();
  });

  it("has proper accessibility attributes", () => {
    mockCanProceedToStep.mockReturnValue(false);

    render(
      <WizardSteps
        currentStep={WIZARD_STEPS.INTERVAL_CONFIG}
        onStepChange={mockOnStepChange}
        canProceedToStep={mockCanProceedToStep}
      />
    );

    const nav = screen.getByLabelText("Progress");
    expect(nav).toBeInTheDocument();

    const currentStepButton = screen.getByText("1");
    expect(currentStepButton).toHaveAttribute("aria-current", "step");
  });
});