"use client";

import { useState, useEffect } from "react";

/**
 * Detects phone-sized viewport (< 768px / below md breakpoint).
 * Returns { isMobile, isLoading } where isLoading is true during SSR/hydration.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    setIsLoading(false);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return { isMobile, isLoading };
}
