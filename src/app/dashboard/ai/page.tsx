"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Send,
  Sparkles,
  Copy,
  Check,
  Lightbulb,
  Users,
  FileText,
  BarChart3,
  Search,
  Coins,
  StopCircle,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Markdown } from "@/components/ui/markdown";
import { useAiStream } from "@/hooks/use-ai-stream";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { AiConversation, AiCredits, AiMessage } from "@/lib/types";

// ── Mabini logo ──

function MabiniLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = { sm: 28, md: 36, lg: 88 };
  const rounded = { sm: "rounded-lg", md: "rounded-xl", lg: "rounded-2xl" };
  return (
    <div className={cn("overflow-hidden shrink-0 bg-white", rounded[size])}
      style={{ width: dims[size], height: dims[size] }}>
      <Image
        src="/mabini-ai.png"
        alt="Mabini AI"
        width={dims[size]}
        height={dims[size]}
        className="object-cover"
      />
    </div>
  );
}

// ── Suggested queries shown on empty chat ──

const suggestedQueries = [
  { icon: Users, label: "How many residents are registered?", category: "Records" },
  { icon: Search, label: "Find all residents in Purok Sampaguita", category: "Search" },
  { icon: BarChart3, label: "Show voter turnout statistics", category: "Analytics" },
  { icon: FileText, label: "How many clearances were issued this month?", category: "Services" },
  { icon: Lightbulb, label: "What DILG reports are due this quarter?", category: "Compliance" },
  { icon: Users, label: "List all senior citizens in the barangay", category: "Records" },
];

// ── Main Page ──

