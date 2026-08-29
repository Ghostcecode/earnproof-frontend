/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { SkeletonBlock, SkeletonContainer } from "../skeleton-base";

describe("SkeletonBlock", () => {
  it("renders as a decorative, aria-hidden element", () => {
    render(<SkeletonBlock data-testid="block" />);
    const block = screen.getByTestId("block");
    expect(block).toHaveAttribute("aria-hidden", "true");
  });

  it("applies the pulse animation and passed-through className", () => {
    render(<SkeletonBlock className="h-4 w-10" data-testid="block" />);
    const block = screen.getByTestId("block");
    expect(block).toHaveClass("animate-pulse");
    expect(block).toHaveClass("h-4");
    expect(block).toHaveClass("w-10");
  });
});

describe("SkeletonContainer", () => {
  it("exposes aria-busy and role=status for the loading region", () => {
    render(
      <SkeletonContainer label="Loading things...">
        <SkeletonBlock />
      </SkeletonContainer>,
    );

    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-busy", "true");
    expect(region).toHaveAttribute("aria-live", "polite");
  });

  it("announces the label via visually-hidden text", () => {
    render(
      <SkeletonContainer label="Loading payments...">
        <SkeletonBlock />
      </SkeletonContainer>,
    );

    expect(screen.getByText("Loading payments...")).toHaveClass("sr-only");
  });

  it("renders children inside the status region", () => {
    render(
      <SkeletonContainer label="Loading...">
        <SkeletonBlock data-testid="child-block" />
      </SkeletonContainer>,
    );

    expect(screen.getByTestId("child-block")).toBeInTheDocument();
  });
});
