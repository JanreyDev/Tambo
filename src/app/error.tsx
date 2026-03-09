"use client";

import { useEffect } from "react";
import { PrimeXLogo } from "@/components/primex-logo";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console in dev, would go to Sentry in production
    console.error("Command Center error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#020617] px-4">
      <PrimeXLogo className="mb-4 h-10 w-10 text-accent" />
      <h2 className="mb-2 text-lg font-bold text-foreground">
        Something went wrong
      </h2>
      <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
        The Command Center encountered an unexpected error. This has been logged
        for review.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-gradient-to-r from-accent to-orange-400 px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-white transition-all hover:from-accent-hover hover:to-accent"
      >
        Try Again
      </button>
    </div>
  );
}
