import { render, screen, fireEvent } from "@testing-library/react";
import { TestErrorTrigger } from "../test-error-trigger";

// Mock console.error to avoid test output noise when error is thrown
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe("TestErrorTrigger", () => {
  it("does not render in production environment", () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });
    
    render(<TestErrorTrigger />);
    
    expect(screen.queryByText("Test Error Boundary")).not.toBeInTheDocument();
    expect(screen.queryByText("Development only")).not.toBeInTheDocument();
    
    Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true });
  });

  it("renders in development environment", () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });
    
    render(<TestErrorTrigger />);
    
    expect(screen.getByText("Development only")).toBeInTheDocument();
    expect(screen.getByText("Test Error Boundary")).toBeInTheDocument();
    
    Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true });
  });

  it("throws error when button is clicked", () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });
    
    // Wrap in error boundary to catch the thrown error
    const ThrowErrorWrapper = () => {
      try {
        return <TestErrorTrigger />;
      } catch (error) {
        return <div>Error caught: {(error as Error).message}</div>;
      }
    };
    
    const { rerender } = render(<ThrowErrorWrapper />);
    
    const button = screen.getByText("Test Error Boundary");
    
    // Clicking should trigger error on next render
    fireEvent.click(button);
    
    // Re-render to trigger the error
    expect(() => rerender(<TestErrorTrigger />)).toThrow("Test error boundary trigger - this is expected behavior for testing");
    
    Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true });
  });

  it("uses appropriate styling for development indicator", () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });
    
    render(<TestErrorTrigger />);
    
    const container = screen.getByText("Development only").parentElement;
    expect(container).toHaveClass("fixed");
    expect(container).toHaveClass("bottom-4");
    expect(container).toHaveClass("right-4");
    
    const button = screen.getByText("Test Error Boundary");
    expect(button).toHaveClass("bg-red-600");
    
    Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true });
  });
});