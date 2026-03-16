"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Gavel,
  Plus,
  Search,
  Filter,
  FileBarChart,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Clock,
  AlertTriangle,
  MapPin,
  Calendar,
  Users,
  Shield,
  Save,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Printer,
  RefreshCw,
  Bot,
  CheckCircle,
  ArrowRight,
  FileText,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { MabiniButton } from "@/components/ui/mabini-button";
import { api } from "@/lib/api";
import type { BlotterRecord, BlotterStats } from "@/lib/types";

// ── Constants ──
const INCIDENT_TYPES = [
  "Theft", "Robbery", "Physical Injury", "Oral Defamation", "Trespassing",
  "Property Damage", "Domestic Dispute", "Noise Complaint", "Disturbance",
  "Harassment", "Vandalism", "Illegal Parking", "Stray Animals", "Other",
];

const STATUS_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: "filed",        label: "Filed",          color: "#64748b" },
  { value: "for_hearing",  label: "For Hearing",    color: "#f59e0b" },
  { value: "for_subpoena", label: "For Subpoena",   color: "#8b5cf6" },
  { value: "settled",      label: "Settled",        color: "#22c55e" },
  { value: "closed",       label: "Closed",         color: "#94a3b8" },
];

const emptyForm = {
  incident_type: "", incident_date: "", incident_time: "", incident_place: "",
  narrative: "", resolution: "",
  complainant_name: "", complainant_address: "", complainant_mobile: "", respondent_unknown: "",
  respondent_name: "", respondent_address: "", respondent_mobile: "",
};

// ── Form Field Components ──
function FormInput({ label, value, onChange, required, type = "text", placeholder = "", disabled = false, error }: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; type?: string; placeholder?: string; disabled?: boolean; error?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} disabled={disabled}
        className={cn("w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2",
          error ? "border-red-500 focus:ring-red-300" : "focus:ring-accent-ring",
          disabled && "opacity-50 cursor-not-allowed")} />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormSelect({ label, value, onChange, options, required, error }: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; required?: boolean; error?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className={cn("w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2",
          error ? "border-red-500 focus:ring-red-300" : "focus:ring-accent-ring")}>
        <option value="">Select {label}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormTextarea({ label, value, onChange, required, rows = 3, placeholder = "" }: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; rows?: number; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)}
        rows={rows} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none" />
    </div>
  );
}

function statusColor(status: string): string {
  return STATUS_OPTIONS.find((s) => s.value === status)?.color ?? "#64748b";
}

function statusLabel(status: string): string {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
}