export default function AiAssistantPage() {
  const { user } = useAuth();

  // State
  const [activeConversation, setActiveConversation] = useState<AiConversation | null>(null);
  const [credits, setCredits] = useState<AiCredits | null>(null);
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Streaming hook
  const { streamingContent, isStreaming, error: streamError, sendMessage, cancelStream } = useAiStream();

  // Greeting for the user
  const userName = user?.first_name || "there";

  const loadCredits = async () => {
    try {
      const res = await api.ai.getCredits();
      setCredits(res);
    } catch {
      // silent fail
    }
  };

  // Load credits on mount
  useEffect(() => {
    loadCredits();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom when messages change or streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages, streamingContent, isStreaming]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const loadConversation = async (id: string) => {
    try {
      const conv = await api.ai.getConversation(id);
      setActiveConversation(conv);
    } catch {
      // silent fail
    }
  };

  const copyToClipboard = (content: string, msgIndex: number) => {
    navigator.clipboard.writeText(content);
    setCopiedId(String(msgIndex));
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = useCallback(async () => {
    const message = input.trim();
    if (!message || isStreaming) return;

    setInput("");

    // Optimistically add user message to the UI
    const userMessage: AiMessage = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    if (activeConversation) {
      setActiveConversation((prev) =>
        prev ? { ...prev, messages: [...prev.messages, userMessage] } : null
      );
    } else {
      // Creating new conversation -- show user message in temporary state
      setActiveConversation({
        id: "temp",
        title: null,
        module_context: null,
        messages: [userMessage],
        message_count: 1,
        tokens_used: 0,
        input_tokens_used: 0,
        output_tokens_used: 0,
        credit_cost: "0",
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Send to API
    const conversationId = activeConversation?.id !== "temp" ? activeConversation?.id : undefined;
    const result = await sendMessage(message, conversationId);

    if (result) {
      // Reload the conversation to get full state from server
      await loadConversation(result.conversationId);
      // Update credits
      setCredits((prev) =>
        prev ? { ...prev, balance: result.remainingBalance } : null
      );
    }
  }, [input, isStreaming, activeConversation, sendMessage]);

  const handleSuggestion = (query: string) => {
    setInput(query);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Messages for display
  const displayMessages = activeConversation?.messages || [];

  // Credit status
  const isDepleted = credits !== null && credits.estimated_messages_remaining <= 0;
  const isLowCredits = credits !== null && !isDepleted && credits.estimated_messages_remaining <= 5;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Mabini AI"
        description="Named after Apolinario Mabini, the Brains of the Philippine Revolution. Your AI-powered assistant for barangay governance, compliance, records management, and community operations."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Tools" },
          { label: "Mabini AI" },
        ]}
        actions={
          credits ? (
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm",
              isDepleted ? "bg-red-100 dark:bg-red-950/30" : isLowCredits ? "bg-amber-100 dark:bg-amber-950/30" : "bg-muted"
            )}>
              <Coins className={cn("h-3.5 w-3.5", isDepleted ? "text-red-500" : isLowCredits ? "text-amber-500" : "text-orange-500")} />
              <span className={cn("font-medium", isDepleted ? "text-red-600 dark:text-red-400" : isLowCredits ? "text-amber-600 dark:text-amber-400" : "")}>
                P{credits.balance.toFixed(2)}
              </span>
              <span className={cn("text-xs", isDepleted ? "text-red-500 dark:text-red-400" : isLowCredits ? "text-amber-500 dark:text-amber-400" : "text-muted-foreground")}>
                {isDepleted ? "Depleted" : isLowCredits ? `~${credits.estimated_messages_remaining} msgs left` : "Mabini Credit"}
              </span>
            </div>
          ) : undefined
        }
      />

      <div style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}>
        {/* Main Chat Area */}
        <div className="flex flex-col rounded-xl glass overflow-hidden h-full">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {displayMessages.length === 0 && !isStreaming ? (
              // Empty state -- Mabini welcome with greeting
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MabiniLogo size="lg" />
                <h3 className="text-xl font-bold text-foreground mt-4 mb-1">
                  Hi, how are you today {userName}?
                </h3>
                <p className="text-sm text-muted-foreground max-w-lg mb-8 leading-relaxed">
                  I&apos;m Mabini, your AI assistant named after Apolinario Mabini &mdash; the Brains of the Philippine Revolution. I serve as the intellectual backbone of your barangay&apos;s daily operations. Ask me about resident records, barangay clearances, compliance reports, or DILG requirements. I can help you navigate Katarungang Pambarangay proceedings, SK youth council matters, and budgeting concerns. I understand Tagalog, Bisaya, Ilonggo, Waray, and other Philippine dialects &mdash; just write in your preferred language. Every conversation is private to your account and securely stored for your reference. How can I assist you today?
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
                  {suggestedQueries.slice(0, 4).map((q, i) => {
                    const Icon = q.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => handleSuggestion(q.label)}
                        className="flex items-start gap-2.5 p-3 rounded-lg border border-border text-left hover:bg-muted/50 transition-colors group"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 group-hover:text-orange-500" />
                        <div>
                          <p className="text-xs text-foreground leading-snug">{q.label}</p>
                          <p className="text-[10px] text-muted-foreground">{q.category}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

              </div>
            ) : (
              <>
                {displayMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "")}
                  >
                    {msg.role === "assistant" && <MabiniLogo size="sm" />}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-xl px-4 py-3",
                        msg.role === "user"
                          ? "bg-accent-bg text-foreground"
                          : "glass-subtle"
                      )}
                    >
                      {msg.role === "assistant" ? (
                        <Markdown content={msg.content} className="text-justify" />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed text-justify">
                          {msg.content}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {msg.role === "assistant" && (
                          <button
                            onClick={() => copyToClipboard(msg.content, i)}
                            className="p-1 rounded hover:bg-muted"
                          >
                            {copiedId === String(i) ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3 text-muted-foreground" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Streaming response */}
                {isStreaming && (
                  <div className="flex gap-3">
                    <MabiniLogo size="sm" />
                    <div className="max-w-[80%] rounded-xl px-4 py-3 glass-subtle">
                      {streamingContent ? (
                        <Markdown content={streamingContent} className="text-justify" />
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Sparkles className="h-4 w-4 animate-pulse text-orange-500" />
                          <span>Mabini is thinking...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Stream error */}
                {streamError && !isStreaming && (
                  <div className="flex gap-3">
                    <MabiniLogo size="sm" />
                    <div className="max-w-[80%] rounded-xl px-4 py-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-600 dark:text-red-400">{streamError}</p>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Credit warnings */}
          {isDepleted && (
            <div className="mx-4 mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-600 dark:text-red-400">
                Your barangay&apos;s Mabini AI credits have been depleted. Please contact your barangay administrator to add more credits.
              </p>
            </div>
          )}
          {isLowCredits && (
            <div className="mx-4 mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Low credits remaining — approximately {credits?.estimated_messages_remaining} message{credits?.estimated_messages_remaining === 1 ? "" : "s"} left.
              </p>
            </div>
          )}

          {/* Input area */}
          <div className="p-4 border-t border-border">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={isDepleted ? undefined : handleKeyDown}
                placeholder={isDepleted ? "Mabini AI credits depleted" : "Ask Mabini anything..."}
                rows={1}
                disabled={isStreaming || isDepleted}
                className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-accent-ring disabled:opacity-50"
                style={{ minHeight: "42px", maxHeight: "120px" }}
              />
              {isStreaming ? (
                <button
                  onClick={cancelStream}
                  className="p-2.5 rounded-lg bg-red-500 text-white transition-colors shrink-0"
                >
                  <StopCircle className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isDepleted}
                  className="p-2.5 rounded-lg text-white transition-colors disabled:opacity-40 shrink-0"
                  style={{ background: "var(--accent-primary)" }}
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <span className="relative flex h-2 w-2">
                {isDepleted ? (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                ) : (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </>
                )}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {isDepleted ? "Mabini is unavailable \u2014 credits depleted" : "Mabini is online \u2022 Powered by PrimeX Ventures Inc."}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
