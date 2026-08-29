/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { StatusCheckSkeleton } from "../status-check-skeleton";

describe("StatusCheckSkeleton", () => {
  it("announces a loading status accessible to screen readers", () => {
    render(<StatusCheckSkeleton />);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Checking system status...")).toBeInTheDocument();
  });

  it("renders three metric-card placeholders", () => {
    const { container } = render(<StatusCheckSkeleton />);
    const metricGrid = container.querySelector(".sm\\:grid-cols-3");
    expect(metricGrid?.children.length).toBe(3);
  });

  it("defaults to 5 service-row placeholders and honors a custom count", () => {
    const { container: withDefault } = render(<StatusCheckSkeleton />);
    expect(
      withDefault.querySelectorAll(".md\\:grid-cols-\\[1\\.3fr_1fr_1fr_1fr\\]"),
    ).toHaveLength(5);

    const { container: withCustom } = render(<StatusCheckSkeleton rows={2} />);
    expect(
      withCustom.querySelectorAll(".md\\:grid-cols-\\[1\\.3fr_1fr_1fr_1fr\\]"),
    ).toHaveLength(2);
  });
});
