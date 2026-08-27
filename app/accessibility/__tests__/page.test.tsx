import { render, screen } from "@testing-library/react";
import AccessibilityPage from "../page";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/accessibility"
}));

// Mock Next.js Link component
jest.mock("next/link", () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

describe("AccessibilityPage", () => {
  it("renders the page heading and description", () => {
    render(<AccessibilityPage />);
    
    expect(screen.getByText("Accessibility statement")).toBeInTheDocument();
    expect(screen.getByText("Our commitment to making EarnProof accessible to all users.")).toBeInTheDocument();
  });

  it("includes accessibility commitment section", () => {
    render(<AccessibilityPage />);
    
    expect(screen.getByText("Our commitment")).toBeInTheDocument();
    expect(screen.getByText(/EarnProof is committed to ensuring digital accessibility/)).toBeInTheDocument();
  });

  it("lists accessibility features", () => {
    render(<AccessibilityPage />);
    
    expect(screen.getByText("Accessibility features")).toBeInTheDocument();
    expect(screen.getByText("Keyboard navigation support for all interactive elements")).toBeInTheDocument();
    expect(screen.getByText("Visible focus indicators on all focusable elements")).toBeInTheDocument();
    expect(screen.getByText("Semantic HTML structure with proper headings and landmarks")).toBeInTheDocument();
    expect(screen.getByText("Alternative text for images and icons")).toBeInTheDocument();
  });

  it("includes known limitations section", () => {
    render(<AccessibilityPage />);
    
    expect(screen.getByText("Known limitations")).toBeInTheDocument();
    expect(screen.getByText(/Some complex data visualizations may not be fully accessible/)).toBeInTheDocument();
    expect(screen.getByText(/Wallet integration flows may have varying accessibility/)).toBeInTheDocument();
  });

  it("references accessibility standards", () => {
    render(<AccessibilityPage />);
    
    expect(screen.getByText("Standards and guidelines")).toBeInTheDocument();
    expect(screen.getByText("Web Content Accessibility Guidelines (WCAG) 2.1")).toBeInTheDocument();
    expect(screen.getByText("Section 508 compliance principles")).toBeInTheDocument();
    expect(screen.getByText(/WAI-ARIA.*specifications/)).toBeInTheDocument();
  });

  it("provides feedback mechanism with mailto link", () => {
    render(<AccessibilityPage />);
    
    expect(screen.getByText("Feedback and support")).toBeInTheDocument();
    
    const feedbackLink = screen.getByText("Send accessibility feedback");
    expect(feedbackLink).toBeInTheDocument();
    expect(feedbackLink.closest("a")).toHaveAttribute("href", "mailto:accessibility@earnproof.com?subject=Accessibility%20Feedback");
  });

  it("includes assessment and testing information", () => {
    render(<AccessibilityPage />);
    
    expect(screen.getByText("Assessment and testing")).toBeInTheDocument();
    expect(screen.getByText("Automated accessibility scanning with industry-standard tools")).toBeInTheDocument();
    expect(screen.getByText("Keyboard-only navigation testing")).toBeInTheDocument();
    expect(screen.getByText("Screen reader compatibility testing")).toBeInTheDocument();
  });

  it("mentions continuous improvement", () => {
    render(<AccessibilityPage />);
    
    expect(screen.getByText("Continuous improvement")).toBeInTheDocument();
    expect(screen.getByText(/Accessibility is an ongoing effort/)).toBeInTheDocument();
  });

  it("includes last updated timestamp", () => {
    render(<AccessibilityPage />);
    
    expect(screen.getByText("This accessibility statement was last updated on August 27, 2026.")).toBeInTheDocument();
  });

  it("uses semantic HTML structure", () => {
    render(<AccessibilityPage />);
    
    // Check for proper heading hierarchy
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("Accessibility statement");
    
    const h2Headings = screen.getAllByRole("heading", { level: 2 });
    expect(h2Headings.length).toBeGreaterThan(1);
    
    // Check for lists
    const lists = screen.getAllByRole("list");
    expect(lists.length).toBeGreaterThan(1);
  });

  it("does not claim formal WCAG conformance", () => {
    render(<AccessibilityPage />);
    
    // Should not claim certification or formal conformance
    expect(screen.queryByText(/certified/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/compliant/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/conform/i)).not.toBeInTheDocument();
  });
});