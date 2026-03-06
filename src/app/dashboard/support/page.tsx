"use client";

import { useState } from "react";
import {
  MessageCircle,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Paperclip,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  created_by: string;
  created_at: string;
  last_reply_at: string;
  messages: { role: string; content: string; timestamp: string }[];
}

const mockTickets: Ticket[] = [
  {
    id: "1", ticket_number: "TKT-2026-001", subject: "Cannot print barangay clearance", category: "Document Issuance", status: "open", priority: "high", created_by: "Secretary Santos", created_at: "2026-03-07 08:00", last_reply_at: "2026-03-07 09:30",
    messages: [
      { role: "user", content: "When I try to print a barangay clearance for Maria Dela Cruz, the system shows a blank page. This started happening today.", timestamp: "2026-03-07 08:00" },
      { role: "support", content: "Thanks for reporting. Can you check if the resident has a complete address record? Blank prints usually happen when required fields are empty. Go to Residents > find the resident > check their profile completion.", timestamp: "2026-03-07 09:30" },
    ],
  },
  {
    id: "2", ticket_number: "TKT-2026-002", subject: "How to add new purok?", category: "Settings", status: "open", priority: "normal", created_by: "Kag. Lopez", created_at: "2026-03-06 14:00", last_reply_at: "",
    messages: [
      { role: "user", content: "The barangay council approved a new purok (Purok Sampaguita Extension). How do I add it to the system?", timestamp: "2026-03-06 14:00" },
    ],
  },
  {
    id: "3", ticket_number: "TKT-2025-015", subject: "Resident data not syncing", category: "Data Sync", status: "resolved", priority: "high", created_by: "Secretary Santos", created_at: "2025-12-10 09:00", last_reply_at: "2025-12-11 10:00",
    messages: [
      { role: "user", content: "New resident registrations from yesterday are not showing up on the dashboard counters.", timestamp: "2025-12-10 09:00" },
      { role: "support", content: "The dashboard cache has been refreshed. The counters should now reflect the latest data. If this happens again, try clearing your browser cache first.", timestamp: "2025-12-11 10:00" },
    ],
  },
  {
    id: "4", ticket_number: "TKT-2025-010", subject: "Request: Bulk import of old resident records", category: "Feature Request", status: "closed", priority: "normal", created_by: "Secretary Santos", created_at: "2025-11-05 10:00", last_reply_at: "2025-11-20 14:00",
    messages: [
      { role: "user", content: "We have around 500 old resident records in Excel format. Is there a way to bulk import them instead of encoding one by one?", timestamp: "2025-11-05 10:00" },
      { role: "support", content: "Good news! Bulk import via Excel/CSV is now available under Residents > Import. We've prepared a template file you can download. Just fill in the columns and upload.", timestamp: "2025-11-20 14:00" },
    ],
  },
];

const categories = ["All", "Document Issuance", "Settings", "Data Sync", "Feature Request", "Bug Report"];
const statusOptions = ["All Status", "Open", "Resolved", "Closed"];

export default function SupportPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showFilters, setShowFilters] = useState(false);
  const [viewTicket, setViewTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = mockTickets.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      if (!t.ticket_number.toLowerCase().includes(q) && !t.subject.toLowerCase().includes(q)) return false;
    }
    if (categoryFilter !== "All" && t.category !== categoryFilter) return false;
    if (statusFilter !== "All Status" && t.status !== statusFilter.toLowerCase()) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  const openCount = mockTickets.filter((t) => t.status === "open").length;

  const priorityColor = (p: string) => {
    switch (p) { case "high": return "danger"; case "normal": return "muted"; case "low": return "info"; default: return "muted"; }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Tickets"
        description="Get help from PrimeX support team"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Tools" }, { label: "Support" }]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}><Plus className="h-4 w-4" /> New Ticket</button>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Tickets" value={mockTickets.length} icon={<MessageCircle className="h-5 w-5" />} />
        <StatCard label="Open" value={openCount} icon={<AlertCircle className="h-5 w-5" />} />
        <StatCard label="Resolved" value={mockTickets.filter((t) => t.status === "resolved").length} icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatCard label="Avg Response" value="4h" icon={<Clock className="h-5 w-5" />} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search tickets..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={cn("flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors",
              showFilters ? "border-accent-primary bg-accent-bg text-accent-text" : "border-border hover:bg-muted")}>
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg border border-border bg-card">
            <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
              {statusOptions.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => { setCategoryFilter("All"); setStatusFilter("All Status"); }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /> Clear</button>
          </div>
        )}
      </div>

      {/* Ticket List */}
      <div className="space-y-2">
        {paged.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground rounded-xl border border-border bg-card">No tickets found.</div>
        ) : (
          paged.map((t) => (
            <div key={t.id} className="p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all cursor-pointer" onClick={() => setViewTicket(t)}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{t.ticket_number}</span>
                    <StatusBadge status={t.status} />
                    <Badge variant={priorityColor(t.priority) as "danger" | "muted" | "info"}>{t.priority}</Badge>
                    <Badge variant="muted">{t.category}</Badge>
                  </div>
                  <h3 className="text-sm font-medium text-foreground">{t.subject}</h3>
                  <p className="text-xs text-muted-foreground mt-1">by {t.created_by} · {t.messages.length} message{t.messages.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-[11px] text-muted-foreground">{t.created_at}</p>
                  {t.last_reply_at && <p className="text-[10px] text-muted-foreground mt-0.5">Last reply: {t.last_reply_at}</p>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View Ticket Modal */}
      <Modal open={!!viewTicket} onClose={() => { setViewTicket(null); setReplyText(""); }} title={viewTicket?.ticket_number || ""} description={viewTicket?.subject || ""} size="lg"
        footer={
          viewTicket?.status === "open" ? (
            <div className="flex items-center gap-2 w-full">
              <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type your reply..."
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring" />
              <ModalButton variant="primary"><Send className="h-4 w-4" /></ModalButton>
            </div>
          ) : (
            <ModalButton variant="secondary" onClick={() => setViewTicket(null)}>Close</ModalButton>
          )
        }>
        {viewTicket && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusBadge status={viewTicket.status} />
              <Badge variant={priorityColor(viewTicket.priority) as "danger" | "muted" | "info"}>{viewTicket.priority}</Badge>
              <Badge variant="muted">{viewTicket.category}</Badge>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {viewTicket.messages.map((msg, i) => (
                <div key={i} className={cn("p-3 rounded-lg", msg.role === "user" ? "bg-muted/50 border border-border" : "bg-accent-bg border border-accent-primary/20")}>
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] font-medium text-foreground">{msg.role === "user" ? viewTicket.created_by : "PrimeX Support"}</span>
                    <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
                  </div>
                  <p className="text-sm text-foreground">{msg.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
