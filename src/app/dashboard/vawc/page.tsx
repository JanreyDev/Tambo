"use client";

import { useState, useCallback } from "react";
import {
  Shield,
  ShieldAlert,
  Plus,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  AlertTriangle,
  Calendar,
  Users,
  Lock,
  EyeOff,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Save,
  MapPin,
  Bot,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

interface VawcCase {
  id: string;
  case_number: string;
  case_type: string;
  complainant_name: string;
  complainant_relationship: string;
  respondent_name: string;
  incident_date: string;
  report_date: string;
  status: string;
  risk_level: string;
  protection_order: boolean;
  referred_to: string;
  case_officer: string;
  is_confidential: boolean;
  // Extended fields for form
  victim_age: string;
  victim_sex: string;
  victim_civil_status: string;
  victim_contact: string;
  victim_address: string;
  perpetrator_age: string;
  perpetrator_sex: string;
  incident_location: string;
  narrative: string;
  protection_order_type: string;
  referral: string;
  action_taken: string;
}

const mockCases: VawcCase[] = [
  { id: "1", case_number: "VAWC-2026-001", case_type: "Physical Violence", complainant_name: "Complainant A", complainant_relationship: "Spouse", respondent_name: "Respondent A", incident_date: "2026-03-01", report_date: "2026-03-02", status: "active", risk_level: "high", protection_order: true, referred_to: "PNP Women's Desk", case_officer: "Kag. Reyes", is_confidential: true, victim_age: "32", victim_sex: "Female", victim_civil_status: "Married", victim_contact: "0917-XXX-XXXX", victim_address: "Purok Sampaguita", perpetrator_age: "35", perpetrator_sex: "Male", incident_location: "Residence - Purok Sampaguita", narrative: "Victim reported being physically assaulted by spouse after a verbal argument. Visible bruising on arms and face.", protection_order_type: "BPO Issued", referral: "PNP", action_taken: "BPO issued. Victim referred to PNP Women's Desk for formal complaint." },
  { id: "2", case_number: "VAWC-2026-002", case_type: "Economic Abuse", complainant_name: "Complainant B", complainant_relationship: "Live-in Partner", respondent_name: "Respondent B", incident_date: "2026-02-15", report_date: "2026-02-16", status: "active", risk_level: "medium", protection_order: false, referred_to: "DSWD", case_officer: "Kag. Lopez", is_confidential: true, victim_age: "28", victim_sex: "Female", victim_civil_status: "Cohabiting", victim_contact: "0918-XXX-XXXX", victim_address: "Purok Rosal", perpetrator_age: "31", perpetrator_sex: "Male", incident_location: "Shared residence - Purok Rosal", narrative: "Victim reported being denied access to household finances and prevented from seeking employment by live-in partner.", protection_order_type: "None", referral: "DSWD", action_taken: "Referred to DSWD for social welfare assistance and counseling." },
  { id: "3", case_number: "VAWC-2025-008", case_type: "Psychological Violence", complainant_name: "Complainant C", complainant_relationship: "Spouse", respondent_name: "Respondent C", incident_date: "2025-11-20", report_date: "2025-11-22", status: "resolved", risk_level: "medium", protection_order: true, referred_to: "Legal Aid", case_officer: "Kag. Reyes", is_confidential: true, victim_age: "40", victim_sex: "Female", victim_civil_status: "Married", victim_contact: "0919-XXX-XXXX", victim_address: "Purok Dahlia", perpetrator_age: "43", perpetrator_sex: "Male", incident_location: "Family home - Purok Dahlia", narrative: "Victim reported ongoing verbal threats, intimidation, and controlling behavior by spouse over several months.", protection_order_type: "TPO Filed", referral: "Legal Aid", action_taken: "TPO filed. Victim received legal aid counseling. Perpetrator attended mandatory counseling." },
  { id: "4", case_number: "VAWC-2025-005", case_type: "Physical Violence", complainant_name: "Complainant D", complainant_relationship: "Parent", respondent_name: "Respondent D", incident_date: "2025-09-10", report_date: "2025-09-10", status: "closed", risk_level: "high", protection_order: true, referred_to: "PNP Women's Desk, DSWD", case_officer: "Kag. Lopez", is_confidential: true, victim_age: "16", victim_sex: "Female", victim_civil_status: "Single", victim_contact: "", victim_address: "Purok Ilang-Ilang", perpetrator_age: "45", perpetrator_sex: "Male", incident_location: "Victim's home - Purok Ilang-Ilang", narrative: "Minor victim reported physical abuse by parent. Visible injuries documented. Child was placed under protective custody.", protection_order_type: "PPO Filed", referral: "DSWD", action_taken: "PPO filed. Minor placed under DSWD protective custody. Criminal complaint filed with PNP." },
  { id: "5", case_number: "VAWC-2026-003", case_type: "Sexual Violence", complainant_name: "Complainant E", complainant_relationship: "Former Partner", respondent_name: "Respondent E", incident_date: "2026-03-04", report_date: "2026-03-05", status: "under_investigation", risk_level: "high", protection_order: false, referred_to: "PNP", case_officer: "Kag. Reyes", is_confidential: true, victim_age: "25", victim_sex: "Female", victim_civil_status: "Single", victim_contact: "0920-XXX-XXXX", victim_address: "Purok Orchid", perpetrator_age: "29", perpetrator_sex: "Male", incident_location: "Respondent's residence", narrative: "Victim reported sexual assault by former partner. Case under investigation by PNP.", protection_order_type: "None", referral: "PNP", action_taken: "Case forwarded to PNP for criminal investigation. Victim referred to hospital for medical examination." },
];

const caseTypes = ["All Types", "Physical Violence", "Sexual Violence", "Psychological Violence", "Economic Abuse"];
const riskLevels = ["All Risk", "High", "Medium", "Low"];
const incidentTypeOptions = ["Physical Violence", "Sexual Violence", "Psychological Violence", "Economic Abuse"];
const victimSexOptions = ["Female", "Male"];
const civilStatusOptions = ["Single", "Married", "Cohabiting", "Separated", "Widowed"];
const perpetratorSexOptions = ["Male", "Female"];
const relationshipOptions = ["Spouse", "Live-in Partner", "Former Partner", "Parent", "Sibling", "Other Relative", "Others"];
const protectionOrderOptions = ["None", "BPO Issued", "TPO Filed", "PPO Filed"];
const referralOptions = ["None", "PNP", "DSWD", "Hospital", "Legal Aid", "Women's Desk"];
const caseStatusOptions = ["Active", "Under Investigation", "Referred", "Resolved", "Closed"];

const emptyForm: Record<string, string> = {
  victim_name: "", victim_age: "", victim_sex: "", victim_civil_status: "", victim_contact: "", victim_address: "",
  perpetrator_name: "", perpetrator_age: "", perpetrator_sex: "", relationship_to_victim: "",
  incident_type: "", incident_date: "", incident_location: "", narrative: "",
  protection_order: "", referral: "", action_taken: "", status: "",
};

// ── Form Field Components (module-level) ──
function FormInput({ label, value, onChange, required, type = "text", placeholder = "", error }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string; placeholder?: string; error?: string }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={cn("w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring", error ? "border-red-500" : "border-border")} />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormSelect({ label, value, onChange, options, required, error }: { label: string; value: string; onChange: (value: string) => void; options: string[]; required?: boolean; error?: string }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className={cn("w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring", error ? "border-red-500" : "border-border")}>
        <option value="">-- Select --</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormTextarea({ label, value, onChange, required, rows = 3, placeholder = "", colSpan2 = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; rows?: number; placeholder?: string; colSpan2?: boolean }) {
  return (
    <div className={colSpan2 ? "col-span-2" : undefined}>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none" />
    </div>
  );
}

export default function VawcPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [riskFilter, setRiskFilter] = useState("All Risk");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [viewCase, setViewCase] = useState<VawcCase | null>(null);
  const pageSize = 10;

  // Create / Edit form
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [formTab, setFormTab] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({ ...emptyForm });

  // Delete confirmation
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VawcCase | null>(null);

  // Form validation
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Action menu
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  // Toast system
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);
  const showToast = useCallback((message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const filtered = mockCases.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      if (!c.case_number.toLowerCase().includes(q) && !c.case_type.toLowerCase().includes(q)) return false;
    }
    if (typeFilter !== "All Types" && c.case_type !== typeFilter) return false;
    if (riskFilter !== "All Risk" && c.risk_level !== riskFilter.toLowerCase()) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  const activeCount = mockCases.filter((c) => c.status === "active" || c.status === "under_investigation").length;
  const highRiskCount = mockCases.filter((c) => c.risk_level === "high").length;
  const withPO = mockCases.filter((c) => c.protection_order).length;

  const riskColor = (level: string) => {
    switch (level) { case "high": return "danger"; case "medium": return "warning"; default: return "muted"; }
  };

  const riskBorderColor = (level: string) => {
    switch (level) { case "high": return "#ef4444"; case "medium": return "#f59e0b"; default: return "#64748b"; }
  };

  // -- Form helpers --
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
    // Required fields
    if (!form["incident_type"]?.trim()) errors["incident_type"] = "Type of violence is required";
    if (!form["incident_date"]?.trim()) errors["incident_date"] = "Incident date is required";
    if (!form["victim_name"]?.trim()) errors["victim_name"] = "Victim name is required";
    if (!form["victim_age"]?.trim()) errors["victim_age"] = "Victim age is required";
    if (!form["perpetrator_name"]?.trim()) errors["perpetrator_name"] = "Perpetrator name is required";
    if (!form["relationship_to_victim"]?.trim()) errors["relationship_to_victim"] = "Relationship to victim is required";
    // VAWC-specific validation
    if (form["victim_age"]?.trim()) {
      const age = Number(form["victim_age"]);
      if (isNaN(age) || age < 0 || age > 150 || !Number.isInteger(age)) {
        errors["victim_age"] = "Enter a valid age (0-150)";
      }
    }
    if (form["incident_date"]?.trim()) {
      const incidentDate = new Date(form["incident_date"]);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (incidentDate > today) {
        errors["incident_date"] = "Incident date cannot be in the future";
      }
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      // Navigate to the first tab that has errors
      const tabFieldMap: Record<number, string[]> = {
        0: ["victim_name", "victim_age"],
        1: ["perpetrator_name", "relationship_to_victim"],
        2: ["incident_type", "incident_date"],
        3: [],
      };
      for (let t = 0; t < 4; t++) {
        if (tabFieldMap[t].some((f) => errors[f])) { setFormTab(t); break; }
      }
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (validateForm()) {
      showToast(showEdit ? "Case Updated" : "VAWC Case Recorded");
      closeFormModal();
    }
  };

  const openCreateCase = () => {
    setForm({ ...emptyForm });
    setFormErrors({});
    setFormTab(0);
    setShowCreate(true);
  };

  const openEditCase = (c: VawcCase) => {
    setForm({
      victim_name: c.complainant_name,
      victim_age: c.victim_age,
      victim_sex: c.victim_sex,
      victim_civil_status: c.victim_civil_status,
      victim_contact: c.victim_contact,
      victim_address: c.victim_address,
      perpetrator_name: c.respondent_name,
      perpetrator_age: c.perpetrator_age,
      perpetrator_sex: c.perpetrator_sex,
      relationship_to_victim: c.complainant_relationship,
      incident_type: c.case_type,
      incident_date: c.incident_date,
      incident_location: c.incident_location,
      narrative: c.narrative,
      protection_order: c.protection_order_type,
      referral: c.referral,
      action_taken: c.action_taken,
      status: c.status.charAt(0).toUpperCase() + c.status.slice(1).replace("_", " "),
    });
    setFormErrors({});
    setFormTab(0);
    setShowEdit(true);
    setActionMenu(null);
  };

  const openDeleteCase = (c: VawcCase) => {
    setDeleteTarget(c);
    setShowDelete(true);
    setActionMenu(null);
  };

  const openViewFromAction = (c: VawcCase) => {
    setViewCase(c);
    setActionMenu(null);
  };

  const openEditFromView = () => {
    if (!viewCase) return;
    const c = viewCase;
    setViewCase(null);
    openEditCase(c);
  };

  const closeFormModal = () => { setShowCreate(false); setShowEdit(false); };

  const formTabs = ["Victim Information", "Perpetrator", "Incident", "Action"];

  // -- Render Form Tab Content --
  const renderFormTab = () => {
    switch (formTab) {
      case 0: return (
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Victim Name" value={form["victim_name"] || ""} onChange={(v) => updateForm("victim_name", v)} required placeholder="Full name (anonymized in records)" error={formErrors["victim_name"]} />
          <FormInput label="Age" value={form["victim_age"] || ""} onChange={(v) => updateForm("victim_age", v)} type="number" required placeholder="e.g. 28" error={formErrors["victim_age"]} />
          <FormSelect label="Sex" value={form["victim_sex"] || ""} onChange={(v) => updateForm("victim_sex", v)} options={victimSexOptions} required />
          <FormSelect label="Civil Status" value={form["victim_civil_status"] || ""} onChange={(v) => updateForm("victim_civil_status", v)} options={civilStatusOptions} required />
          <FormInput label="Contact Number" value={form["victim_contact"] || ""} onChange={(v) => updateForm("victim_contact", v)} placeholder="e.g. 0917-XXX-XXXX" />
          <FormInput label="Address" value={form["victim_address"] || ""} onChange={(v) => updateForm("victim_address", v)} placeholder="Purok / Street" />
        </div>
      );
      case 1: return (
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Perpetrator Name" value={form["perpetrator_name"] || ""} onChange={(v) => updateForm("perpetrator_name", v)} required placeholder="Full name" error={formErrors["perpetrator_name"]} />
          <FormInput label="Age" value={form["perpetrator_age"] || ""} onChange={(v) => updateForm("perpetrator_age", v)} type="number" placeholder="e.g. 35" />
          <FormSelect label="Sex" value={form["perpetrator_sex"] || ""} onChange={(v) => updateForm("perpetrator_sex", v)} options={perpetratorSexOptions} required />
          <FormSelect label="Relationship to Victim" value={form["relationship_to_victim"] || ""} onChange={(v) => updateForm("relationship_to_victim", v)} options={relationshipOptions} required error={formErrors["relationship_to_victim"]} />
        </div>
      );
      case 2: return (
        <div className="grid grid-cols-2 gap-4">
          <FormSelect label="Type of Violence" value={form["incident_type"] || ""} onChange={(v) => updateForm("incident_type", v)} options={incidentTypeOptions} required error={formErrors["incident_type"]} />
          <FormInput label="Date of Incident" value={form["incident_date"] || ""} onChange={(v) => updateForm("incident_date", v)} type="date" required error={formErrors["incident_date"]} />
          <div className="col-span-2">
            <FormInput label="Location of Incident" value={form["incident_location"] || ""} onChange={(v) => updateForm("incident_location", v)} placeholder="e.g. Residence - Purok Sampaguita" />
          </div>
          <FormTextarea label="Incident Narrative" value={form["narrative"] || ""} onChange={(v) => updateForm("narrative", v)} required rows={5} placeholder="Describe the incident in detail. Include what happened, injuries observed, and circumstances." colSpan2 />
        </div>
      );
      case 3: return (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormSelect label="Protection Order Type" value={form["protection_order"] || ""} onChange={(v) => updateForm("protection_order", v)} options={protectionOrderOptions} required />
            <p className="text-[10px] text-muted-foreground mt-1">BPO = Barangay Protection Order (issued by Punong Barangay). TPO = Temporary (court). PPO = Permanent (court).</p>
          </div>
          <FormSelect label="Referral" value={form["referral"] || ""} onChange={(v) => updateForm("referral", v)} options={referralOptions} required />
          <FormTextarea label="Action Taken" value={form["action_taken"] || ""} onChange={(v) => updateForm("action_taken", v)} rows={3} placeholder="e.g. BPO issued, referred to PNP Women's Desk, victim placed in shelter..." colSpan2 />
          <div className="col-span-2">
            <FormSelect label="Case Status" value={form["status"] || ""} onChange={(v) => updateForm("status", v)} options={caseStatusOptions} required />
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="VAWC Records"
        description="Violence Against Women and Children case management"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "VAWC Records" }]}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><Download className="h-4 w-4" /> Export</button>
            <button onClick={openCreateCase} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}><Plus className="h-4 w-4" /> Record VAWC Case</button>
          </div>
        }
      />

      {/* Mabini AI Insight */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-accent-primary/20 bg-accent-bg/30">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--accent-primary)", opacity: 0.15 }}>
          <Bot className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Mabini AI VAWC Case Monitor</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            2 high-risk cases require immediate follow-up. 1 BPO expiring within 15 days — consider TPO filing. Physical violence cases account for 60% of records this quarter.
          </p>
        </div>
        <button onClick={() => router.push("/dashboard/ai")} className="shrink-0 px-3 py-1.5 text-[10px] font-semibold rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--accent-primary)", color: "#fff" }}>
          Ask Mabini
        </button>
      </div>

      {/* RA 9262 Confidential Banner */}
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 flex items-start gap-3">
        <Shield className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-red-800 dark:text-red-200">CONFIDENTIAL - RA 9262 Protected Information</p>
          <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">All VAWC case records are protected under Republic Act No. 9262 (Anti-Violence Against Women and Their Children Act) and RA 10173 (Data Privacy Act). Unauthorized disclosure is punishable by law. Access is restricted to authorized case officers only.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Cases" value={mockCases.length} icon={<Shield className="h-5 w-5" />} />
        <StatCard label="Active Cases" value={activeCount} icon={<AlertTriangle className="h-5 w-5" />} />
        <StatCard label="High Risk" value={highRiskCount} icon={<AlertTriangle className="h-5 w-5" />} />
        <StatCard label="Protection Orders" value={withPO} icon={<Lock className="h-5 w-5" />} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by case number or type..."
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
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
              {caseTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select value={riskFilter} onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
              {riskLevels.map((r) => <option key={r}>{r}</option>)}
            </select>
            <button onClick={() => { setTypeFilter("All Types"); setRiskFilter("All Risk"); }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /> Clear</button>
          </div>
        )}
      </div>

      {/* Case Cards */}
      <div className="space-y-3">
        {paged.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-border bg-card flex flex-col items-center gap-3">
            <ShieldAlert className="h-10 w-10 text-muted-foreground/50" />
            <div>
              <p className="text-sm font-medium text-foreground">No VAWC cases recorded</p>
              <p className="text-xs text-muted-foreground mt-1">Cases will be recorded here with full confidentiality under RA 9262.</p>
            </div>
          </div>
        ) : (
          paged.map((c) => (
            <div key={c.id} className="p-5 rounded-xl border bg-card hover:shadow-md transition-all"
              style={{ borderLeftWidth: "4px", borderLeftColor: riskBorderColor(c.risk_level) }}>
              <div className="flex items-start justify-between">
                <div className="flex-1 cursor-pointer" onClick={() => setViewCase(c)}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-foreground">{c.case_number}</span>
                    <StatusBadge status={c.status} />
                    <Badge variant={riskColor(c.risk_level) as "danger" | "warning" | "muted"}>{c.risk_level.toUpperCase()} RISK</Badge>
                    {c.protection_order && <Badge variant="info">PO Issued</Badge>}
                  </div>
                  <p className="text-sm text-foreground">{c.case_type}</p>
                  <div className="flex items-center gap-4 mt-2 text-[12px] text-muted-foreground">
                    <span className="flex items-center gap-1"><EyeOff className="h-3 w-3" /> Confidential parties</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {c.complainant_relationship}</span>
                    <span>Referred: {c.referred_to}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 shrink-0 ml-4">
                  <div className="text-right">
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end"><Calendar className="h-3 w-3" /> {c.incident_date}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Officer: {c.case_officer}</p>
                  </div>
                  {/* Action Menu */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setActionMenu(actionMenu === c.id ? null : c.id)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {actionMenu === c.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setActionMenu(null)} />
                        <div className="absolute right-0 top-8 z-50 w-48 py-1 rounded-lg border border-border bg-card shadow-lg">
                          <button onClick={() => openViewFromAction(c)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                            <Eye className="h-4 w-4" /> View Details
                          </button>
                          <button onClick={() => openEditCase(c)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                            <Edit className="h-4 w-4" /> Edit
                          </button>
                          <div className="border-t border-border my-1" />
                          <button onClick={() => openDeleteCase(c)}
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

      {/* Record / Edit VAWC Case Form Modal */}
      <Modal open={showCreate || showEdit} onClose={closeFormModal} title={showEdit ? "Edit VAWC Case" : "Record VAWC Case"} description={showEdit ? "Update an existing VAWC case record" : "File a new VAWC case report"} size="lg"
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
                <ModalButton variant="primary" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-1" /> {showEdit ? "Update" : "Save"}
                </ModalButton>
              )}
            </div>
          </div>
        }>
        {/* RA 9262 Notice inside form */}
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 mb-4 flex items-center gap-2">
          <Lock className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-xs text-red-700 dark:text-red-300">This record is protected under RA 9262. All information is strictly confidential.</p>
        </div>
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
      <Modal open={showDelete} onClose={() => { setShowDelete(false); setDeleteTarget(null); }} title="Delete VAWC Case" size="sm"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { setShowDelete(false); setDeleteTarget(null); }}>Cancel</ModalButton>
            <ModalButton variant="danger" onClick={() => { showToast("Case Deleted"); setShowDelete(false); setDeleteTarget(null); }}>Delete Case</ModalButton>
          </>
        }>
        {deleteTarget && (
          <div className="space-y-3">
            <p className="text-sm text-foreground">Are you sure you want to delete case <span className="font-bold">{deleteTarget.case_number}</span>?</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={riskColor(deleteTarget.risk_level) as "danger" | "warning" | "muted"}>{deleteTarget.risk_level.toUpperCase()} RISK</Badge>
              <span className="text-xs text-muted-foreground">{deleteTarget.case_type}</span>
            </div>
            <p className="text-sm text-muted-foreground">This will permanently remove this VAWC case record. This action cannot be undone and may affect ongoing investigations or protection orders.</p>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
              <p className="text-xs text-amber-700 dark:text-amber-300">Note: Deletion of VAWC records may be subject to RA 9262 and RA 10173 data retention requirements.</p>
            </div>
          </div>
        )}
      </Modal>

      {/* View Case Modal */}
      <Modal open={!!viewCase} onClose={() => setViewCase(null)} title={viewCase?.case_number || ""} description={viewCase?.case_type || ""} size="lg"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setViewCase(null)}>Close</ModalButton>
            <ModalButton variant="primary" onClick={openEditFromView}>Update Case</ModalButton>
          </>
        }>
        {viewCase && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <StatusBadge status={viewCase.status} />
              <Badge variant={riskColor(viewCase.risk_level) as "danger" | "warning" | "muted"}>{viewCase.risk_level.toUpperCase()} RISK</Badge>
              {viewCase.protection_order && <Badge variant="info">Protection Order Issued</Badge>}
            </div>
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
              <p className="text-xs font-medium text-red-700 dark:text-red-400 uppercase mb-1">Confidential Notice</p>
              <p className="text-sm text-red-800 dark:text-red-300">Party names are anonymized per RA 9262. Full details accessible to authorized case officers only.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-border">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Victim</p>
                <p className="text-sm text-foreground font-medium">{viewCase.complainant_name}</p>
                <p className="text-xs text-muted-foreground mt-1">Age: {viewCase.victim_age} | Sex: {viewCase.victim_sex}</p>
                <p className="text-xs text-muted-foreground">Status: {viewCase.victim_civil_status}</p>
                {viewCase.victim_address && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> {viewCase.victim_address}</p>}
              </div>
              <div className="p-4 rounded-lg border border-border">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Perpetrator</p>
                <p className="text-sm text-foreground font-medium">{viewCase.respondent_name}</p>
                <p className="text-xs text-muted-foreground mt-1">Age: {viewCase.perpetrator_age} | Sex: {viewCase.perpetrator_sex}</p>
                <p className="text-xs text-muted-foreground">Relationship: {viewCase.complainant_relationship}</p>
              </div>
            </div>
            {viewCase.narrative && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Incident Narrative</p>
                <p className="text-sm text-foreground leading-relaxed">{viewCase.narrative}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div><p className="text-[11px] text-muted-foreground uppercase">Incident Date</p><p className="text-sm">{viewCase.incident_date}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Report Date</p><p className="text-sm">{viewCase.report_date}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Location</p><p className="text-sm">{viewCase.incident_location}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Case Officer</p><p className="text-sm">{viewCase.case_officer}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Protection Order</p><p className="text-sm">{viewCase.protection_order_type}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Referred To</p><p className="text-sm">{viewCase.referred_to}</p></div>
            </div>
            {viewCase.action_taken && (
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
                <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">Action Taken</p>
                <p className="text-sm text-emerald-800 dark:text-emerald-300">{viewCase.action_taken}</p>
              </div>
            )}
          </div>
        )}
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
