"use client";

import { useState } from "react";
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
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

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

export default function BlotterPage() {
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

  // Delete confirmation
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BlotterRecord | null>(null);

  // Update status modal
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  const [updateTarget, setUpdateTarget] = useState<BlotterRecord | null>(null);
  const [newStatus, setNewStatus] = useState("");

  // Action menu
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

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
  const updateForm = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const openRecordModal = () => {
    setForm({ ...emptyForm });
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

  // ── Form Field Components ──
  const Input = ({ label, field, required, type = "text", placeholder = "", disabled = false }: { label: string; field: string; required?: boolean; type?: string; placeholder?: string; disabled?: boolean }) => (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type} value={form[field] || ""} onChange={(e) => updateForm(field, e.target.value)} placeholder={placeholder} disabled={disabled}
        className={cn("w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring", disabled && "opacity-50 cursor-not-allowed")} />
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

  // ── Render Form Tab Content ──
  const renderFormTab = () => {
    switch (formTab) {
      case 0: return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Incident Type" field="incident_type" options={incidentTypeOptions} required />
            <Select label="Severity" field="severity" options={severityOptions} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date of Incident" field="incident_date" type="date" required />
            <Input label="Time of Incident" field="incident_time" type="time" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Purok / Zone" field="incident_purok" options={purokOptions} required />
            <Input label="Street / Address" field="incident_location" placeholder="e.g. Rizal St. near sari-sari store" required />
          </div>
        </div>
      );
      case 1: return (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Complainant Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" field="complainant_name" required placeholder="e.g. Maria Dela Cruz" />
            <Input label="Contact Number" field="complainant_contact" placeholder="e.g. 0917-123-4567" />
          </div>
          <Input label="Address" field="complainant_address" placeholder="e.g. Purok Sampaguita, Rizal St." />
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
            <Input label="Full Name" field="respondent_name" required placeholder="e.g. Juan Santos" disabled={form.respondent_unknown === "yes"} />
            <Input label="Contact Number" field="respondent_contact" placeholder="e.g. 0918-234-5678" disabled={form.respondent_unknown === "yes"} />
          </div>
          <Input label="Address" field="respondent_address" placeholder="e.g. Purok Rosal, Mabini St." disabled={form.respondent_unknown === "yes"} />
        </div>
      );
      case 2: return (
        <div className="space-y-4">
          <Textarea label="Incident Narrative" field="narrative" required rows={4} placeholder="Describe the incident in detail. Include what happened, when, where, and how it was reported." />
          <Textarea label="Action Taken" field="action_taken" rows={3} placeholder="e.g. Forwarded to PNP, mediation conducted, parties summoned..." />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Recorded By" field="recorded_by" required placeholder="e.g. Secretary Santos" />
            <Input label="Witness Names" field="witness_names" placeholder="e.g. Juan Dela Cruz, Maria Santos" />
          </div>
          <Input label="Evidence / Attachments Note" field="evidence_notes" placeholder="e.g. CCTV footage saved, medical certificate attached" />
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
            <button onClick={openRecordModal} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}><Plus className="h-4 w-4" /> Record Blotter</button>
          </div>
        }
      />

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
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg border border-border bg-card">
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
          <div className="p-12 text-center text-muted-foreground rounded-xl border border-border bg-card">No blotter records found.</div>
        ) : (
          paged.map((b) => (
            <div key={b.id} className="p-5 rounded-xl border bg-card hover:shadow-md transition-all"
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
                        <div className="absolute right-0 top-8 z-50 w-48 py-1 rounded-lg border border-border bg-card shadow-lg">
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
                <ModalButton variant="primary" onClick={closeFormModal}>
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
            <ModalButton variant="danger" onClick={() => { setShowDelete(false); setDeleteTarget(null); }}>Delete Record</ModalButton>
          </>
        }>
        {deleteTarget && (
          <div className="space-y-3">
            <p className="text-sm text-foreground">Are you sure you want to delete blotter record <span className="font-bold">{deleteTarget.blotter_number}</span>?</p>
            <p className="text-sm text-muted-foreground">This action cannot be undone. The record for "{deleteTarget.incident_type}" involving {deleteTarget.complainant_name} vs. {deleteTarget.respondent_name} will be permanently removed.</p>
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
              <div className="p-4 rounded-lg border border-border">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Complainant</p>
                <p className="text-sm text-foreground font-medium">{viewBlotter.complainant_name}</p>
                {viewBlotter.complainant_contact && <p className="text-xs text-muted-foreground mt-1">{viewBlotter.complainant_contact}</p>}
                {viewBlotter.complainant_address && <p className="text-xs text-muted-foreground">{viewBlotter.complainant_address}</p>}
              </div>
              <div className="p-4 rounded-lg border border-border">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Respondent</p>
                <p className="text-sm text-foreground font-medium">{viewBlotter.respondent_name}</p>
                {viewBlotter.respondent_contact && <p className="text-xs text-muted-foreground mt-1">{viewBlotter.respondent_contact}</p>}
                {viewBlotter.respondent_address && <p className="text-xs text-muted-foreground">{viewBlotter.respondent_address}</p>}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
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

      {/* Update Status Modal */}
      <Modal open={showUpdateStatus} onClose={() => { setShowUpdateStatus(false); setUpdateTarget(null); }} title="Update Blotter Status" description={updateTarget?.blotter_number || ""} size="sm"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { setShowUpdateStatus(false); setUpdateTarget(null); }}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={() => { setShowUpdateStatus(false); setUpdateTarget(null); }}>
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
