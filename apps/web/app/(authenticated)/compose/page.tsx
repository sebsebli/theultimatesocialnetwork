"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const ComposeContent = dynamic(
  () =>
    import("@/components/compose-content").then((m) => ({
      default: m.ComposeContent,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-ink flex items-center justify-center text-secondary">
        Loading editor...
      </div>
    ),
  },
);

export default function ComposePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ink flex items-center justify-center text-secondary">
          Loading editor...
        </div>
      }
    >
      <ComposeContent />
    </Suspense>
  );
}
