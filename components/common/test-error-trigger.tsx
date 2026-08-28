/**
 * TEST-ONLY COMPONENT
 * This component is used exclusively for testing the global error boundary.
 * It should not be used in production routes or user-facing features.
 */

"use client";

import { useState } from "react";

export function TestErrorTrigger() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error("Test error boundary trigger - this is expected behavior for testing");
  }

  // Only render in development environment
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-amber-300/30 bg-amber-300/10 p-3">
      <p className="text-xs text-amber-200 mb-2">Development only</p>
      <button
        onClick={() => setShouldThrow(true)}
        className="text-xs bg-red-600 text-white px-2 py-1 rounded"
        type="button"
      >
        Test Error Boundary
      </button>
    </div>
  );
}