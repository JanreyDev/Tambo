"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ShieldAlert,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Lock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Clock,
  Scale,
  Download,
  Shield,
  Printer,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { MabiniButton } from "@/components/ui/mabini-button";

// ── Types ──────────────────────────────────────────────────────────────────
interface VawcCase {
  id: string;
  case_number: string;
  incident_type: string;
  filing_date: string;
  incident_date: string | null;
  incident_time: string | null;
  incident_place: string | null;
  narrative_encrypted: string | null;
  victim_name_encrypted: string;
  victim_dob: string | null;
  victim_address_encrypted: string | null;
  victim_phone_encrypted: string | null;
  victim_occupation: string | null;
  victim_income_range: string | null;
  victim_civil_status: string | null;
  victim_resident_id: string | null;
  respondent_name_encrypted: string;
  respondent_dob: string | null;
  respondent_address_encrypted: string | null;
  respondent_phone_encrypted: string | null;
  respondent_occupation: string | null;
  respondent_civil_status: string | null;
  respondent_relationship: string;
  children_info_encrypted: string | null;
  bpo_issued: boolean;
  bpo_issued_date: string | null;
  bpo_expiry_date: string | null;
  tpo_referred: boolean;
  tpo_date: string | null;
  ppo_referred: boolean;
  ppo_date: string | null;
  referred_to_pnp: boolean;
  pnp_referral_time: string | null;
  referred_to_dswd: boolean;
  dswd_referral_time: string | null;
  other_referrals: string[] | null;
  status: string;
  vaw_desk_officer_id: string | null;
  logbook_type: string | null;
  logbook_page_number: number | null;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse {
  data: VawcCase[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

// ── Constants ──────────────────────────────────────────────────────────────
const INCIDENT_TYPES = [
  "Physical Violence",
  "Sexual Violence",
  "Psychological Violence",
  "Economic Abuse",
];

const RELATIONSHIPS = [
  "Spouse",
  "Former Spouse",
  "Live-in Partner",
  "Former Live-in Partner",
  "Boyfriend",
  "Former Boyfriend",
  "Parent",
  "Sibling",
  "Other Relative",
  "Others",
];

const CIVIL_STATUSES = ["Single", "Married", "Live-in", "Separated", "Widowed", "Annulled"];

const INCOME_RANGES = [
  "Below ₱10,000",
  "₱10,000 – ₱20,000",
  "₱20,000 – ₱40,000",
  "Above ₱40,000",
  "No income",
];

const CASE_STATUSES = [
  { value: "under_investigation", label: "Under Investigation" },
  { value: "protection_order", label: "Protection Order Issued" },
  { value: "referred", label: "Referred" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

const LOGBOOK_TYPES = [
  { value: "ra9262", label: "RA 9262" },
  { value: "other_vaw", label: "Other VAW" },
];

const STATUS_COLORS: Record<string, string> = {
  under_investigation: "#f59e0b",
  protection_order: "#ef4444",
  referred: "#8b5cf6",
  resolved: "#22c55e",
  dismissed: "#64748b",
};

const STATUS_LABELS: Record<string, string> = {
  under_investigation: "Under Investigation",
  protection_order: "Protection Order",
  referred: "Referred",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

type FormState = {
  // Incident
  incident_type: string;
  filing_date: string;
  incident_date: string;
  incident_time: string;
  incident_place: string;
  narrative_encrypted: string;
  status: string;
  logbook_type: string;
  logbook_page_number: string;
  // Victim
  victim_name_encrypted: string;
  victim_dob: string;
  victim_address_encrypted: string;
  victim_phone_encrypted: string;
  victim_occupation: string;
  victim_income_range: string;
  victim_civil_status: string;
  // Respondent
  respondent_name_encrypted: string;
  respondent_dob: string;
  respondent_address_encrypted: string;
  respondent_phone_encrypted: string;
  respondent_occupation: string;
  respondent_civil_status: string;
  respondent_relationship: string;
  children_info_encrypted: string;
  // Protection Orders
  bpo_issued: boolean;
  bpo_issued_date: string;
  bpo_expiry_date: string;
  tpo_referred: boolean;
  tpo_date: string;
  ppo_referred: boolean;
  ppo_date: string;
  // Referrals
  referred_to_pnp: boolean;
  pnp_referral_time: string;
  referred_to_dswd: boolean;
  dswd_referral_time: string;
};

const EMPTY_FORM: FormState = {
  incident_type: "",
  filing_date: new Date().toISOString().slice(0, 10),
  incident_date: "",
  incident_time: "",
  incident_place: "",
  narrative_encrypted: "",
  status: "under_investigation",
  logbook_type: "",
  logbook_page_number: "",
  victim_name_encrypted: "",
  victim_dob: "",
  victim_address_encrypted: "",
  victim_phone_encrypted: "",
  victim_occupation: "",
  victim_income_range: "",
  victim_civil_status: "",
  respondent_name_encrypted: "",
  respondent_dob: "",
  respondent_address_encrypted: "",
  respondent_phone_encrypted: "",
  respondent_occupation: "",
  respondent_civil_status: "",
  respondent_relationship: "",
  children_info_encrypted: "",
  bpo_issued: false,
  bpo_issued_date: "",
  bpo_expiry_date: "",
  tpo_referred: false,
  tpo_date: "",
  ppo_referred: false,
  ppo_date: "",
  referred_to_pnp: false,
  pnp_referral_time: "",
  referred_to_dswd: false,
  dswd_referral_time: "",
};

// ── Library Section Component ─────────────────────────────────────────────
function LibrarySection({ id, title, children, accent = "red" }: {
  id: string; title: string; children: React.ReactNode; accent?: "red" | "violet";
}) {
  const [open, setOpen] = useState(false);
  return (
    <div key={id} className="border-b border-border/60 last:border-0">
      <button onClick={() => setOpen(!open)} className={cn("w-full flex items-center justify-between px-2 py-3 text-sm font-semibold text-foreground transition-colors text-left",
        accent === "red" ? "hover:text-red-600 dark:hover:text-red-400" : "hover:text-violet-600 dark:hover:text-violet-400")}>
        {title}
        <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", open && "rotate-90")} />
      </button>
      {open && <div className="px-2 pb-4">{children}</div>}
    </div>
  );
}

// ── Form Field Components (module-level) ─────────────────────────────────
function FormInput({
  label, value, onChange, required, type = "text", placeholder = "", error, hint, readOnly, maxLength, digitsOnly,
}: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; type?: string; placeholder?: string;
  error?: string; hint?: string; readOnly?: boolean;
  maxLength?: number; digitsOnly?: boolean;
}) {
  const handleChange = (raw: string) => {
    const v = digitsOnly ? raw.replace(/\D/g, "") : raw;
    onChange(maxLength ? v.slice(0, maxLength) : v);
  };
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type} value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        maxLength={maxLength}
        inputMode={digitsOnly ? "numeric" : undefined}
        className={cn(
          "w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring",
          error && "border-red-500",
          readOnly && "opacity-60 cursor-default"
        )}
      />
      {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormCombobox({
  label, value, onChange, options, required, error, hint, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[] | string[];
  required?: boolean; error?: string; hint?: string; placeholder?: string;
}) {
  const normalized = options.map((o) => typeof o === "string" ? { value: o, label: o } : o);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropUp, setDropUp] = useState(false);
  const selected = normalized.find((o) => o.value === value);
  const filtered = query ? normalized.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())) : normalized;

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
      setDropUp(window.innerHeight - rect.bottom < 240);
    }
    setQuery("");
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {open ? (
        <div
          className={cn(
            "relative w-full overflow-hidden border bg-background text-sm focus-within:ring-2",
            error ? "border-red-500 focus-within:ring-red-300" : "border-accent-primary focus-within:ring-accent-ring",
            filtered.length > 0 ? (dropUp ? "rounded-b-xl rounded-t-none border-t-transparent" : "rounded-t-xl rounded-b-none border-b-transparent") : "rounded-xl"
          )}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search...`}
            style={{ outline: "none", boxShadow: "none", WebkitAppearance: "none", appearance: "none" }}
            className="block w-full border-0 bg-transparent py-2 pr-9 pl-8 text-sm text-foreground shadow-none outline-none ring-0 placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0" />
          <button onClick={() => setOpen(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
        </div>
      ) : (
        <button type="button" onClick={handleOpen}
          className={cn("w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl border glass-input text-left hover:opacity-90 transition-opacity",
            error ? "border-red-500" : "border-border",
            selected ? "text-foreground" : "text-muted-foreground")}>
          <span>{selected ? selected.label : (placeholder ?? "Select...")}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 rotate-90" />
        </button>
      )}
      {open && (
        <div
          className={cn(
            "absolute left-0 right-0 z-[9999] overflow-hidden border border-border bg-white shadow-xl dark:bg-slate-800",
            dropUp ? "bottom-full -mb-px rounded-t-xl rounded-b-none border-b-0" : "top-full -mt-px rounded-b-xl rounded-t-none border-t-0"
          )}
        >
          <div className="max-h-52 overflow-y-auto">
            {filtered.length > 0 ? filtered.map((o) => (
              <button key={o.value} type="button"
                onClick={() => { onChange(o.value); setOpen(false); setQuery(""); }}
                className={cn("w-full text-left px-3 py-2 text-sm hover:bg-orange-50 dark:hover:bg-slate-700 hover:text-orange-700 dark:hover:text-orange-300 transition-colors",
                  o.value === value ? "bg-orange-50 dark:bg-slate-700 text-orange-700 dark:text-orange-300 font-medium" : "text-slate-800 dark:text-slate-100")}>
                {o.label}
              </button>
            )) : (
              <p className="px-3 py-4 text-xs text-center text-muted-foreground">No matches for &ldquo;{query}&rdquo;</p>
            )}
          </div>
        </div>
      )}
      {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormTextarea({
  label, value, onChange, required, rows = 3, placeholder = "", colSpan2 = false, hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; rows?: number; placeholder?: string; colSpan2?: boolean; hint?: string;
}) {
  return (
    <div className={colSpan2 ? "col-span-2" : undefined}>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <textarea
        value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none"
      />
      {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

function Toggle({
  label, checked, onChange, hint,
}: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "mt-0.5 relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
          checked ? "bg-accent-primary" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function VawcPage() {
  const [cases, setCases] = useState<VawcCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const PER_PAGE = 25;

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Library
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryTab, setLibraryTab] = useState<"pcw" | "ra9262">("pcw");

  // Modals
  const [viewCase, setViewCase] = useState<VawcCase | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<VawcCase | null>(null);
  const [formTab, setFormTab] = useState(0);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [generatingDoc, setGeneratingDoc] = useState<string | null>(null);

  // Toast
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "error" }[]>([]);
  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  // ── Fetch ──
  const fetchCases = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), per_page: String(PER_PAGE), sort_by: "filing_date", sort_dir: "desc" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("incident_type", typeFilter);

      const res = await api.get<PaginatedResponse>(`/vawc-cases?${params}`);
      setCases(res.data ?? []);
      setTotalPages(res.last_page ?? 1);
      setTotal(res.total ?? 0);
    } catch {
      showToast("Failed to load VAWC records", "error");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter, showToast]);

  useEffect(() => {
    fetchCases(page);
  }, [page, statusFilter, typeFilter, fetchCases]);

  // Debounce search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      fetchCases(1);
    }, 400);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Form helpers ──
  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Auto-calculate BPO expiry (15 days from issuance)
      if (key === "bpo_issued_date" && typeof value === "string" && value) {
        const d = new Date(value);
        d.setDate(d.getDate() + 15);
        next.bpo_expiry_date = d.toISOString().slice(0, 10);
      }
      return next;
    });
    setFormErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const formFromCase = (c: VawcCase): FormState => ({
    incident_type: c.incident_type,
    filing_date: c.filing_date ? c.filing_date.slice(0, 10) : "",
    incident_date: c.incident_date ? c.incident_date.slice(0, 10) : "",
    incident_time: c.incident_time ?? "",
    incident_place: c.incident_place ?? "",
    narrative_encrypted: c.narrative_encrypted ?? "",
    status: c.status,
    logbook_type: c.logbook_type ?? "",
    logbook_page_number: c.logbook_page_number != null ? String(c.logbook_page_number) : "",
    victim_name_encrypted: c.victim_name_encrypted,
    victim_dob: c.victim_dob ? c.victim_dob.slice(0, 10) : "",
    victim_address_encrypted: c.victim_address_encrypted ?? "",
    victim_phone_encrypted: c.victim_phone_encrypted ?? "",
    victim_occupation: c.victim_occupation ?? "",
    victim_income_range: c.victim_income_range ?? "",
    victim_civil_status: c.victim_civil_status ?? "",
    respondent_name_encrypted: c.respondent_name_encrypted,
    respondent_dob: c.respondent_dob ? c.respondent_dob.slice(0, 10) : "",
    respondent_address_encrypted: c.respondent_address_encrypted ?? "",
    respondent_phone_encrypted: c.respondent_phone_encrypted ?? "",
    respondent_occupation: c.respondent_occupation ?? "",
    respondent_civil_status: c.respondent_civil_status ?? "",
    respondent_relationship: c.respondent_relationship,
    children_info_encrypted: c.children_info_encrypted ?? "",
    bpo_issued: c.bpo_issued,
    bpo_issued_date: c.bpo_issued_date ? c.bpo_issued_date.slice(0, 10) : "",
    bpo_expiry_date: c.bpo_expiry_date ? c.bpo_expiry_date.slice(0, 10) : "",
    tpo_referred: c.tpo_referred,
    tpo_date: c.tpo_date ? c.tpo_date.slice(0, 10) : "",
    ppo_referred: c.ppo_referred,
    ppo_date: c.ppo_date ? c.ppo_date.slice(0, 10) : "",
    referred_to_pnp: c.referred_to_pnp,
    pnp_referral_time: c.pnp_referral_time ?? "",
    referred_to_dswd: c.referred_to_dswd,
    dswd_referral_time: c.dswd_referral_time ?? "",
  });

  // Fetch full case (show endpoint) — index omits encrypted fields per RA 9262
  const openView = async (c: VawcCase) => {
    setViewLoading(true);
    try {
      const data = await api.get<{ vawc_case: VawcCase }>(`/vawc-cases/${c.id}`);
      setViewCase((data as { vawc_case: VawcCase }).vawc_case);
    } catch {
      showToast("Failed to load case details", "error");
    } finally {
      setViewLoading(false);
    }
  };

  // Generate Annex A — VAW DocS Intake Form via backend (creates IssuedDocument + PDF)
  const printIntakeForm = async (c: VawcCase) => {
    if (generatingDoc) return;
    setGeneratingDoc("intake_form");
    try {
      const res = await api.post<{ document: { id: string; pdf_url?: string } }>(`/vawc-cases/${c.id}/generate-document`, { document_type: "intake_form" });
      const doc = (res as { document: { id: string; pdf_url?: string } }).document;
      showToast("Intake Form saved to Documents module");
      window.open(`/api/v1/issued-documents/${doc.id}/pdf`, "_blank");
    } catch {
      showToast("Failed to generate Intake Form", "error");
    } finally {
      setGeneratingDoc(null);
    }
  };

  // Generate Annex D — BPO Application Form via backend (creates IssuedDocument + PDF)
  const printBPOForm = async (c: VawcCase) => {
    if (generatingDoc) return;
    setGeneratingDoc("bpo_application");
    try {
      const res = await api.post<{ document: { id: string; pdf_url?: string } }>(`/vawc-cases/${c.id}/generate-document`, { document_type: "bpo_application" });
      const doc = (res as { document: { id: string; pdf_url?: string } }).document;
      showToast("BPO Application saved to Documents module");
      window.open(`/api/v1/issued-documents/${doc.id}/pdf`, "_blank");
    } catch {
      showToast("Failed to generate BPO Application", "error");
    } finally {
      setGeneratingDoc(null);
    }
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM });
    setFormErrors({});
    setFormTab(0);
    setShowForm(true);
  };

  const openEdit = (c: VawcCase) => {
    setEditTarget(c);
    setForm(formFromCase(c));
    setFormErrors({});
    setFormTab(0);
    setViewCase(null);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditTarget(null); };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.incident_type) errors.incident_type = "Required";
    if (!form.incident_date) errors.incident_date = "Required";
    if (!form.victim_name_encrypted.trim()) errors.victim_name_encrypted = "Required";
    if (!form.respondent_name_encrypted.trim()) errors.respondent_name_encrypted = "Required";
    if (!form.respondent_relationship) errors.respondent_relationship = "Required";
    if (form.victim_phone_encrypted && form.victim_phone_encrypted.replace(/\D/g, "").length > 0) {
      const digits = form.victim_phone_encrypted.replace(/\D/g, "");
      if (digits.length !== 11) errors.victim_phone_encrypted = "Must be exactly 11 digits";
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      const tabFieldMap: Record<number, string[]> = {
        0: ["incident_type", "incident_date"],
        1: ["victim_name_encrypted", "victim_phone_encrypted"],
        2: ["respondent_name_encrypted", "respondent_relationship"],
        3: [],
      };
      for (let t = 0; t < 4; t++) {
        if (tabFieldMap[t].some((f) => errors[f])) { setFormTab(t); break; }
      }
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (submitting || !validateForm()) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        incident_type: form.incident_type,
        filing_date: form.filing_date,
        incident_date: form.incident_date,
        incident_time: form.incident_time || null,
        incident_place: form.incident_place || null,
        narrative_encrypted: form.narrative_encrypted || null,
        status: form.status,
        victim_name_encrypted: form.victim_name_encrypted,
        victim_dob: form.victim_dob || null,
        victim_address_encrypted: form.victim_address_encrypted || null,
        victim_phone_encrypted: form.victim_phone_encrypted || null,
        victim_occupation: form.victim_occupation || null,
        victim_income_range: form.victim_income_range || null,
        victim_civil_status: form.victim_civil_status || null,
        respondent_name_encrypted: form.respondent_name_encrypted,
        respondent_dob: form.respondent_dob || null,
        respondent_address_encrypted: form.respondent_address_encrypted || null,
        respondent_phone_encrypted: form.respondent_phone_encrypted || null,
        respondent_occupation: form.respondent_occupation || null,
        respondent_civil_status: form.respondent_civil_status || null,
        respondent_relationship: form.respondent_relationship,
        children_info_encrypted: form.children_info_encrypted || null,
        bpo_issued: form.bpo_issued,
        bpo_issued_date: form.bpo_issued_date || null,
        bpo_expiry_date: form.bpo_expiry_date || null,
        tpo_referred: form.tpo_referred,
        tpo_date: form.tpo_date || null,
        ppo_referred: form.ppo_referred,
        ppo_date: form.ppo_date || null,
        referred_to_pnp: form.referred_to_pnp,
        pnp_referral_time: form.pnp_referral_time || null,
        referred_to_dswd: form.referred_to_dswd,
        dswd_referral_time: form.dswd_referral_time || null,
        logbook_type: form.logbook_type || null,
        logbook_page_number: form.logbook_page_number ? parseInt(form.logbook_page_number) : null,
      };

      if (editTarget) {
        await api.put(`/vawc-cases/${editTarget.id}`, payload);
        showToast("VAWC case updated");
      } else {
        await api.post("/vawc-cases", payload);
        showToast("VAWC case recorded");
      }
      closeForm();
      fetchCases(page);
    } catch {
      showToast("Failed to save case", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const activeFilters = [statusFilter, typeFilter].filter(Boolean).length;

  // ── Form Tabs ──
  const FORM_TABS = ["Incident", "Victim", "Respondent", "Protection & Referral"];

  const renderFormTab = () => {
    switch (formTab) {
      case 0: return (
        <div className="grid grid-cols-2 gap-4">
          <FormCombobox
            label="Type of Violence" value={form.incident_type}
            onChange={(v) => updateForm("incident_type", v)}
            options={INCIDENT_TYPES} required error={formErrors.incident_type}
            hint="RA 9262: Physical, Sexual, Psychological, Economic"
          />
          <FormInput
            label="Date of Incident" value={form.incident_date}
            onChange={(v) => updateForm("incident_date", v)}
            type="date" required error={formErrors.incident_date}
          />
          <FormInput
            label="Filing Date" value={form.filing_date}
            onChange={(v) => updateForm("filing_date", v)}
            type="date" required
          />
          <FormInput
            label="Time of Incident" value={form.incident_time}
            onChange={(v) => updateForm("incident_time", v)}
            type="time"
          />
          <div className="col-span-2">
            <FormInput
              label="Place of Incident" value={form.incident_place}
              onChange={(v) => updateForm("incident_place", v)}
              placeholder="e.g. Respondent's residence, Purok Sampaguita"
            />
          </div>
          <FormTextarea
            label="Incident Narrative" value={form.narrative_encrypted}
            onChange={(v) => updateForm("narrative_encrypted", v)}
            rows={5} colSpan2
            placeholder="Describe the incident in detail — what happened, injuries observed, circumstances, and any witnesses."
          />
          <FormCombobox
            label="Case Status" value={form.status}
            onChange={(v) => updateForm("status", v)}
            options={CASE_STATUSES}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormCombobox
              label="Logbook Type" value={form.logbook_type}
              onChange={(v) => updateForm("logbook_type", v)}
              options={LOGBOOK_TYPES}
            />
            <FormInput
              label="Logbook Page No." value={form.logbook_page_number}
              onChange={(v) => updateForm("logbook_page_number", v)}
              type="number" placeholder="e.g. 12"
            />
          </div>
        </div>
      );
      case 1: return (
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              Victim information is protected under RA 9262 and RA 10173. Access is restricted and logged.
            </p>
          </div>
          <FormInput
            label="Victim Name" value={form.victim_name_encrypted}
            onChange={(v) => updateForm("victim_name_encrypted", v)}
            required error={formErrors.victim_name_encrypted}
            placeholder="Full name"
          />
          <FormInput
            label="Date of Birth" value={form.victim_dob}
            onChange={(v) => updateForm("victim_dob", v)}
            type="date"
          />
          <FormCombobox
            label="Civil Status" value={form.victim_civil_status}
            onChange={(v) => updateForm("victim_civil_status", v)}
            options={CIVIL_STATUSES}
          />
          <FormInput
            label="Contact Number" value={form.victim_phone_encrypted}
            onChange={(v) => updateForm("victim_phone_encrypted", v)}
            placeholder="09XXXXXXXXX" error={formErrors.victim_phone_encrypted}
            digitsOnly maxLength={11}
          />
          <div className="col-span-2">
            <FormInput
              label="Address" value={form.victim_address_encrypted}
              onChange={(v) => updateForm("victim_address_encrypted", v)}
              placeholder="House No. / Purok / Street"
            />
          </div>
          <FormInput
            label="Occupation" value={form.victim_occupation}
            onChange={(v) => updateForm("victim_occupation", v)}
            placeholder="e.g. Housewife, Teacher"
          />
          <FormCombobox
            label="Monthly Income Range" value={form.victim_income_range}
            onChange={(v) => updateForm("victim_income_range", v)}
            options={INCOME_RANGES}
          />
          <div className="col-span-2">
            <FormTextarea
              label="Children (if involved)" value={form.children_info_encrypted}
              onChange={(v) => updateForm("children_info_encrypted", v)}
              rows={2}
              placeholder="e.g. 2 children (ages 5 and 8) — present during incident"
            />
          </div>
        </div>
      );
      case 2: return (
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Respondent Name" value={form.respondent_name_encrypted}
            onChange={(v) => updateForm("respondent_name_encrypted", v)}
            required error={formErrors.respondent_name_encrypted}
            placeholder="Full name"
          />
          <FormCombobox
            label="Relationship to Victim" value={form.respondent_relationship}
            onChange={(v) => updateForm("respondent_relationship", v)}
            options={RELATIONSHIPS} required error={formErrors.respondent_relationship}
          />
          <FormInput
            label="Date of Birth" value={form.respondent_dob}
            onChange={(v) => updateForm("respondent_dob", v)}
            type="date"
          />
          <FormCombobox
            label="Civil Status" value={form.respondent_civil_status}
            onChange={(v) => updateForm("respondent_civil_status", v)}
            options={CIVIL_STATUSES}
          />
          <FormInput
            label="Contact Number" value={form.respondent_phone_encrypted}
            onChange={(v) => updateForm("respondent_phone_encrypted", v)}
            placeholder="09XXXXXXXXX"
            digitsOnly maxLength={11}
          />
          <div className="col-span-2">
            <FormInput
              label="Address" value={form.respondent_address_encrypted}
              onChange={(v) => updateForm("respondent_address_encrypted", v)}
              placeholder="House No. / Purok / Street"
            />
          </div>
          <FormInput
            label="Occupation" value={form.respondent_occupation}
            onChange={(v) => updateForm("respondent_occupation", v)}
            placeholder="e.g. Driver, Farmer"
          />
        </div>
      );
      case 3: return (
        <div className="space-y-6">
          {/* BPO */}
          <div className="p-4 rounded-xl border border-border space-y-4">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Barangay Protection Order (BPO)</p>
            <p className="text-[11px] text-muted-foreground">
              Issued by the Punong Barangay on the date of filing, after ex parte determination. Valid for 15 days.
            </p>
            <Toggle
              label="BPO Issued"
              checked={form.bpo_issued}
              onChange={(v) => updateForm("bpo_issued", v)}
            />
            {form.bpo_issued && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <FormInput
                  label="BPO Issued Date" value={form.bpo_issued_date}
                  onChange={(v) => updateForm("bpo_issued_date", v)}
                  type="date"
                />
                <FormInput
                  label="BPO Expiry Date (auto: +15 days)" value={form.bpo_expiry_date}
                  onChange={(v) => updateForm("bpo_expiry_date", v)}
                  type="date"
                  hint="Automatically computed. Edit only if different."
                />
              </div>
            )}
          </div>

          {/* TPO / PPO */}
          <div className="p-4 rounded-xl border border-border space-y-4">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Court Protection Orders</p>
            <p className="text-[11px] text-muted-foreground">
              TPO/PPO filed at the nearest Family Court. BPO does not preclude TPO/PPO. Assist victim to file within 24 hours of BPO issuance.
            </p>
            <div className="space-y-3">
              <Toggle
                label="TPO (Temporary Protection Order) referred to Family Court"
                checked={form.tpo_referred}
                onChange={(v) => updateForm("tpo_referred", v)}
              />
              {form.tpo_referred && (
                <FormInput
                  label="TPO Filing Date" value={form.tpo_date}
                  onChange={(v) => updateForm("tpo_date", v)}
                  type="date"
                />
              )}
              <Toggle
                label="PPO (Permanent Protection Order) referred to Family Court"
                checked={form.ppo_referred}
                onChange={(v) => updateForm("ppo_referred", v)}
              />
              {form.ppo_referred && (
                <FormInput
                  label="PPO Filing Date" value={form.ppo_date}
                  onChange={(v) => updateForm("ppo_date", v)}
                  type="date"
                />
              )}
            </div>
          </div>

          {/* Referrals */}
          <div className="p-4 rounded-xl border border-border space-y-4">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Mandatory Referrals</p>
            <p className="text-[11px] text-muted-foreground">
              RA 9262 and JMC 2010-2 require reporting to PNP and C/MSWDO within 4 hours of the incident being reported to the barangay.
            </p>
            <div className="space-y-3">
              <Toggle
                label="Referred to PNP (Women and Children Protection Desk)"
                checked={form.referred_to_pnp}
                onChange={(v) => updateForm("referred_to_pnp", v)}
                hint="Must be done within 4 hours of receiving the report"
              />
              {form.referred_to_pnp && (
                <FormInput
                  label="PNP Referral Date/Time" value={form.pnp_referral_time}
                  onChange={(v) => updateForm("pnp_referral_time", v)}
                  type="datetime-local"
                />
              )}
              <Toggle
                label="Referred to C/MSWDO (City/Municipal Social Welfare)"
                checked={form.referred_to_dswd}
                onChange={(v) => updateForm("referred_to_dswd", v)}
                hint="Must be done within 4 hours of receiving the report"
              />
              {form.referred_to_dswd && (
                <FormInput
                  label="MSWDO Referral Date/Time" value={form.dswd_referral_time}
                  onChange={(v) => updateForm("dswd_referral_time", v)}
                  type="datetime-local"
                />
              )}
            </div>
          </div>
        </div>
      );
      default: return null;
    }
  };

  // ── Render ──
  return (
    <div className="space-y-6">
      <PageHeader
        title="VAWC Records"
        description="Violence Against Women and Children — RA 9262 | VAW Desk (JMC 2010-2)"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "VAWC Records" }]}
      />

      {/* RA 9262 Confidential Banner */}
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 flex items-start gap-3">
        <Lock className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-red-800 dark:text-red-200">CONFIDENTIAL — RA 9262 Protected Information</p>
          <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
            All VAWC records are protected under Republic Act No. 9262 (Anti-VAWC Act) and RA 10173 (Data Privacy Act).
            Access is restricted to authorized VAW Desk personnel only. Unauthorized disclosure is punishable by law.
            No amicable settlement or mediation under Katarungang Pambarangay — VAWC is a criminal offense.
          </p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by case number..."
              className="w-full pl-9 pr-8 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring"
            />
            {search && (
              <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "relative flex items-center justify-center w-9 h-9 shrink-0 rounded-lg border transition-colors",
              showFilters || activeFilters > 0 ? "border-accent-primary bg-accent-bg text-accent-text" : "border-border hover:bg-muted text-muted-foreground"
            )}
          >
            <Filter className="h-4 w-4" />
            {activeFilters > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ background: "var(--accent-primary)" }}>
                {activeFilters}
              </span>
            )}
          </button>
          <button
            onClick={() => { setShowLibrary(true); setLibraryTab("pcw"); }}
            className="flex items-center gap-2 px-3 h-9 shrink-0 text-sm rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
          >
            <BookOpen className="h-4 w-4" /> VAWC Library
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 h-9 shrink-0 text-sm font-medium rounded-lg text-white transition-colors"
            style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
          >
            <Plus className="h-4 w-4" /> Add VAWC Case
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg glass-subtle">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Status:</span>
            {[{ value: "", label: "All" }, ...CASE_STATUSES].map((s) => (
              <button key={s.value}
                onClick={() => { setStatusFilter(s.value); setPage(1); }}
                className={cn(
                  "px-3 py-1 text-xs rounded-full border transition-colors",
                  statusFilter === s.value
                    ? "border-accent-primary bg-accent-bg text-accent-text font-medium"
                    : "border-border hover:bg-muted text-muted-foreground"
                )}>
                {s.label}
              </button>
            ))}
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider ml-4">Type:</span>
            {["", ...INCIDENT_TYPES].map((t) => (
              <button key={t}
                onClick={() => { setTypeFilter(t); setPage(1); }}
                className={cn(
                  "px-3 py-1 text-xs rounded-full border transition-colors",
                  typeFilter === t
                    ? "border-accent-primary bg-accent-bg text-accent-text font-medium"
                    : "border-border hover:bg-muted text-muted-foreground"
                )}>
                {t || "All"}
              </button>
            ))}
            {activeFilters > 0 && (
              <button onClick={() => { setStatusFilter(""); setTypeFilter(""); setPage(1); }}
                className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground ml-2">
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Case List */}
      <div className="space-y-2">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="h-[72px] rounded-xl bg-muted/40 animate-pulse" />
          ))
        ) : cases.length === 0 ? (
          <div className="p-12 text-center rounded-xl glass flex flex-col items-center gap-3">
            <ShieldAlert className="h-10 w-10 text-muted-foreground/50" />
            <div>
              <p className="text-sm font-medium text-foreground">No VAWC cases recorded</p>
              <p className="text-xs text-muted-foreground mt-1">Cases will appear here. All records are strictly confidential under RA 9262.</p>
            </div>
          </div>
        ) : (
          cases.map((c) => {
            const statusColor = STATUS_COLORS[c.status] ?? "#64748b";
            const bpoExpired = c.bpo_issued && c.bpo_expiry_date
              ? new Date(c.bpo_expiry_date) < new Date()
              : false;

            return (
              <div
                key={c.id}
                className="flex items-center gap-4 px-5 py-4 rounded-xl border border-border bg-card hover:border-accent-primary/40 hover:bg-muted/20 transition-all cursor-pointer"
                onClick={() => openView(c)}
              >
                {/* Status dot */}
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: statusColor }} />

                {/* Left: case number + type */}
                <div className="w-52 shrink-0">
                  <p className="text-xs font-bold font-mono text-foreground">{c.case_number}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-muted text-muted-foreground">
                    {c.incident_type}
                  </span>
                </div>

                {/* Center: status + protection orders */}
                <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium" style={{ color: statusColor }}>
                    {STATUS_LABELS[c.status] ?? c.status}
                  </span>
                  {c.bpo_issued && (
                    <span className={cn(
                      "px-2 py-0.5 text-[10px] font-semibold rounded-full",
                      bpoExpired
                        ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400"
                        : "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                    )}>
                      BPO {bpoExpired ? "Expired" : "Issued"}
                    </span>
                  )}
                  {c.tpo_referred && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400">
                      TPO
                    </span>
                  )}
                  {c.ppo_referred && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400">
                      PPO
                    </span>
                  )}
                  {(!c.referred_to_pnp || !c.referred_to_dswd) && (
                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400">
                      <AlertCircle className="h-2.5 w-2.5" /> Referral pending
                    </span>
                  )}
                </div>

                {/* Right: date + respondent relationship */}
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-foreground">{c.incident_date ? c.incident_date.slice(0, 10) : c.filing_date?.slice(0, 10)}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{c.respondent_relationship}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} total case{total !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronsLeft className="h-4 w-4" /></button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
            <span className="px-3 py-1 text-sm">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
            <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronsRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {/* Record / Edit Form Modal */}
      <Modal
        open={showForm}
        onClose={closeForm}
        disableOutsideClick
        title={editTarget ? `Edit ${editTarget.case_number}` : "Record VAWC Case"}
        description={editTarget ? "Update case details" : "File a new VAWC case — RA 9262"}
        size="lg"
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeForm}
                className="inline-flex h-10 items-center rounded-lg border border-border bg-muted px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
              >
                Cancel
              </button>
              {formTab > 0 && (
                <button
                  type="button"
                  onClick={() => setFormTab((t) => t - 1)}
                  className="inline-flex h-10 items-center rounded-lg border border-border bg-muted px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
                >
                  <ChevronLeft className="mr-1.5 h-4 w-4" /> Back
                </button>
              )}
            </div>
            {formTab < FORM_TABS.length - 1 ? (
              <button
                type="button"
                onClick={() => setFormTab((t) => t + 1)}
                className="inline-flex h-10 min-w-[112px] items-center justify-center rounded-lg bg-accent-primary px-5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Next <ChevronRight className="ml-1.5 h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex h-10 min-w-[140px] items-center justify-center rounded-lg bg-accent-primary px-5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Saving..." : editTarget ? "Update Case" : "Record Case"}
              </button>
            )}
          </div>
        }
      >
        {/* RA 9262 Notice */}
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 mb-4 flex items-center gap-2">
          <Lock className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-xs text-red-700 dark:text-red-300">Strictly confidential under RA 9262 and RA 10173. Access is logged.</p>
        </div>

        {/* Tab Nav */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {FORM_TABS.map((tab, i) => (
            <button key={tab} onClick={() => setFormTab(i)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors",
                formTab === i ? "bg-accent-bg text-accent-text" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <span
                className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold mr-1.5"
                style={formTab === i
                  ? { background: "var(--accent-primary)", color: "#fff" }
                  : { background: "var(--muted)", color: "var(--muted-foreground)" }}
              >
                {i + 1}
              </span>
              {tab}
            </button>
          ))}
        </div>

        {renderFormTab()}
      </Modal>

      {/* View Case Modal */}
      {viewCase && (
        <Modal
          open
          onClose={() => setViewCase(null)}
          disableOutsideClick
          title={viewCase.case_number}
          description={`${viewCase.incident_type} — Filed ${viewCase.filing_date?.slice(0, 10)}`}
          size="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <ModalButton variant="secondary" onClick={() => setViewCase(null)}>Close</ModalButton>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printIntakeForm(viewCase)}
                  disabled={generatingDoc !== null}
                  title="Generate Intake Form (Annex A)"
                  className="flex items-center gap-1.5 px-3 h-8 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50"
                >
                  {generatingDoc === "intake_form" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                  Intake Form
                </button>
                <button
                  onClick={() => printBPOForm(viewCase)}
                  disabled={generatingDoc !== null}
                  title="Generate BPO Application (Annex D)"
                  className="flex items-center gap-1.5 px-3 h-8 text-xs font-medium rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors disabled:opacity-50"
                >
                  {generatingDoc === "bpo_application" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                  BPO Form
                </button>
                <ModalButton variant="primary" onClick={() => openEdit(viewCase)}>Edit</ModalButton>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Status row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="px-2.5 py-0.5 text-xs font-semibold rounded-full text-white"
                style={{ background: STATUS_COLORS[viewCase.status] ?? "#64748b" }}
              >
                {STATUS_LABELS[viewCase.status] ?? viewCase.status}
              </span>
              {viewCase.bpo_issued && (
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                  BPO Issued {viewCase.bpo_expiry_date ? `— expires ${viewCase.bpo_expiry_date.slice(0, 10)}` : ""}
                </span>
              )}
              {viewCase.tpo_referred && <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400">TPO Filed</span>}
              {viewCase.ppo_referred && <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400">PPO Filed</span>}
            </div>

            {/* Referral status */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "PNP Referred", done: viewCase.referred_to_pnp, detail: viewCase.pnp_referral_time },
                { label: "MSWDO Referred", done: viewCase.referred_to_dswd, detail: viewCase.dswd_referral_time },
              ].map((ref) => (
                <div
                  key={ref.label}
                  className={cn(
                    "p-3 rounded-lg flex items-center gap-2 text-xs",
                    ref.done
                      ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300"
                      : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400"
                  )}
                >
                  {ref.done
                    ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
                  <span>
                    {ref.label}: <strong>{ref.done ? "Done" : "Pending"}</strong>
                    {ref.done && ref.detail ? ` — ${ref.detail.slice(0, 16).replace("T", " ")}` : ""}
                  </span>
                </div>
              ))}
            </div>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg glass-subtle">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Victim-Survivor</p>
                <p className="text-sm font-medium text-foreground">{viewCase.victim_name_encrypted}</p>
                {viewCase.victim_civil_status && <p className="text-xs text-muted-foreground mt-1">{viewCase.victim_civil_status}</p>}
                {viewCase.victim_address_encrypted && <p className="text-xs text-muted-foreground mt-0.5">{viewCase.victim_address_encrypted}</p>}
              </div>
              <div className="p-4 rounded-lg glass-subtle">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Respondent</p>
                <p className="text-sm font-medium text-foreground">{viewCase.respondent_name_encrypted}</p>
                <p className="text-xs text-muted-foreground mt-1">Relationship: {viewCase.respondent_relationship}</p>
                {viewCase.respondent_address_encrypted && <p className="text-xs text-muted-foreground mt-0.5">{viewCase.respondent_address_encrypted}</p>}
              </div>
            </div>

            {/* Incident details */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase">Incident Date</p>
                <p className="text-sm">{viewCase.incident_date?.slice(0, 10) ?? "—"}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase">Filing Date</p>
                <p className="text-sm">{viewCase.filing_date?.slice(0, 10) ?? "—"}</p>
              </div>
              {viewCase.incident_place && (
                <div className="col-span-2">
                  <p className="text-[11px] text-muted-foreground uppercase">Place of Incident</p>
                  <p className="text-sm">{viewCase.incident_place}</p>
                </div>
              )}
            </div>

            {/* Narrative */}
            {viewCase.narrative_encrypted && (
              <div className="p-4 rounded-lg glass-subtle">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Incident Narrative</p>
                <p className="text-sm text-foreground leading-relaxed">{viewCase.narrative_encrypted}</p>
              </div>
            )}

            {/* Children */}
            {viewCase.children_info_encrypted && (
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Children</p>
                <p className="text-sm text-foreground">{viewCase.children_info_encrypted}</p>
              </div>
            )}

            {/* Logbook */}
            {(viewCase.logbook_type || viewCase.logbook_page_number) && (
              <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                {viewCase.logbook_type && <div><p className="text-[11px] text-muted-foreground uppercase">Logbook Type</p><p className="text-sm">{LOGBOOK_TYPES.find((l) => l.value === viewCase.logbook_type)?.label ?? viewCase.logbook_type}</p></div>}
                {viewCase.logbook_page_number && <div><p className="text-[11px] text-muted-foreground uppercase">Page No.</p><p className="text-sm">{viewCase.logbook_page_number}</p></div>}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* VAWC Library Modal */}
      <Modal open={showLibrary} onClose={() => setShowLibrary(false)} title="VAWC Reference Library" description="Official references for Violence Against Women and Children cases" size="xl"
        footer={<ModalButton variant="secondary" onClick={() => setShowLibrary(false)}>Close</ModalButton>}>
        {/* Tab Selector — Book Covers */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button onClick={() => setLibraryTab("pcw")}
            className={cn("relative p-5 rounded-xl border-2 text-left transition-all",
              libraryTab === "pcw" ? "border-red-500 bg-red-50 dark:bg-red-950/30 shadow-md" : "border-border hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/10")}>
            <div className="flex items-start gap-3">
              <div className={cn("w-12 h-14 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                libraryTab === "pcw" ? "bg-red-500 text-white" : "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400")}>
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className={cn("text-sm font-bold", libraryTab === "pcw" ? "text-red-700 dark:text-red-300" : "text-foreground")}>PCW VAW Desk Handbook</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">Barangay VAW Desk Handbook (PCW, 2012) — JMC 2010-2</p>
                <p className="text-[10px] text-muted-foreground mt-1">Service protocol, BPO process, referral system, forms</p>
              </div>
            </div>
            {libraryTab === "pcw" && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />}
          </button>
          <button onClick={() => setLibraryTab("ra9262")}
            className={cn("relative p-5 rounded-xl border-2 text-left transition-all",
              libraryTab === "ra9262" ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 shadow-md" : "border-border hover:border-violet-300 hover:bg-violet-50/50 dark:hover:bg-violet-950/10")}>
            <div className="flex items-start gap-3">
              <div className={cn("w-12 h-14 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                libraryTab === "ra9262" ? "bg-violet-500 text-white" : "bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-400")}>
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <p className={cn("text-sm font-bold", libraryTab === "ra9262" ? "text-violet-700 dark:text-violet-300" : "text-foreground")}>RA 9262 — Anti-VAWC Act</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">Republic Act No. 9262 (2004) — Anti-Violence Against Women and Their Children Act</p>
                <p className="text-[10px] text-muted-foreground mt-1">Protection orders, penalties, victim rights, definitions</p>
              </div>
            </div>
            {libraryTab === "ra9262" && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-violet-500" />}
          </button>
        </div>

        {/* Book Content */}
        <div className="max-h-[55vh] overflow-y-auto rounded-xl border border-border bg-background">
          {libraryTab === "pcw" ? (
            <div className="p-6 space-y-1">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-red-500 font-semibold">JMC 2010-2 — DILG / DSWD / DOH / DepEd / PCW</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">Barangay VAW Desk Handbook</p>
                </div>
                <a href="/references/vawc-pcw-handbook.pdf" download="PCW-VAW-Desk-Handbook.pdf"
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 hover:bg-red-100 transition-colors ml-3">
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </a>
              </div>
              <div className="space-y-0">
                {[
                  { id: "pcw-legal", title: "Legal Basis", content: (
                    <div className="space-y-2 text-sm text-foreground leading-relaxed">
                      <p>The Barangay VAW Desk is established under the following laws:</p>
                      <ul className="space-y-1.5 list-disc ml-4">
                        <li><strong>RA 9262</strong> (2004) — Anti-Violence Against Women and Their Children Act — primary law</li>
                        <li><strong>RA 9710</strong> (2008) — Magna Carta of Women, Section 12D — mandates VAW Desk in every barangay</li>
                        <li><strong>JMC 2010-2</strong> — Joint Memorandum Circular by DILG, DSWD, DOH, DepEd, PCW — implementing guidelines</li>
                        <li><strong>RA 7877</strong> — Anti-Sexual Harassment Act (1995)</li>
                        <li><strong>RA 8353</strong> — Anti-Rape Law (1997)</li>
                        <li><strong>RA 9208</strong> — Anti-Trafficking in Persons Act (2003)</li>
                      </ul>
                      <p className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 font-semibold text-xs">
                        CRITICAL: VAWC is a criminal offense. No amicable settlement under Katarungang Pambarangay applies. Barangay cannot mediate, conciliate, or arbitrate VAWC cases — only refer and support.
                      </p>
                    </div>
                  )},
                  { id: "pcw-victims", title: "Who is a Victim Under RA 9262", content: (
                    <div className="space-y-3 text-sm text-foreground">
                      <p>A woman who is:</p>
                      <ul className="space-y-1.5 list-disc ml-4">
                        <li>Wife or <strong>former wife</strong> of the offender</li>
                        <li>Woman with whom offender has or <strong>had a sexual or dating relationship</strong></li>
                        <li>Woman with whom offender has a <strong>common child</strong> (married or not)</li>
                        <li>Children of such a woman (including those under her care)</li>
                      </ul>
                    </div>
                  )},
                  { id: "pcw-types", title: "4 Forms of Violence Under RA 9262", content: (
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Physical Violence", color: "red", desc: "Bodily harm, battering, physical assault, threats of attack" },
                        { label: "Sexual Violence", color: "violet", desc: "Rape, marital rape, sexual harassment, forced prostitution, obscene content" },
                        { label: "Psychological Violence", color: "amber", desc: "Emotional abuse, harassment, stalking, public humiliation, controlling behavior, isolation" },
                        { label: "Economic Abuse", color: "emerald", desc: "Destroying property, controlling finances, preventing employment, withholding financial support" },
                      ].map((t) => (
                        <div key={t.label} className={`p-3 rounded-lg bg-${t.color}-50 dark:bg-${t.color}-950/20 border border-${t.color}-200 dark:border-${t.color}-900`}>
                          <p className={`text-xs font-bold text-${t.color}-700 dark:text-${t.color}-300 mb-1`}>{t.label}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
                        </div>
                      ))}
                    </div>
                  )},
                  { id: "pcw-protocol", title: "7-Step Service Delivery Protocol", content: (
                    <div className="space-y-2">
                      {[
                        { step: 1, label: "Make victim comfortable", desc: "Safe private room, water, food, first aid. Ensure her immediate safety and that of her children." },
                        { step: 2, label: "Assess situation", desc: "Get initial info, determine risks, check if medical attention is needed immediately." },
                        { step: 3, label: "Emergency referral", desc: "If urgent: refer to nearest medical facility immediately. Fill intake and referral forms." },
                        { step: 4, label: "Interview", desc: "Gender-sensitive, non-judgmental. Victim tells her story in her own language. No repeated questioning." },
                        { step: 5, label: "Inform of rights", desc: "Explain RA 9262 rights, available remedies, BPO process. Assist filing if she decides to proceed." },
                        { step: 6, label: "Record using VAW DocS", desc: "Transfer data to VAW DocS Intake Form (Annex A). Keep records confidential and secured." },
                        { step: 7, label: "Report within 4 hours", desc: "Mandatory report to PNP (WCPD) and C/MSWDO within 4 hours of receiving the report." },
                      ].map((s) => (
                        <div key={s.step} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                          <span className="w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{s.step}</span>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{s.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )},
                  { id: "pcw-bpo", title: "Protection Orders (BPO → TPO → PPO)", content: (
                    <div className="space-y-3">
                      <div className="overflow-hidden rounded-xl border border-border">
                        <table className="w-full text-sm">
                          <thead><tr className="bg-muted/50"><th className="text-left px-4 py-2.5 text-xs font-semibold">Type</th><th className="text-left px-4 py-2.5 text-xs font-semibold">Issued By</th><th className="text-left px-4 py-2.5 text-xs font-semibold">Timeline</th><th className="text-left px-4 py-2.5 text-xs font-semibold">Duration</th></tr></thead>
                          <tbody className="divide-y divide-border">
                            <tr><td className="px-4 py-3 font-medium text-amber-600 dark:text-amber-400">BPO</td><td className="px-4 py-3 text-xs text-muted-foreground">Punong Barangay / Kagawad (if PB absent)</td><td className="px-4 py-3 text-xs text-muted-foreground">Issued on day of filing — ex parte</td><td className="px-4 py-3 text-xs font-semibold">15 days</td></tr>
                            <tr><td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400">TPO</td><td className="px-4 py-3 text-xs text-muted-foreground">Family Court</td><td className="px-4 py-3 text-xs text-muted-foreground">Within 24 hours of BPO issuance</td><td className="px-4 py-3 text-xs font-semibold">30 days</td></tr>
                            <tr><td className="px-4 py-3 font-medium text-violet-600 dark:text-violet-400">PPO</td><td className="px-4 py-3 text-xs text-muted-foreground">Family Court</td><td className="px-4 py-3 text-xs text-muted-foreground">After full hearing</td><td className="px-4 py-3 text-xs font-semibold">Permanent</td></tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="text-xs text-muted-foreground">BPO does NOT preclude the victim from also applying for TPO or PPO directly from the Family Court. She may apply for TPO/PPO instead of BPO.</p>
                    </div>
                  )},
                  { id: "pcw-forms", title: "Official VAW Forms (Annexes)", content: (
                    <div className="space-y-2 text-sm">
                      <p className="text-xs text-muted-foreground mb-3">Open a case record and use the print buttons in the case view to generate pre-filled forms. Blank templates are available below.</p>
                      {[
                        { annex: "Annex A", name: "VAW DocS Intake Form", desc: "National VAW Documentation System barangay intake form — main case record", canPrint: "intake" as const },
                        { annex: "Annex B", name: "Referral Form", desc: "Used when referring victim to other agencies or service providers", canPrint: null },
                        { annex: "Annex C", name: "Feedback Form", desc: "Follow-up feedback from referral agencies", canPrint: null },
                        { annex: "Annex D", name: "BPO Application Form", desc: "Barangay Protection Order application filed by or on behalf of victim", canPrint: "bpo" as const },
                        { annex: "Annex H", name: "Monthly Report Form", desc: "Breakdown by nature: RA 9262 (Physical/Sexual/Psychological/Economic), RA 8353 (Rape), RA 9208 (Trafficking), RA 7877 (Harassment)", canPrint: null },
                      ].map((f) => (
                        <div key={f.annex} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 shrink-0 mt-0.5">{f.annex}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">{f.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                          </div>
                          {f.canPrint && (
                            <button
                              onClick={() => {
                                const blank: VawcCase = {
                                  id: "", case_number: "VAWC-____-____", incident_type: f.canPrint === "bpo" ? "" : "",
                                  filing_date: new Date().toISOString().slice(0, 10), incident_date: null, incident_time: null,
                                  incident_place: null, narrative_encrypted: null, victim_name_encrypted: "",
                                  victim_dob: null, victim_address_encrypted: null, victim_phone_encrypted: null,
                                  victim_occupation: null, victim_income_range: null, victim_civil_status: null,
                                  victim_resident_id: null, respondent_name_encrypted: "", respondent_dob: null,
                                  respondent_address_encrypted: null, respondent_phone_encrypted: null,
                                  respondent_occupation: null, respondent_civil_status: null, respondent_relationship: "",
                                  children_info_encrypted: null, bpo_issued: false, bpo_issued_date: null,
                                  bpo_expiry_date: null, tpo_referred: false, tpo_date: null, ppo_referred: false,
                                  ppo_date: null, referred_to_pnp: false, pnp_referral_time: null,
                                  referred_to_dswd: false, dswd_referral_time: null, other_referrals: null,
                                  status: "under_investigation", vaw_desk_officer_id: null, logbook_type: null,
                                  logbook_page_number: null, created_at: "", updated_at: "",
                                };
                                if (f.canPrint === "intake") printIntakeForm(blank);
                                else printBPOForm(blank);
                              }}
                              className="shrink-0 flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
                            >
                              <Printer className="w-3 h-3" /> Blank
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )},
                  { id: "pcw-reporting", title: "Reporting Requirements", content: (
                    <div className="space-y-2">
                      {[
                        { time: "Within 4 hours", desc: "Report each incident to PNP (Women and Children Protection Desk) and C/MSWDO" },
                        { time: "Quarterly", desc: "Submit report on all VAW cases to DILG City/Municipal Field Office and C/MSWDO" },
                        { time: "Annually", desc: "Include VAW cases in GAD Plans and Programs (funded from minimum 5% LGU GAD budget)" },
                      ].map((r) => (
                        <div key={r.time} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                          <Clock className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-sm font-bold text-foreground">{r.time}</span>
                            <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )},
                ].map((section) => (
                  <LibrarySection key={section.id} id={section.id} title={section.title} accent="red">
                    {section.content}
                  </LibrarySection>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-1">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-violet-500 font-semibold">Republic Act No. 9262 — Signed March 8, 2004</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">Anti-Violence Against Women and Their Children Act</p>
                </div>
              </div>
              <div className="space-y-0">
                {[
                  { id: "ra-scope", title: "Scope and Purpose", content: (
                    <div className="space-y-3 text-sm text-foreground leading-relaxed">
                      <p>RA 9262 recognizes that violence against women and children is a public concern and a human rights violation. It applies to all women who are or were in an intimate relationship with a man, regardless of marital status.</p>
                      <p>The law covers violence committed by a husband, former husband, or any person against a woman with whom he has or had a sexual or dating relationship, or with whom he has a common child.</p>
                    </div>
                  )},
                  { id: "ra-rights", title: "Rights of the Victim", content: (
                    <div className="space-y-2 text-sm">
                      {[
                        "Be treated with respect and dignity",
                        "Avail of legal assistance from PAO (Public Attorney's Office) or private counsel",
                        "Be entitled to support from the offender",
                        "Have her name and address withheld from public records",
                        "Be protected by government from threats of arrest if she has been detained",
                        "Be entitled to the same custody and support rights as before the violence",
                        "Exclusive use and occupancy of the family dwelling during proceedings",
                        "Emergency protective order from the police",
                      ].map((r, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded-lg border border-border">
                          <Scale className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-foreground">{r}</p>
                        </div>
                      ))}
                    </div>
                  )},
                  { id: "ra-penalties", title: "Penalties", content: (
                    <div className="space-y-3 text-sm">
                      <div className="overflow-hidden rounded-xl border border-border">
                        <table className="w-full text-xs">
                          <thead><tr className="bg-muted/50"><th className="text-left px-4 py-2.5 font-semibold">Act</th><th className="text-left px-4 py-2.5 font-semibold">Penalty</th></tr></thead>
                          <tbody className="divide-y divide-border">
                            <tr><td className="px-4 py-3">Causing physical harm</td><td className="px-4 py-3 font-medium">Prision mayor (6 yrs 1 day — 12 yrs)</td></tr>
                            <tr><td className="px-4 py-3">Threatening physical harm</td><td className="px-4 py-3 font-medium">Prision correccional (6 mos 1 day — 6 yrs)</td></tr>
                            <tr><td className="px-4 py-3">Psychological violence (e.g., infidelity)</td><td className="px-4 py-3 font-medium">Prision mayor + mandatory counseling</td></tr>
                            <tr><td className="px-4 py-3">Economic abuse</td><td className="px-4 py-3 font-medium">Arresto mayor (1 month 1 day — 6 mos)</td></tr>
                            <tr><td className="px-4 py-3">Violation of BPO</td><td className="px-4 py-3 font-medium text-red-600">Imprisonment 30 days + fine ₱5,000</td></tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )},
                  { id: "ra-bpo-detail", title: "BPO — Barangay Protection Order (Section 14)", content: (
                    <div className="space-y-3 text-sm text-foreground leading-relaxed">
                      <ul className="space-y-2 list-disc ml-4">
                        <li>Issued by the <strong>Punong Barangay</strong> or any <strong>Barangay Kagawad</strong> if PB is unavailable</li>
                        <li>Issued <strong>ex parte</strong> (without the presence of the respondent) on the same day of filing</li>
                        <li>Effective for <strong>15 days</strong></li>
                        <li>Prohibits respondent from committing further acts of violence and from contacting the victim</li>
                        <li>Does NOT prevent victim from also applying for TPO or PPO at the Family Court</li>
                        <li><strong>Violation of BPO</strong>: imprisonment of 30 days + fine not less than ₱5,000 — to be imposed by the MTC</li>
                        <li>Barangay official who fails to issue BPO within prescribed period faces disciplinary action</li>
                      </ul>
                      <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900">
                        <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">No Filing Fee. No Bond Required.</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Victim-survivors shall not be required to pay docket fees and other fees for the filing of the application for protection order.</p>
                      </div>
                    </div>
                  )},
                  { id: "ra-confidentiality", title: "Confidentiality (Section 44)", content: (
                    <div className="space-y-3 text-sm text-foreground leading-relaxed">
                      <p>All records pertaining to VAWC cases — whether before the barangay, court, or any government agency — shall be confidential and must not be disclosed to the public.</p>
                      <ul className="space-y-1.5 list-disc ml-4">
                        <li>Victim&apos;s address, contact number, and place of work must not appear in any public document</li>
                        <li>Court proceedings are closed to the public</li>
                        <li>Records must be sealed and cannot be accessed without court order</li>
                        <li>Any person who violates confidentiality faces <strong>1 year imprisonment and/or fine of ₱500 to ₱5,000</strong></li>
                      </ul>
                      <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                        <p className="text-xs font-semibold text-red-700 dark:text-red-300">RA 10173 (Data Privacy Act) also applies.</p>
                        <p className="text-xs text-muted-foreground mt-0.5">All VAWC data in this system is encrypted and access is logged per RA 10173 compliance requirements.</p>
                      </div>
                    </div>
                  )},
                ].map((section) => (
                  <LibrarySection key={section.id} id={section.id} title={section.title} accent="violet">
                    {section.content}
                  </LibrarySection>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Toast */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id}
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-300",
              t.type === "error" ? "bg-red-600 text-white" : "bg-foreground text-background"
            )}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {t.message}
          </div>
        ))}
      </div>

      <MabiniButton pageContext="You are on the VAWC (Violence Against Women and Children) page. This page manages VAWC cases under RA 9262 (Anti-VAWC Act) and JMC 2010-2 (VAW Desk guidelines). All records are strictly confidential. Key rules: No amicable settlement for VAWC under KP. BPO issued by Punong Barangay on day of filing, valid 15 days. TPO/PPO filed at Family Court within 24 hours. Report to PNP and MSWDO within 4 hours. Forms: VAW DocS Intake Form (Annex A), Referral Form (Annex B), BPO Application (Annex D). Types of violence: Physical, Sexual, Psychological, Economic." />
    </div>
  );
}
