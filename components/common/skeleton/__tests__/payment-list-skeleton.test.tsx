/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { PaymentListSkeleton } from "../payment-list-skeleton";

describe("PaymentListSkeleton", () => {
  it("announces a loading status accessible to screen readers", () => {
    render(<PaymentListSkeleton />);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading payments...")).toBeInTheDocument();
  });

  it("defaults to 3 placeholder rows", () => {
    const { container } = render(<PaymentListSkeleton />);
    const rows = container.querySelectorAll(":scope > [role='status'] > div");
    expect(rows).toHaveLength(3);
  });

  it("renders the requested number of placeholder rows", () => {
    const { container } = render(<PaymentListSkeleton rows={5} />);
    const rows = container.querySelectorAll(":scope > [role='status'] > div");
    expect(rows).toHaveLength(5);
  });
});
