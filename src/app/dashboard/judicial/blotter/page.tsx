"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Gavel,
  Plus,
  Search,
  Filter,
  Download,
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
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

// ── Types ──
interface BlotterRecord {
  id: string;
  blotter_number: string;
  incident_type: string;
  narrative: string;
  complainant_name: string;
  complainant_contact: string;
  complainant_address: string;
  respondent_name: string;
  respondent_contact: string;
  respondent_address: string;
  incident_date: string;
  incident_time: string;
  incident_location: string;
  incident_purok: string;
  severity: string;
  status: string;
  action_taken: string;
  recorded_by: string;
  recorded_at: string;
  witness_names: string;
  evidence_notes: string;
}

const mockBlotters: BlotterRecord[] = [
  { id: "1", blotter_number: "BLO-2026-001", incident_type: "Theft", narrative: "Complainant reported that their motorcycle (Honda Click 125i, red) was stolen from in front of their residence between 2:00 AM and 5:00 AM. No CCTV footage available.", complainant_name: "Maria Dela Cruz", complainant_contact: "0917-123-4567", complainant_address: "Purok Sampaguita, Rizal St.", respondent_name: "Unknown", respondent_contact: "", respondent_address: "Unknown", incident_date: "2026-03-06", incident_time: "05:30", incident_location: "Rizal St.", incident_purok: "Purok Sampaguita", severity: "High", status: "open", action_taken: "Forwarded to PNP Station 7", recorded_by: "Tanod Chief Garcia", recorded_at: "2026-03-06 06:00", witness_names: "", evidence_notes: "" },
  { id: "2", blotter_number: "BLO-2026-002", incident_type: "Domestic Dispute", narrative: "Neighbors reported shouting and breaking of objects from the residence. Upon investigation, couple admitted to verbal argument over finances. No physical injuries.", complainant_name: "Neighbor (Anonymous)", complainant_contact: "", complainant_address: "Purok Rosal", respondent_name: "Juan Santos / Wife", respondent_contact: "0918-234-5678", respondent_address: "Purok Rosal, Mabini St.", incident_date: "2026-03-04", incident_time: "22:30", incident_location: "Mabini St.", incident_purok: "Purok Rosal", severity: "Medium", status: "resolved", action_taken: "Mediation conducted. Both parties signed agreement.", recorded_by: "Kag. Lopez", recorded_at: "2026-03-05 08:00", witness_names: "Rosa De Los Santos", evidence_notes: "" },
  { id: "3", blotter_number: "BLO-2026-003", incident_type: "Physical Altercation", narrative: "Complainant was punched in the face by respondent during a basketball game argument. Visible bruising on left cheek. Medical certificate obtained.", complainant_name: "Angelo Pascual", complainant_contact: "0919-345-6789", complainant_address: "Purok Dahlia, J.P. Rizal St.", respondent_name: "Pedro Reyes", respondent_contact: "0920-456-7890", respondent_address: "Purok Dahlia, Mabini St.", incident_date: "2026-02-28", incident_time: "16:00", incident_location: "Barangay Basketball Court", incident_purok: "Purok Dahlia", severity: "High", status: "active", action_taken: "KP case filed (KP-2026-003). Respondent summoned.", recorded_by: "Secretary Santos", recorded_at: "2026-02-28 17:00", witness_names: "Mark Chavez, Roberto Manalo", evidence_notes: "Medical certificate attached" },
  { id: "4", blotter_number: "BLO-2025-009", incident_type: "Vandalism", narrative: "Barangay Hall wall spray-painted with graffiti. CCTV captured 2 male juveniles. Identified through community cooperation.", complainant_name: "Barangay Tambo", complainant_contact: "044-123-4567", complainant_address: "Barangay Hall", respondent_name: "2 Minor Respondents", respondent_contact: "", respondent_address: "Purok Dahlia", incident_date: "2025-12-15", incident_time: "23:00", incident_location: "Barangay Hall", incident_purok: "Purok Dahlia", severity: "Medium", status: "closed", action_taken: "Parents summoned. Restitution made. Minors counseled by BCPC.", recorded_by: "Tanod Chief Garcia", recorded_at: "2025-12-16 08:00", witness_names: "", evidence_notes: "CCTV footage saved" },
];

