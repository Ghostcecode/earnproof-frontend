/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { VerifyErrorBoundary } from "../verify-error-boundary";

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("verification flow exploded");
  }
  return <div>Verify flow content</div>;
}

const originalConsoleError = console.error;

beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe("VerifyErrorBoundary", () => {
  it("renders children normally when nothing throws", () => {
    render(
      <VerifyErrorBoundary>
        <Bomb shouldThrow={false} />
      </VerifyErrorBoundary>,
    );

    expect(screen.getByText("Verify flow content")).toBeInTheDocument();
  });

  it("catches a thrown error and renders the fallback instead of crashing", () => {
    render(
      <VerifyErrorBoundary>
        <Bomb shouldThrow={true} />
      </VerifyErrorBoundary>,
    );

    expect(screen.getByText("Verification hit a problem")).toBeInTheDocument();
    expect(screen.queryByText("Verify flow content")).not.toBeInTheDocument();
  });

  it("logs the caught error without letting it propagate", () => {
    const spy = jest.spyOn(console, "error").mockImplementation();

    render(
      <VerifyErrorBoundary>
        <Bomb shouldThrow={true} />
      </VerifyErrorBoundary>,
    );

    expect(spy).toHaveBeenCalledWith(
      "VerifyErrorBoundary caught an error:",
      expect.any(Error),
      expect.anything(),
    );

    spy.mockRestore();
  });

  it("announces the fallback via role=alert and aria-live=assertive", () => {
    render(
      <VerifyErrorBoundary>
        <Bomb shouldThrow={true} />
      </VerifyErrorBoundary>,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "assertive");
  });

  it("moves focus to the error heading when the fallback mounts", async () => {
    render(
      <VerifyErrorBoundary>
        <Bomb shouldThrow={true} />
      </VerifyErrorBoundary>,
    );

    await Promise.resolve();

    expect(screen.getByText("Verification hit a problem")).toHaveFocus();
  });

  it("provides recovery options: retry, go back, and system status", () => {
    render(
      <VerifyErrorBoundary>
        <Bomb shouldThrow={true} />
      </VerifyErrorBoundary>,
    );

    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go back to verification" }),
    ).toHaveAttribute("href", "/verify");
    expect(
      screen.getByRole("link", { name: "Check system status" }),
    ).toHaveAttribute("href", "/status");
    expect(screen.getByRole("link", { name: "Contact support" })).toBeInTheDocument();
  });

  it("re-renders children when retry is clicked and the error condition is gone", () => {
    let shouldThrow = true;

    function ConditionalBomb() {
      if (shouldThrow) {
        throw new Error("verification flow exploded");
      }
      return <div>Verify flow content</div>;
    }

    render(
      <VerifyErrorBoundary>
        <ConditionalBomb />
      </VerifyErrorBoundary>,
    );
    expect(screen.getByText("Verification hit a problem")).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(screen.getByText("Verify flow content")).toBeInTheDocument();
    expect(screen.queryByText("Verification hit a problem")).not.toBeInTheDocument();
  });
});