// ── Page ──
export default function BlotterPage() {
  const router = useRouter();

  // Data
  const [blotters, setBlotters]   = useState<BlotterRecord[]>([]);
  const [stats, setStats]         = useState<BlotterStats | null>(null);
  const [loading, setLoading]     = useState(true);
  const [total, setTotal]         = useState(0);
  const [lastPage, setLastPage]   = useState(1);

  // Filters
  const [search, setSearch]           = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter]   = useState("");
  const [typeFilter, setTypeFilter]       = useState("");
  const [showFilters, setShowFilters]     = useState(false);
  const [page, setPage]                   = useState(1);
  const perPage = 15;

  // Modals
  const [viewBlotter, setViewBlotter]     = useState<BlotterRecord | null>(null);
  const [showCreate, setShowCreate]       = useState(false);
  const [showEdit, setShowEdit]           = useState(false);
  const [editTarget, setEditTarget]       = useState<BlotterRecord | null>(null);
  const [formTab, setFormTab]             = useState(0);
  const [form, setForm]                   = useState({ ...emptyForm });
  const [formErrors, setFormErrors]       = useState<Record<string, string>>({});
  const [saving, setSaving]               = useState(false);
  const [showDelete, setShowDelete]       = useState(false);
  const [deleteTarget, setDeleteTarget]   = useState<BlotterRecord | null>(null);
  const [deleting, setDeleting]           = useState(false);
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  const [updateTarget, setUpdateTarget]   = useState<BlotterRecord | null>(null);
  const [newStatus, setNewStatus]         = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Toast
  const [toasts, setToasts] = useState<{ id: number; message: string; type?: "success" | "error" }[]>([]);
  const addToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, typeFilter]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.blotters.stats();
      if (res) setStats(res);
    } catch { /* silent */ }
  }, []);

  // Fetch blotters
  const fetchBlotters = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.blotters.list({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        incident_type: typeFilter || undefined,
        page,
        per_page: perPage,
      });
      if (res) {
        setBlotters(res.data);
        setTotal(res.total);
        setLastPage(res.last_page);
      }
    } catch {
      addToast("Failed to load blotter records", "error");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, typeFilter, page, addToast]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchBlotters(); }, [fetchBlotters]);

  // Mabini insight
  const mabiniInsight = useMemo(() => {
    if (!stats) return "Loading blotter analysis...";
    if (stats.total === 0) return "No blotter records yet. Record incidents as they are reported to the barangay.";
    const parts: string[] = [];
    if (stats.active > 0) parts.push(`${stats.active} active case(s) pending resolution.`);
    if (stats.for_hearing > 0) parts.push(`${stats.for_hearing} set for hearing.`);
    if (stats.for_subpoena > 0) parts.push(`${stats.for_subpoena} awaiting subpoena.`);
    if (stats.this_month > 0) parts.push(`${stats.this_month} recorded this month.`);
    if (parts.length === 0) return `${stats.settled} cases settled, ${stats.closed} closed. All active cases resolved.`;
    return parts.join(" ");
  }, [stats]);

  // ── Form helpers ──
  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.incident_type)   errors.incident_type   = "Required";
    if (!form.complainant_name) errors.complainant_name = "Required";
    if (!form.respondent_name && form.respondent_unknown !== "yes") errors.respondent_name = "Required (or check Unknown)";
    if (!form.narrative)       errors.narrative        = "Required";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      if (errors.incident_type) setFormTab(0);
      else if (errors.complainant_name || errors.respondent_name) setFormTab(1);
      else setFormTab(2);
      return false;
    }
    return true;
  };

  const openCreate = () => {
    setForm({ ...emptyForm });
    setFormErrors({});
    setFormTab(0);
    setShowCreate(true);
  };

  const openEdit = (b: BlotterRecord) => {
    setEditTarget(b);
    setForm({
      incident_type:       b.incident_type,
      incident_date:       b.incident_date ?? "",
      incident_time:       b.incident_time ?? "",
      incident_place:      b.incident_place ?? "",
      narrative:           b.narrative,
      resolution:          b.resolution ?? "",
      complainant_name:    b.complainant_name,
      complainant_address: b.complainant_address ?? "",
      complainant_mobile:  b.complainant_mobile ?? "",
      respondent_unknown:  b.respondent_name === "Unknown" ? "yes" : "",
      respondent_name:     b.respondent_name,
      respondent_address:  b.respondent_address ?? "",
      respondent_mobile:   b.respondent_mobile ?? "",
    });
    setFormErrors({});
    setFormTab(0);
    setShowEdit(true);
    setActionMenuOpen(null);
  };

  const closeFormModal = () => {
    setShowCreate(false);
    setShowEdit(false);
    setEditTarget(null);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        incident_type:       form.incident_type,
        incident_date:       form.incident_date || null,
        incident_time:       form.incident_time || null,
        incident_place:      form.incident_place || null,
        narrative:           form.narrative,
        resolution:          form.resolution || null,
        complainant_name:    form.complainant_name,
        complainant_address: form.complainant_address || null,
        complainant_mobile:  form.complainant_mobile || null,
        respondent_name:     form.respondent_unknown === "yes" ? "Unknown" : form.respondent_name,
        respondent_address:  form.respondent_unknown === "yes" ? null : (form.respondent_address || null),
        respondent_mobile:   form.respondent_unknown === "yes" ? null : (form.respondent_mobile || null),
      };

      if (showEdit && editTarget) {
        const res = await api.blotters.update(editTarget.id, payload);
        if (res.blotter) {
          addToast("Blotter record updated");
          closeFormModal();
          fetchBlotters();
          fetchStats();
        }
      } else {
        const res = await api.blotters.create(payload);
        if (res.blotter) {
          addToast("Blotter recorded");
          closeFormModal();
          fetchBlotters();
          fetchStats();
        }
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to save. Please try again.";
      addToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.blotters.destroy(deleteTarget.id);
      addToast("Record deleted");
      setShowDelete(false);
      setDeleteTarget(null);
      fetchBlotters();
      fetchStats();
    } catch {
      addToast("Failed to delete record", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!updateTarget || !newStatus) return;
    setUpdatingStatus(true);
    try {
      await api.blotters.update(updateTarget.id, { status: newStatus });
      addToast("Status updated");
      setShowUpdateStatus(false);
      setUpdateTarget(null);
      fetchBlotters();
      fetchStats();
    } catch {
      addToast("Failed to update status", "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formTabs = ["Incident", "Parties", "Details"];

  const renderFormTab = () => {
    switch (formTab) {
      case 0: return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormSelect label="Incident Type" value={form.incident_type} onChange={(v) => updateForm("incident_type", v)}
              options={INCIDENT_TYPES} required error={formErrors.incident_type} />
            <div className="grid grid-cols-2 gap-2">
              <FormInput label="Date" value={form.incident_date} onChange={(v) => updateForm("incident_date", v)} type="date" />
              <FormInput label="Time" value={form.incident_time} onChange={(v) => updateForm("incident_time", v)} type="time" />
            </div>
          </div>
          <FormInput label="Place of Incident" value={form.incident_place} onChange={(v) => updateForm("incident_place", v)}
            placeholder="e.g. Purok Sampaguita, Rizal St. near sari-sari store" />
        </div>
      );
      case 1: return (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Complainant</h4>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Full Name" value={form.complainant_name} onChange={(v) => updateForm("complainant_name", v)}
              required placeholder="e.g. Maria Dela Cruz" error={formErrors.complainant_name} />
            <FormInput label="Mobile Number" value={form.complainant_mobile} onChange={(v) => updateForm("complainant_mobile", v)}
              placeholder="e.g. 09171234567" />
          </div>
          <FormInput label="Address" value={form.complainant_address} onChange={(v) => updateForm("complainant_address", v)}
            placeholder="e.g. Purok Sampaguita, Rizal St." />
          <hr className="border-border" />
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">Respondent</h4>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.respondent_unknown === "yes"}
                onChange={(e) => {
                  if (e.target.checked) {
                    setForm((prev) => ({ ...prev, respondent_unknown: "yes", respondent_name: "Unknown", respondent_mobile: "", respondent_address: "" }));
                  } else {
                    setForm((prev) => ({ ...prev, respondent_unknown: "", respondent_name: "", respondent_mobile: "", respondent_address: "" }));
                  }
                }}
                className="w-4 h-4 rounded border-border" />
              <span className="text-sm text-muted-foreground">Unknown respondent</span>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Full Name" value={form.respondent_name} onChange={(v) => updateForm("respondent_name", v)}
              required placeholder="e.g. Juan Santos" disabled={form.respondent_unknown === "yes"}
              error={formErrors.respondent_name} />
            <FormInput label="Mobile Number" value={form.respondent_mobile} onChange={(v) => updateForm("respondent_mobile", v)}
              placeholder="e.g. 09181234567" disabled={form.respondent_unknown === "yes"} />
          </div>
          <FormInput label="Address" value={form.respondent_address} onChange={(v) => updateForm("respondent_address", v)}
            placeholder="e.g. Purok Rosal, Mabini St." disabled={form.respondent_unknown === "yes"} />
        </div>
      );
      case 2: return (
        <div className="space-y-4">
          <FormTextarea label="Incident Narrative" value={form.narrative} onChange={(v) => updateForm("narrative", v)}
            required rows={5} placeholder="Describe the incident in detail — what happened, when, where, who was involved, and how it was reported." />
          {formErrors.narrative && <p className="text-[11px] text-red-500 -mt-3">{formErrors.narrative}</p>}
          <FormTextarea label="Action Taken / Resolution" value={form.resolution} onChange={(v) => updateForm("resolution", v)}
            rows={3} placeholder="e.g. Parties summoned for hearing, referred to PNP, mediation conducted..." />
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blotter Records"
        description="Record and track barangay incident reports"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Judicial" }, { label: "Blotter Records" }]}
      />

      {/* Mabini AI Insight */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-accent-primary/20 bg-accent-bg/30">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--accent-primary)", opacity: 0.15 }}>
          <Bot className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Mabini AI — Blotter Analysis</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{mabiniInsight}</p>
        </div>
        <button onClick={() => router.push("/dashboard/ai")}
          className="shrink-0 px-3 py-1.5 text-[10px] font-semibold rounded-lg transition-colors hover:opacity-80"
          style={{ background: "var(--accent-primary)", color: "#fff" }}>
          Ask Mabini
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Records"   value={stats?.total      ?? "—"} icon={<Gavel className="h-5 w-5" />} />
        <StatCard label="Active / Open"   value={stats?.active     ?? "—"} icon={<AlertTriangle className="h-5 w-5" />} />
        <StatCard label="Settled / Closed" value={stats ? stats.settled + stats.closed : "—"} icon={<Shield className="h-5 w-5" />} />
        <StatCard label="This Month"      value={stats?.this_month ?? "—"} icon={<Calendar className="h-5 w-5" />} />
      </div>

      {/* Status Flow */}
      <div className="flex items-center gap-1.5">
        {STATUS_OPTIONS.map((s, i) => (
          <div key={s.value} className="contents">
            <button onClick={() => setStatusFilter(statusFilter === s.value ? "" : s.value)}
              className={cn("flex-1 flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border transition-all hover:shadow-sm",
                statusFilter === s.value ? "shadow-sm" : "border-border bg-card hover:bg-muted/50")}
              style={statusFilter === s.value ? { borderColor: s.color, background: `${s.color}15` } : {}}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
              <span className="text-[11px] font-semibold text-foreground">{s.label}</span>
              <span className="text-xs font-bold" style={{ color: s.color }}>
                {stats ? (s.value === "filed" ? stats.filed : s.value === "for_hearing" ? stats.for_hearing : s.value === "for_subpoena" ? stats.for_subpoena : s.value === "settled" ? stats.settled : stats.closed) : "—"}
              </span>
            </button>
            {i < STATUS_OPTIONS.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
          </div>
        ))}
        {statusFilter && (
          <button onClick={() => setStatusFilter("")}
            className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg border border-border hover:bg-muted text-muted-foreground transition-colors ml-1">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by blotter number, party names, or incident type..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent-ring" />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setShowFilters(!showFilters)}
              className={cn("flex items-center justify-center w-9 h-9 rounded-lg border transition-colors",
                showFilters ? "border-accent-primary bg-accent-bg text-accent-text" : "border-border hover:bg-muted text-muted-foreground")}>
              <Filter className="h-4 w-4" />
            </button>
            <button className="flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-muted text-muted-foreground transition-colors">
              <FileBarChart className="h-4 w-4" />
            </button>
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors"
              style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
              <Plus className="h-4 w-4" /> Record Blotter
            </button>
          </div>
        </div>
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg glass-subtle">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent-ring">
              <option value="">All Types</option>
              {INCIDENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent-ring">
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button onClick={() => { setTypeFilter(""); setStatusFilter(""); }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" /> Clear
            </button>
          </div>
        )}
      </div>

      {/* Blotter Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl glass animate-pulse" />)}</div>
        ) : blotters.length === 0 ? (
          <div className="p-16 text-center rounded-xl glass">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Shield className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">No blotter records found</p>
                <p className="text-xs text-muted-foreground mt-1">Record new incidents as they are reported to the barangay.</p>
              </div>
              <button onClick={openCreate}
                className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white hover:opacity-90"
                style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
                + Record Blotter
              </button>
            </div>
          </div>
        ) : (
          blotters.map((b) => (
            <div key={b.id} className="p-5 rounded-xl glass hover:shadow-md transition-all"
              style={{ borderLeftWidth: "4px", borderLeftColor: statusColor(b.status) }}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1 cursor-pointer" onClick={() => setViewBlotter(b)}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${statusColor(b.status)}15` }}>
                    <Gavel className="h-5 w-5" style={{ color: statusColor(b.status) }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-bold text-foreground">{b.blotter_number}</span>
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                        style={{ background: `${statusColor(b.status)}20`, color: statusColor(b.status) }}>
                        {statusLabel(b.status)}
                      </span>
                      <Badge variant="muted">{b.incident_type}</Badge>
                      {b.linked_kp_case_id && <Badge variant="info">KP Linked</Badge>}
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{b.narrative}</p>
                    <div className="flex items-center gap-4 mt-2 text-[12px] text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {b.complainant_name} vs. {b.respondent_name}
                      </span>
                      {b.incident_place && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {b.incident_place}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 shrink-0 ml-4">
                  <div className="text-right">
                    {b.incident_date && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end">
                        <Calendar className="h-3 w-3" />
                        {b.incident_date.includes("T") ? b.incident_date.split("T")[0] : b.incident_date}
                      </p>
                    )}
                    {b.incident_time && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        <Clock className="h-3 w-3 inline mr-1" />{b.incident_time}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">Filed: {b.filing_date?.split("T")[0] ?? b.filing_date}</p>
                  </div>
                  {/* Action Menu */}
                  <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setActionMenuOpen(actionMenuOpen === b.id ? null : b.id); }}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {actionMenuOpen === b.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setActionMenuOpen(null)} />
                        <div className="absolute right-0 top-8 z-50 w-48 py-1 rounded-lg bg-white dark:bg-slate-800 border border-border shadow-lg">
                          <button onClick={() => { setViewBlotter(b); setActionMenuOpen(null); }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                            <Eye className="h-4 w-4" /> View Details
                          </button>
                          <button onClick={() => openEdit(b)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                            <Edit className="h-4 w-4" /> Edit
                          </button>
                          <button onClick={() => { setUpdateTarget(b); setNewStatus(b.status); setShowUpdateStatus(true); setActionMenuOpen(null); }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                            <RefreshCw className="h-4 w-4" /> Update Status
                          </button>
                          <button onClick={() => { setActionMenuOpen(null); }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                            <Printer className="h-4 w-4" /> Print Report
                          </button>
                          <div className="border-t border-border my-1" />
                          <button onClick={() => { setDeleteTarget(b); setShowDelete(true); setActionMenuOpen(null); }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-muted transition-colors">
                            <Trash2 className="h-4 w-4" /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronsLeft className="h-4 w-4" /></button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
            <span className="px-3 py-1 text-sm">{page} / {lastPage}</span>
            <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page >= lastPage} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
            <button onClick={() => setPage(lastPage)} disabled={page >= lastPage} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronsRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {/* Record / Edit Blotter Form Modal */}
      <Modal open={showCreate || showEdit} onClose={closeFormModal}
        title={showEdit ? "Edit Blotter Record" : "Record Blotter"}
        description={showEdit ? "Update an existing incident report" : "File a new barangay incident report"}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div>
              {formTab > 0 && (
                <ModalButton variant="secondary" onClick={() => setFormTab((t) => t - 1)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </ModalButton>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ModalButton variant="secondary" onClick={closeFormModal}>Cancel</ModalButton>
              {formTab < formTabs.length - 1 ? (
                <ModalButton variant="primary" onClick={() => setFormTab((t) => t + 1)}>
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </ModalButton>
              ) : (
                <ModalButton variant="primary" onClick={handleSubmit} disabled={saving}>
                  <Save className="w-4 h-4 mr-1" /> {saving ? "Saving..." : showEdit ? "Update" : "Record Blotter"}
                </ModalButton>
              )}
            </div>
          </div>
        }>
        <div className="flex gap-1 mb-6">
          {formTabs.map((tab, i) => (
            <button key={tab} onClick={() => setFormTab(i)}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors",
                formTab === i ? "bg-accent-bg text-accent-text" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold mr-1.5"
                style={formTab === i ? { background: "var(--accent-primary)", color: "#fff" } : { background: "var(--muted)", color: "var(--muted-foreground)" }}>
                {i + 1}
              </span>
              {tab}
            </button>
          ))}
        </div>
        {renderFormTab()}
      </Modal>

      {/* View Blotter Modal */}
      <Modal open={!!viewBlotter} onClose={() => setViewBlotter(null)}
        title={viewBlotter?.blotter_number ?? ""}
        description={`${viewBlotter?.incident_type ?? ""} — ${viewBlotter?.incident_date?.split("T")[0] ?? viewBlotter?.filing_date ?? ""}`}
        size="lg"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setViewBlotter(null)}>Close</ModalButton>
            <ModalButton variant="primary" onClick={() => { const b = viewBlotter; setViewBlotter(null); if (b) openEdit(b); }}>
              Edit Record
            </ModalButton>
          </>
        }>
        {viewBlotter && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full"
                style={{ background: `${statusColor(viewBlotter.status)}20`, color: statusColor(viewBlotter.status) }}>
                {statusLabel(viewBlotter.status)}
              </span>
              <Badge variant="muted">{viewBlotter.incident_type}</Badge>
              {viewBlotter.linked_kp_case_id && <Badge variant="info">Linked to KP Case</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg glass-subtle">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Complainant</p>
                <p className="text-sm text-foreground font-medium">{viewBlotter.complainant_name}</p>
                {viewBlotter.complainant_mobile && <p className="text-xs text-muted-foreground mt-1">{viewBlotter.complainant_mobile}</p>}
                {viewBlotter.complainant_address && <p className="text-xs text-muted-foreground">{viewBlotter.complainant_address}</p>}
              </div>
              <div className="p-4 rounded-lg glass-subtle">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Respondent</p>
                <p className="text-sm text-foreground font-medium">{viewBlotter.respondent_name}</p>
                {viewBlotter.respondent_mobile && <p className="text-xs text-muted-foreground mt-1">{viewBlotter.respondent_mobile}</p>}
                {viewBlotter.respondent_address && <p className="text-xs text-muted-foreground">{viewBlotter.respondent_address}</p>}
              </div>
            </div>
            <div className="p-4 rounded-lg glass-subtle">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Incident Narrative</p>
              <p className="text-sm text-foreground leading-relaxed">{viewBlotter.narrative}</p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div><p className="text-[11px] text-muted-foreground uppercase mb-0.5">Filing Date</p><p>{viewBlotter.filing_date?.split("T")[0] ?? viewBlotter.filing_date}</p></div>
              {viewBlotter.incident_date && <div><p className="text-[11px] text-muted-foreground uppercase mb-0.5">Incident Date</p><p>{viewBlotter.incident_date.split("T")[0]} {viewBlotter.incident_time ? `at ${viewBlotter.incident_time}` : ""}</p></div>}
              {viewBlotter.incident_place && <div className="col-span-2"><p className="text-[11px] text-muted-foreground uppercase mb-0.5">Location</p><p>{viewBlotter.incident_place}</p></div>}
            </div>
            {viewBlotter.resolution && (
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
                <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
                  <FileText className="h-3 w-3 inline mr-1" /> Action Taken / Resolution
                </p>
                <p className="text-sm text-emerald-800 dark:text-emerald-300">{viewBlotter.resolution}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal open={showDelete} onClose={() => { setShowDelete(false); setDeleteTarget(null); }}
        title="Delete Blotter Record" size="sm"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { setShowDelete(false); setDeleteTarget(null); }}>Cancel</ModalButton>
            <ModalButton variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Record"}
            </ModalButton>
          </>
        }>
        {deleteTarget && (
          <div className="space-y-3">
            <p className="text-sm text-foreground">Are you sure you want to delete <span className="font-bold">{deleteTarget.blotter_number}</span>?</p>
            <p className="text-sm text-muted-foreground">
              {deleteTarget.incident_type} — {deleteTarget.complainant_name} vs. {deleteTarget.respondent_name}. This cannot be undone.
            </p>
          </div>
        )}
      </Modal>

      {/* Update Status Modal */}
      <Modal open={showUpdateStatus} onClose={() => { setShowUpdateStatus(false); setUpdateTarget(null); }}
        title="Update Status" description={updateTarget?.blotter_number ?? ""} size="sm"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { setShowUpdateStatus(false); setUpdateTarget(null); }}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={handleUpdateStatus} disabled={updatingStatus}>
              <Save className="w-4 h-4 mr-1" /> {updatingStatus ? "Saving..." : "Update Status"}
            </ModalButton>
          </>
        }>
        {updateTarget && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Current Status</p>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full"
                style={{ background: `${statusColor(updateTarget.status)}20`, color: statusColor(updateTarget.status) }}>
                {statusLabel(updateTarget.status)}
              </span>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                New Status<span className="text-red-500 ml-0.5">*</span>
              </label>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent-ring">
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="flex items-center gap-2 px-4 py-3 rounded-lg glass shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-200">
            {t.type === "error"
              ? <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              : <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
            <span className="text-sm font-medium text-foreground">{t.message}</span>
            <button onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="ml-2 text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>

      <MabiniButton pageContext="You are on the Blotter Records page. This page manages barangay blotter reports, complaints, and incident records. Status flow: filed → for_hearing → for_subpoena → settled → closed." />
    </div>
  );
}
