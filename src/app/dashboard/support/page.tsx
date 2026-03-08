"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  Plus,
  Search,
  Filter,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  User,
  MoreHorizontal,
  Eye,
  Trash2,
  Bot,
  Headphones,
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
const priorityOptions = ["Normal", "High", "Low"];

function SupportInput({ label, name, value, placeholder, required, error, onChange }: { label: string; name: string; value: string; placeholder?: string; required?: boolean; error?: string; onChange: (name: string, value: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type="text" value={value} onChange={(e) => onChange(name, e.target.value)} placeholder={placeholder}
        className={cn("w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2", error ? "border-red-500 focus:ring-red-300" : "border-border focus:ring-accent-ring")} />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function SupportSelect({ label, name, value, options, required, error, onChange }: { label: string; name: string; value: string; options: string[]; required?: boolean; error?: string; onChange: (name: string, value: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select value={value} onChange={(e) => onChange(name, e.target.value)}
        className={cn("w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2", error ? "border-red-500 focus:ring-red-300" : "border-border focus:ring-accent-ring")}>
        {options.map((o) => <option key={o} value={o}>{o || "-- Select --"}</option>)}
      </select>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default function SupportPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showFilters, setShowFilters] = useState(false);
  const [viewTicket, setViewTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyError, setReplyError] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [formTab, setFormTab] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({ subject: "", category: "", priority: "Normal", description: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const pageSize = 10;

  // Toast system
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);
  const showToast = useCallback((message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

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

  const formTabs = ["Ticket Info", "Details"];

  const handleFormFieldChange = (name: string, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    setFormErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
  };

  const validateTicketForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.subject.trim()) errors.subject = "Subject is required";
    if (!form.category) errors.category = "Category is required";
    if (!form.description.trim()) errors.description = "Description is required";
    else if (form.description.trim().length < 10) errors.description = "Description must be at least 10 characters";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Tickets"
        description="Get help from PrimeX support team"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Tools" }, { label: "Support" }]}
        actions={
          <button onClick={() => { setForm({ subject: "", category: "", priority: "Normal", description: "" }); setFormErrors({}); setFormTab(0); setShowCreate(true); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}><Plus className="h-4 w-4" /> New Ticket</button>
        }
      />

      {/* Mabini AI Insight */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-accent-primary/20 bg-accent-bg/30">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--accent-primary)", opacity: 0.15 }}>
          <Bot className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Mabini AI Support Summary</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            2 open tickets awaiting response. Average resolution time is 4.2 hours. Most common issue this week: document issuance errors. 1 high-priority ticket unresolved for 48+ hours.
          </p>
        </div>
        <button onClick={() => router.push("/dashboard/ai")} className="shrink-0 px-3 py-1.5 text-[10px] font-semibold rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--accent-primary)", color: "#fff" }}>
          Ask Mabini
        </button>
      </div>

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
          <div className="p-12 text-center rounded-xl border border-border bg-card flex flex-col items-center gap-3">
            <Headphones className="h-10 w-10 text-muted-foreground/50" />
            <div>
              <p className="text-sm font-medium text-foreground">No support tickets</p>
              <p className="text-xs text-muted-foreground mt-1">Need help? Create a ticket and our team will respond within 24 hours.</p>
            </div>
          </div>
        ) : (
          paged.map((t) => (
            <div key={t.id} className="p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all cursor-pointer" onClick={() => setViewTicket(t)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{t.ticket_number}</span>
                    <StatusBadge status={t.status} />
                    <Badge variant={priorityColor(t.priority) as "danger" | "muted" | "info"}>{t.priority}</Badge>
                    <Badge variant="muted">{t.category}</Badge>
                  </div>
                  <h3 className="text-sm font-medium text-foreground">{t.subject}</h3>
                  <p className="text-xs text-muted-foreground mt-1">by {t.created_by} · {t.messages.length} message{t.messages.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <div className="text-right">
                    <p className="text-[11px] text-muted-foreground">{t.created_at}</p>
                    {t.last_reply_at && <p className="text-[10px] text-muted-foreground mt-0.5">Last reply: {t.last_reply_at}</p>}
                  </div>
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setActionMenu(actionMenu === t.id ? null : t.id)} className="p-1.5 rounded hover:bg-muted"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></button>
                    {actionMenu === t.id && (
                      <div className="absolute right-0 top-8 z-20 w-44 bg-card border border-border rounded-lg shadow-lg py-1">
                        <button onClick={() => { setViewTicket(t); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Eye className="h-3.5 w-3.5" /> View</button>
                        {t.status === "open" && <button onClick={() => { showToast("Ticket Resolved"); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5" /> Mark Resolved</button>}
                        <button onClick={() => { setViewTicket(t); setShowDelete(true); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-muted flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Ticket Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Submit New Ticket" size="lg"
        footer={<>
          <ModalButton variant="secondary" onClick={() => setShowCreate(false)}>Cancel</ModalButton>
          {formTab > 0 && <ModalButton variant="secondary" onClick={() => setFormTab(t => t - 1)}>Previous</ModalButton>}
          {formTab < formTabs.length - 1
            ? <ModalButton variant="primary" onClick={() => {
                const errors: Record<string, string> = {};
                if (!form.subject.trim()) errors.subject = "Subject is required";
                if (!form.category) errors.category = "Category is required";
                setFormErrors(errors);
                if (Object.keys(errors).length === 0) setFormTab(t => t + 1);
              }}>Next</ModalButton>
            : <ModalButton variant="primary" onClick={() => { if (validateTicketForm()) { showToast("Ticket Submitted"); setShowCreate(false); } }}>Submit Ticket</ModalButton>}
        </>}>
        <div className="flex border-b border-border mb-6">
          {formTabs.map((tab, i) => (
            <button key={tab} onClick={() => setFormTab(i)}
              className={cn("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                formTab === i ? "border-accent-primary text-accent-text" : "border-transparent text-muted-foreground hover:text-foreground")}>
              {tab}
            </button>
          ))}
        </div>
        {formTab === 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <SupportInput label="Subject" name="subject" value={form.subject} placeholder="Brief description of your issue" required error={formErrors.subject} onChange={handleFormFieldChange} />
            </div>
            <SupportSelect label="Category" name="category" value={form.category} options={["", "Document Issuance", "Settings", "Data Sync", "Feature Request", "Bug Report"]} required error={formErrors.category} onChange={handleFormFieldChange} />
            <SupportSelect label="Priority" name="priority" value={form.priority} options={priorityOptions} required onChange={handleFormFieldChange} />
          </div>
        )}
        {formTab === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Describe Your Issue<span className="text-red-500 ml-0.5">*</span></label>
              <textarea value={form.description} onChange={(e) => { setForm((f) => ({ ...f, description: e.target.value })); setFormErrors((prev) => { const next = { ...prev }; delete next.description; return next; }); }}
                placeholder="Please describe the issue in detail. Include steps to reproduce if applicable."
                rows={5} className={cn("w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 resize-none", formErrors.description ? "border-red-500 focus:ring-red-300" : "border-border focus:ring-accent-ring")} />
              {formErrors.description && <p className="text-[11px] text-red-500 mt-1">{formErrors.description}</p>}
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Ticket Summary</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Subject:</span> <span className="font-medium">{form.subject || "--"}</span></div>
                <div><span className="text-muted-foreground">Category:</span> <span className="font-medium">{form.category || "--"}</span></div>
                <div><span className="text-muted-foreground">Priority:</span> <span className="font-medium">{form.priority}</span></div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* View Ticket Modal */}
      <Modal open={!!viewTicket && !showDelete} onClose={() => { setViewTicket(null); setReplyText(""); setReplyError(""); }} title={viewTicket?.ticket_number || ""} description={viewTicket?.subject || ""} size="lg"
        footer={
          viewTicket?.status === "open" ? (
            <div className="w-full space-y-1">
              <div className="flex items-center gap-2 w-full">
                <input type="text" value={replyText} onChange={(e) => { setReplyText(e.target.value); setReplyError(""); }} placeholder="Type your reply..."
                  className={cn("flex-1 px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2", replyError ? "border-red-500 focus:ring-red-300" : "border-border focus:ring-accent-ring")} />
                <ModalButton variant="primary" onClick={() => { if (!replyText.trim()) { setReplyError("Reply cannot be empty"); return; } showToast("Reply Sent"); setReplyText(""); setReplyError(""); }}><Send className="h-4 w-4" /></ModalButton>
              </div>
              {replyError && <p className="text-[11px] text-red-500">{replyError}</p>}
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

      {/* Delete Confirmation */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Ticket" description="This action cannot be undone." size="sm"
        footer={<><ModalButton variant="secondary" onClick={() => { setShowDelete(false); setViewTicket(null); }}>Cancel</ModalButton><ModalButton variant="danger" onClick={() => { showToast("Ticket Deleted"); setShowDelete(false); setViewTicket(null); }}>Delete</ModalButton></>}>
        <p className="text-sm text-muted-foreground">Are you sure you want to delete ticket <span className="font-medium text-foreground">{viewTicket?.ticket_number}</span> &mdash; <span className="font-medium text-foreground">{viewTicket?.subject}</span>?</p>
      </Modal>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="flex items-center gap-2 px-4 py-3 rounded-lg bg-foreground text-background text-sm font-medium shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
