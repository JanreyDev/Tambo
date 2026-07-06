"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UsePollingOptions<T> {
  fetcher: (signal: AbortSignal) => Promise<T>;
  interval?: number;
  enabled?: boolean;
}

interface UsePollingResult<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  refetch: () => void;
}

export function usePolling<T>({
  fetcher,
  interval = 30000,
  enabled = true,
}: UsePollingOptions<T>): UsePollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetcherRef = useRef(fetcher);

  // Keep fetcher ref current via effect (React 19 strict mode)
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const doFetch = useCallback(async (signal: AbortSignal) => {
    try {
      const result = await fetcherRef.current(signal);
      if (!signal.aborted) {
        setData(result);
        setError(null);
        setIsLoading(false);
      }
    } catch (err) {
      if (!signal.aborted) {
        const message = err instanceof Error ? err.message : "Failed to fetch data";
        setError(message);
        setIsLoading(false);
      }
    }
  }, []);

  const refetch = useCallback(() => {
    const controller = new AbortController();
    doFetch(controller.signal);
    return () => controller.abort();
  }, [doFetch]);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    doFetch(controller.signal);

    const timer = setInterval(() => {
      const innerController = new AbortController();
      doFetch(innerController.signal);
    }, interval);

    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [doFetch, interval, enabled]);

  return { data, error, isLoading, refetch };
}
