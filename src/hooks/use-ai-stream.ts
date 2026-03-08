"use client";

import { useCallback, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { AiStreamEvent } from "@/lib/types";

interface UseAiStreamReturn {
  streamingContent: string;
  isStreaming: boolean;
  error: string | null;
  sendMessage: (message: string, conversationId?: string) => Promise<{
    conversationId: string;
    title: string;
    creditCost: number;
    remainingBalance: number;
  } | null>;
  cancelStream: () => void;
}

export function useAiStream(): UseAiStreamReturn {
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (message: string, conversationId?: string) => {
      setStreamingContent("");
      setError(null);
      setIsStreaming(true);

      const abortController = new AbortController();
      abortRef.current = abortController;

      let result: {
        conversationId: string;
        title: string;
        creditCost: number;
        remainingBalance: number;
      } | null = null;

      try {
        const onEvent = (event: AiStreamEvent) => {
          switch (event.event) {
            case "content_delta":
              setStreamingContent((prev) => prev + (event.data.text ?? ""));
              break;
            case "message_complete":
              result = {
                conversationId: event.data.conversation_id,
                title: event.data.title,
                creditCost: event.data.credit_cost,
                remainingBalance: event.data.remaining_balance,
              };
              break;
            case "error":
              setError(event.data.message);
              break;
          }
        };

        if (conversationId) {
          await api.ai.sendMessage(conversationId, message, onEvent, abortController.signal);
        } else {
          await api.ai.createConversation(message, onEvent, abortController.signal);
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // User cancelled -- not an error
        } else {
          const msg = (err as { message?: string })?.message || "Failed to send message";
          setError(msg);
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }

      return result;
    },
    []
  );

  return { streamingContent, isStreaming, error, sendMessage, cancelStream };
}
