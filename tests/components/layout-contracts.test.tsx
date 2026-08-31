import { render, screen } from "@testing-library/react";

import { PublicFooter } from "@/components/layout/public-footer";
import { PublicNav } from "@/components/layout/public-nav";
import { PublicShell } from "@/components/layout/public-shell";

describe("shared layout contracts", () => {
  it("renders the public navigation", () => {
    render(<PublicNav />);

    expect(
      screen.getByRole("navigation"),
    ).toBeInTheDocument();
  });

  it("renders the public footer", () => {
    render(<PublicFooter />);

    expect(
      screen.getByRole("contentinfo"),
    ).toBeInTheDocument();
  });

  it("composes PublicShell around route content", () => {
    render(
      <PublicShell>
        <main aria-label="Test route">
          Test route content
        </main>
      </PublicShell>,
    );

    expect(
      screen.getByLabelText("Test route"),
    ).toBeInTheDocument();
  });
});
