import { render, screen, fireEvent } from "@testing-library/react";
import ErrorPage from "../error";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/error"
}));

// Mock Next.js Link component
jest.mock("next/link", () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock console.error to avoid test output noise
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe("ErrorPage", () => {
  const mockError = new Error("Test error message");
  const mockReset = jest.fn();

  beforeEach(() => {
    mockReset.mockClear();
  });

  it("renders error page title and description", () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("An unexpected error occurred while loading this page. We apologize for the inconvenience.")).toBeInTheDocument();
  });

  it("displays user-friendly error message without technical details in production", () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });
    
    render(<ErrorPage error={mockError} reset={mockReset} />);
    
    expect(screen.getByText("An internal application error has occurred. The technical team has been notified and is working to resolve the issue.")).toBeInTheDocument();
    expect(screen.queryByText("Test error message")).not.toBeInTheDocument();
    
    Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true });
  });

  it("shows developer details in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });
    
    render(<ErrorPage error={mockError} reset={mockReset} />);
    
    expect(screen.getByText("Developer details")).toBeInTheDocument();
    expect(screen.getByText("Test error message")).toBeInTheDocument();
    
    Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true });
  });

  it("calls reset function when try again button is clicked", () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    
    const tryAgainButton = screen.getByText("Try again");
    expect(tryAgainButton).toBeInTheDocument();
    
    fireEvent.click(tryAgainButton);
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it("provides link to system status page", () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    
    const statusLink = screen.getByText("System status");
    expect(statusLink.closest("a")).toHaveAttribute("href", "/status");
  });

  it("provides navigation links to main areas", () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    
    const homepageLink = screen.getByText("Go to homepage");
    expect(homepageLink.closest("a")).toHaveAttribute("href", "/");
    
    const verifyLink = screen.getByText("Verify a proof");
    expect(verifyLink.closest("a")).toHaveAttribute("href", "/verify");
    
    const createLink = screen.getByText("Create a proof");
    expect(createLink.closest("a")).toHaveAttribute("href", "/proofs/create");
  });

  it("provides link to accessibility page for support", () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    
    const accessibilityLink = screen.getByText("accessibility page");
    expect(accessibilityLink.closest("a")).toHaveAttribute("href", "/accessibility");
  });

  it("includes both try again and system status actions", () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    
    expect(screen.getByText("What you can do")).toBeInTheDocument();
    expect(screen.getByText("Try again")).toBeInTheDocument();
    expect(screen.getByText("Check system status")).toBeInTheDocument();
  });

  it("logs error to console", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    
    render(<ErrorPage error={mockError} reset={mockReset} />);
    
    expect(consoleSpy).toHaveBeenCalledWith("Global error boundary caught:", mockError);
    
    consoleSpy.mockRestore();
  });

  it("does not expose sensitive error information", () => {
    const sensitiveError = new Error("Database password: secret123");
    
    render(<ErrorPage error={sensitiveError} reset={mockReset} />);
    
    // Should not show sensitive information in production mode
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });
    
    expect(screen.queryByText("secret123")).not.toBeInTheDocument();
    expect(screen.queryByText("Database password")).not.toBeInTheDocument();
    
    Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true });
  });

  it("provides clear action guidance", () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    
    expect(screen.getByText("This might be a temporary issue. Click below to reload the page and try again.")).toBeInTheDocument();
    expect(screen.getByText("View the current status of EarnProof services to see if there are any known issues.")).toBeInTheDocument();
  });

  it("includes alternative actions section", () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    
    expect(screen.getByText("Alternative actions")).toBeInTheDocument();
    expect(screen.getByText("Go to homepage")).toBeInTheDocument();
    expect(screen.getByText("Verify a proof")).toBeInTheDocument();
    expect(screen.getByText("Create a proof")).toBeInTheDocument();
  });
});