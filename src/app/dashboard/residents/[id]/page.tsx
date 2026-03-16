"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Edit, Printer, Archive, User, Calendar, Heart, MapPin,
  Phone, Mail, Briefcase, GraduationCap, IdCard, Vote,
  Home, Flag, Users, AlertTriangle, Loader2, Contact,
  HandHeart, Link2, PawPrint, Globe, Fingerprint,
  ScrollText, Activity, FolderOpen, Clock, X, Plus,
  MessageSquare, Sparkles, CheckCircle2, ChevronRight, Search, Eye,
  FileEdit, Trash2, UserPlus, Shield, Download,
} from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { Markdown } from "@/components/ui/markdown";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn, resolvePhotoUrl } from "@/lib/utils";
import ResidentPinMap from "@/components/map/resident-pin-map-dynamic";
import { GenerateDocumentWizard } from "@/components/documents/GenerateDocumentWizard";
import { GenerateIdModal } from "@/components/documents/GenerateIdModal";
import { SendSmsModal, type SmsTargetResident } from "@/components/residents/SendSmsModal";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useAiStream } from "@/hooks/use-ai-stream";
import type { ResidentDetail } from "@/lib/types";
import { MabiniButton } from "@/components/ui/mabini-button";

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseDate(s: string) {
  // Extract date part only to avoid timezone shift
  const datePart = s.split("T")[0];
  const [y, m, day] = datePart.split("-").map(Number);
  return new Date(y, m - 1, day);
}

