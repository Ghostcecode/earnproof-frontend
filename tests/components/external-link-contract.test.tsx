import { render, screen } from "@testing-library/react";

import {
  ExternalLink,
} from "@/components/common/external-link";

describe("ExternalLink contract", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("renders a safe trusted external link", () => {
    render(
      <ExternalLink href="https://stellar.expert/explorer">
        Stellar Explorer
      </ExternalLink>,
    );

    const link = screen.getByRole("link", {
      name: "Stellar Explorer",
    });

    expect(link).toHaveAttribute(
      "href",
      "https://stellar.expert/explorer",
    );

    expect(link).toHaveAttribute(
      "target",
      "_blank",
    );

    expect(link).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
  });

  it.each([
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "file:///etc/passwd",
  ])("does not render unsafe href: %s", (href) => {
    render(
      <ExternalLink href={href}>
        Unsafe link
      </ExternalLink>,
    );

    expect(
      screen.queryByRole("link", {
        name: "Unsafe link",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByText("Unsafe link"),
    ).toHaveAttribute(
      "data-blocked-url",
      "true",
    );
  });
});
