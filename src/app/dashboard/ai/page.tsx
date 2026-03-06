"use client";

import { useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  RotateCcw,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Users,
  FileText,
  BarChart3,
  Search,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const suggestedQueries = [
  { icon: Users, label: "How many residents are registered?", category: "Records" },
  { icon: Search, label: "Find all residents in Purok Sampaguita", category: "Search" },
  { icon: BarChart3, label: "Show voter turnout statistics", category: "Analytics" },
  { icon: FileText, label: "How many clearances were issued this month?", category: "Services" },
  { icon: Lightbulb, label: "What DILG reports are due this quarter?", category: "Compliance" },
  { icon: Users, label: "List all senior citizens in the barangay", category: "Records" },
];

const mockMessages: Message[] = [
  { id: "1", role: "user", content: "How many residents are currently registered in the barangay?", timestamp: "10:30 AM" },
  { id: "2", role: "assistant", content: "Based on the current records, Barangay Tambo has **2,847 registered residents** across **612 households**.\n\nHere's a quick breakdown:\n- **Male:** 1,423 (50.0%)\n- **Female:** 1,424 (50.0%)\n- **Voters:** 1,892 (66.4%)\n- **Senior Citizens:** 312 (11.0%)\n- **PWDs:** 45 (1.6%)\n- **SK Youth (15-30):** 687 (24.1%)\n\nThe most populated purok is **Purok Sampaguita** with 523 residents (18.4%).", timestamp: "10:30 AM" },
];

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    // Mock AI response
    setTimeout(() => {
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "I'm currently running in demo mode. Once the backend is connected, I'll be able to query your barangay data in real-time, generate reports, and answer questions about residents, documents, cases, and more.", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestion = (query: string) => {
    setInput(query);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Assistant"
        description="Ask questions about your barangay data"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Tools" }, { label: "AI Assistant" }]}
        actions={
          <button onClick={() => setMessages([])} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors">
            <RotateCcw className="h-4 w-4" /> New Chat
          </button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Chat Area */}
        <div className="xl:col-span-3 flex flex-col rounded-xl border border-border bg-card" style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--accent-bg)" }}>
                  <Bot className="h-8 w-8" style={{ color: "var(--accent-primary)" }} />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Kapitan AI</h3>
                <p className="text-sm text-muted-foreground max-w-md">Ask me anything about your barangay data. I can search records, generate statistics, and help with reports.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "")}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--accent-bg)" }}>
                      <Sparkles className="h-4 w-4" style={{ color: "var(--accent-primary)" }} />
                    </div>
                  )}
                  <div className={cn("max-w-[80%] rounded-xl px-4 py-3", msg.role === "user" ? "bg-accent-bg text-foreground" : "bg-muted/50 border border-border")}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-1">
                          <button className="p-1 rounded hover:bg-muted"><Copy className="h-3 w-3 text-muted-foreground" /></button>
                          <button className="p-1 rounded hover:bg-muted"><ThumbsUp className="h-3 w-3 text-muted-foreground" /></button>
                          <button className="p-1 rounded hover:bg-muted"><ThumbsDown className="h-3 w-3 text-muted-foreground" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--accent-bg)" }}>
                  <Sparkles className="h-4 w-4" style={{ color: "var(--accent-primary)" }} />
                </div>
                <div className="bg-muted/50 border border-border rounded-xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Ask about residents, documents, cases, statistics..."
                className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring" />
              <button onClick={handleSend} disabled={!input.trim()}
                className="p-2.5 rounded-lg text-white transition-colors disabled:opacity-40" style={{ background: "var(--accent-primary)" }}>
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">Kapitan AI can search your barangay data and access the internet for supplementary information.</p>
          </div>
        </div>

        {/* Sidebar - Suggestions */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border bg-card">
            <h3 className="text-sm font-semibold text-foreground mb-3">Suggested Questions</h3>
            <div className="space-y-2">
              {suggestedQueries.map((q, i) => {
                const Icon = q.icon;
                return (
                  <button key={i} onClick={() => handleSuggestion(q.label)}
                    className="w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left hover:bg-muted/50 transition-colors group">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 group-hover:text-foreground" />
                    <div>
                      <p className="text-xs text-foreground leading-snug">{q.label}</p>
                      <p className="text-[10px] text-muted-foreground">{q.category}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card">
            <h3 className="text-sm font-semibold text-foreground mb-2">Capabilities</h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>Search resident records</li>
              <li>Generate statistics and charts</li>
              <li>Query case and blotter data</li>
              <li>Document issuance summaries</li>
              <li>DILG compliance checks</li>
              <li>Internet-supplemented answers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