function age(dob: string) {
  const d = parseDate(dob);
  if (isNaN(d.getTime())) return "?";
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const mo = now.getMonth() - d.getMonth();
  if (mo < 0 || (mo === 0 && now.getDate() < d.getDate())) a--;
  return a;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function formatDate(d: string | null | undefined): string | null {
  if (!d) return null;
  const dt = parseDate(d);
  if (isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
}

function cap(s: string | null | undefined): string | null {
  if (!s) return null;
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}

// ── Field — Tanga-Proof: always shows "Not indicated" when empty ──────────────

function Field({
  label,
  value,
  icon,
  mono,
  wide,
}: {
  label: string;
  value: string | number | null | undefined | React.ReactNode;
  icon?: React.ReactNode;
  mono?: boolean;
  wide?: boolean;
}) {
  const isEmpty = value === null || value === undefined || value === "" || value === false;
  return (
    <div className={cn("flex flex-col gap-1", wide && "col-span-2")}>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className={cn(
        "flex items-center gap-1.5 text-sm",
        mono && "font-mono",
        isEmpty ? "text-muted-foreground/50 italic" : "text-foreground"
      )}>
        {icon && !isEmpty && <span className="text-muted-foreground shrink-0">{icon}</span>}
        <span>{isEmpty ? "Not indicated" : (value as React.ReactNode)}</span>
      </div>
    </div>
  );
}

function Section({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
        {children}
      </div>
    </div>
  );
}

function Divider() {
  return <hr className="border-border" />;
}

function PlaceholderTab({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 text-muted-foreground">
        {icon}
      </div>
      <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground max-w-xs">{description}</p>
    </div>
  );
}

// ── Activity Tab ──────────────────────────────────────────────────────────────

type ActivityLogEntry = {
  id: string;
  action: string;
  changes: Record<string, unknown> | null;
  created_at: string;
  user: { id: string; username: string; first_name: string | null; last_name: string | null } | null;
};

function ActivityTab({ residentId }: { residentId: string }) {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchActivity = async () => {
      try {
        const res = await api.residents.activity(residentId, { page, per_page: 20 });
        if (cancelled) return;
        setLogs(res.data);
        setLastPage(res.last_page);
        setTotal(res.total);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchActivity();
    return () => { cancelled = true; };
  }, [residentId, page]);

  const actionIconMap: Record<string, React.ReactNode> = {
    created: <UserPlus className="h-4 w-4" />,
    updated: <FileEdit className="h-4 w-4" />,
    deleted: <Trash2 className="h-4 w-4" />,
    viewed: <Eye className="h-4 w-4" />,
    printed: <Printer className="h-4 w-4" />,
    document_issued: <ScrollText className="h-4 w-4" />,
    sms_sent: <MessageSquare className="h-4 w-4" />,
  };
  const actionColorMap: Record<string, string> = {
    created: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    updated: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    deleted: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    viewed: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
    printed: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    document_issued: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    sms_sent: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  };
  const actionLabelMap: Record<string, string> = {
    created: "created",
    updated: "updated",
    deleted: "deleted",
    viewed: "viewed",
    printed: "printed a record for",
    document_issued: "issued a document for",
    sms_sent: "sent an SMS to",
  };

  function formatChanges(changes: Record<string, unknown> | null): React.ReactNode {
    if (!changes) return null;
    const desc = changes.description as string | undefined;
    const fieldsChanged = changes.fields_changed as string[] | undefined;
    const oldVals = changes.old as Record<string, unknown> | undefined;
    const newVals = changes.new as Record<string, unknown> | undefined;
    return (
      <div className="space-y-1.5 mt-1.5">
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
        {fieldsChanged && fieldsChanged.length > 0 && (
          <div className="space-y-1">
            {fieldsChanged.slice(0, 5).map((field) => (
              <div key={field} className="flex items-center gap-2 text-[11px]">
                <span className="font-medium text-muted-foreground capitalize min-w-[100px]">{field.replace(/_/g, " ")}</span>
                {oldVals?.[field] !== undefined && (
                  <span className="px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 line-through truncate max-w-[120px]">{String(oldVals[field] ?? "empty")}</span>
                )}
                <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                {newVals?.[field] !== undefined && (
                  <span className="px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 truncate max-w-[120px]">{String(newVals[field] ?? "empty")}</span>
                )}
              </div>
            ))}
            {fieldsChanged.length > 5 && (
              <p className="text-[10px] text-muted-foreground">+{fieldsChanged.length - 5} more field{fieldsChanged.length - 5 > 1 ? "s" : ""}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Activity Log</h3>
        {total > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground">{total}</span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : logs.length > 0 ? (
        <>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-1">
              {logs.map((log) => {
                const colorClass = actionColorMap[log.action] || "bg-muted text-muted-foreground";
                const icon = actionIconMap[log.action] || <Activity className="h-4 w-4" />;
                const label = actionLabelMap[log.action] || log.action;
                const userName = log.user
                  ? (log.user.first_name ? `${log.user.first_name} ${log.user.last_name || ""}`.trim() : log.user.username)
                  : "System";
                return (
                  <div key={log.id} className="relative flex gap-3 py-2.5">
                    <div className={cn("relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0", colorClass)}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-foreground">
                          <span className="font-bold">{userName}</span>
                          <span className="text-muted-foreground"> {label} this profile</span>
                        </p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 pt-0.5">{timeAgo(log.created_at)}</span>
                      </div>
                      {log.changes && formatChanges(log.changes)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {lastPage > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Previous
              </button>
              <span className="text-xs text-muted-foreground">Page {page} of {lastPage}</span>
              <button type="button" disabled={page >= lastPage} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-border p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Activity className="h-7 w-7 text-muted-foreground/60" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">No activity yet</p>
          <p className="text-xs text-muted-foreground">All profile changes, views, and actions will be recorded here.</p>
        </div>
      )}
    </div>
  );
}

// ── SMS History Tab ────────────────────────────────────────────────────────────

type SmsHistoryEntry = {
  id: string;
  recipient_phone: string;
  message: string;
  credit_cost: string;
  status: string;
  created_at: string;
};

function SmsHistoryTab({ residentId }: { residentId: string }) {
  const [logs, setLogs] = useState<SmsHistoryEntry[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.residents.smsHistory(residentId, { page, per_page: 20 })
      .then((res) => {
        if (cancelled) return;
        setLogs(res.data);
        setLastPage(res.last_page);
        setTotal(res.total);
      })
      .catch(() => { /* ignore */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [residentId, page]);

  const statusColor = (s: string) =>
    s === "sent" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    : s === "failed" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">SMS History</h3>
        {total > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground">{total}</span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : logs.length > 0 ? (
        <>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="p-4 rounded-xl border border-border glass-subtle space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">{log.recipient_phone}</p>
                      <p className="text-[10px] text-muted-foreground/70">{timeAgo(log.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      ₱{parseFloat(log.credit_cost).toFixed(2)}
                    </span>
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize", statusColor(log.status))}>
                      {log.status}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-foreground pl-10 leading-relaxed">{log.message}</p>
              </div>
            ))}
          </div>

          {lastPage > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Previous
              </button>
              <span className="text-xs text-muted-foreground">Page {page} of {lastPage}</span>
              <button type="button" disabled={page >= lastPage} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-border p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-7 w-7 text-muted-foreground/60" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">No SMS sent yet</p>
          <p className="text-xs text-muted-foreground">SMS messages sent to this resident will appear here.</p>
        </div>
      )}
    </div>
  );
}

// ── Documents Tab ─────────────────────────────────────────────────────────────

function DocumentsTab({ residentId }: { residentId: string }) {
  const [docs, setDocs] = useState<import("@/lib/types").IssuedDocument[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchDocs = async () => {
      try {
        const res = await api.issuedDocuments.list({ constituent_type: "resident", constituent_id: residentId, page, per_page: 20, sort_by: "created_at", sort_dir: "desc" });
        if (cancelled) return;
        setDocs(res.data);
        setLastPage(res.last_page);
        setTotal(res.total);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDocs();
    return () => { cancelled = true; };
  }, [residentId, page]);

  const statusColors: Record<string, string> = {
    issued:   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    released: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    expired:  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    revoked:  "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  };

  function fmtDate(d: string | null | undefined) {
    if (!d) return null;
    const dt = new Date(d.includes("T") ? d : d + "T00:00:00");
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ScrollText className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Issued Documents</h3>
        {total > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground">{total}</span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : docs.length > 0 ? (
        <>
          <div className="space-y-2">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-background hover:bg-muted/30 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                  <ScrollText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {doc.template_name || "Document"}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        #{doc.document_number}
                      </p>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize shrink-0", statusColors[doc.status] || "bg-muted text-muted-foreground")}>
                      {doc.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
                    {doc.issued_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {fmtDate(doc.issued_date)}
                      </span>
                    )}
                    {doc.purpose && (
                      <span className="truncate max-w-[200px]">{doc.purpose}</span>
                    )}
                    {doc.or_number && (
                      <span>O.R. #{doc.or_number}</span>
                    )}
                    {doc.blockchain_hash && (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <Shield className="h-3 w-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  {/* PDF actions */}
                  {doc.pdf_url && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <button
                        onClick={() => window.open(`/api/v1/issued-documents/${doc.id}/pdf`, "_blank")}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <Printer className="h-3 w-3" /> Print
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/v1/issued-documents/${doc.id}/pdf`);
                            if (!response.ok) return;
                            const blob = await response.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `${doc.document_number}.pdf`;
                            a.click();
                            URL.revokeObjectURL(url);
                          } catch { /* silent */ }
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <Download className="h-3 w-3" /> Download
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {lastPage > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Previous
              </button>
              <span className="text-xs text-muted-foreground">Page {page} of {lastPage}</span>
              <button type="button" disabled={page >= lastPage} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-border p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <ScrollText className="h-7 w-7 text-muted-foreground/60" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">No documents yet</p>
          <p className="text-xs text-muted-foreground">Certificates, clearances, and record prints issued to this resident will appear here.</p>
        </div>
      )}
    </div>
  );
}

// ── Mabini AI Summary Card ────────────────────────────────────────────────────

function MabiniSummaryCard({
  content,
  isStreaming,
  error,
}: {
  content: string;
  isStreaming: boolean;
  error: string | null;
}) {
  const router = useRouter();
  const hasContent = content.length > 0;

  return (
    <div className="rounded-xl border border-orange-200/60 dark:border-orange-800/40 bg-orange-50/60 dark:bg-orange-950/10 overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-orange-200/60 dark:border-orange-800/40">
        <div className="w-5 h-5 rounded-md overflow-hidden shrink-0 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mabini-ai.png" alt="Mabini AI" className="w-full h-full object-cover" />
        </div>
        <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">Mabini AI Summary</span>
        {isStreaming && (
          <span className="flex items-center gap-1 text-[10px] text-orange-500 ml-auto">
            <Sparkles className="h-3 w-3 animate-pulse" />
            Generating...
          </span>
        )}
        {!isStreaming && hasContent && (
          <span className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 ml-auto">
            <CheckCircle2 className="h-3 w-3" />
            Done
          </span>
        )}
      </div>
      <div className="p-4">
        {error ? (
          <p className="text-xs text-muted-foreground">AI summary unavailable.</p>
        ) : !hasContent && isStreaming ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-orange-500 animate-pulse" />
            <span>Mabini is reading the resident record...</span>
          </div>
        ) : hasContent ? (
          <Markdown content={content} className="text-sm" />
        ) : null}
        <button
          onClick={() => router.push("/dashboard/ai")}
          className="mt-3 flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
        >
          <MessageSquare className="h-3 w-3" />
          Ask Mabini more about this resident
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ── Personal Info Tab ─────────────────────────────────────────────────────────

function PersonalInfoTab({
  r,
  mabini,
}: {
  r: ResidentDetail;
  mabini: { content: string; isStreaming: boolean; error: string | null };
}) {
  const fullAddress = [r.house_block_lot, r.street, r.purok ? `Purok ${r.purok}` : null]
    .filter(Boolean).join(", ");

  return (
    <div className="space-y-6">

      {/* Mabini AI summary — auto-shown when streaming starts */}
      {(mabini.isStreaming || mabini.content) && (
        <MabiniSummaryCard content={mabini.content} isStreaming={mabini.isStreaming} error={mabini.error} />
      )}

      {/* Cross-barangay flags */}
      {(r.cross_barangay_flags?.length ?? 0) > 0 && (
        <div className="space-y-2">
          {r.cross_barangay_flags?.map((fl, i) => (
            <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl text-sm bg-gray-50 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-800">
              <Flag className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Cross-barangay record detected in <strong>{fl.barangay_name}</strong>{fl.detected_at ? ` (${fl.detected_at})` : ""}. Verify before issuing official documents.</span>
            </div>
          ))}
        </div>
      )}

      {/* Personal Information */}
      <Section title="Personal Information" icon={<User className="h-4 w-4" />}>
        <Field label="Sex" value={cap(r.sex)} />
        <Field label="Date of Birth" value={r.date_of_birth ? `${formatDate(r.date_of_birth)} (${age(r.date_of_birth)} yrs)` : null} />
        <Field label="Civil Status" value={cap(r.civil_status)} />
        <Field label="Blood Type" value={r.blood_type} />
        <Field label="Place of Birth" value={cap(r.place_of_birth)} />
        <Field label="Citizenship" value={cap(r.citizenship)} />
        <Field label="Religion" value={cap(r.religion)} />
        <Field label="Ethnicity" value={cap(r.ethnicity)} />
        <Field label="Height" value={r.height_cm ? `${r.height_cm} cm` : null} />
        <Field label="Weight" value={r.weight_kg ? `${r.weight_kg} kg` : null} />
        <Field label="Complexion" value={cap(r.complexion)} />
        <Field label="Resident Type" value={cap(r.resident_type)} />
        <Field label="Mother's Maiden Name" value={cap(r.mothers_maiden_name)} wide />
      </Section>

      <Divider />

      {/* Contact & Address */}
      <Section title="Contact & Address" icon={<Phone className="h-4 w-4" />}>
        <Field label="Mobile" value={r.mobile_number} icon={<Phone className="h-3 w-3" />} />
        <Field label="Telephone" value={r.telephone} icon={<Phone className="h-3 w-3" />} />
        <Field label="Email" value={r.email} icon={<Mail className="h-3 w-3" />} />
        <Field label="Full Address" value={fullAddress || null} icon={<MapPin className="h-3 w-3" />} wide />
        <Field label="Purok" value={r.purok} />
        <Field label="Street" value={r.street} />
        <Field label="House / Block / Lot / Subdivision / Village" value={r.house_block_lot} />

        <Field label="Zip Code" value={r.zip_code} />
        <Field label="Coordinates" value={(r.latitude && r.longitude) ? `${r.latitude}, ${r.longitude}` : null} icon={<Globe className="h-3 w-3" />} wide />
      </Section>

      <Divider />

      {/* Employment & Livelihood */}
      <Section title="Employment & Livelihood" icon={<Briefcase className="h-4 w-4" />}>
        <Field label="Livelihood Type" value={cap(r.livelihood_type)} />
        <Field label="Occupation" value={cap(r.occupation)} />
        <Field label="Monthly Income Range" value={cap(r.monthly_income_range)} />
        <Field label="Skills" value={cap(r.skills)} wide />
      </Section>

      <Divider />

      {/* Education */}
      <Section title="Education" icon={<GraduationCap className="h-4 w-4" />}>
        {Array.isArray(r.education_details) && (r.education_details as Record<string, unknown>[]).length > 0 ? (
          <div className="relative pl-5">
            {/* Timeline spine */}
            <div className="absolute left-1.5 top-2 bottom-2 w-px bg-border" />
            <div className="space-y-4">
              {(r.education_details as Record<string, unknown>[]).map((e, i) => {
                const level = String(e.level || e.degree || "");
                const school = String(e.school || "");
                const course = String(e.course || "");
                const startYear = String(e.start_year || "");
                const endYear = String(e.end_year || "");
                const currentlyStudying = Boolean(e.currently_studying);
                const years = startYear && endYear
                  ? `${startYear} – ${endYear}`
                  : startYear && currentlyStudying
                    ? `${startYear} – present`
                    : startYear
                      ? startYear
                      : endYear
                        ? `Until ${endYear}`
                        : "";
                return (
                  <div key={i} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-5 top-2 w-2.5 h-2.5 rounded-full bg-accent-primary border-2 border-background" />
                    <div className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground leading-tight">{level || "—"}</p>
                          {course && <p className="text-xs font-medium text-accent-text">{course}</p>}
                          {school && <p className="text-xs text-muted-foreground">{school}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {currentlyStudying && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border border-green-200 dark:border-green-800">
                              Ongoing
                            </span>
                          )}
                          {years && <p className="text-[11px] text-muted-foreground tabular-nums">{years}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No education records on file.</p>
        )}
      </Section>

      <Divider />

      {/* Government IDs — decrypted server-side, shown to authorized staff */}
      <Section title="Government IDs" icon={<IdCard className="h-4 w-4" />}>
        <Field label="PhilHealth No." value={r.philhealth_number} icon={<IdCard className="h-3 w-3" />} />
        <Field label="PhilHealth Expiry" value={formatDate(r.philhealth_expiry)} />
        <Field label="SSS / GSIS No." value={r.sss_gsis_number} icon={<IdCard className="h-3 w-3" />} />
        <Field label="SSS / GSIS Expiry" value={formatDate(r.sss_gsis_expiry)} />
        <Field label="Pag-IBIG No." value={r.pagibig_number} icon={<IdCard className="h-3 w-3" />} />
        <Field label="Pag-IBIG Expiry" value={formatDate(r.pagibig_expiry)} />
        <Field label="TIN No." value={r.tin_number} icon={<IdCard className="h-3 w-3" />} />
        <Field label="TIN Expiry" value={formatDate(r.tin_expiry)} />
        <Field label="PWD ID No." value={r.pwd_id} icon={<IdCard className="h-3 w-3" />} />
        <Field label="PWD ID Expiry" value={formatDate(r.pwd_id_expiry)} />
        <Field label="Senior Citizen ID" value={r.senior_citizen_id} wide icon={<IdCard className="h-3 w-3" />} />
      </Section>

      <Divider />

      {/* Voter & Household */}
      <Section title="Voter & Household" icon={<Vote className="h-4 w-4" />}>
        <Field label="Registered Voter" value={r.is_voter ? "Yes" : "No"} />
        <Field label="Resident Voter" value={r.is_resident_voter ? "Yes" : "No"} />
        <Field label="Voter ID" value={r.voter_id} mono />
        <Field label="Precinct Number" value={r.voter_precinct_number} mono />
        <Field label="Last Voted Year" value={r.last_voted_year} />
        <Field label="Head of Household" value={r.is_head_of_household ? "Yes" : "No"} />
        <Field label="Relationship to Head" value={cap(r.relationship_to_head)} />
        <Field label="Household Number" value={r.household?.household_number} mono />
      </Section>

      <Divider />

      {/* Barangay Position — always shown, Tanga-Proof */}
      <Section title="Barangay Position" icon={<Contact className="h-4 w-4" />}>
        <Field label="Position" value={cap(r.barangay_position)} />
        <Field label="Start Date" value={formatDate(r.barangay_role_start)} />
        <Field label="End Date" value={formatDate(r.barangay_role_end)} />
      </Section>

      <Divider />

      {/* Emergency Contact — always shown */}
      <Section title="Emergency Contact" icon={<AlertTriangle className="h-4 w-4" />}>
        <Field label="Name" value={cap(r.emergency_contact_name)} wide />
        <Field label="Phone" value={r.emergency_contact_phone} />
        <Field label="Relationship" value={cap(r.emergency_contact_relationship)} />
        <Field label="Address" value={cap(r.emergency_contact_address)} wide />
      </Section>

      <Divider />

      {/* Work History */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Work History</h3>
        </div>
        {Array.isArray(r.work_history) && (r.work_history as Record<string, unknown>[]).length > 0 ? (
          <div className="space-y-2">
            {(r.work_history as Record<string, unknown>[]).map((w, i) => {
              const position = String(w.position || w.job_title || "");
              const company = String(w.company || w.employer || "");
              const empType = String(w.employment_type || "");
              const description = String(w.description || "");
              const startYear = String(w.start_year || w.year_started || "");
              const endYear = String(w.end_year || w.year_ended || "");
              const years = startYear && endYear ? `${startYear} – ${endYear}` : startYear ? `${startYear} – present` : endYear ? `Until ${endYear}` : "";
              return (
              <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl glass-subtle text-sm">
                <Briefcase className="h-4 w-4 text-accent-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground">{position || "—"}</p>
                    {empType && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{empType}</span>}
                  </div>
                  {company && <p className="text-xs text-muted-foreground">{company}</p>}
                  {years && <p className="text-xs text-muted-foreground">{years}</p>}
                  {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
                </div>
              </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/50 italic">Not indicated</p>
        )}
      </div>

      <Divider />

      {/* Business / Enterprise */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Business / Enterprise</h3>
        </div>
        {Array.isArray(r.business_details) && (r.business_details as Record<string, string>[]).length > 0 ? (
          <div className="space-y-3">
            {(r.business_details as Record<string, string>[]).map((b, i) => {
              const bizName = b.business_name || b.name || "";
              const bizType = b.business_type || b.type || "";
              const bizAddress = b.business_address || b.address || "";
              const permitNo = b.business_permit_no || "";
              const dtiSec = b.dti_sec_no || "";
              const monthlyIncome = b.monthly_income || "";
              const startYear = b.start_year || "";
              const status = b.status || "";
              const description = b.description || "";
              return (
                <div key={i} className="p-4 rounded-xl glass-subtle text-sm space-y-2">
                  <div className="flex items-start gap-3">
                    <Briefcase className="h-4 w-4 text-accent-primary shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground">{bizName || "—"}</p>
                        {status && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{status}</span>}
                      </div>
                      {bizType && <p className="text-xs text-muted-foreground">{bizType}</p>}
                      {bizAddress && <p className="text-xs text-muted-foreground">{bizAddress}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 pl-7">
                    {permitNo && <Field label="Business Permit No." value={permitNo} mono />}
                    {dtiSec && <Field label="DTI / SEC No." value={dtiSec} mono />}
                    {monthlyIncome && <Field label="Monthly Income" value={monthlyIncome} />}
                    {startYear && <Field label="Start Year" value={startYear} />}
                  </div>
                  {description && <p className="text-xs text-muted-foreground pl-7 mt-1">{description}</p>}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/50 italic">Not indicated</p>
        )}
      </div>

      <Divider />

      {/* Health & Remarks — always shown, Tanga-Proof */}
      <Section title="Health & Remarks" icon={<Fingerprint className="h-4 w-4" />}>
        <Field label="Health History" value={r.health_history} wide />
        <Field label="Organ Donor" value={r.is_organ_donor ? "Yes" : "No"} />
        <Field label="Sector (Other)" value={r.sector_other} />
        <Field label="Other Remarks" value={r.other_remarks} wide />
      </Section>

    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

interface Toast { id: string; type: "success" | "error" | "warning" | "info"; title: string; message?: string; }

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  const colors: Record<string, string> = {
    success: "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
    error: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
    warning: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200",
    info: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
  };
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className={cn("flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm pointer-events-auto", colors[t.type])}>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{t.title}</p>
            {t.message && <p className="text-xs mt-0.5 opacity-80">{t.message}</p>}
          </div>
          <button onClick={() => onDismiss(t.id)} className="shrink-0 p-0.5 rounded hover:opacity-60 transition-opacity"><X className="h-3.5 w-3.5" /></button>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ResidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [resident, setResident] = useState<ResidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);

  // ── Action modals ──
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsTarget, setSmsTarget] = useState<SmsTargetResident | null>(null);
  const [showDocWizard, setShowDocWizard] = useState(false);
  const [docWizardCategory, setDocWizardCategory] = useState<string | null>(null);
  const [showIdModal, setShowIdModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const [archiveSaving, setArchiveSaving] = useState(false);

  // ── Relatives search state ──
  const [relSearch, setRelSearch] = useState("");
  const [relResults, setRelResults] = useState<{ id: string; name: string; resident_number: string; purok: string; photo_url?: string | null }[]>([]);
  const [relSearchLoading, setRelSearchLoading] = useState(false);
  const [relDropdownOpen, setRelDropdownOpen] = useState(false);
  const [relDropdownPos, setRelDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const relInputRef = useRef<HTMLDivElement>(null);
  const relSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [relSelected, setRelSelected] = useState<{ id: string; name: string; resident_number: string; photo_url?: string | null } | null>(null);
  const [relRelationship, setRelRelationship] = useState("");
  const [relSaving, setRelSaving] = useState(false);

  // ── Pet modal state ──
  const [petModalOpen, setPetModalOpen] = useState(false);
  const [petForm, setPetForm] = useState({ name: "", pet_type: "", sex: "", date_of_birth: "", remarks: "" });
  const [petSaving, setPetSaving] = useState(false);

  // ── Assistance modal state ──
  const [assistModalOpen, setAssistModalOpen] = useState(false);
  const [assistForm, setAssistForm] = useState({ date: "", type: "", source: "", amount: "", description: "", status: "", remarks: "" });
  const [assistSaving, setAssistSaving] = useState(false);

  const { streamingContent, isStreaming, error: streamError, sendMessage } = useAiStream();
  const aiTriggered = useRef(false);

  const addToast = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4000);
  }, []);

  const fetchResident = useCallback(async (silent = false) => {
    if (!isAuthenticated) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await api.residents.get(id);
      setResident(data);
    } catch {
      if (!silent) setError("Could not load resident record. It may have been deleted or you may not have access.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (!authLoading) fetchResident();
  }, [fetchResident, authLoading]);

  // ── Relatives search ──
  const searchRelatives = useCallback((query: string) => {
    setRelSearch(query);
    setRelSelected(null);
    if (query.trim().length === 0) {
      setRelResults([]);
      setRelDropdownOpen(false);
      setRelSearchLoading(false);
      return;
    }
    setRelSearchLoading(true);
    setRelDropdownOpen(true);
    if (relInputRef.current) {
      const rect = relInputRef.current.getBoundingClientRect();
      setRelDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    if (relSearchTimerRef.current) clearTimeout(relSearchTimerRef.current);
    relSearchTimerRef.current = setTimeout(async () => {
      try {
        const res = await api.residents.list({ search: query.trim(), per_page: 10 });
        const existingIds = new Set(
          Array.isArray(resident?.relative_links)
            ? (resident.relative_links as Record<string, string>[]).map((r) => r.resident_id)
            : []
        );
        const results = res.data
          .filter((r) => r.id !== id && !existingIds.has(r.id))
          .slice(0, 8)
          .map((r) => ({
            id: r.id,
            resident_number: r.resident_number,
            name: `${r.last_name}, ${r.first_name}${r.middle_name ? " " + r.middle_name.charAt(0) + "." : ""}${r.extension_name ? " " + r.extension_name : ""}`.trim(),
            purok: r.purok || "",
            photo_url: r.photo_url ?? null,
          }));
        setRelResults(results);
      } catch {
        setRelResults([]);
      } finally {
        setRelSearchLoading(false);
      }
    }, 300);
  }, [resident, id]);

  const selectRelative = (r: { id: string; name: string; resident_number: string; purok: string }) => {
    setRelSelected(r);
    setRelSearch(r.name);
    setRelDropdownOpen(false);
    setRelResults([]);
    setRelRelationship("");
  };

  const saveRelative = async () => {
    if (!relSelected || !relRelationship || !resident) return;
    setRelSaving(true);
    try {
      const existing = Array.isArray(resident.relative_links)
        ? (resident.relative_links as Record<string, string>[]).map((r) => ({
            resident_id: r.resident_id || "",
            resident_name: r.resident_name || r.name || "",
            relationship: r.relationship || "",
            photo_url: r.photo_url || "",
          }))
        : [];
      const newEntry = {
        resident_id: relSelected.id,
        resident_name: relSelected.name,
        relationship: relRelationship,
        photo_url: relSelected.photo_url || "",
      };
      await api.residents.update(id, { relative_entries: [...existing, newEntry] });
      await fetchResident(true);
      setRelSelected(null);
      setRelSearch("");
      setRelRelationship("");
    } catch {
      // silent — user will see no change
    } finally {
      setRelSaving(false);
    }
  };

  const removeRelative = async (relIdx: number) => {
    if (!resident) return;
    const existing = (resident.relative_links as Record<string, string>[])
      .filter((_, i) => i !== relIdx)
      .map((r) => ({
        resident_id: r.resident_id || "",
        resident_name: r.resident_name || r.name || "",
        relationship: r.relationship || "",
        photo_url: r.photo_url || "",
      }));
    try {
      await api.residents.update(id, { relative_entries: existing });
      await fetchResident(true);
    } catch {
      // silent
    }
  };

  const savePet = async () => {
    if (!petForm.name || !resident) return;
    setPetSaving(true);
    try {
      const existing = Array.isArray(resident.pet_records)
        ? (resident.pet_records as Record<string, string>[]).map((p) => ({
            name: p.name || "",
            pet_type: p.pet_type || p.species || "",
            sex: p.sex || "",
            date_of_birth: p.date_of_birth || "",
            remarks: p.remarks || "",
          }))
        : [];
      await api.residents.update(id, { pet_entries: [...existing, petForm] });
      await fetchResident(true);
      setPetModalOpen(false);
      setPetForm({ name: "", pet_type: "", sex: "", date_of_birth: "", remarks: "" });
    } catch {
      // silent
    } finally {
      setPetSaving(false);
    }
  };

  const saveAssistance = async () => {
    if (!assistForm.date || !resident) return;
    setAssistSaving(true);
    try {
      const existing = Array.isArray(resident.assistance_history)
        ? (resident.assistance_history as Record<string, string>[]).map((a) => ({
            date: a.date || "",
            type: a.type || a.program || "",
            source: a.source || "",
            amount: a.amount || "",
            description: a.description || "",
            status: a.status || "",
            remarks: a.remarks || "",
          }))
        : [];
      await api.residents.update(id, { assistance_entries: [...existing, assistForm] });
      await fetchResident(true);
      setAssistModalOpen(false);
      setAssistForm({ date: "", type: "", source: "", amount: "", description: "", status: "", remarks: "" });
    } catch {
      // silent
    } finally {
      setAssistSaving(false);
    }
  };

  // Auto-trigger Mabini AI summary once resident data is loaded
  useEffect(() => {
    if (!resident || aiTriggered.current) return;
    aiTriggered.current = true;

    const name = `${resident.first_name} ${resident.last_name}`;
    const dobStr = resident.date_of_birth ? `born ${formatDate(resident.date_of_birth)}` : "";
    const ageStr = resident.date_of_birth ? `, ${age(resident.date_of_birth)} years old` : "";
    const sexStr = resident.sex ? `, ${resident.sex}` : "";
    const purokStr = resident.purok ? `, Purok ${resident.purok}` : "";
    const occupStr = resident.occupation ? `. Occupation: ${resident.occupation}` : "";
    const voterStr = resident.is_voter ? ". Registered voter" : ". Not a registered voter";
    const hohStr = resident.is_head_of_household ? ". Head of household" : "";
    const sectorStr = resident.sectoral_tags?.length
      ? `. Sectoral tags: ${resident.sectoral_tags.map(t => t.sector).join(", ")}`
      : "";
    const completionStr = `Profile is ${resident.profile_completion_pct}% complete.`;

    const prompt = `You are a barangay management assistant. Provide a concise 3-4 sentence resident profile summary for barangay staff. Include key facts: ${name}${dobStr}${ageStr}${sexStr}${purokStr}${occupStr}${voterStr}${hohStr}${sectorStr}. ${completionStr} Highlight anything the staff should be aware of. Keep it direct and professional.`;

    sendMessage(prompt);
  }, [resident, sendMessage]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Error ──
  if (error || !resident) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="h-8 w-8 text-amber-500" />
        <p className="text-sm text-muted-foreground text-center max-w-sm">{error || "Resident not found."}</p>
        <button
          onClick={() => router.push("/dashboard/residents")}
          className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Residents
        </button>
      </div>
    );
  }

  // ── Derived values ──
  const fullName = [
    resident.last_name.toUpperCase() + ",",
    resident.first_name,
    resident.middle_name ? resident.middle_name[0] + "." : null,
    resident.extension_name || null,
  ].filter(Boolean).join(" ");

  const initials = (resident.last_name[0] + resident.first_name[0]).toUpperCase();
  const avatarColor = resident.sex === "female" ? "bg-pink-400" : "bg-blue-400";

  const completionPct = resident.profile_completion_pct;
  const completionColor =
    completionPct >= 80 ? "#22c55e" :
    completionPct >= 50 ? "#f59e0b" : "#ef4444";

  const missingFields = [
    // Personal
    !resident.blood_type && "Blood Type",
    !resident.citizenship && "Citizenship",
    !resident.religion && "Religion",
    !resident.ethnicity && "Ethnicity",
    !resident.mothers_maiden_name && "Mother's Maiden Name",
    // Contact
    !resident.mobile_number && "Mobile Number",
    !resident.email && "Email Address",
    // Address
    !resident.purok && "Purok / Sitio",
    !resident.house_block_lot && "House / Block / Lot",
    // Photo
    !resident.photo_file_id && "Profile Photo",
    // Education & Work
    !resident.highest_education && "Highest Education",
    !(Array.isArray(resident.education_details) && resident.education_details.length > 0) && "Education Details",
    !resident.occupation && "Occupation",
    !resident.employer && "Employer",
    !resident.source_of_income && "Source of Income",
    // Gov IDs
    !resident.philhealth_number && "PhilHealth Number",
    !resident.sss_gsis_number && "SSS / GSIS Number",
    !resident.pagibig_number && "Pag-IBIG Number",
    // Emergency Contact
    !resident.emergency_contact_name && "Emergency Contact Name",
    !resident.emergency_contact_phone && "Emergency Contact Phone",
    // Health
    !resident.health_history && "Health / Medical History",
  ].filter(Boolean) as string[];

  const tabs = [
    { id: "info", label: "Personal Info", icon: <User className="h-3.5 w-3.5" /> },
    { id: "cases", label: "Cases", icon: <FolderOpen className="h-3.5 w-3.5" /> },
    { id: "documents", label: "Documents", icon: <ScrollText className="h-3.5 w-3.5" /> },
    { id: "assistance", label: "Assistance / Solicitation", icon: <HandHeart className="h-3.5 w-3.5" /> },
    { id: "relatives", label: "Linked Relatives", icon: <Link2 className="h-3.5 w-3.5" /> },
    { id: "pets", label: "Pets", icon: <PawPrint className="h-3.5 w-3.5" /> },
    { id: "sms-history", label: "SMS History", icon: <MessageSquare className="h-3.5 w-3.5" /> },
    { id: "activity", label: "Activity", icon: <Activity className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-4">

      {/* Back */}
      <button
        onClick={() => router.push("/dashboard/residents")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Residents
      </button>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">

        {/* ── Left Panel ── */}
        <div className="w-full lg:w-72 shrink-0 space-y-4">

          {/* Identity Card */}
          <div className="rounded-2xl border border-border glass p-5">

            {/* Avatar + Name */}
            <div className="flex flex-col items-center text-center mb-4">
              {resident.photo_url ? (
                <img src={resolvePhotoUrl(resident.photo_url)!} alt={initials} className="w-24 h-24 rounded-2xl object-cover shadow-lg mb-3" />
              ) : (
                <div className={cn(
                  "w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg mb-3",
                  avatarColor
                )}>
                  {initials}
                </div>
              )}
              <h1 className="text-base font-bold text-foreground leading-tight">{fullName}</h1>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">{resident.resident_number}</p>

              {/* Status + key badges */}
              <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                <StatusBadge status={resident.status} />
                {resident.is_voter && <Badge variant="success" dot>Voter</Badge>}
                {resident.is_head_of_household && (
                  <span className="relative group">
                    <Badge variant="warning" dot>Head of Household</Badge>
                  </span>
                )}
                {resident.is_organ_donor && <Badge variant="info" dot>Organ Donor</Badge>}
                {resident.registration_source && (
                  <Badge variant={resident.registration_source === "import" ? "warning" : resident.registration_source === "census" ? "info" : "success"} dot>
                    {resident.registration_source === "form" ? "Form" : resident.registration_source === "import" ? "Imported" : resident.registration_source === "census" ? "Census" : cap(resident.registration_source)}
                  </Badge>
                )}
              </div>

              {/* Sectoral tags */}
              {(resident.sectoral_tags?.length ?? 0) > 0 && (
                <div className="flex flex-wrap justify-center gap-1 mt-1.5">
                  {resident.sectoral_tags?.map(t => (
                    <Badge key={t.id} variant="info" className="text-[9px] px-1.5">{t.sector}</Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Quick facts — Tanga-Proof: all shown */}
            <div className="space-y-2 py-3 border-t border-border">
              {/* Age & Sex */}
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                {resident.date_of_birth ? (
                  <span className="text-foreground">
                    {age(resident.date_of_birth)} yrs
                    {resident.sex && <span className="text-muted-foreground"> · {cap(resident.sex)}</span>}
                  </span>
                ) : (
                  <span className="text-muted-foreground/50 italic">Age not indicated</span>
                )}
              </div>

              {/* Civil Status */}
              <div className="flex items-center gap-2 text-xs">
                <Heart className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                {resident.civil_status ? (
                  <span className="text-foreground">{cap(resident.civil_status)}</span>
                ) : (
                  <span className="text-muted-foreground/50 italic">Civil status not indicated</span>
                )}
              </div>

              {/* Purok */}
              <div className="flex items-center gap-2 text-xs">
                <Home className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                {resident.purok ? (
                  <span className="text-foreground">Purok {resident.purok}</span>
                ) : (
                  <span className="text-muted-foreground/50 italic">Purok not indicated</span>
                )}
              </div>

              {/* Mobile */}
              <div className="flex items-center gap-2 text-xs">
                <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                {resident.mobile_number ? (
                  <span className="text-foreground">{resident.mobile_number}</span>
                ) : (
                  <span className="text-muted-foreground/50 italic">Mobile not indicated</span>
                )}
              </div>

              {/* Occupation */}
              {resident.occupation && (
                <div className="flex items-center gap-2 text-xs">
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-foreground">{cap(resident.occupation)}</span>
                </div>
              )}
            </div>

            {/* Registered & Updated */}
            <div className="pt-3 border-t border-border space-y-1">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" />
                <span>Registered: {formatDate(resident.registration_date || resident.created_at) ?? "Not indicated"}</span>
              </div>
              {resident.updated_at && (
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>Updated: {formatDate(resident.updated_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Profile Completion Card */}
          <div className="rounded-2xl border border-border glass p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profile Completion</p>
              <span className="text-sm font-bold" style={{ color: completionColor }}>{completionPct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${completionPct}%`, background: completionColor }}
              />
            </div>
            {missingFields.length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] text-muted-foreground mb-1.5">Missing information:</p>
                <div className="space-y-1">
                  {missingFields.slice(0, 8).map((f) => (
                    <div key={f} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <div className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                      {f}
                    </div>
                  ))}
                  {missingFields.length > 8 && (
                    <p className="text-[10px] text-muted-foreground">+{missingFields.length - 8} more fields missing</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Map Preview — clickable, opens full modal */}
          {(() => {
            const resLat = resident.latitude ? parseFloat(String(resident.latitude)) : null;
            const resLng = resident.longitude ? parseFloat(String(resident.longitude)) : null;
            const centerLat = resLat ?? (user?.barangay?.latitude ? parseFloat(String(user.barangay.latitude)) : 14.5995);
            const centerLng = resLng ?? (user?.barangay?.longitude ? parseFloat(String(user.barangay.longitude)) : 120.9842);
            return (
              <>
                <div
                  className="rounded-2xl border border-border glass overflow-hidden cursor-pointer group"
                  onClick={() => setMapModalOpen(true)}
                  title="Click to expand map"
                >
                  <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!resLat && <span className="text-[10px] text-muted-foreground/60 italic">No pin set</span>}
                      <span className="text-[10px] text-accent-text opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <Globe className="h-3 w-3" /> Expand
                      </span>
                    </div>
                  </div>
                  <div className="pointer-events-none">
                    <ResidentPinMap
                      lat={resLat}
                      lng={resLng}
                      centerLat={centerLat}
                      centerLng={centerLng}
                      readOnly
                      className="w-full h-[160px]"
                    />
                  </div>
                </div>

                {/* Full Map Modal */}
                {mapModalOpen && (
                  <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
                    onClick={(e) => { if (e.target === e.currentTarget) setMapModalOpen(false); }}
                  >
                    <div className="relative w-full max-w-4xl rounded-2xl overflow-hidden border border-border bg-card shadow-2xl flex flex-col"
                      style={{ maxHeight: "90vh" }}>
                      {/* Modal Header */}
                      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-card/95 backdrop-blur shrink-0">
                        <div className="flex items-center gap-2.5">
                          <MapPin className="h-4 w-4 text-accent-primary" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {resident.first_name} {resident.last_name} — Location
                            </p>
                            {resLat && resLng ? (
                              <p className="text-[11px] text-muted-foreground tabular-nums">{resLat.toFixed(6)}, {resLng.toFixed(6)}</p>
                            ) : (
                              <p className="text-[11px] text-muted-foreground/60 italic">No pin set — showing barangay area</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {resLat && resLng && (
                            <a
                              href={`https://www.google.com/maps?q=${resLat},${resLng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Globe className="h-3.5 w-3.5" />
                              Open in Google Maps
                            </a>
                          )}
                          <button
                            onClick={() => setMapModalOpen(false)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {/* Full Map */}
                      <div style={{ height: "60vh" }}>
                        <ResidentPinMap
                          lat={resLat}
                          lng={resLng}
                          centerLat={centerLat}
                          centerLng={centerLng}
                          readOnly
                          className="w-full h-full"
                        />
                      </div>
                      {/* Footer hint */}
                      <div className="px-5 py-2.5 border-t border-border bg-muted/30 shrink-0">
                        <p className="text-[11px] text-muted-foreground">
                          Scroll to zoom · Drag to pan · Click marker to see details
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {/* Actions */}
          <div className="rounded-2xl border border-border glass p-4 space-y-2">
            <button
              onClick={() => router.push(`/dashboard/residents?edit=${resident.id}`)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium rounded-xl text-white transition-colors"
              style={{ background: "var(--accent-primary)" }}
            >
              <Edit className="h-4 w-4" />
              Edit Profile
            </button>
            <button
              onClick={() => { setDocWizardCategory(null); setShowDocWizard(true); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium rounded-xl border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
            >
              <ScrollText className="h-4 w-4" />
              Generate Document
            </button>
            <button
              disabled={!resident.mobile_number}
              onClick={() => {
                setSmsTarget({
                  id: resident.id,
                  name: `${resident.last_name}, ${resident.first_name}${resident.middle_name ? " " + resident.middle_name.charAt(0) + "." : ""}${resident.extension_name ? " " + resident.extension_name : ""}`.trim(),
                  mobile_number: resident.mobile_number ?? null,
                });
                setShowSmsModal(true);
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium rounded-xl border border-orange-200 dark:border-orange-800/40 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title={resident.mobile_number ? `Send SMS to ${resident.mobile_number}` : "No mobile number registered"}
            >
              <MessageSquare className="h-4 w-4" />
              Send SMS
            </button>
            <button
              onClick={() => setShowIdModal(true)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium rounded-xl border border-violet-200 dark:border-violet-800/40 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors"
            >
              <IdCard className="h-4 w-4" />
              Print Resident ID
            </button>
            <button
              onClick={() => setShowArchiveModal(true)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium rounded-xl border border-amber-300/60 dark:border-amber-800/40 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
            >
              <Archive className="h-4 w-4" />
              Archive Record
            </button>
          </div>

        </div>
        {/* ── End Left Panel ── */}

        {/* ── Right Panel ── */}
        <div className="flex-1 min-w-0">
          <Tabs tabs={tabs} defaultTab="info">
            {(active) => (
              <div className="rounded-2xl border border-border glass p-6">

                {active === "info" && (
                  <PersonalInfoTab
                    r={resident}
                    mabini={{ content: streamingContent, isStreaming, error: streamError }}
                  />
                )}

                {active === "cases" && (
                  <div className="space-y-4">
                    {(resident.cross_barangay_flags?.length ?? 0) > 0 && (
                      <div className="space-y-2 mb-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cross-Barangay Flags</p>
                        {resident.cross_barangay_flags?.map((fl, i) => (
                          <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl text-sm bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-400">
                            <Flag className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>Cross-barangay record detected in <strong>{fl.barangay_name}</strong>{fl.detected_at ? ` (${fl.detected_at})` : ""}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <PlaceholderTab
                      icon={<FolderOpen className="h-6 w-6" />}
                      title="Cases & Blotter Records"
                      description="Blotter entries, VAWC cases, and other records linked to this resident will appear here."
                    />
                  </div>
                )}

                {active === "documents" && <DocumentsTab residentId={id} />}

                {active === "assistance" && (() => {
                  const assistList = Array.isArray(resident.assistance_history) ? (resident.assistance_history as Record<string, string>[]) : [];
                  const totalAmount = assistList.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
                  const statusColors: Record<string, string> = {
                    released: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
                    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
                    partial: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
                    denied: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
                    cancelled: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
                  };
                  return (
                  <div className="space-y-4">
                    {/* Header with stats */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HandHeart className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assistance / Solicitation</h3>
                      </div>
                      <button type="button" onClick={() => setAssistModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white transition-all hover:opacity-90 active:scale-[0.97]"
                        style={{ background: "var(--accent-primary)" }}>
                        <Plus className="h-3.5 w-3.5" /> Add Record
                      </button>
                    </div>

                    {/* Summary cards */}
                    {assistList.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-center">
                          <p className="text-lg font-bold text-foreground">{assistList.length}</p>
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Records</p>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-center">
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">₱{totalAmount.toLocaleString()}</p>
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Amount</p>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-center">
                          <p className="text-lg font-bold text-foreground">{assistList.filter(a => (a.status || "").toLowerCase() === "released").length}</p>
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Released</p>
                        </div>
                      </div>
                    )}

                    {/* Records */}
                    {assistList.length > 0 ? (
                      <div className="space-y-2.5">
                        {assistList.map((a, i) => (
                          <div key={i} className="group rounded-xl border border-border bg-card/60 hover:border-accent-primary/30 hover:shadow-sm transition-all overflow-hidden">
                            <div className="flex items-start gap-4 p-4">
                              {/* Type icon */}
                              <div className="w-10 h-10 rounded-xl bg-accent-bg flex items-center justify-center shrink-0">
                                <HandHeart className="h-5 w-5 text-accent-primary" />
                              </div>
                              {/* Content */}
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-bold text-foreground">{a.type || a.program || "Assistance"}</p>
                                    {a.source && <p className="text-xs text-muted-foreground">Source: {a.source}</p>}
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {a.amount && (
                                      <span className="px-2.5 py-1 rounded-lg bg-green-50 dark:bg-green-950/30 text-xs font-bold text-green-700 dark:text-green-300 tabular-nums">
                                        ₱{Number(a.amount).toLocaleString()}
                                      </span>
                                    )}
                                    {a.status && (
                                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider", statusColors[(a.status || "").toLowerCase()] || "bg-muted text-muted-foreground")}>
                                        {a.status}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {a.description && <p className="text-xs text-foreground/70 leading-relaxed">{a.description}</p>}
                                {a.remarks && <p className="text-xs text-muted-foreground italic">{a.remarks}</p>}
                                {a.date && (
                                  <div className="flex items-center gap-1.5 pt-0.5">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    <p className="text-[11px] text-muted-foreground">{formatDate(a.date) || a.date}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border-2 border-dashed border-border p-10 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-accent-bg/50 flex items-center justify-center mx-auto mb-4">
                          <HandHeart className="h-7 w-7 text-accent-primary/60" />
                        </div>
                        <p className="text-sm font-semibold text-foreground mb-1">No assistance records yet</p>
                        <p className="text-xs text-muted-foreground mb-4">Track financial aid, medical assistance, food packs, and other support given to this resident.</p>
                        <button type="button" onClick={() => setAssistModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white transition-all hover:opacity-90"
                          style={{ background: "var(--accent-primary)" }}>
                          <Plus className="h-3.5 w-3.5" /> Add First Record
                        </button>
                      </div>
                    )}
                  </div>
                  );
                })()}

                {active === "relatives" && (() => {
                  const relList = Array.isArray(resident.relative_links) ? (resident.relative_links as Record<string, string>[]) : [];
                  const relIconMap: Record<string, React.ReactNode> = {
                    spouse: <Heart className="h-4 w-4" />,
                    father: <User className="h-4 w-4" />,
                    mother: <User className="h-4 w-4" />,
                    son: <User className="h-4 w-4" />,
                    daughter: <User className="h-4 w-4" />,
                    brother: <Users className="h-4 w-4" />,
                    sister: <Users className="h-4 w-4" />,
                  };
                  const relColorMap: Record<string, string> = {
                    spouse: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
                    father: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
                    mother: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
                    son: "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
                    daughter: "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400",
                    brother: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
                    sister: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
                  };
                  return (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Linked Relatives</h3>
                        {relList.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-bg text-accent-text">{relList.length}</span>
                        )}
                      </div>
                    </div>

                    {/* Search box */}
                    <div className="rounded-xl border border-border p-4 space-y-3 bg-gradient-to-br from-muted/20 to-muted/5">
                      <p className="text-xs font-medium text-muted-foreground">Link an existing resident as a relative</p>
                      <div ref={relInputRef} className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        {relSearchLoading && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />
                        )}
                        <input
                          type="text"
                          value={relSearch}
                          onChange={(e) => searchRelatives(e.target.value)}
                          onFocus={() => {
                            if (relInputRef.current) {
                              const rect = relInputRef.current.getBoundingClientRect();
                              setRelDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
                            }
                            if (relResults.length > 0) setRelDropdownOpen(true);
                          }}
                          onBlur={() => setTimeout(() => setRelDropdownOpen(false), 250)}
                          placeholder="Type resident name or ID number..."
                          className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring"
                        />
                      </div>
                      {relSearch.trim().length >= 1 && !relSearchLoading && relResults.length === 0 && !relSelected && (
                        <p className="text-xs text-muted-foreground pl-1">No matching residents found. They must be registered first.</p>
                      )}
                      {relSelected && (
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-bg text-accent-text text-xs font-medium">
                            <User className="h-3.5 w-3.5" />
                            {relSelected.name}
                            <span className="text-[10px] text-accent-text/60 ml-0.5">{relSelected.resident_number}</span>
                            <button type="button" onClick={() => { setRelSelected(null); setRelSearch(""); setRelRelationship(""); }} className="ml-1 hover:text-red-500 transition-colors">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <select
                            value={relRelationship}
                            onChange={(e) => setRelRelationship(e.target.value)}
                            className="px-3 py-1.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring"
                          >
                            {["", "Spouse", "Father", "Mother", "Son", "Daughter", "Brother", "Sister", "Grandfather", "Grandmother", "Grandson", "Granddaughter", "Uncle", "Aunt", "Nephew", "Niece", "Cousin", "Father-in-law", "Mother-in-law", "Son-in-law", "Daughter-in-law", "Brother-in-law", "Sister-in-law", "Stepfather", "Stepmother", "Stepson", "Stepdaughter", "Guardian", "Ward", "Others"].map((o) => (
                              <option key={o} value={o}>{o || "Select relationship..."}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={saveRelative}
                            disabled={!relRelationship || relSaving}
                            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90 active:scale-[0.97]"
                            style={{ background: "var(--accent-primary)" }}
                          >
                            {relSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                            Link Relative
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Portal dropdown */}
                    {relDropdownOpen && relResults.length > 0 && typeof window !== "undefined" && createPortal(
                      <div
                        className="fixed z-[9999] bg-background border border-border rounded-xl shadow-xl overflow-hidden"
                        style={{ top: relDropdownPos.top, left: relDropdownPos.left, width: relDropdownPos.width, maxHeight: 280 }}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <div className="px-3 py-2 border-b border-border bg-muted/40">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{relResults.length} resident{relResults.length !== 1 ? "s" : ""} found</p>
                        </div>
                        {relResults.map((r) => (
                          <button key={r.id} type="button" onMouseDown={() => selectRelative(r)}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent-bg transition-colors flex items-center gap-3 border-b border-border/40 last:border-0">
                            <div className="w-7 h-7 rounded-lg bg-accent-bg flex items-center justify-center shrink-0">
                              <User className="h-3.5 w-3.5 text-accent-text" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-foreground truncate">{r.name}</p>
                              <p className="text-[10px] text-muted-foreground">{r.resident_number}{r.purok ? ` · Purok ${r.purok}` : ""}</p>
                            </div>
                            <Link2 className="h-3.5 w-3.5 text-accent-primary shrink-0" />
                          </button>
                        ))}
                      </div>,
                      document.body
                    )}

                    {/* Linked relatives grid */}
                    {relList.length > 0 ? (
                      <div className={cn("gap-3", relList.length > 1 ? "grid grid-cols-1 sm:grid-cols-2" : "flex flex-col")}>
                        {relList.map((rel, i) => {
                          const relKey = (rel.relationship || "").toLowerCase();
                          const colorClass = relColorMap[relKey] || "bg-accent-bg text-accent-primary";
                          const displayName = rel.name || rel.resident_name || "—";
                          const nameParts = displayName.trim().split(/\s+/);
                          const initials = nameParts.length >= 2
                            ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
                            : displayName.slice(0, 2).toUpperCase();
                          const photoUrl = rel.photo_url ? resolvePhotoUrl(rel.photo_url) : null;
                          return (
                          <div key={i} className="group relative rounded-xl border border-border bg-card/60 hover:border-accent-primary/30 hover:shadow-sm transition-all overflow-hidden">
                            <div className="flex items-center gap-3 p-4">
                              {/* Square avatar with photo or initials */}
                              <div className={cn("w-12 h-12 rounded-xl shrink-0 overflow-hidden flex items-center justify-center font-bold text-sm", colorClass)}>
                                {photoUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={photoUrl} alt={displayName} className="w-full h-full object-cover" />
                                ) : (
                                  <span>{initials}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground truncate">{displayName}</p>
                                <p className="text-[11px] text-muted-foreground capitalize">{rel.relationship || "—"}</p>
                                {rel.resident_id && (
                                  <button type="button" onClick={() => router.push(`/dashboard/residents/${rel.resident_id}`)}
                                    className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-accent-text hover:underline">
                                    <Eye className="h-3 w-3" /> View Profile
                                  </button>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeRelative(i)}
                                className="absolute top-2 right-2 p-1.5 text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-red-500 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0"
                                title="Remove link"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-xl border-2 border-dashed border-border p-10 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-accent-bg/50 flex items-center justify-center mx-auto mb-4">
                          <Link2 className="h-7 w-7 text-accent-primary/60" />
                        </div>
                        <p className="text-sm font-semibold text-foreground mb-1">No relatives linked yet</p>
                        <p className="text-xs text-muted-foreground">Search for an existing resident above and select their relationship to link family members.</p>
                      </div>
                    )}
                  </div>
                  );
                })()}

                {active === "pets" && (() => {
                  const petList = Array.isArray(resident.pet_records) ? (resident.pet_records as Record<string, string>[]) : [];
                  const speciesColorMap: Record<string, string> = {
                    dog: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
                    cat: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
                    bird: "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
                    fish: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
                    chicken: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
                    rabbit: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
                    goat: "bg-lime-100 text-lime-600 dark:bg-lime-900/30 dark:text-lime-400",
                    pig: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
                    cow: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
                    carabao: "bg-stone-100 text-stone-600 dark:bg-stone-900/30 dark:text-stone-400",
                    horse: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
                  };
                  return (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PawPrint className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pets</h3>
                        {petList.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{petList.length}</span>
                        )}
                      </div>
                      <button type="button" onClick={() => setPetModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white transition-all hover:opacity-90 active:scale-[0.97]"
                        style={{ background: "var(--accent-primary)" }}>
                        <Plus className="h-3.5 w-3.5" /> Add Pet
                      </button>
                    </div>

                    {/* Summary */}
                    {petList.length > 0 && (() => {
                      const speciesCounts: Record<string, number> = {};
                      petList.forEach(p => {
                        const s = (p.species || p.pet_type || "Other").toLowerCase();
                        speciesCounts[s] = (speciesCounts[s] || 0) + 1;
                      });
                      return (
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(speciesCounts).map(([species, count]) => (
                            <span key={species} className={cn("px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize", speciesColorMap[species] || "bg-muted text-muted-foreground")}>
                              {count} {species}{count > 1 ? "s" : ""}
                            </span>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Pet cards */}
                    {petList.length > 0 ? (
                      <div className={cn("gap-3", petList.length > 1 ? "grid grid-cols-1 sm:grid-cols-2" : "flex flex-col")}>
                        {petList.map((pet, i) => {
                          const speciesKey = (pet.species || pet.pet_type || "").toLowerCase();
                          const colorClass = speciesColorMap[speciesKey] || "bg-muted text-muted-foreground";
                          const petAge = pet.date_of_birth ? age(pet.date_of_birth) : null;
                          return (
                          <div key={i} className="group relative rounded-xl border border-border bg-card/60 hover:border-amber-400/40 hover:shadow-sm transition-all overflow-hidden">
                            <div className="flex items-start gap-3 p-4">
                              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", colorClass)}>
                                <PawPrint className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-bold text-foreground truncate">{pet.name || "Unnamed"}</p>
                                  {pet.sex && (
                                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0", pet.sex.toLowerCase() === "male" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400")}>
                                      {pet.sex}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground capitalize">{pet.species || pet.pet_type || "Unknown species"}</p>
                                {petAge !== null && (
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    <p className="text-[11px] text-muted-foreground">{petAge} year{petAge !== 1 ? "s" : ""} old</p>
                                  </div>
                                )}
                                {pet.remarks && (
                                  <p className="text-[11px] text-muted-foreground/70 italic leading-relaxed mt-0.5">{pet.remarks}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-xl border-2 border-dashed border-border p-10 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mx-auto mb-4">
                          <PawPrint className="h-7 w-7 text-amber-400/60" />
                        </div>
                        <p className="text-sm font-semibold text-foreground mb-1">No pets registered</p>
                        <p className="text-xs text-muted-foreground mb-4">Register household pets including dogs, cats, livestock, and other animals.</p>
                        <button type="button" onClick={() => setPetModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white transition-all hover:opacity-90"
                          style={{ background: "var(--accent-primary)" }}>
                          <Plus className="h-3.5 w-3.5" /> Add First Pet
                        </button>
                      </div>
                    )}
                  </div>
                  );
                })()}

                {active === "sms-history" && <SmsHistoryTab residentId={id} />}
                {active === "activity" && <ActivityTab residentId={id} />}

              </div>
            )}
          </Tabs>
        </div>
        {/* ── End Right Panel ── */}

      </div>
      {/* ── Pet Modal ── */}
      {petModalOpen && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onMouseDown={(e) => e.stopPropagation()}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onMouseDown={(e) => e.preventDefault()} />
          <div className="relative z-10 w-full max-w-lg bg-background rounded-2xl border border-border shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <PawPrint className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Add Pet</h2>
                  <p className="text-[11px] text-muted-foreground">Register a pet for this resident</p>
                </div>
              </div>
              <button type="button" onClick={() => setPetModalOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Pet Name <span className="text-red-500">*</span></label>
                  <input type="text" value={petForm.name} onChange={(e) => setPetForm((f) => ({ ...f, name: e.target.value.toUpperCase() }))}
                    placeholder="e.g. BROWNIE"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring uppercase" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Type / Species</label>
                  <select value={petForm.pet_type} onChange={(e) => setPetForm((f) => ({ ...f, pet_type: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
                    {["", "Dog", "Cat", "Bird", "Fish", "Chicken", "Rabbit", "Goat", "Pig", "Cow", "Carabao", "Horse", "Turtle", "Duck", "Other"].map((o) => (
                      <option key={o} value={o}>{o || "Select type..."}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Sex</label>
                  <select value={petForm.sex} onChange={(e) => setPetForm((f) => ({ ...f, sex: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
                    {["", "Male", "Female"].map((o) => <option key={o} value={o}>{o || "Select sex..."}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Date of Birth</label>
                  <input type="date" value={petForm.date_of_birth} onChange={(e) => setPetForm((f) => ({ ...f, date_of_birth: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Remarks</label>
                  <textarea value={petForm.remarks} onChange={(e) => setPetForm((f) => ({ ...f, remarks: e.target.value.toUpperCase() }))}
                    placeholder="Vaccination status, special notes, etc."
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none uppercase" />
                </div>
              </div>
            </div>
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
              <button type="button" onClick={() => setPetModalOpen(false)}
                className="px-4 py-2 text-sm rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground">
                Cancel
              </button>
              <button type="button" onClick={savePet} disabled={!petForm.name || petSaving}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ background: "var(--accent-primary)" }}>
                {petSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add Pet
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Assistance / Solicitation Modal ── */}
      {assistModalOpen && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onMouseDown={(e) => e.stopPropagation()}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onMouseDown={(e) => e.preventDefault()} />
          <div className="relative z-10 w-full max-w-lg bg-background rounded-2xl border border-border shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-accent-bg flex items-center justify-center">
                  <HandHeart className="h-4 w-4 text-accent-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Add Assistance / Solicitation</h2>
                  <p className="text-[11px] text-muted-foreground">Record assistance given to this resident</p>
                </div>
              </div>
              <button type="button" onClick={() => setAssistModalOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Date <span className="text-red-500">*</span></label>
                  <input type="date" value={assistForm.date} onChange={(e) => setAssistForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
                  <select value={assistForm.status} onChange={(e) => setAssistForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
                    {["", "Pending", "Released", "Partial", "Denied", "Cancelled"].map((o) => <option key={o} value={o}>{o || "Select status..."}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Type of Assistance</label>
                  <select value={assistForm.type} onChange={(e) => setAssistForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
                    {["", "Financial", "Medical", "Food Pack", "Livelihood", "Educational", "Housing/Shelter", "Burial", "Calamity Relief", "Legal", "Referral Letter", "Transportation", "Scholarship", "Other"].map((o) => (
                      <option key={o} value={o}>{o || "Select type..."}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Amount (₱)</label>
                  <input type="number" min="0" value={assistForm.amount} onChange={(e) => setAssistForm((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label>
                  <textarea value={assistForm.description} onChange={(e) => setAssistForm((f) => ({ ...f, description: e.target.value.toUpperCase() }))}
                    placeholder="Details of the assistance provided..."
                    rows={2}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none uppercase" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Remarks</label>
                  <textarea value={assistForm.remarks} onChange={(e) => setAssistForm((f) => ({ ...f, remarks: e.target.value.toUpperCase() }))}
                    placeholder="Additional notes..."
                    rows={2}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none uppercase" />
                </div>
              </div>
            </div>
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
              <button type="button" onClick={() => setAssistModalOpen(false)}
                className="px-4 py-2 text-sm rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground">
                Cancel
              </button>
              <button type="button" onClick={saveAssistance} disabled={!assistForm.date || assistSaving}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ background: "var(--accent-primary)" }}>
                {assistSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add Assistance
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <MabiniButton pageContext="You are on the Resident Detail page. This page shows the complete profile of a specific resident, including personal information, address, sectoral data, government IDs, and activity history." />

      {/* Generate Document Wizard */}
      <GenerateDocumentWizard
        open={showDocWizard}
        onClose={() => { setShowDocWizard(false); setDocWizardCategory(null); }}
        initialResidentId={resident?.id ?? null}
        initialTemplateCategory={docWizardCategory}
      />

      {/* Send SMS Modal */}
      <SendSmsModal
        open={showSmsModal}
        onClose={() => { setShowSmsModal(false); setSmsTarget(null); }}
        resident={smsTarget}
        creditBalance={user?.barangay?.sms_credit_balance != null ? parseFloat(String(user.barangay.sms_credit_balance)) : null}
      />

      {/* Generate ID Modal */}
      <GenerateIdModal
        open={showIdModal}
        onClose={() => setShowIdModal(false)}
        residentId={resident?.id ?? null}
      />

      {/* Archive Record Modal */}
      <Modal
        open={showArchiveModal}
        onClose={() => { setShowArchiveModal(false); setArchiveReason(""); }}
        title="Archive Resident Record"
        size="sm"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { setShowArchiveModal(false); setArchiveReason(""); }}>Cancel</ModalButton>
            <ModalButton
              variant="danger"
              disabled={!archiveReason || archiveSaving}
              onClick={async () => {
                if (!resident) return;
                setArchiveSaving(true);
                try {
                  await api.residents.delete(resident.id);
                  addToast({ type: "success", title: "Record archived", message: `${resident.first_name} ${resident.last_name} has been moved to archive.` });
                  setShowArchiveModal(false);
                  setArchiveReason("");
                  router.push("/dashboard/residents");
                } catch {
                  addToast({ type: "error", title: "Archive failed", message: "Could not archive this record. Please try again." });
                } finally {
                  setArchiveSaving(false);
                }
              }}
            >
              {archiveSaving ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Archiving...</> : "Archive Record"}
            </ModalButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
              <Archive className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">{resident?.first_name} {resident?.last_name}</p>
              <p className="text-xs text-amber-700 dark:text-amber-400">{resident?.resident_number}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">This record will be moved to the archive. It will no longer appear in active resident lists but can be restored later.</p>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Reason for archiving <span className="text-red-500">*</span></label>
            <select
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring"
            >
              <option value="">Select a reason...</option>
              <option value="deceased">Deceased</option>
              <option value="transferred">Transferred out of barangay</option>
              <option value="duplicate">Duplicate record</option>
              <option value="error">Data entry error</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Toast notifications */}
      {createPortal(
        <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />,
        document.body
      )}
    </div>
  );
}
