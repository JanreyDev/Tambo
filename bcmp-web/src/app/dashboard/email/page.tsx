"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { MabiniButton } from "@/components/ui/mabini-button";
import { Modal, ModalButton } from "@/components/ui/modal";
import { api } from "@/lib/api";
import {
  Mail, Inbox, Send, FileEdit, Star, Trash2, Archive,
  Search, Plus, Paperclip, ChevronRight, Users,
  Reply, Forward, MoreHorizontal, X, RefreshCw,
  CheckCheck, Clock, AlertCircle, ArrowLeft, Loader2,
} from "lucide-react";
import type { ResidentSummary } from "@/lib/types";

// ── Types ────────────────────────────────────────────────────────────

interface Message {
  id: string;
  from_user_id: string | null;
  to_user_id: string | null;
  to_address: string | null;
  cc_addresses: string[] | null;
  subject: string;
  body: string;
  folder: "inbox" | "sent" | "draft" | "trash" | "starred" | "archive";
  is_read: boolean;
  is_starred: boolean;
  is_draft: boolean;
  sent_at: string | null;
  created_at: string;
  from_user?: { id: string; full_name: string; username: string };
  to_user?: { id: string; full_name: string; username: string };
  unread_count?: number;
}

interface InboxState {
  messages: Message[];
  unread_count: number;
  loading: boolean;
  error: string | null;
}

interface ComposeData {
  to_user_id: string;
  to_address: string;
  cc_addresses: string;
  subject: string;
  body: string;
  is_draft: boolean;
}

interface StaffUser {
  id: string;
  full_name: string;
  username: string;
}

type Folder = "inbox" | "sent" | "draft" | "trash" | "starred" | "archive";

const FOLDERS: { key: Folder; label: string; icon: React.ElementType }[] = [
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "starred", label: "Starred", icon: Star },
  { key: "sent", label: "Sent", icon: Send },
  { key: "draft", label: "Drafts", icon: FileEdit },
  { key: "archive", label: "Archive", icon: Archive },
  { key: "trash", label: "Trash", icon: Trash2 },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

