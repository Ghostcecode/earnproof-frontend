import { render, screen, fireEvent } from "@testing-library/react";
import ProofTypesPage from "../page";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/proof-types"
}));

// Mock Next.js Link component
jest.mock("next/link", () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

describe("ProofTypesPage", () => {
  it("renders the page heading and description", () => {
    render(<ProofTypesPage />);
    
    expect(screen.getByText("Proof types")).toBeInTheDocument();
    expect(screen.getByText("Browse available proof types and create verifiable credentials for different use cases.")).toBeInTheDocument();
  });

  it("displays metrics for proof types", () => {
    render(<ProofTypesPage />);
    
    expect(screen.getByText("3")).toBeInTheDocument(); // Total types
    expect(screen.getByText("Total types")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument(); // Available now
    expect(screen.getByText("Available now")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // Coming soon
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
  });

  it("renders all proof types in cards view", () => {
    render(<ProofTypesPage />);
    
    expect(screen.getByText("Minimum Income")).toBeInTheDocument();
    expect(screen.getByText("Recurring Income")).toBeInTheDocument();
    expect(screen.getByText("Payment Receipt")).toBeInTheDocument();
  });

  it("shows minimum income proof as available with create link", () => {
    render(<ProofTypesPage />);
    
    const minimumIncomeSection = screen.getByText("Minimum Income").closest("article");
    expect(minimumIncomeSection).toBeInTheDocument();
    
    // Should have "available" status badge
    expect(screen.getByText("available")).toBeInTheDocument();
    
    // Should have active create proof link
    const createLinks = screen.getAllByText("Create proof");
    expect(createLinks[0].closest("a")).toHaveAttribute("href", "/proofs/create");
  });

  it("shows planned proof types as coming soon", () => {
    render(<ProofTypesPage />);
    
    // Should have planned status badges
    const plannedBadges = screen.getAllByText("planned");
    expect(plannedBadges).toHaveLength(2);
    
    // Should have disabled coming soon buttons
    const comingSoonButtons = screen.getAllByText("Coming soon");
    expect(comingSoonButtons).toHaveLength(2);
    comingSoonButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it("filters proof types based on search input", () => {
    render(<ProofTypesPage />);
    
    const searchInput = screen.getByPlaceholderText("Search by name, description, or category...");
    
    // Search for "minimum"
    fireEvent.change(searchInput, { target: { value: "minimum" } });
    
    expect(screen.getByText("Minimum Income")).toBeInTheDocument();
    expect(screen.queryByText("Recurring Income")).not.toBeInTheDocument();
    expect(screen.queryByText("Payment Receipt")).not.toBeInTheDocument();
  });

  it("shows no results state when search has no matches", () => {
    render(<ProofTypesPage />);
    
    const searchInput = screen.getByPlaceholderText("Search by name, description, or category...");
    
    // Search for something that doesn't exist
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });
    
    expect(screen.getByText("No proof types found")).toBeInTheDocument();
    expect(screen.getByText("Try adjusting your search terms or browse all available proof types.")).toBeInTheDocument();
  });

  it("switches between cards and table view", () => {
    render(<ProofTypesPage />);
    
    const cardsButton = screen.getByText("Cards");
    const tableButton = screen.getByText("Table");
    
    // Initially in cards view
    expect(cardsButton).toHaveClass("border-cyan-300/30");
    expect(cardsButton).toHaveClass("bg-cyan-300/10");
    expect(cardsButton).toHaveClass("text-cyan-200");
    
    // Switch to table view
    fireEvent.click(tableButton);
    expect(tableButton).toHaveClass("border-cyan-300/30");
    expect(tableButton).toHaveClass("bg-cyan-300/10");
    expect(tableButton).toHaveClass("text-cyan-200");
    
    // Should show table headers
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Time estimate")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("displays proof type requirements and details", () => {
    render(<ProofTypesPage />);
    
    expect(screen.getByText("Stellar testnet wallet with payment history")).toBeInTheDocument();
    expect(screen.getByText("Qualifying payments within specified period")).toBeInTheDocument();
    expect(screen.getByText("5-10 minutes")).toBeInTheDocument();
    expect(screen.getByText("Income Verification")).toBeInTheDocument();
  });
});