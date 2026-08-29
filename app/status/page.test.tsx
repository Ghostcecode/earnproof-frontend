/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StatusPage from "./page";

jest.mock("@/components/layout/public-shell", () => ({
  PublicShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("@/components/common/page-heading", () => ({
  PageHeading: ({
    title,
    description,
  }: {
    title: string;
    description: string;
  }) => (
    <header>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  ),
}));

jest.mock("@/components/common/production-ui", () => ({
  pageContainer: "page-container",
  MetricGrid: ({ items }: { items: { value: string; label: string }[] }) => (
    <section>
      {items.map((item) => (
        <div key={item.label}>
          <span>{item.value}</span> – <span>{item.label}</span>
        </div>
      ))}
    </section>
  ),
  StatusBadge: ({
    children,
    tone,
  }: {
    children: React.ReactNode;
    tone?: string;
  }) => (
    <span data-tone={tone}>{children}</span>
  ),
  DataPanel: ({
    headers,
    rows,
    searchPlaceholder,
  }: {
    headers: string[];
    rows: {
      primary: string;
      secondary: string;
      tertiary: string;
      status: string;
    }[];
    searchPlaceholder: string;
  }) => (
    <section>
      <input placeholder={searchPlaceholder} />
      <div>
        {headers.map((h) => (
          <span key={h}>{h}</span>
        ))}
      </div>
      {rows.map((row) => (
        <article key={row.primary}>
          <span>{row.primary}</span>
          <span>{row.secondary}</span>
          <span>{row.tertiary}</span>
          <span>{row.status}</span>
        </article>
      ))}
    </section>
  ),
}));

const HEALTH_OK = {
  status: "ok",
  service: "earnproof-api",
  database: "ok",
  timestamp: new Date().toISOString(),
};

const originalFetch = global.fetch;

beforeEach(() => {
  jest.useFakeTimers();
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => HEALTH_OK,
  });
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.useRealTimers();
});

describe("StatusPage", () => {
  it("renders the page heading and initial loading state", () => {
    render(<StatusPage />);

    expect(
      screen.getByRole("heading", { name: "System status" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Live health for the EarnProof API/),
    ).toBeInTheDocument();
  });

  it("shows the loading skeleton before the first health check resolves", () => {
    render(<StatusPage />);

    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Checking system status...")).toBeInTheDocument();
    expect(screen.queryByText("EarnProof API")).not.toBeInTheDocument();
  });

  it("renders live health data after fetch succeeds", async () => {
    render(<StatusPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
    });

    expect(screen.getByText("EarnProof API")).toBeInTheDocument();
    expect(screen.getByText("Database")).toBeInTheDocument();
    expect(screen.getAllByText("Global").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Just now").length).toBeGreaterThan(0);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows error banner when fetch fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({}),
    });

    render(<StatusPage />);

    await waitFor(() => {
      expect(screen.getByText("HTTP 503")).toBeInTheDocument();
    });

    expect(screen.getByText("Unreachable")).toBeInTheDocument();
  });

  it("shows timeout error state", async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(
              new DOMException("The operation was aborted.", "AbortError"),
            );
          });
        }),
    );

    render(<StatusPage />);

    act(() => {
      jest.advanceTimersByTime(10_000);
    });

    await waitFor(() => {
      expect(screen.getByText("Timeout")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Request timed out"),
    ).toBeInTheDocument();
  });

  it("shows retry button and refetches on click", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({}),
    });

    render(<StatusPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => HEALTH_OK,
    });

    await user.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
    });
  });

  it("renders all expected service rows", async () => {
    render(<StatusPage />);

    await waitFor(() => {
      expect(screen.getByText("EarnProof API")).toBeInTheDocument();
    });

    expect(screen.getByText("Database")).toBeInTheDocument();
    expect(screen.getByText("Stellar indexer")).toBeInTheDocument();
    expect(screen.getByText("Smart contracts")).toBeInTheDocument();
    expect(screen.getByText("Webhook delivery")).toBeInTheDocument();
  });

  it("shows last checked timestamp", async () => {
    render(<StatusPage />);

    await waitFor(() => {
      expect(screen.getByText(/Last checked:/)).toBeInTheDocument();
    });
  });
});