function initials(name: string): string {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

export default function EmailPage() {
  const [folder, setFolder] = useState<Folder>("inbox");
  const [state, setState] = useState<InboxState>({ messages: [], unread_count: 0, loading: true, error: null });
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Message | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [folderCounts, setFolderCounts] = useState<Partial<Record<Folder, number>>>({});
  const [compose, setCompose] = useState<ComposeData>({
    to_user_id: "", to_address: "", cc_addresses: "", subject: "", body: "", is_draft: false,
  });
  const [sending, setSending] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [residentSearch, setResidentSearch] = useState("");
  const [residentResults, setResidentResults] = useState<ResidentSummary[]>([]);
  const [searchingResidents, setSearchingResidents] = useState(false);
  const [selectedResident, setSelectedResident] = useState<ResidentSummary | null>(null);

  useEffect(() => {
    if (!residentSearch.trim()) {
      setResidentResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setSearchingResidents(true);
      try {
        const response = await api.residents.list({ search: residentSearch, per_page: 5 });
        setResidentResults(response.data ?? []);
      } catch {
        // ignore
      } finally {
        setSearchingResidents(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [residentSearch]);

  const handleSelectResident = (res: ResidentSummary) => {
    setSelectedResident(res);
    setCompose(c => ({
      ...c,
      to_user_id: "",
      to_address: res.email ?? "",
    }));
    setResidentSearch("");
    setResidentResults([]);
  };

  const fetchMessages = useCallback(async (f: Folder, q?: string) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const params = new URLSearchParams({ folder: f });
      if (q) params.set("search", q);
      const data = await api.get<{ data: Message[]; unread_count: number }>(`/messages?${params}`);
      setState({
        messages: (data as { data: Message[]; unread_count: number }).data ?? [],
        unread_count: (data as { data: Message[]; unread_count: number }).unread_count ?? 0,
        loading: false,
        error: null,
      });
      // Update folder counts from inbox data
      if (f === "inbox") {
        setFolderCounts(prev => ({ ...prev, inbox: (data as { data: Message[]; unread_count: number }).unread_count ?? 0 }));
      }
    } catch {
      setState(s => ({ ...s, loading: false, error: "Failed to load messages." }));
    }
  }, []);

  const fetchStaffUsers = useCallback(async () => {
    try {
      const data = await api.get<{ users: StaffUser[] }>("/messages/users");
      setStaffUsers((data as { users: StaffUser[] }).users ?? []);
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchMessages(folder, search || undefined);
  }, [folder, fetchMessages]);

  useEffect(() => {
    fetchStaffUsers();
  }, [fetchStaffUsers]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchMessages(folder, val || undefined);
    }, 400);
  };

  const openMessage = async (msg: Message) => {
    setSelected(msg);
    if (!msg.is_read && msg.folder === "inbox") {
      try {
        await api.patch(`/messages/${msg.id}`, { is_read: true });
        setState(s => ({
          ...s,
          messages: s.messages.map(m => m.id === msg.id ? { ...m, is_read: true } : m),
          unread_count: Math.max(0, s.unread_count - 1),
        }));
      } catch { /* non-critical */ }
    }
  };

  const toggleStar = async (msg: Message, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.patch(`/messages/${msg.id}`, { is_starred: !msg.is_starred });
      setState(s => ({
        ...s,
        messages: s.messages.map(m => m.id === msg.id ? { ...m, is_starred: !m.is_starred } : m),
      }));
      if (selected?.id === msg.id) setSelected({ ...msg, is_starred: !msg.is_starred });
    } catch { /* non-critical */ }
  };

  const moveToTrash = async (msg: Message) => {
    try {
      await api.delete(`/messages/${msg.id}`);
      setState(s => ({ ...s, messages: s.messages.filter(m => m.id !== msg.id) }));
      setSelected(null);
    } catch { /* non-critical */ }
  };

  const archiveMessage = async (msg: Message) => {
    try {
      await api.patch(`/messages/${msg.id}`, { folder: "archive" });
      setState(s => ({ ...s, messages: s.messages.filter(m => m.id !== msg.id) }));
      setSelected(null);
    } catch { /* non-critical */ }
  };

  const sendMessage = async (draft: boolean) => {
    setSending(true);
    try {
      await api.post("/messages", {
        ...compose,
        cc_addresses: compose.cc_addresses ? compose.cc_addresses.split(",").map(s => s.trim()).filter(Boolean) : [],
        is_draft: draft,
      });
      setShowCompose(false);
      setCompose({ to_user_id: "", to_address: "", cc_addresses: "", subject: "", body: "", is_draft: false });
      setSelectedResident(null);
      if (!draft) fetchMessages(folder);
    } catch {
      /* show error */
    } finally {
      setSending(false);
    }
  };

  const getSenderName = (msg: Message): string => {
    if (msg.from_user) return msg.from_user.full_name;
    return "System";
  };

  const getRecipientName = (msg: Message): string => {
    if (msg.to_user) return msg.to_user.full_name;
    if (msg.to_address) return msg.to_address;
    return "—";
  };

  const displayName = (msg: Message) =>
    folder === "sent" || folder === "draft" ? `To: ${getRecipientName(msg)}` : getSenderName(msg);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      <div className="px-4 lg:px-6 pt-4 pb-2">
        <PageHeader
          title="Email"
          description="Internal barangay messaging system"
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Email" }]}
        />
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[220px_320px_1fr] gap-0 overflow-hidden mx-4 lg:mx-6 mb-4 rounded-xl border border-border bg-background overflow-hidden shadow-sm">

        {/* Sidebar — Folders */}
        <div className="glass border-r border-border p-3 flex flex-col gap-1 overflow-y-auto">
          <button
            onClick={() => setShowCompose(true)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-white mb-2"
            style={{ background: "var(--accent-primary)" }}
          >
            <Plus className="w-4 h-4" />
            Compose
          </button>

          {FOLDERS.map(f => {
            const Icon = f.icon;
            const active = f.key === folder;
            const count = f.key === "inbox" ? state.unread_count : (folderCounts[f.key] ?? 0);
            return (
              <button
                key={f.key}
                onClick={() => { setFolder(f.key); setSelected(null); }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left w-full ${
                  active
                    ? "bg-accent-primary/10 text-accent-primary font-medium"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{f.label}</span>
                {count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    active ? "bg-accent-primary text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          <div className="mt-auto pt-3 border-t border-border">
            <MabiniButton pageContext="You are on the Email page. This is the internal barangay messaging system for staff communication. Users can compose, reply, forward messages, and organize them into folders (inbox, sent, drafts, starred, archive, trash)." />
          </div>
        </div>

        {/* Message List */}
        <div className="border-r border-border flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="p-3 border-b border-border flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg bg-muted/50 border border-border focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
            </div>
            <button
              onClick={() => fetchMessages(folder, search || undefined)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {state.loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-muted rounded w-3/4" />
                      <div className="h-2.5 bg-muted rounded w-1/2" />
                      <div className="h-2 bg-muted rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : state.error ? (
              <div className="p-6 text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{state.error}</p>
              </div>
            ) : state.messages.length === 0 ? (
              <div className="p-6 text-center">
                <Mail className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No messages in {folder}</p>
              </div>
            ) : (
              state.messages.map(msg => {
                const isSelected = selected?.id === msg.id;
                const unread = !msg.is_read && msg.folder === "inbox";
                return (
                  <button
                    key={msg.id}
                    onClick={() => openMessage(msg)}
                    className={`w-full flex items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/50 ${
                      isSelected ? "bg-accent-primary/5 border-l-2 border-accent-primary" : ""
                    } ${unread ? "bg-blue-50/50 dark:bg-blue-950/10" : ""}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold text-white ${
                      unread ? "bg-accent-primary" : "bg-slate-400 dark:bg-slate-600"
                    }`}>
                      {initials(displayName(msg))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className={`text-xs truncate ${unread ? "font-bold text-foreground" : "font-medium text-foreground/80"}`}>
                          {displayName(msg)}
                        </p>
                        <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {timeAgo(msg.sent_at ?? msg.created_at)}
                        </span>
                      </div>
                      <p className={`text-xs ${unread ? "font-semibold text-foreground/90" : "text-muted-foreground"} truncate`}>
                        {msg.subject || "(no subject)"}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 truncate mt-0.5">
                        {msg.body.replace(/<[^>]+>/g, "").substring(0, 80)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {msg.is_starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                      {unread && <span className="w-2 h-2 rounded-full bg-accent-primary" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Message Detail */}
        <div className="flex flex-col overflow-hidden">
          {selected ? (
            <>
              {/* Detail header */}
              <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-3">
                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground lg:hidden"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="font-semibold text-sm text-foreground flex-1 truncate">{selected.subject || "(no subject)"}</h2>
                <div className="flex items-center gap-1">
                  <button
                    onClick={e => toggleStar(selected, e)}
                    className="p-1.5 rounded-lg hover:bg-muted"
                    title="Star"
                  >
                    <Star className={`w-4 h-4 ${selected.is_starred ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`} />
                  </button>
                  {folder !== "trash" && (
                    <button
                      onClick={() => archiveMessage(selected)}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                      title="Archive"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => moveToTrash(selected)}
                    className="p-1.5 rounded-lg hover:bg-muted text-red-500"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Meta */}
              <div className="px-5 py-3 border-b border-border">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {initials(getSenderName(selected))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{getSenderName(selected)}</p>
                      <span className="text-xs text-muted-foreground">
                        {selected.sent_at ? new Date(selected.sent_at).toLocaleString("en-PH") : "Draft"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">To: {getRecipientName(selected)}</p>
                    {selected.cc_addresses && selected.cc_addresses.length > 0 && (
                      <p className="text-xs text-muted-foreground">CC: {selected.cc_addresses.join(", ")}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: selected.body || "<p><em>No content</em></p>" }}
                />
              </div>

              {/* Reply bar */}
              {folder !== "trash" && folder !== "draft" && (
                <div className="px-5 py-3 border-t border-border flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCompose({
                        to_user_id: selected.from_user_id ?? "",
                        to_address: "",
                        cc_addresses: "",
                        subject: `Re: ${selected.subject}`,
                        body: `\n\n---\n${getSenderName(selected)} wrote:\n${selected.body.replace(/<[^>]+>/g, "")}`,
                        is_draft: false,
                      });
                      setShowCompose(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-sm text-foreground"
                  >
                    <Reply className="w-3.5 h-3.5" /> Reply
                  </button>
                  <button
                    onClick={() => {
                      setCompose({
                        to_user_id: "",
                        to_address: "",
                        cc_addresses: "",
                        subject: `Fwd: ${selected.subject}`,
                        body: `\n\n---\n${getSenderName(selected)} wrote:\n${selected.body.replace(/<[^>]+>/g, "")}`,
                        is_draft: false,
                      });
                      setShowCompose(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-sm text-foreground"
                  >
                    <Forward className="w-3.5 h-3.5" /> Forward
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <Mail className="w-14 h-14 text-muted-foreground/20 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Select a message to read</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Or compose a new message</p>
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      <Modal
        open={showCompose}
        onClose={() => {
          setShowCompose(false);
          setResidentSearch("");
          setResidentResults([]);
          setSelectedResident(null);
        }}
        title="New Message"
        size="lg"
        disableOutsideClick
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { sendMessage(true); }}>
              Save Draft
            </ModalButton>
            <ModalButton variant="primary" onClick={() => { sendMessage(false); }} disabled={sending || !compose.subject || (!compose.to_user_id && !compose.to_address)}>
              {sending ? "Sending..." : "Send"}
            </ModalButton>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">To (Staff Member)</label>
            <select
              value={compose.to_user_id}
              onChange={e => {
                const val = e.target.value;
                setCompose(c => ({ ...c, to_user_id: val, to_address: val ? "" : c.to_address }));
                if (val) setSelectedResident(null);
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent-primary"
            >
              <option value="">-- Select staff member --</option>
              {staffUsers.map(u => (
                <option key={u.id} value={u.id}>{u.full_name} (@{u.username})</option>
              ))}
            </select>
          </div>

          {!compose.to_user_id && (
            <>
              <div className="relative">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Or Search Resident</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    value={residentSearch}
                    onChange={e => setResidentSearch(e.target.value)}
                    placeholder="Type resident name to search..."
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent-primary"
                  />
                  {searchingResidents && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>

                {residentResults.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-border text-xs">
                    {residentResults.map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleSelectResident(r)}
                        className="w-full px-3 py-2 text-left hover:bg-muted transition-colors flex justify-between items-center text-foreground"
                      >
                        <span>{r.last_name}, {r.first_name}</span>
                        <span className="text-muted-foreground">{r.email || "No email"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedResident && (
                <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-blue-800 dark:text-blue-300">Selected Resident: </span>
                    <span className="text-foreground">{selectedResident.first_name} {selectedResident.last_name}</span>
                    {selectedResident.email ? (
                      <span className="text-muted-foreground font-mono ml-1.5">({selectedResident.email})</span>
                    ) : (
                      <span className="text-red-500 font-medium ml-1.5">(No email address registered)</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedResident(null); setCompose(c => ({ ...c, to_address: "" })); }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Or Email Address</label>
                <input
                  type="email"
                  value={compose.to_address}
                  onChange={e => {
                    setCompose(c => ({ ...c, to_address: e.target.value }));
                    setSelectedResident(null);
                  }}
                  placeholder="recipient@example.com"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>
            </>
          )}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">CC (comma-separated)</label>
            <input
              value={compose.cc_addresses}
              onChange={e => setCompose(c => ({ ...c, cc_addresses: e.target.value }))}
              placeholder="cc@example.com, another@example.com"
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject *</label>
            <input
              value={compose.subject}
              onChange={e => setCompose(c => ({ ...c, subject: e.target.value }))}
              placeholder="Message subject"
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Message *</label>
            <textarea
              value={compose.body}
              onChange={e => setCompose(c => ({ ...c, body: e.target.value }))}
              rows={8}
              placeholder="Write your message here..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent-primary resize-none font-mono"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
