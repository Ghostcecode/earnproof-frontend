/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { VerifyResultSkeleton } from "../verify-result-skeleton";

describe("VerifyResultSkeleton", () => {
  it("announces a loading status accessible to screen readers", () => {
    render(<VerifyResultSkeleton />);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Looking up proof...")).toBeInTheDocument();
  });

  it("renders a status-pill placeholder and a definition list of field placeholders", () => {
    const { container } = render(<VerifyResultSkeleton />);
    const dl = container.querySelector("dl");
    expect(dl).not.toBeNull();
    expect(dl?.children.length).toBe(8);
  });
});
