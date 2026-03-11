"use client";

import { useSyncExternalStore } from "react";

const MOBILE_MQ = "(max-width: 767px)";

function subscribe(callback: () => void) {
  const mq = window.matchMedia(MOBILE_MQ);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(MOBILE_MQ).matches;
}

function getServerSnapshot() {
  return false; // SSR: assume desktop (server can't detect viewport)
}

/**
 * Detects phone-sized viewport (< 768px / below md breakpoint).
 * Uses useSyncExternalStore for SSR-safe, lint-clean media query tracking.
 */
export function useIsMobile() {
  const isMobile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { isMobile, isLoading: false };
}
