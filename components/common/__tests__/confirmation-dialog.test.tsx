/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ConfirmationDialog } from "../confirmation-dialog";

describe("ConfirmationDialog", () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with basic props", () => {
    render(
      <ConfirmationDialog
        title="Test Dialog"
        message="Are you sure you want to continue?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText("Test Dialog")).toBeInTheDocument();
    expect(screen.getByText("Are you sure you want to continue?")).toBeInTheDocument();
    expect(screen.getByText("Confirm")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("renders with custom button text", () => {
    render(
      <ConfirmationDialog
        title="Delete Item"
        message="This action cannot be undone."
        confirmText="Delete"
        cancelText="Keep"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.getByText("Keep")).toBeInTheDocument();
  });

  it("applies danger variant styling", () => {
    render(
      <ConfirmationDialog
        title="Dangerous Action"
        message="This is dangerous."
        confirmVariant="danger"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByText("Confirm");
    expect(confirmButton).toHaveClass("bg-rose-600");
  });

  it("focuses cancel button on mount", () => {
    render(
      <ConfirmationDialog
        title="Test Dialog"
        message="Test message"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText("Cancel");
    expect(cancelButton).toHaveFocus();
  });

  it("calls onConfirm when confirm button is clicked", () => {
    render(
      <ConfirmationDialog
        title="Test Dialog"
        message="Test message"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByText("Confirm");
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when cancel button is clicked", () => {
    render(
      <ConfirmationDialog
        title="Test Dialog"
        message="Test message"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when Escape key is pressed", () => {
    render(
      <ConfirmationDialog
        title="Test Dialog"
        message="Test message"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("does not call onCancel on Escape when processing", () => {
    render(
      <ConfirmationDialog
        title="Test Dialog"
        message="Test message"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isProcessing={true}
      />
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it("disables buttons when processing", () => {
    render(
      <ConfirmationDialog
        title="Test Dialog"
        message="Test message"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isProcessing={true}
      />
    );

    const confirmButton = screen.getByText("Processing...");
    const cancelButton = screen.getByText("Cancel");

    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it("has correct accessibility attributes", () => {
    render(
      <ConfirmationDialog
        title="Test Dialog"
        message="Test message"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby");
    expect(dialog).toHaveAttribute("aria-describedby");

    const title = screen.getByText("Test Dialog");
    const message = screen.getByText("Test message");
    
    expect(title).toHaveAttribute("id");
    expect(message).toHaveAttribute("id");
  });
});