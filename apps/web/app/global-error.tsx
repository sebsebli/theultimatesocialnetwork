"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/error-reporting";

/**
 * Catches errors in the root layout. Must render its own <html> and <body>.
 * Used for unhandled errors that would otherwise break the whole app.
 * Reports to Sentry when window.__reportError is set (see docs/MONITORING.md).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { digest: error.digest, scope: "global" });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#0B0B0C",
          color: "#F2F2F2",
          fontFamily: "system-ui, sans-serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p style={{ color: "#A8A8AA", marginBottom: 24 }}>
            The app encountered an error. Please try again or refresh the page.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              minHeight: 44, // MODAL.buttonMinHeight
              padding: "12px 24px", // MODAL.buttonPaddingVertical/Horizontal
              borderRadius: 8, // SIZES.borderRadius
              background: "#6E7A8A", // COLORS.primary
              color: "#fff",
              border: "none",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
