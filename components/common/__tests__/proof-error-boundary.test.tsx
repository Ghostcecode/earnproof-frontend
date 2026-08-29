/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { ProofErrorBoundary } from "../proof-error-boundary";

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("proof flow exploded");
  }
  return <div>Proof flow content</div>;
}

const originalConsoleError = console.error;

beforeAll(() => {
  // React logs the caught error to console.error too (dev-mode noise) —
  // silence it so the assertion on our own componentDidCatch log below
  // isn't drowned out. Restored after all tests in this file.
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe("ProofErrorBoundary", () => {
  it("renders children normally when nothing throws", () => {
    render(
      <ProofErrorBoundary>
        <Bomb shouldThrow={false} />
      </ProofErrorBoundary>,
    );

    expect(screen.getByText("Proof flow content")).toBeInTheDocument();
  });

  it("catches a thrown error and renders the fallback instead of crashing", () => {
    render(
      <ProofErrorBoundary>
        <Bomb shouldThrow={true} />
      </ProofErrorBoundary>,
    );

    expect(screen.getByText("Proof creation hit a problem")).toBeInTheDocument();
    expect(screen.queryByText("Proof flow content")).not.toBeInTheDocument();
  });

  it("logs the caught error without letting it propagate", () => {
    const spy = jest.spyOn(console, "error").mockImplementation();

    render(
      <ProofErrorBoundary>
        <Bomb shouldThrow={true} />
      </ProofErrorBoundary>,
    );

    expect(spy).toHaveBeenCalledWith(
      "ProofErrorBoundary caught an error:",
      expect.any(Error),
      expect.anything(),
    );

    spy.mockRestore();
  });

  it("announces the fallback via role=alert and aria-live=assertive", () => {
    render(
      <ProofErrorBoundary>
        <Bomb shouldThrow={true} />
      </ProofErrorBoundary>,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "assertive");
  });

  it("moves focus to the error heading when the fallback mounts", async () => {
    render(
      <ProofErrorBoundary>
        <Bomb shouldThrow={true} />
      </ProofErrorBoundary>,
    );

    // Focus is set from componentDidCatch via a microtask (see the
    // component's comment for why); flush it before asserting.
    await Promise.resolve();

    expect(screen.getByText("Proof creation hit a problem")).toHaveFocus();
  });

  it("provides recovery options: retry, go back, and system status", () => {
    render(
      <ProofErrorBoundary>
        <Bomb shouldThrow={true} />
      </ProofErrorBoundary>,
    );

    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go back to proof types" }),
    ).toHaveAttribute("href", "/proofs");
    expect(
      screen.getByRole("link", { name: "Check system status" }),
    ).toHaveAttribute("href", "/status");
    expect(screen.getByRole("link", { name: "Contact support" })).toBeInTheDocument();
  });

  it("re-renders children when retry is clicked and the error condition is gone", () => {
    let shouldThrow = true;

    function ConditionalBomb() {
      if (shouldThrow) {
        throw new Error("proof flow exploded");
      }
      return <div>Proof flow content</div>;
    }

    render(
      <ProofErrorBoundary>
        <ConditionalBomb />
      </ProofErrorBoundary>,
    );
    expect(screen.getByText("Proof creation hit a problem")).toBeInTheDocument();

    // Simulate the underlying condition being fixed, then retry.
    shouldThrow = false;
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(screen.getByText("Proof flow content")).toBeInTheDocument();
    expect(screen.queryByText("Proof creation hit a problem")).not.toBeInTheDocument();
  });
});
