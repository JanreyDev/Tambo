"use client";

import { useState } from "react";
import {
  Scale,
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
  Users,
  FileText,
  Calendar,
  AlertTriangle,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Printer,
  Save,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

interface KpCase {
  id: string;
  case_number: string;
  title: string;
  case_type: string;
  complainants: string[];
  respondents: string[];
  complainant_contact: string;
  complainant_address: string;
  respondent_contact: string;
  respondent_address: string;
  status: string;
  date_filed: string;
  next_hearing: string;
  hearing_count: number;
  lupon_chairman: string;
  remarks: string;
  description: string;
  relief_sought: string;
}

const mockCases: KpCase[] = [
  { id: "1", case_number: "KP-2026-001", title: "Boundary Dispute - Lot 45/46", case_type: "Property Dispute", complainants: ["Maria Dela Cruz"], respondents: ["Juan Santos"], complainant_contact: "09171234567", complainant_address: "Purok Sampaguita, Rizal St.", respondent_contact: "09281234567", respondent_address: "Purok Sampaguita, Rizal St.", status: "mediation", date_filed: "2026-01-15", next_hearing: "2026-03-15", hearing_count: 3, lupon_chairman: "Kap. Ricardo Reyes", remarks: "Parties agreed to survey. Pending results.", description: "Complainant alleges respondent encroached on her property boundary by approximately 2 meters when building a concrete fence.", relief_sought: "Removal of encroaching fence and restoration of original boundary line." },
  { id: "2", case_number: "KP-2026-002", title: "Noise Complaint - Videoke", case_type: "Nuisance", complainants: ["Rosa De Los Santos", "Carlos Rivera"], respondents: ["Mark Chavez"], complainant_contact: "09351234567", complainant_address: "Purok Rosal, Mabini St.", respondent_contact: "09331234567", respondent_address: "Purok Rosal, Mabini St.", status: "filed", date_filed: "2026-02-20", next_hearing: "2026-03-10", hearing_count: 0, lupon_chairman: "Kap. Ricardo Reyes", remarks: "First hearing scheduled.", description: "Respondent operates loud videoke sessions nightly from 10PM to 3AM causing disturbance to multiple households.", relief_sought: "Cease all videoke operations past 10:00 PM as per barangay noise ordinance." },
  { id: "3", case_number: "KP-2026-003", title: "Unpaid Debt - Construction Materials", case_type: "Collection of Sum of Money", complainants: ["Roberto Manalo"], respondents: ["Pedro Reyes"], complainant_contact: "09271234567", complainant_address: "Purok Rosal, Aguinaldo St.", respondent_contact: "09451234567", respondent_address: "Purok Sampaguita, Luna St.", status: "conciliation", date_filed: "2026-02-01", next_hearing: "2026-03-12", hearing_count: 2, lupon_chairman: "Kag. Ana Santos", remarks: "Respondent offered installment plan.", description: "Respondent purchased construction materials worth P45,000 on credit and has not paid for over 6 months despite repeated demands.", relief_sought: "Full payment of P45,000 plus interest at legal rate." },
  { id: "4", case_number: "KP-2025-015", title: "Right of Way Dispute", case_type: "Property Dispute", complainants: ["Angelo Pascual"], respondents: ["Liza Villanueva"], complainant_contact: "09471234567", complainant_address: "Purok Ilang-Ilang, Del Pilar St.", respondent_contact: "09381234567", respondent_address: "Purok Jasmine, Rizal St.", status: "settled", date_filed: "2025-11-10", next_hearing: "", hearing_count: 4, lupon_chairman: "Kap. Ricardo Reyes", remarks: "Settlement agreement signed. Case closed.", description: "Respondent blocked the only access road to complainant's property by constructing a gate.", relief_sought: "Reopening of right of way and permanent easement agreement." },
  { id: "5", case_number: "KP-2025-014", title: "Physical Altercation", case_type: "Physical Injury", complainants: ["Ana Garcia"], respondents: ["Pedro Reyes", "Mark Chavez"], complainant_contact: "09351234567", complainant_address: "Purok Ilang-Ilang, Bonifacio Ave.", respondent_contact: "09451234567", respondent_address: "Purok Sampaguita, Luna St.", status: "for_hearing", date_filed: "2025-10-05", next_hearing: "2026-03-08", hearing_count: 5, lupon_chairman: "Kag. Maria Lopez", remarks: "Multiple postponements. Final hearing set.", description: "Complainant was physically assaulted by respondents during a verbal argument at the public market.", relief_sought: "Formal apology, payment of medical expenses (P8,500), and undertaking to keep peace." },
  { id: "6", case_number: "KP-2025-013", title: "Verbal Harassment", case_type: "Oral Defamation", complainants: ["Josephine Ocampo"], respondents: ["Gloria Tolentino"], complainant_contact: "09421234567", complainant_address: "Purok Orchid, Mabini St.", respondent_contact: "09251234567", respondent_address: "Purok Dahlia, Bonifacio Ave.", status: "dismissed", date_filed: "2025-09-20", next_hearing: "", hearing_count: 2, lupon_chairman: "Kap. Ricardo Reyes", remarks: "Complainant withdrew complaint.", description: "Respondent publicly shouted defamatory remarks against complainant in front of neighbors and passersby.", relief_sought: "Public apology and moral damages." },
];

const caseTypeOptions = ["Property Dispute", "Nuisance", "Collection of Sum of Money", "Physical Injury", "Oral Defamation", "Breach of Contract", "Damage to Property", "Other"];
const caseTypes = ["All Types", ...caseTypeOptions];
const caseStatuses = ["All Status", "Filed", "Mediation", "Conciliation", "Arbitration", "For Hearing", "Settled", "Dismissed", "Closed"];
const statusUpdateOptions = ["Filed", "Mediation", "Conciliation", "Arbitration", "For Hearing", "Settled", "Dismissed"];
const luponChairmen = ["Kap. Ricardo Reyes", "Kag. Ana Santos", "Kag. Maria Lopez", "Kag. Jose Mendoza"];

const emptyForm: Record<string, string> = {
  title: "", case_type: "", date_filed: "",
  complainant_names: "", complainant_contact: "", complainant_address: "",
  respondent_names: "", respondent_contact: "", respondent_address: "",
  description: "", relief_sought: "", lupon_chairman: "", initial_hearing_date: "", notes: "",
};

export default function KpCasesPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [viewCase, setViewCase] = useState<KpCase | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [showFileCase, setShowFileCase] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [formTab, setFormTab] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({ ...emptyForm });
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<KpCase | null>(null);
  const [showScheduleHearing, setShowScheduleHearing] = useState(false);
  const [hearingForm, setHearingForm] = useState<Record<string, string>>({ date: "", time: "", venue: "", notes: "" });
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  const [statusForm, setStatusForm] = useState<Record<string, string>>({ status: "", remarks: "" });
  const pageSize = 10;

  const filtered = mockCases.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      if (!c.title.toLowerCase().includes(q) && !c.case_number.toLowerCase().includes(q)
        && !c.complainants.join(" ").toLowerCase().includes(q) && !c.respondents.join(" ").toLowerCase().includes(q)) return false;
    }
    if (typeFilter !== "All Types" && c.case_type !== typeFilter) return false;
    if (statusFilter !== "All Status" && c.status !== statusFilter.toLowerCase().replace(" ", "_")) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  const activeCount = mockCases.filter((c) => !["settled", "dismissed", "closed"].includes(c.status)).length;
  const settledCount = mockCases.filter((c) => c.status === "settled").length;
  const upcomingHearings = mockCases.filter((c) => c.next_hearing && new Date(c.next_hearing) >= new Date()).length;

  const openFileCase = () => { setForm({ ...emptyForm }); setFormTab(0); setShowFileCase(true); };
  const updateForm = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const openEditCase = (c: KpCase) => {
    setForm({
      title: c.title,
      case_type: c.case_type,
      date_filed: c.date_filed,
      complainant_names: c.complainants.join(", "),
      complainant_contact: c.complainant_contact,
      complainant_address: c.complainant_address,
      respondent_names: c.respondents.join(", "),
      respondent_contact: c.respondent_contact,
      respondent_address: c.respondent_address,
      description: c.description,
      relief_sought: c.relief_sought,
      lupon_chairman: c.lupon_chairman,
      initial_hearing_date: c.next_hearing,
      notes: c.remarks,
    });
    setFormTab(0);
    setShowEdit(true);
    setActionMenu(null);
  };

  const openDeleteCase = (c: KpCase) => {
    setDeleteTarget(c);
    setShowDelete(true);
    setActionMenu(null);
  };

  const closeFormModal = () => { setShowFileCase(false); setShowEdit(false); };

  const openScheduleHearing = (c: KpCase) => {
    setViewCase(c);
    setHearingForm({ date: "", time: "", venue: "Barangay Hall", notes: "" });
    setShowScheduleHearing(true);
  };

  const openUpdateStatus = (c: KpCase) => {
    setViewCase(c);
    setStatusForm({ status: c.status, remarks: "" });
    setShowUpdateStatus(true);
  };

  const formTabs = ["Case Info", "Parties", "Details"];

  // -- Form Field Components --
  const Input = ({ label, field, required, type = "text", placeholder = "" }: { label: string; field: string; required?: boolean; type?: string; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type} value={form[field] || ""} onChange={(e) => updateForm(field, e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring" />
    </div>
  );

  const Select = ({ label, field, options, required }: { label: string; field: string; options: string[]; required?: boolean }) => (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select value={form[field] || ""} onChange={(e) => updateForm(field, e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
        <option value="">Select {label}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const Textarea = ({ label, field, required, rows = 3, placeholder = "" }: { label: string; field: string; required?: boolean; rows?: number; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <textarea value={form[field] || ""} onChange={(e) => updateForm(field, e.target.value)} rows={rows} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none" />
    </div>
  );

  // -- Render Form Tab Content --
  const renderFormTab = () => {
    switch (formTab) {
      case 0: return (
        <div className="space-y-4">
          <Input label="Case Title" field="title" required placeholder="e.g. Boundary Dispute - Lot 45/46" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Case Type" field="case_type" options={caseTypeOptions} required />
            <Input label="Date Filed" field="date_filed" type="date" required />
          </div>
        </div>
      );
      case 1: return (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Complainant</h4>
          <div className="grid grid-cols-1 gap-4">
            <Input label="Complainant Name(s)" field="complainant_names" required placeholder="e.g. Maria Dela Cruz (separate multiple with commas)" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Contact Number" field="complainant_contact" placeholder="09XX-XXX-XXXX" />
              <Input label="Address" field="complainant_address" placeholder="e.g. Purok Sampaguita, Rizal St." />
            </div>
          </div>
          <h4 className="text-sm font-semibold text-foreground mt-6">Respondent</h4>
          <div className="grid grid-cols-1 gap-4">
            <Input label="Respondent Name(s)" field="respondent_names" required placeholder="e.g. Juan Santos (separate multiple with commas)" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Contact Number" field="respondent_contact" placeholder="09XX-XXX-XXXX" />
              <Input label="Address" field="respondent_address" placeholder="e.g. Purok Rosal, Mabini St." />
            </div>
          </div>
        </div>
      );
      case 2: return (
        <div className="space-y-4">
          <Textarea label="Brief Description / Facts of the Case" field="description" required rows={4} placeholder="Describe the facts and circumstances of the complaint..." />
          <Input label="Relief / Remedy Sought" field="relief_sought" placeholder="e.g. Payment of damages, removal of structure" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Lupon Chairman" field="lupon_chairman" options={luponChairmen} required />
            <Input label="Initial Hearing Date" field="initial_hearing_date" type="date" />
          </div>
          <Textarea label="Notes" field="notes" rows={2} placeholder="Any additional notes or remarks..." />
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Katarungang Pambarangay Cases"
        description="Manage KP case records, hearings, and settlements"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Judicial" }, { label: "KP Cases" }]}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><Download className="h-4 w-4" /> Export</button>
            <button onClick={openFileCase} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}><Plus className="h-4 w-4" /> File New Case</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Cases" value={mockCases.length} icon={<Scale className="h-5 w-5" />} />
        <StatCard label="Active Cases" value={activeCount} icon={<AlertTriangle className="h-5 w-5" />} trend={{ value: -1, label: "vs last month" }} />
        <StatCard label="Settled" value={settledCount} icon={<FileText className="h-5 w-5" />} trend={{ value: 25, label: "settlement rate" }} />
        <StatCard label="Upcoming Hearings" value={upcomingHearings} icon={<Calendar className="h-5 w-5" />} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by case number, title, or party names..."
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
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
              {caseStatuses.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => { setTypeFilter("All Types"); setStatusFilter("All Status"); }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /> Clear</button>
          </div>
        )}
      </div>

      {/* Case Cards */}
      <div className="space-y-3">
        {paged.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground rounded-xl border border-border bg-card">No cases found.</div>
        ) : (
          paged.map((c) => (
            <div key={c.id} className="p-5 rounded-xl border border-border bg-card hover:shadow-md transition-all cursor-pointer" onClick={() => setViewCase(c)}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent-bg flex items-center justify-center shrink-0">
                    <Scale className="h-5 w-5 text-accent-text" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-foreground">{c.case_number}</span>
                      <StatusBadge status={c.status} />
                      <Badge variant="muted">{c.case_type}</Badge>
                    </div>
                    <p className="text-sm text-foreground font-medium">{c.title}</p>
                    <div className="flex items-center gap-4 mt-2 text-[12px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {c.complainants.join(", ")} <span className="text-muted-foreground/50">vs.</span> {c.respondents.join(", ")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-muted-foreground">Filed {c.date_filed}</p>
                    {c.next_hearing && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1 flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3" /> Next: {c.next_hearing}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-1">{c.hearing_count} hearing(s)</p>
                  </div>
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setActionMenu(actionMenu === c.id ? null : c.id)} className="p-1.5 rounded hover:bg-muted transition-colors">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </button>
                    {actionMenu === c.id && (
                      <div className="absolute right-0 top-8 z-20 w-44 bg-card border border-border rounded-lg shadow-lg py-1">
                        <button onClick={() => { setViewCase(c); setActionMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left"><Eye className="h-3.5 w-3.5" /> View Case</button>
                        <button onClick={() => openEditCase(c)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left"><Edit className="h-3.5 w-3.5" /> Edit</button>
                        <button onClick={() => { openScheduleHearing(c); setActionMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left"><Calendar className="h-3.5 w-3.5" /> Schedule Hearing</button>
                        <button onClick={() => { openUpdateStatus(c); setActionMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left"><FileText className="h-3.5 w-3.5" /> Update Status</button>
                        <div className="border-t border-border my-1" />
                        <button onClick={() => { setActionMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left"><Printer className="h-3.5 w-3.5" /> Print CFA</button>
                        <button onClick={() => openDeleteCase(c)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-muted text-left"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                      </div>
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

      {/* View Case Modal (Enhanced) */}
      <Modal open={!!viewCase && !showScheduleHearing && !showUpdateStatus} onClose={() => setViewCase(null)} title={viewCase?.case_number || ""} description={viewCase?.title} size="lg"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setViewCase(null)}>Close</ModalButton>
            <ModalButton variant="secondary" onClick={() => { if (viewCase) openScheduleHearing(viewCase); }}><Calendar className="h-4 w-4 mr-1" /> Schedule Hearing</ModalButton>
            <ModalButton variant="secondary" onClick={() => { if (viewCase) openUpdateStatus(viewCase); }}><FileText className="h-4 w-4 mr-1" /> Update Status</ModalButton>
            <ModalButton variant="primary"><Printer className="h-4 w-4 mr-1" /> Print CFA</ModalButton>
          </>
        }>
        {viewCase && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <StatusBadge status={viewCase.status} />
              <Badge variant="muted">{viewCase.case_type}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-border">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Complainant(s)</p>
                {viewCase.complainants.map((c, i) => <p key={i} className="text-sm text-foreground font-medium">{c}</p>)}
                {viewCase.complainant_contact && <p className="text-[11px] text-muted-foreground mt-1">Contact: {viewCase.complainant_contact}</p>}
                {viewCase.complainant_address && <p className="text-[11px] text-muted-foreground">Address: {viewCase.complainant_address}</p>}
              </div>
              <div className="p-4 rounded-lg border border-border">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Respondent(s)</p>
                {viewCase.respondents.map((r, i) => <p key={i} className="text-sm text-foreground font-medium">{r}</p>)}
                {viewCase.respondent_contact && <p className="text-[11px] text-muted-foreground mt-1">Contact: {viewCase.respondent_contact}</p>}
                {viewCase.respondent_address && <p className="text-[11px] text-muted-foreground">Address: {viewCase.respondent_address}</p>}
              </div>
            </div>
            {viewCase.description && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Description / Facts</p>
                <p className="text-sm text-foreground leading-relaxed">{viewCase.description}</p>
              </div>
            )}
            {viewCase.relief_sought && (
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                <p className="text-[11px] font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">Relief / Remedy Sought</p>
                <p className="text-sm text-blue-800 dark:text-blue-300">{viewCase.relief_sought}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div><p className="text-[11px] text-muted-foreground uppercase">Date Filed</p><p className="text-sm">{viewCase.date_filed}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Next Hearing</p><p className="text-sm">{viewCase.next_hearing || "—"}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Hearings Held</p><p className="text-sm">{viewCase.hearing_count}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Lupon Chairman</p><p className="text-sm">{viewCase.lupon_chairman}</p></div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Remarks</p>
              <p className="text-sm text-foreground">{viewCase.remarks}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* File / Edit Case Modal */}
      <Modal open={showFileCase || showEdit} onClose={closeFormModal} title={showEdit ? "Edit KP Case" : "File New KP Case"} description={showEdit ? "Update an existing KP case record" : undefined} size="lg"
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
                <ModalButton variant="primary" onClick={closeFormModal}>
                  <Save className="w-4 h-4 mr-1" /> {showEdit ? "Update" : "File Case"}
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
      <Modal open={showDelete} onClose={() => { setShowDelete(false); setDeleteTarget(null); }} title="Delete KP Case" size="sm"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { setShowDelete(false); setDeleteTarget(null); }}>Cancel</ModalButton>
            <ModalButton variant="danger" onClick={() => { setShowDelete(false); setDeleteTarget(null); }}>Delete Case</ModalButton>
          </>
        }>
        {deleteTarget && (
          <div className="space-y-3">
            <p className="text-sm text-foreground">Are you sure you want to delete case <span className="font-bold">{deleteTarget.case_number}</span>?</p>
            <p className="text-sm text-muted-foreground">This will permanently remove the KP case "{deleteTarget.title}" including all hearing records and settlement data. This action cannot be undone.</p>
          </div>
        )}
      </Modal>

      {/* Schedule Hearing Modal */}
      <Modal open={showScheduleHearing} onClose={() => { setShowScheduleHearing(false); }} title="Schedule Hearing" description={viewCase ? `${viewCase.case_number} — ${viewCase.title}` : ""} size="md"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setShowScheduleHearing(false)}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={() => setShowScheduleHearing(false)}>
              <Save className="w-4 h-4 mr-1" /> Schedule
            </ModalButton>
          </>
        }>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Hearing Date<span className="text-red-500 ml-0.5">*</span></label>
              <input type="date" value={hearingForm.date} onChange={(e) => setHearingForm((p) => ({ ...p, date: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Time<span className="text-red-500 ml-0.5">*</span></label>
              <input type="time" value={hearingForm.time} onChange={(e) => setHearingForm((p) => ({ ...p, time: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Venue</label>
            <input type="text" value={hearingForm.venue} onChange={(e) => setHearingForm((p) => ({ ...p, venue: e.target.value }))} placeholder="e.g. Barangay Hall"
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
            <textarea value={hearingForm.notes} onChange={(e) => setHearingForm((p) => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Any notes for this hearing..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none" />
          </div>
        </div>
      </Modal>

      {/* Update Status Modal */}
      <Modal open={showUpdateStatus} onClose={() => { setShowUpdateStatus(false); }} title="Update Case Status" description={viewCase ? `${viewCase.case_number} — ${viewCase.title}` : ""} size="md"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setShowUpdateStatus(false)}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={() => setShowUpdateStatus(false)}>
              <Save className="w-4 h-4 mr-1" /> Update
            </ModalButton>
          </>
        }>
        <div className="space-y-4">
          {viewCase && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
              <span className="text-xs text-muted-foreground">Current status:</span>
              <StatusBadge status={viewCase.status} />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">New Status<span className="text-red-500 ml-0.5">*</span></label>
            <select value={statusForm.status} onChange={(e) => setStatusForm((p) => ({ ...p, status: e.target.value }))}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
              <option value="">Select Status</option>
              {statusUpdateOptions.map((s) => <option key={s} value={s.toLowerCase().replace(" ", "_")}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Remarks</label>
            <textarea value={statusForm.remarks} onChange={(e) => setStatusForm((p) => ({ ...p, remarks: e.target.value }))} rows={3} placeholder="Reason for status change or additional remarks..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
