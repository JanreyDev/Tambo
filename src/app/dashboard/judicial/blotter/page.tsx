"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  AlertTriangle,
  MapPin,
  Users,
  Shield,
  CheckCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { MabiniButton } from "@/components/ui/mabini-button";
import { api } from "@/lib/api";
import type { BlotterRecord } from "@/lib/types";

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
function FormInput({ label, value, onChange, required, type = "text", placeholder = "", disabled = false, error, maxLength }: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; type?: string; placeholder?: string; disabled?: boolean; error?: string; maxLength?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} disabled={disabled} maxLength={maxLength}
        className={cn("w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2",
          error ? "border-red-500 focus:ring-red-300" : "focus:ring-accent-ring",
          disabled && "opacity-50 cursor-not-allowed")} />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormCombobox({ label, value, onChange, options, required, error, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; required?: boolean; error?: string; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dropUp, setDropUp] = useState(false);
  const filtered = query ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase())) : options;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = () => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setDropUp(window.innerHeight - rect.bottom < 220);
    }
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-xs font-medium text-muted-foreground mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {open ? (
        <div className={cn("w-full flex items-center gap-2 px-3 py-2 text-sm rounded-xl border bg-background focus-within:ring-2", error ? "border-red-500 focus-within:ring-red-300" : "border-accent-primary focus-within:ring-accent-ring")}>
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${label.toLowerCase()}...`}
            className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground text-sm" />
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
        </div>
      ) : (
        <button type="button" onClick={handleOpen}
          className={cn("w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl border bg-background text-left hover:bg-muted/50 transition-colors",
            error ? "border-red-500" : "border-border",
            value ? "text-foreground" : "text-muted-foreground")}>
          <span>{value || (placeholder ?? `Select ${label}`)}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 rotate-90" />
        </button>
      )}
      {open && (
        <div className={cn("absolute left-0 right-0 z-[9999] bg-white dark:bg-slate-800 border border-border rounded-xl shadow-xl overflow-hidden", dropUp ? "bottom-full mb-1" : "top-full mt-1")}>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length > 0 ? filtered.map((o) => (
              <button key={o} type="button" onClick={() => { onChange(o); setOpen(false); setQuery(""); }}
                className={cn("w-full text-left px-3 py-2 text-sm hover:bg-orange-50 dark:hover:bg-slate-700 hover:text-orange-700 dark:hover:text-orange-300 transition-colors",
                  o === value ? "bg-orange-50 dark:bg-slate-700 text-orange-700 dark:text-orange-300 font-medium" : "text-slate-800 dark:text-slate-100")}>
                {o}
              </button>
            )) : (
              <p className="px-3 py-4 text-xs text-center text-muted-foreground">No matches for &ldquo;{query}&rdquo;</p>
            )}
          </div>
        </div>
      )}
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
  // Data
  const [blotters, setBlotters]   = useState<BlotterRecord[]>([]);
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

  useEffect(() => { fetchBlotters(); }, [fetchBlotters]);

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
    if (form.complainant_mobile && form.complainant_mobile.length !== 11)
      errors.complainant_mobile = "Must be exactly 11 digits";
    if (!form.respondent_name && form.respondent_unknown !== "yes") errors.respondent_name = "Required (or check Unknown)";
    if (form.respondent_mobile && form.respondent_mobile.length !== 11 && form.respondent_unknown !== "yes")
      errors.respondent_mobile = "Must be exactly 11 digits";
    if (!form.narrative)       errors.narrative        = "Required";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      if (errors.incident_type) setFormTab(0);
      else if (errors.complainant_name || errors.complainant_mobile || errors.respondent_name || errors.respondent_mobile) setFormTab(1);
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
        }
      } else {
        const res = await api.blotters.create(payload);
        if (res.blotter) {
          addToast("Blotter recorded");
          closeFormModal();
          fetchBlotters();
        }
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to save. Please try again.";
      addToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const formTabs = ["Incident", "Parties", "Details"];

  const renderFormTab = () => {
    switch (formTab) {
      case 0: return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormCombobox label="Incident Type" value={form.incident_type} onChange={(v) => updateForm("incident_type", v)}
              options={INCIDENT_TYPES} required error={formErrors.incident_type} placeholder="Select incident type" />
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
              placeholder="e.g. 09171234567" maxLength={11} error={formErrors.complainant_mobile} />
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
              placeholder="e.g. 09181234567" disabled={form.respondent_unknown === "yes"} maxLength={11} error={formErrors.respondent_mobile} />
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

      {/* Search & Filters */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by blotter number, name, or incident type..."
              className="w-full pl-9 pr-9 py-2 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent-ring" />
            {search && (
              <button onClick={() => { setSearch(""); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={cn("flex items-center gap-1.5 px-3 h-9 text-sm rounded-lg border transition-colors",
              showFilters || typeFilter || statusFilter
                ? "border-accent-primary bg-accent-bg text-accent-text"
                : "border-border hover:bg-muted text-muted-foreground")}>
            <Filter className="h-4 w-4" />
            {(typeFilter || statusFilter) && (
              <span className="w-4 h-4 rounded-full bg-accent-primary text-white text-[10px] font-bold flex items-center justify-center">
                {[typeFilter, statusFilter].filter(Boolean).length}
              </span>
            )}
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors shrink-0"
            style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
            <Plus className="h-4 w-4" /> Record Blotter
          </button>
        </div>
        {showFilters && (
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {/* Status */}
            <div className="flex items-start gap-4 px-4 py-3">
              <span className="text-[11px] font-semibold text-muted-foreground w-16 shrink-0 pt-1">Status</span>
              <div className="flex flex-wrap gap-1.5 flex-1">
                {[{ value: "", label: "All" }, ...STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label, color: s.color }))].map((s) => (
                  <button key={s.value} onClick={() => setStatusFilter(s.value)}
                    className={cn("px-3 py-1 text-xs font-medium rounded-lg border transition-colors",
                      statusFilter === s.value
                        ? "border-accent-primary bg-accent-bg text-accent-text"
                        : "border-border text-muted-foreground hover:bg-muted hover:text-foreground")}>
                    {"color" in s && s.color && s.value && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{ background: s.color }} />
                    )}
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Incident Type */}
            <div className="flex items-start gap-4 px-4 py-3">
              <span className="text-[11px] font-semibold text-muted-foreground w-16 shrink-0 pt-1">Type</span>
              <div className="flex flex-wrap gap-1.5 flex-1">
                {[{ value: "", label: "All" }, ...INCIDENT_TYPES.map((t) => ({ value: t, label: t }))].map((t) => (
                  <button key={t.value} onClick={() => setTypeFilter(t.value)}
                    className={cn("px-3 py-1 text-xs font-medium rounded-lg border transition-colors",
                      typeFilter === t.value
                        ? "border-accent-primary bg-accent-bg text-accent-text"
                        : "border-border text-muted-foreground hover:bg-muted hover:text-foreground")}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            {(typeFilter || statusFilter) && (
              <div className="flex justify-end px-4 py-2">
                <button onClick={() => { setTypeFilter(""); setStatusFilter(""); }}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900/40 transition-colors">
                  <X className="h-3 w-3" /> Clear filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Blotter List */}
      <div className="space-y-2">
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl glass animate-pulse" />)}</div>
        ) : blotters.length === 0 ? (
          <div className="py-16 text-center rounded-xl border border-border bg-card">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Shield className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">No blotter records found</p>
                <p className="text-xs text-muted-foreground mt-0.5">Incidents reported to the barangay will appear here.</p>
              </div>
              <button onClick={openCreate} className="px-4 py-1.5 text-xs font-semibold rounded-lg text-white"
                style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
                + Record Blotter
              </button>
            </div>
          </div>
        ) : (
          blotters.map((b) => (
            <div key={b.id}
              className="flex items-center gap-4 px-5 py-4 rounded-xl border border-border bg-card hover:border-accent-primary/40 hover:bg-muted/20 transition-all cursor-pointer"
              onClick={() => setViewBlotter(b)}>

              {/* Status indicator */}
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: statusColor(b.status) }} />

              {/* Left: number + type */}
              <div className="w-48 shrink-0">
                <p className="text-xs font-bold font-mono text-foreground">{b.blotter_number}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-muted text-muted-foreground">{b.incident_type}</span>
                </div>
              </div>

              {/* Center: narrative + parties */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground line-clamp-1 font-medium">{b.narrative}</p>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 min-w-0">
                    <Users className="h-3 w-3 shrink-0" />
                    <span className="truncate">{b.complainant_name} vs. {b.respondent_name}</span>
                  </span>
                  {b.incident_place && (
                    <span className="flex items-center gap-1 min-w-0 hidden md:flex">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{b.incident_place}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Right: date */}
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">
                  {b.incident_date ? (b.incident_date.includes("T") ? b.incident_date.split("T")[0] : b.incident_date) : b.filing_date?.split("T")[0]}
                </p>
                {b.incident_time && <p className="text-[10px] text-muted-foreground mt-0.5">{b.incident_time}</p>}
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
        size="lg" disableOutsideClick
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
                  {saving ? "Saving..." : showEdit ? "Update Record" : "Record Blotter"}
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
        description={`${viewBlotter?.incident_type ?? ""} · ${statusLabel(viewBlotter?.status ?? "")}`}
        size="lg"
        disableOutsideClick
        footer={
          <div className="flex items-center justify-between w-full">
            <ModalButton variant="secondary" onClick={() => setViewBlotter(null)}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={() => { const b = viewBlotter; setViewBlotter(null); if (b) openEdit(b); }}>Edit</ModalButton>
          </div>
        }>
        {viewBlotter && (
          <div className="space-y-4">
            {/* Parties */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl border border-border bg-muted/30">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Complainant</p>
                <p className="text-sm font-semibold text-foreground">{viewBlotter.complainant_name}</p>
                {viewBlotter.complainant_mobile && <p className="text-xs text-muted-foreground mt-1">{viewBlotter.complainant_mobile}</p>}
                {viewBlotter.complainant_address && <p className="text-xs text-muted-foreground">{viewBlotter.complainant_address}</p>}
              </div>
              <div className="p-4 rounded-xl border border-border bg-muted/30">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Respondent</p>
                <p className="text-sm font-semibold text-foreground">{viewBlotter.respondent_name}</p>
                {viewBlotter.respondent_mobile && <p className="text-xs text-muted-foreground mt-1">{viewBlotter.respondent_mobile}</p>}
                {viewBlotter.respondent_address && <p className="text-xs text-muted-foreground">{viewBlotter.respondent_address}</p>}
              </div>
            </div>
            {/* Narrative */}
            <div className="p-4 rounded-xl border border-border bg-muted/30">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Incident Narrative</p>
              <p className="text-sm text-foreground leading-relaxed">{viewBlotter.narrative}</p>
            </div>
            {/* Meta */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Filing Date</p>
                <p className="text-sm text-foreground">{viewBlotter.filing_date?.split("T")[0] ?? viewBlotter.filing_date}</p>
              </div>
              {viewBlotter.incident_date && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Incident Date</p>
                  <p className="text-sm text-foreground">{viewBlotter.incident_date.split("T")[0]}{viewBlotter.incident_time ? ` at ${viewBlotter.incident_time}` : ""}</p>
                </div>
              )}
              {viewBlotter.incident_place && (
                <div className="col-span-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Location</p>
                  <p className="text-sm text-foreground">{viewBlotter.incident_place}</p>
                </div>
              )}
            </div>
            {/* Resolution */}
            {viewBlotter.resolution && (
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20">
                <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-2">Action Taken / Resolution</p>
                <p className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">{viewBlotter.resolution}</p>
              </div>
            )}
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