const incidentTypeOptions = ["Theft", "Domestic Dispute", "Physical Altercation", "Vandalism", "Trespassing", "Disturbance", "Property Damage", "Harassment", "Noise Complaint", "Other"];
const incidentTypes = ["All Types", ...incidentTypeOptions];
const statusOptions = ["All Status", "Open", "Active", "Resolved", "Closed"];
const severityOptions = ["Low", "Medium", "High"];
const purokOptions = ["Purok Sampaguita", "Purok Rosal", "Purok Dahlia", "Purok Ilang-Ilang", "Purok Camia", "Purok Orchid", "Purok Jasmine", "Purok Santan"];
const updateStatusOptions = ["open", "active", "resolved", "closed"];

const emptyForm: Record<string, string> = {
  incident_type: "", incident_date: "", incident_time: "", incident_purok: "", incident_location: "", severity: "",
  complainant_name: "", complainant_contact: "", complainant_address: "", respondent_name: "", respondent_contact: "", respondent_address: "", respondent_unknown: "",
  narrative: "", action_taken: "", recorded_by: "", witness_names: "", evidence_notes: "",
};

// ── Form Field Components (module-level) ──
function FormInput({ label, value, onChange, required, type = "text", placeholder = "", disabled = false, error }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string; placeholder?: string; disabled?: boolean; error?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        className={cn("w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2", error ? "border-red-500 focus:ring-red-300" : "border-border focus:ring-accent-ring", disabled && "opacity-50 cursor-not-allowed")} />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormSelect({ label, value, onChange, options, required, error }: { label: string; value: string; onChange: (value: string) => void; options: string[]; required?: boolean; error?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className={cn("w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2", error ? "border-red-500 focus:ring-red-300" : "border-border focus:ring-accent-ring")}>
        <option value="">Select {label}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormTextarea({ label, value, onChange, required, rows = 3, placeholder = "" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; rows?: number; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none" />
    </div>
  );
}

export default function BlotterPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // View modal
  const [viewBlotter, setViewBlotter] = useState<BlotterRecord | null>(null);

  // Record Blotter form modal
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [formTab, setFormTab] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({ ...emptyForm });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Delete confirmation
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BlotterRecord | null>(null);

  // Update status modal
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  const [updateTarget, setUpdateTarget] = useState<BlotterRecord | null>(null);
  const [newStatus, setNewStatus] = useState("");

  // Action menu
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Toast system
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);
  const addToast = useCallback((message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
  }, []);
  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => { setToasts((prev) => prev.slice(1)); }, 3000);
    return () => clearTimeout(timer);
  }, [toasts]);

  const filtered = mockBlotters.filter((b) => {
    if (search) {
      const q = search.toLowerCase();
      if (!b.blotter_number.toLowerCase().includes(q) && !b.complainant_name.toLowerCase().includes(q)
        && !b.respondent_name.toLowerCase().includes(q) && !b.incident_type.toLowerCase().includes(q)) return false;
    }
    if (typeFilter !== "All Types" && b.incident_type !== typeFilter) return false;
    if (statusFilter !== "All Status" && b.status !== statusFilter.toLowerCase()) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  const activeCount = mockBlotters.filter((b) => b.status === "open" || b.status === "active").length;
  const resolvedCount = mockBlotters.filter((b) => b.status === "resolved" || b.status === "closed").length;

  const statusColor = (status: string): string => {
    switch (status) { case "open": return "#ef4444"; case "active": return "#f59e0b"; case "resolved": return "#22c55e"; default: return "#64748b"; }
  };

  // ── Form helpers ──
  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.incident_type) errors.incident_type = "Incident type is required";
    if (!form.incident_date) errors.incident_date = "Incident date is required";
    if (!form.incident_location) errors.incident_location = "Location is required";
    if (!form.complainant_name) errors.complainant_name = "Complainant name is required";
    if (!form.incident_purok) errors.incident_purok = "Purok / Zone is required";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      // Jump to the tab that contains the first error
      if (errors.incident_type || errors.incident_date || errors.incident_location || errors.incident_purok) setFormTab(0);
      else if (errors.complainant_name) setFormTab(1);
      return false;
    }
    return true;
  };

  const openRecordModal = () => {
    setForm({ ...emptyForm });
    setFormErrors({});
    setFormTab(0);
    setShowCreate(true);
  };

  const openEditBlotter = (b: BlotterRecord) => {
    setForm({
      incident_type: b.incident_type,
      incident_date: b.incident_date,
      incident_time: b.incident_time,
      incident_purok: b.incident_purok,
      incident_location: b.incident_location,
      severity: b.severity,
      complainant_name: b.complainant_name,
      complainant_contact: b.complainant_contact,
      complainant_address: b.complainant_address,
      respondent_name: b.respondent_name,
      respondent_contact: b.respondent_contact,
      respondent_address: b.respondent_address,
      respondent_unknown: b.respondent_name === "Unknown" ? "yes" : "",
      narrative: b.narrative,
      action_taken: b.action_taken,
      recorded_by: b.recorded_by,
      witness_names: b.witness_names,
      evidence_notes: b.evidence_notes,
    });
    setFormErrors({});
    setFormTab(0);
    setShowEdit(true);
    setActionMenuOpen(null);
  };

  const openDeleteBlotter = (b: BlotterRecord) => {
    setDeleteTarget(b);
    setShowDelete(true);
    setActionMenuOpen(null);
  };

  const openUpdateStatus = (b: BlotterRecord) => {
    setUpdateTarget(b);
    setNewStatus(b.status);
    setShowUpdateStatus(true);
    setActionMenuOpen(null);
  };

  const openViewFromAction = (b: BlotterRecord) => {
    setViewBlotter(b);
    setActionMenuOpen(null);
  };

  const openEditFromView = () => {
    if (!viewBlotter) return;
    const b = viewBlotter;
    setViewBlotter(null);
    openEditBlotter(b);
  };

  const formTabs = ["Incident", "Parties", "Details"];


  // ── Render Form Tab Content ──
  const renderFormTab = () => {
    switch (formTab) {
      case 0: return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormSelect label="Incident Type" value={form["incident_type"] || ""} onChange={(v) => updateForm("incident_type", v)} options={incidentTypeOptions} required error={formErrors.incident_type} />
            <FormSelect label="Severity" value={form["severity"] || ""} onChange={(v) => updateForm("severity", v)} options={severityOptions} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Date of Incident" value={form["incident_date"] || ""} onChange={(v) => updateForm("incident_date", v)} type="date" required error={formErrors.incident_date} />
            <FormInput label="Time of Incident" value={form["incident_time"] || ""} onChange={(v) => updateForm("incident_time", v)} type="time" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormSelect label="Purok / Zone" value={form["incident_purok"] || ""} onChange={(v) => updateForm("incident_purok", v)} options={purokOptions} required error={formErrors.incident_purok} />
            <FormInput label="Street / Address" value={form["incident_location"] || ""} onChange={(v) => updateForm("incident_location", v)} placeholder="e.g. Rizal St. near sari-sari store" required error={formErrors.incident_location} />
          </div>
        </div>
      );
      case 1: return (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Complainant Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Full Name" value={form["complainant_name"] || ""} onChange={(v) => updateForm("complainant_name", v)} required placeholder="e.g. Maria Dela Cruz" error={formErrors.complainant_name} />
            <FormInput label="Contact Number" value={form["complainant_contact"] || ""} onChange={(v) => updateForm("complainant_contact", v)} placeholder="e.g. 0917-123-4567" />
          </div>
          <FormInput label="Address" value={form["complainant_address"] || ""} onChange={(v) => updateForm("complainant_address", v)} placeholder="e.g. Purok Sampaguita, Rizal St." />
          <hr className="border-border my-2" />
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">Respondent Information</h4>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.respondent_unknown === "yes"} onChange={(e) => {
                if (e.target.checked) {
                  setForm((prev) => ({ ...prev, respondent_unknown: "yes", respondent_name: "Unknown", respondent_contact: "", respondent_address: "Unknown" }));
                } else {
                  setForm((prev) => ({ ...prev, respondent_unknown: "", respondent_name: "", respondent_contact: "", respondent_address: "" }));
                }
              }}
                className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-ring" />
              <span className="text-sm text-muted-foreground">Unknown Respondent</span>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Full Name" value={form["respondent_name"] || ""} onChange={(v) => updateForm("respondent_name", v)} required placeholder="e.g. Juan Santos" disabled={form.respondent_unknown === "yes"} />
            <FormInput label="Contact Number" value={form["respondent_contact"] || ""} onChange={(v) => updateForm("respondent_contact", v)} placeholder="e.g. 0918-234-5678" disabled={form.respondent_unknown === "yes"} />
          </div>
          <FormInput label="Address" value={form["respondent_address"] || ""} onChange={(v) => updateForm("respondent_address", v)} placeholder="e.g. Purok Rosal, Mabini St." disabled={form.respondent_unknown === "yes"} />
        </div>
      );
      case 2: return (
        <div className="space-y-4">
          <div>
            <FormTextarea label="Incident Narrative" value={form["narrative"] || ""} onChange={(v) => updateForm("narrative", v)} required rows={4} placeholder="Describe the incident in detail. Include what happened, when, where, and how it was reported." />
            <p className="text-[10px] text-muted-foreground mt-1">Include: what happened, when, where, who was involved, and any witnesses.</p>
          </div>
          <FormTextarea label="Action Taken" value={form["action_taken"] || ""} onChange={(v) => updateForm("action_taken", v)} rows={3} placeholder="e.g. Forwarded to PNP, mediation conducted, parties summoned..." />
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Recorded By" value={form["recorded_by"] || ""} onChange={(v) => updateForm("recorded_by", v)} required placeholder="e.g. Secretary Santos" />
            <FormInput label="Witness Names" value={form["witness_names"] || ""} onChange={(v) => updateForm("witness_names", v)} placeholder="e.g. Juan Dela Cruz, Maria Santos" />
          </div>
          <FormInput label="Evidence / Attachments Note" value={form["evidence_notes"] || ""} onChange={(v) => updateForm("evidence_notes", v)} placeholder="e.g. CCTV footage saved, medical certificate attached" />
        </div>
      );
      default: return null;
    }
  };

  const closeFormModal = () => { setShowCreate(false); setShowEdit(false); };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blotter Records"
        description="Record and track barangay incident reports"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Judicial" }, { label: "Blotter Records" }]}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><Download className="h-4 w-4" /> Export</button>
            <button onClick={openRecordModal} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}><Plus className="h-4 w-4" /> Record Blotter</button>
          </div>
        }
      />

      {/* Mabini AI Insight */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-accent-primary/20 bg-accent-bg/30">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--accent-primary)", opacity: 0.15 }}>
          <Bot className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Mabini AI Blotter Analysis</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            2 open cases pending resolution for over 7 days. Theft incidents increased 25% this month compared to last. Purok 3 has the highest incident density.
          </p>
        </div>
        <button onClick={() => router.push("/dashboard/ai")} className="shrink-0 px-3 py-1.5 text-[10px] font-semibold rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--accent-primary)", color: "#fff" }}>
          Ask Mabini
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Records" value={mockBlotters.length} icon={<Gavel className="h-5 w-5" />} />
        <StatCard label="Active / Open" value={activeCount} icon={<AlertTriangle className="h-5 w-5" />} trend={{ value: -1, label: "this month" }} />
        <StatCard label="Resolved / Closed" value={resolvedCount} icon={<Shield className="h-5 w-5" />} />
        <StatCard label="This Month" value={mockBlotters.filter((b) => b.incident_date >= "2026-03-01").length} icon={<Calendar className="h-5 w-5" />} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by blotter number, party names, or type..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={cn("flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors",
              showFilters ? "border-accent-primary bg-accent-bg text-accent-text" : "border-border hover:bg-muted")}>
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg glass-subtle">
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
              {incidentTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
              {statusOptions.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => { setTypeFilter("All Types"); setStatusFilter("All Status"); }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /> Clear</button>
          </div>
        )}
      </div>

      {/* Blotter Cards */}
      <div className="space-y-3">
        {paged.length === 0 ? (
          <div className="p-16 text-center rounded-xl glass">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"><Shield className="w-6 h-6 text-muted-foreground" /></div>
              <div>
                <p className="text-sm font-medium text-foreground">No blotter records found</p>
                <p className="text-xs text-muted-foreground mt-1">All clear! Record new incidents as they are reported to the barangay.</p>
              </div>
              <button onClick={() => openRecordModal()} className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white hover:opacity-90" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>+ Record Blotter</button>
            </div>
          </div>
        ) : (
          paged.map((b) => (
            <div key={b.id} className="p-5 rounded-xl glass hover:shadow-md transition-all"
              style={{ borderLeftWidth: "4px", borderLeftColor: statusColor(b.status) }}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1 cursor-pointer" onClick={() => setViewBlotter(b)}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${statusColor(b.status)}15` }}>
                    <Gavel className="h-5 w-5" style={{ color: statusColor(b.status) }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-foreground">{b.blotter_number}</span>
                      <StatusBadge status={b.status} />
                      <Badge variant="muted">{b.incident_type}</Badge>
                      {b.severity === "High" && <Badge variant="danger">High Severity</Badge>}
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{b.narrative}</p>
                    <div className="flex items-center gap-4 mt-2 text-[12px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {b.complainant_name} vs. {b.respondent_name}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {b.incident_purok}, {b.incident_location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 shrink-0 ml-4">
                  <div className="text-right">
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end"><Calendar className="h-3 w-3" /> {b.incident_date}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5"><Clock className="h-3 w-3 inline mr-1" />{b.incident_time}</p>
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
                        <div className="absolute right-0 top-8 z-50 w-48 py-1 rounded-lg glass shadow-lg">
                          <button onClick={() => openViewFromAction(b)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                            <Eye className="h-4 w-4" /> View Details
                          </button>
                          <button onClick={() => openEditBlotter(b)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                            <Edit className="h-4 w-4" /> Edit
                          </button>
                          <button onClick={() => openUpdateStatus(b)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                            <RefreshCw className="h-4 w-4" /> Update Status
                          </button>
                          <button onClick={() => { setActionMenuOpen(null); }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                            <Printer className="h-4 w-4" /> Print Report
                          </button>
                          <div className="border-t border-border my-1" />
                          <button onClick={() => openDeleteBlotter(b)}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing {start + 1}–{Math.min(start + pageSize, filtered.length)} of {filtered.length}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={safePage <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronsLeft className="h-4 w-4" /></button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
            <span className="px-3 py-1 text-sm">{safePage} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
            <button onClick={() => setPage(totalPages)} disabled={safePage >= totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronsRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {/* Record / Edit Blotter Form Modal */}
      <Modal open={showCreate || showEdit} onClose={closeFormModal} title={showEdit ? "Edit Blotter Record" : "Record Blotter"} description={showEdit ? "Update an existing incident report" : "File a new barangay incident report"} size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
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
                <ModalButton variant="primary" onClick={() => { if (validateForm()) { addToast(showEdit ? "Blotter Updated" : "Blotter Recorded"); closeFormModal(); } }}>
                  <Save className="w-4 h-4 mr-1" /> {showEdit ? "Update" : "Record Blotter"}
                </ModalButton>
              )}
            </div>
          </div>
        }>
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
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

      {/* Delete Confirmation Modal */}
      <Modal open={showDelete} onClose={() => { setShowDelete(false); setDeleteTarget(null); }} title="Delete Blotter Record" size="sm"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { setShowDelete(false); setDeleteTarget(null); }}>Cancel</ModalButton>
            <ModalButton variant="danger" onClick={() => { addToast("Record Deleted"); setShowDelete(false); setDeleteTarget(null); }}>Delete Record</ModalButton>
          </>
        }>
        {deleteTarget && (
          <div className="space-y-3">
            <p className="text-sm text-foreground">Are you sure you want to delete blotter record <span className="font-bold">{deleteTarget.blotter_number}</span>?</p>
            <p className="text-sm text-muted-foreground">This action cannot be undone. The record for &ldquo;{deleteTarget.incident_type}&rdquo; involving {deleteTarget.complainant_name} vs. {deleteTarget.respondent_name} will be permanently removed.</p>
          </div>
        )}
      </Modal>

      {/* View Blotter Modal */}
      <Modal open={!!viewBlotter} onClose={() => setViewBlotter(null)} title={viewBlotter?.blotter_number || ""} description={`${viewBlotter?.incident_type} — ${viewBlotter?.incident_date}`} size="lg"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setViewBlotter(null)}>Close</ModalButton>
            <ModalButton variant="primary" onClick={openEditFromView}>Update Record</ModalButton>
          </>
        }>
        {viewBlotter && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <StatusBadge status={viewBlotter.status} />
              <Badge variant="muted">{viewBlotter.incident_type}</Badge>
              {viewBlotter.severity && (
                <Badge variant={viewBlotter.severity === "High" ? "danger" : viewBlotter.severity === "Medium" ? "warning" : "muted"}>
                  {viewBlotter.severity} Severity
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg glass-subtle">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Complainant</p>
                <p className="text-sm text-foreground font-medium">{viewBlotter.complainant_name}</p>
                {viewBlotter.complainant_contact && <p className="text-xs text-muted-foreground mt-1">{viewBlotter.complainant_contact}</p>}
                {viewBlotter.complainant_address && <p className="text-xs text-muted-foreground">{viewBlotter.complainant_address}</p>}
              </div>
              <div className="p-4 rounded-lg glass-subtle">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Respondent</p>
                <p className="text-sm text-foreground font-medium">{viewBlotter.respondent_name}</p>
                {viewBlotter.respondent_contact && <p className="text-xs text-muted-foreground mt-1">{viewBlotter.respondent_contact}</p>}
                {viewBlotter.respondent_address && <p className="text-xs text-muted-foreground">{viewBlotter.respondent_address}</p>}
              </div>
            </div>
            <div className="p-4 rounded-lg glass-subtle">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Incident Narrative</p>
              <p className="text-sm text-foreground leading-relaxed">{viewBlotter.narrative}</p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div><p className="text-[11px] text-muted-foreground uppercase">Date & Time</p><p className="text-sm">{viewBlotter.incident_date} at {viewBlotter.incident_time}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Location</p><p className="text-sm">{viewBlotter.incident_purok}, {viewBlotter.incident_location}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Recorded By</p><p className="text-sm">{viewBlotter.recorded_by}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Recorded At</p><p className="text-sm">{viewBlotter.recorded_at}</p></div>
              {viewBlotter.witness_names && <div><p className="text-[11px] text-muted-foreground uppercase">Witnesses</p><p className="text-sm">{viewBlotter.witness_names}</p></div>}
              {viewBlotter.evidence_notes && <div><p className="text-[11px] text-muted-foreground uppercase">Evidence / Attachments</p><p className="text-sm">{viewBlotter.evidence_notes}</p></div>}
            </div>
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
              <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">Action Taken</p>
              <p className="text-sm text-emerald-800 dark:text-emerald-300">{viewBlotter.action_taken || "No action recorded yet."}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="flex items-center gap-2 px-4 py-3 rounded-lg glass shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-200">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-sm font-medium text-foreground">{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="ml-2 text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>

      {/* Update Status Modal */}
      <Modal open={showUpdateStatus} onClose={() => { setShowUpdateStatus(false); setUpdateTarget(null); }} title="Update Blotter Status" description={updateTarget?.blotter_number || ""} size="sm"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { setShowUpdateStatus(false); setUpdateTarget(null); }}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={() => { addToast("Status Updated"); setShowUpdateStatus(false); setUpdateTarget(null); }}>
              <Save className="w-4 h-4 mr-1" /> Update Status
            </ModalButton>
          </>
        }>
        {updateTarget && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Current Status</p>
              <StatusBadge status={updateTarget.status} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">New Status<span className="text-red-500 ml-0.5">*</span></label>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
                {updateStatusOptions.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
