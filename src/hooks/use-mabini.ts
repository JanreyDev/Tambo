"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { MabiniMessage, MabiniChatResponse } from "@/lib/types";

interface UseMabiniResult {
  messages: MabiniMessage[];
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearMessages: () => void;
}

export function useMabini(): UseMabiniResult {
  const [messages, setMessages] = useState<MabiniMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: MabiniMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<MabiniChatResponse>(
        "/founder/mabini/chat",
        { message: content },
      );
      setMessages((prev) => [...prev, response.message]);
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : "Mabini is unavailable";
      setError(errMessage);

      const errorResponse: MabiniMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "I'm currently unable to process your request. The API may not be connected yet.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, sendMessage, isLoading, error, clearMessages };
}
