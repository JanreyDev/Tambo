"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMabini } from "@/hooks/use-mabini";
import { format } from "date-fns";

interface MabiniPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const quickQueries = [
  "System health",
  "Revenue",
  "Active alerts",
  "BCMP status",
];

export function MabiniPanel({ isOpen, onClose }: MabiniPanelProps) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, isLoading, clearMessages } = useMabini();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Focus trap
      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button, input, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput("");
    await sendMessage(msg);
  };

  const handleQuickQuery = async (query: string) => {
    if (isLoading) return;
    await sendMessage(query);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="animate-slide-in-right fixed right-0 top-0 z-50 flex h-full w-full max-w-[420px] flex-col border-l border-card-border bg-background shadow-2xl"
        role="dialog"
        aria-label="Mabini AI Assistant"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-card-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold text-foreground">
              Mabini AI
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearMessages}
              className="rounded px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground"
              aria-label="Clear chat"
            >
              Clear
            </button>
            <button
              onClick={onClose}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground"
              aria-label="Close Mabini panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick queries */}
        <div className="flex gap-2 overflow-x-auto border-b border-card-border px-4 py-2">
          {quickQueries.map((query) => (
            <button
              key={query}
              onClick={() => handleQuickQuery(query)}
              disabled={isLoading}
              className="flex-shrink-0 rounded-full border border-card-border bg-surface px-3 py-1 text-[10px] text-muted-foreground transition-colors hover:border-accent/40 hover:text-accent disabled:opacity-50"
            >
              {query}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Sparkles className="mb-3 h-8 w-8 text-accent/30" />
              <p className="text-sm text-muted-foreground">
                Ask Mabini about your systems, revenue, or infrastructure.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col",
                  msg.role === "user" ? "items-end" : "items-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                    msg.role === "user"
                      ? "bg-accent text-white"
                      : "bg-surface-elevated text-foreground",
                  )}
                >
                  {msg.content}
                </div>
                <span className="font-metrics mt-1 text-[9px] text-muted-foreground">
                  {format(new Date(msg.timestamp), "HH:mm")}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="flex items-center gap-2 rounded-xl bg-surface-elevated px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin text-accent" />
                  Mabini is thinking...
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-card-border px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Mabini..."
              disabled={isLoading}
              className="flex-1 rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none disabled:opacity-50"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
