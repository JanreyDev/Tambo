"use client";

import { useState } from "react";
import {
  MessageCircle,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  User,
  Building2,
  ChevronRight,
  Send,
  Paperclip,
  MoreHorizontal,
  Tag,
  ArrowUpRight,
} from "lucide-react";

type TicketPriority = "Urgent" | "High" | "Medium" | "Low";
type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";

interface Ticket {
  id: string;
  subject: string;
  barangay: string;
  submittedBy: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: string;
  created: string;
  lastUpdate: string;
  messages: number;
  description: string;
}

const priorityColors: Record<TicketPriority, string> = {
  Urgent: "#ef4444",
  High: "#f97316",
  Medium: "#f59e0b",
  Low: "#64748b",
};

const statusConfig: Record<TicketStatus, { icon: React.ElementType; color: string }> = {
  Open: { icon: AlertCircle, color: "#3b82f6" },
  "In Progress": { icon: Clock, color: "#f59e0b" },
  Resolved: { icon: CheckCircle2, color: "#22c55e" },
  Closed: { icon: XCircle, color: "#94a3b8" },
};

const tickets: Ticket[] = [
  { id: "TKT-2601", subject: "Cannot generate barangay clearance — PDF generation error", barangay: "Brgy. Tambo", submittedBy: "Maria Santos", priority: "Urgent", status: "Open", category: "Documents", created: "30 min ago", lastUpdate: "30 min ago", messages: 2, description: "When trying to generate a barangay clearance for resident Juan Dela Cruz (RES-001), the system shows a blank page instead of the PDF. This has been happening since this morning." },
  { id: "TKT-2600", subject: "Request for 3 additional user accounts", barangay: "Brgy. San Jose", submittedBy: "Kap. Maria Reyes", priority: "Medium", status: "In Progress", category: "Account", created: "2 hrs ago", lastUpdate: "1 hr ago", messages: 4, description: "We need 3 more user accounts for our new barangay health workers. They need access to the Residents module only." },
  { id: "TKT-2599", subject: "SMS credits running low — need top up", barangay: "Brgy. Mabayuan", submittedBy: "Ana Garcia", priority: "Low", status: "Open", category: "Billing", created: "5 hrs ago", lastUpdate: "5 hrs ago", messages: 1, description: "Our SMS credits are down to P50. We need a top-up of P1,000 credits for the upcoming barangay assembly notifications." },
  { id: "TKT-2598", subject: "Resident data not syncing after offline mode", barangay: "Brgy. East Tapinac", submittedBy: "Pedro Reyes", priority: "High", status: "In Progress", category: "Technical", created: "1 day ago", lastUpdate: "3 hrs ago", messages: 6, description: "We registered 5 residents while offline yesterday. When internet came back, only 3 of them synced. The other 2 are still showing as pending." },
  { id: "TKT-2597", subject: "How to change barangay logo and header?", barangay: "Brgy. Kalaklan", submittedBy: "Kap. Ana Villanueva", priority: "Low", status: "Resolved", category: "How-to", created: "2 days ago", lastUpdate: "1 day ago", messages: 3, description: "We want to update our barangay logo and the header text that appears on generated documents. Where can we change this?" },
  { id: "TKT-2596", subject: "Blotter report formatting issue", barangay: "Brgy. Barretto", submittedBy: "Ricardo Torres", priority: "Medium", status: "Closed", category: "Documents", created: "3 days ago", lastUpdate: "2 days ago", messages: 5, description: "The blotter report PDF has overlapping text when the narrative is longer than 500 characters." },
];

export default function SupportPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "All">("All");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");

  const filtered = tickets.filter((t) => {
    const matchSearch = t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.barangay.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    open: tickets.filter(t => t.status === "Open").length,
    inProgress: tickets.filter(t => t.status === "In Progress").length,
    resolved: tickets.filter(t => t.status === "Resolved").length,
    avgResponse: "2.4 hrs",
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Support Tickets</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage support requests from all barangays</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: "Open", value: stats.open, color: "#3b82f6", icon: AlertCircle },
          { label: "In Progress", value: stats.inProgress, color: "#f59e0b", icon: Clock },
          { label: "Resolved", value: stats.resolved, color: "#22c55e", icon: CheckCircle2 },
          { label: "Avg Response Time", value: stats.avgResponse, color: "#8b5cf6", icon: ArrowUpRight },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
              </div>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${s.color}12` }}>
                <s.icon className="w-4.5 h-4.5" style={{ color: s.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        {/* Ticket List */}
        <div className={`${selectedTicket ? "w-[55%]" : "flex-1"} space-y-3 transition-all`}>
          {/* Search + Filters */}
          <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets..."
              className="flex-1 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <div className="flex items-center gap-1">
              {(["All", "Open", "In Progress", "Resolved", "Closed"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s as TicketStatus | "All")}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-full transition-colors ${
                    statusFilter === s
                      ? "bg-blue-600 text-white"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Tickets */}
          <div className="space-y-2">
            {filtered.map((ticket) => {
              const sc = statusConfig[ticket.status];
              const StatusIcon = sc.icon;
              const isSelected = selectedTicket?.id === ticket.id;
              return (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full text-left bg-card border rounded-xl p-4 transition-all hover:shadow-sm ${
                    isSelected ? "border-blue-500 ring-1 ring-blue-500/20" : "border-border"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: priorityColors[ticket.priority] }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-muted-foreground">{ticket.id}</span>
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold"
                          style={{ background: `${sc.color}15`, color: sc.color }}>
                          <StatusIcon className="w-3 h-3" />
                          {ticket.status}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-muted text-muted-foreground">
                          {ticket.category}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{ticket.subject}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {ticket.barangay}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <User className="w-3 h-3" /> {ticket.submittedBy}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" /> {ticket.messages}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{ticket.created}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ticket Detail Panel */}
        {selectedTicket && (
          <div className="w-[45%] bg-card border border-border rounded-xl overflow-hidden flex flex-col sticky top-20 h-[calc(100vh-8rem)]">
            {/* Header */}
            <div className="p-5 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-muted-foreground">{selectedTicket.id}</span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: `${priorityColors[selectedTicket.priority]}15`, color: priorityColors[selectedTicket.priority] }}>
                    {selectedTicket.priority}
                  </span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: `${statusConfig[selectedTicket.status].color}15`, color: statusConfig[selectedTicket.status].color }}>
                    {selectedTicket.status}
                  </span>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-foreground">{selectedTicket.subject}</h3>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> {selectedTicket.barangay}
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <User className="w-3 h-3" /> {selectedTicket.submittedBy}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Original message */}
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                  {selectedTicket.submittedBy.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-foreground">{selectedTicket.submittedBy}</span>
                    <span className="text-[10px] text-muted-foreground">{selectedTicket.created}</span>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed">
                    {selectedTicket.description}
                  </div>
                </div>
              </div>

              {/* Auto-response */}
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  P
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-foreground">PrimeX Support</span>
                    <span className="text-[10px] text-muted-foreground">Auto-reply</span>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 text-xs text-foreground leading-relaxed">
                    Thank you for reaching out. We have received your ticket and our support team will review it shortly. Your ticket reference is <strong>{selectedTicket.id}</strong>.
                  </div>
                </div>
              </div>
            </div>

            {/* Reply Input */}
            <div className="p-4 border-t border-border">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-input-border bg-input-bg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Attach file">
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors" aria-label="Send reply">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
