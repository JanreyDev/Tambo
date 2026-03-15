"use client";

import { useState, useCallback } from "react";
import {
  Receipt,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  Plus,
  Save,
  MoreHorizontal,
  Eye,
  Edit,
  Play,
  User,
  Phone,
  MapPin,
  AlertTriangle,
  Copy,
  Trash2,
  Bot,
  Inbox,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { MabiniButton } from '@/components/ui/mabini-button';

// ── Types ──
interface ServiceRequest {
  id: string;
  request_number: string;
  document_type: string;
  purpose: string;
  requestor_name: string;
  requestor_contact: string;
  requestor_address: string;
  requestor_resident_id: string;
  status: string;
  priority: string;
  copies: number;
  requested_at: string;
  processed_at: string;
  processed_by: string;
  released_at: string;
  estimated_pickup: string;
  amount: number;
  or_number: string;
  notes: string;
  special_instructions: string;
  rejection_notes: string;
}

// ── Mock Residents for Search ──
interface ResidentOption {
  id: string;
  resident_number: string;
  name: string;
  contact: string;
  address: string;
}

const mockResidentOptions: ResidentOption[] = [
  { id: "1", resident_number: "RES-2026-0001", name: "Maria Dela Cruz", contact: "0917-123-4567", address: "123 Rizal St., Purok Sampaguita" },
  { id: "2", resident_number: "RES-2026-0002", name: "Juan Santos Jr.", contact: "0928-123-4567", address: "45 Mabini St., Purok Rosal" },
  { id: "3", resident_number: "RES-2026-0003", name: "Ana Garcia", contact: "0935-123-4567", address: "67 Bonifacio Ave., Purok Ilang-Ilang" },
  { id: "4", resident_number: "RES-2026-0004", name: "Pedro Reyes", contact: "0945-123-4567", address: "89 Luna St., Purok Sampaguita" },
  { id: "5", resident_number: "RES-2026-0005", name: "Rosa De Los Santos", contact: "0916-123-4567", address: "101 Del Pilar St., Purok Dahlia" },
  { id: "6", resident_number: "RES-2026-0006", name: "Roberto Cruz Sr.", contact: "0920-555-6677", address: "33 Aguinaldo St., Purok Rosal" },
  { id: "7", resident_number: "RES-2026-0007", name: "Liza De Los Santos", contact: "0918-111-2233", address: "55 Rizal St., Purok Jasmine" },
  { id: "8", resident_number: "RES-2026-0008", name: "Angelo Pascual", contact: "0920-333-4455", address: "44 Del Pilar St., Purok Ilang-Ilang" },
];

// ── Mock Requests ──
const mockRequests: ServiceRequest[] = [
  { id: "1", request_number: "REQ-2026-0201", document_type: "Barangay Clearance", purpose: "Employment", requestor_name: "Maria Dela Cruz", requestor_contact: "0917-123-4567", requestor_address: "123 Rizal St., Purok Sampaguita", requestor_resident_id: "RES-2026-0001", status: "pending", priority: "normal", copies: 1, requested_at: "2026-03-07 08:30", processed_at: "", processed_by: "", released_at: "", estimated_pickup: "2026-03-08", amount: 50, or_number: "", notes: "", special_instructions: "", rejection_notes: "" },
  { id: "2", request_number: "REQ-2026-0200", document_type: "Certificate of Residency", purpose: "School enrollment", requestor_name: "Ana Garcia", requestor_contact: "0918-222-3344", requestor_address: "67 Bonifacio Ave., Purok Ilang-Ilang", requestor_resident_id: "RES-2026-0003", status: "pending", priority: "rush", copies: 2, requested_at: "2026-03-07 08:15", processed_at: "", processed_by: "", released_at: "", estimated_pickup: "2026-03-07", amount: 30, or_number: "", notes: "", special_instructions: "Needed ASAP for enrollment deadline", rejection_notes: "" },
  { id: "3", request_number: "REQ-2026-0199", document_type: "Certificate of Indigency", purpose: "Medical assistance (PhilHealth)", requestor_name: "Roberto Cruz Sr.", requestor_contact: "0920-555-6677", requestor_address: "33 Aguinaldo St., Purok Rosal", requestor_resident_id: "RES-2026-0006", status: "processing", priority: "normal", copies: 1, requested_at: "2026-03-06 14:00", processed_at: "", processed_by: "Secretary Santos", released_at: "", estimated_pickup: "2026-03-07", amount: 0, or_number: "", notes: "Verifying indigency status", special_instructions: "", rejection_notes: "" },
  { id: "4", request_number: "REQ-2026-0198", document_type: "Barangay Clearance", purpose: "NBI Clearance requirement", requestor_name: "Juan Santos Jr.", requestor_contact: "0919-444-5566", requestor_address: "45 Mabini St., Purok Rosal", requestor_resident_id: "RES-2026-0002", status: "ready", priority: "normal", copies: 1, requested_at: "2026-03-06 10:00", processed_at: "2026-03-06 15:00", processed_by: "Secretary Santos", released_at: "", estimated_pickup: "2026-03-07", amount: 50, or_number: "OR-2026-0150", notes: "", special_instructions: "", rejection_notes: "" },
  { id: "5", request_number: "REQ-2026-0195", document_type: "Business Permit Clearance", purpose: "Business permit renewal", requestor_name: "Pedro Reyes", requestor_contact: "0917-888-9900", requestor_address: "89 Luna St., Purok Sampaguita", requestor_resident_id: "RES-2026-0004", status: "released", priority: "normal", copies: 1, requested_at: "2026-03-05 09:00", processed_at: "2026-03-05 16:00", processed_by: "Secretary Santos", released_at: "2026-03-06 09:00", estimated_pickup: "2026-03-06", amount: 100, or_number: "OR-2026-0148", notes: "", special_instructions: "", rejection_notes: "" },
  { id: "6", request_number: "REQ-2026-0190", document_type: "Certificate of Residency", purpose: "Voter registration", requestor_name: "Liza De Los Santos", requestor_contact: "0918-111-2233", requestor_address: "55 Rizal St., Purok Jasmine", requestor_resident_id: "RES-2026-0007", status: "released", priority: "normal", copies: 1, requested_at: "2026-03-04 13:00", processed_at: "2026-03-04 16:30", processed_by: "Kag. Lopez", released_at: "2026-03-05 08:00", estimated_pickup: "2026-03-05", amount: 30, or_number: "OR-2026-0145", notes: "", special_instructions: "", rejection_notes: "" },
  { id: "7", request_number: "REQ-2026-0185", document_type: "Barangay Clearance", purpose: "Employment abroad (OFW)", requestor_name: "Angelo Pascual", requestor_contact: "0920-333-4455", requestor_address: "44 Del Pilar St., Purok Ilang-Ilang", requestor_resident_id: "RES-2026-0008", status: "rejected", priority: "normal", copies: 1, requested_at: "2026-03-03 10:30", processed_at: "2026-03-03 14:00", processed_by: "Secretary Santos", released_at: "", estimated_pickup: "", amount: 0, or_number: "", notes: "", special_instructions: "", rejection_notes: "Incomplete requirements. Missing valid ID. Please submit a government-issued ID and resubmit the request." },
];

const documentTypes = ["Barangay Clearance", "Certificate of Residency", "Certificate of Indigency", "Business Permit Clearance", "Cedula", "Certificate of Good Moral"];
const docFilterOptions = ["All Documents", ...documentTypes];
const statusOptions = ["All Status", "Pending", "Processing", "Ready", "Released", "Rejected"];
const priorityOptions = ["Normal", "Rush"];

function RequestInput({ label, field, required, type = "text", placeholder = "", disabled, value, onChange }: { label: string; field: string; required?: boolean; type?: string; placeholder?: string; disabled?: boolean; value: string; onChange: (field: string, value: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type} value={value} onChange={(e) => onChange(field, e.target.value)} placeholder={placeholder} disabled={disabled}
        className={cn("w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring", disabled && "opacity-50 cursor-not-allowed")} />
    </div>
  );
}

function RequestSelect({ label, field, options, required, value, onChange }: { label: string; field: string; options: string[]; required?: boolean; value: string; onChange: (field: string, value: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select value={value} onChange={(e) => onChange(field, e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring">
        <option value="">Select {label}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function RequestTextarea({ label, field, placeholder = "", rows = 3, value, onChange }: { label: string; field: string; placeholder?: string; rows?: number; value: string; onChange: (field: string, value: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      <textarea value={value} onChange={(e) => onChange(field, e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none" />
    </div>
  );
}

const emptyForm: Record<string, string> = {
  requestor_mode: "resident",
  requestor_search: "",
  requestor_resident_id: "",
  requestor_name: "",
  requestor_contact: "",
  requestor_address: "",
  document_type: "",
  purpose: "",
  copies: "1",
  priority: "Normal",
  notes: "",
  special_instructions: "",
  estimated_pickup: "",
};

export default function RequestsPage() {
  const [search, setSearch] = useState("");
  const [docFilter, setDocFilter] = useState("All Documents");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [viewReq, setViewReq] = useState<ServiceRequest | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  // New Request form state
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ServiceRequest | null>(null);
  const [formTab, setFormTab] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({ ...emptyForm });
  const [residentSearch, setResidentSearch] = useState("");
  const [selectedResident, setSelectedResident] = useState<ResidentOption | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showReject, setShowReject] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Toast System ──
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "error" | "info" }[]>([]);
  const addToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const pageSize = 10;

  const filtered = mockRequests.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      if (!r.request_number.toLowerCase().includes(q) && !r.requestor_name.toLowerCase().includes(q)
        && !r.document_type.toLowerCase().includes(q)) return false;
    }
    if (docFilter !== "All Documents" && r.document_type !== docFilter) return false;
    if (statusFilter !== "All Status" && r.status !== statusFilter.toLowerCase()) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  const pendingCount = mockRequests.filter((r) => r.status === "pending" || r.status === "processing").length;
  const readyCount = mockRequests.filter((r) => r.status === "ready").length;
  const todayRevenue = mockRequests.filter((r) => r.or_number && r.processed_at.startsWith("2026-03-06")).reduce((sum, r) => sum + r.amount, 0);

  const statusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-3.5 w-3.5 text-amber-500" />;
      case "processing": return <Clock className="h-3.5 w-3.5 text-blue-500" />;
      case "ready": return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case "released": return <CheckCircle2 className="h-3.5 w-3.5 text-gray-500" />;
      case "rejected": return <XCircle className="h-3.5 w-3.5 text-red-500" />;
      default: return null;
    }
  };

  // ── New Request Form Helpers ──
  const openCreate = () => {
    setForm({ ...emptyForm });
    setFormTab(0);
    setSelectedResident(null);
    setResidentSearch("");
    setFormErrors({});
    setShowCreate(true);
  };

  const updateForm = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const formTabs = ["Requestor", "Document", "Details"];

  const filteredResidents = residentSearch.length >= 2
    ? mockResidentOptions.filter((r) =>
        r.name.toLowerCase().includes(residentSearch.toLowerCase()) ||
        r.resident_number.toLowerCase().includes(residentSearch.toLowerCase())
      )
    : [];

  const selectResident = (r: ResidentOption) => {
    setSelectedResident(r);
    setForm((prev) => ({
      ...prev,
      requestor_resident_id: r.resident_number,
      requestor_name: r.name,
      requestor_contact: r.contact,
      requestor_address: r.address,
    }));
    setResidentSearch("");
  };

  const clearResident = () => {
    setSelectedResident(null);
    setForm((prev) => ({
      ...prev,
      requestor_resident_id: "",
      requestor_name: "",
      requestor_contact: "",
      requestor_address: "",
    }));
  };

  const openEdit = (req: ServiceRequest) => {
    const matchedResident = mockResidentOptions.find((r) => r.resident_number === req.requestor_resident_id) || null;
    setSelectedResident(matchedResident);
    setForm({
      requestor_mode: matchedResident ? "resident" : "manual",
      requestor_search: "",
      requestor_resident_id: req.requestor_resident_id,
      requestor_name: req.requestor_name,
      requestor_contact: req.requestor_contact,
      requestor_address: req.requestor_address,
      document_type: req.document_type,
      purpose: req.purpose,
      copies: String(req.copies),
      priority: req.priority.charAt(0).toUpperCase() + req.priority.slice(1),
      notes: req.notes,
      special_instructions: req.special_instructions,
      estimated_pickup: req.estimated_pickup,
    });
    setFormTab(0);
    setResidentSearch("");
    setFormErrors({});
    setShowEdit(true);
    setActionMenu(null);
  };

  const openDelete = (req: ServiceRequest) => {
    setDeleteTarget(req);
    setShowDelete(true);
    setActionMenu(null);
  };

  // ── Form Validation ──
  const handleFormSubmit = () => {
    const errors: Record<string, string> = {};

    // Requestor validation
    if (form.requestor_mode === "resident" && !selectedResident) {
      errors.requestor = "Please select a registered resident.";
    }
    if (form.requestor_mode === "manual" && !form.requestor_name.trim()) {
      errors.requestor_name = "Full name is required.";
    }

    // Document validation
    if (!form.document_type) {
      errors.document_type = "Document type is required.";
    }

    // Priority validation
    if (!form.priority) {
      errors.priority = "Priority is required.";
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      // Jump to the first tab that has an error
      if (errors.requestor || errors.requestor_name) {
        setFormTab(0);
      } else if (errors.document_type) {
        setFormTab(1);
      } else if (errors.priority) {
        setFormTab(2);
      }
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    setTimeout(() => {
      addToast(showEdit ? "Request updated successfully." : "Request submitted successfully.", "success");
      closeForm();
      setIsSubmitting(false);
    }, 300);
  };

  // ── Render Form Tab Content ──
  const renderFormTab = () => {
    switch (formTab) {
      case 0: return (
        <div className="space-y-4">
          {/* Mode Toggle */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Requestor Type</label>
            <div className="flex gap-2">
              <button onClick={() => { updateForm("requestor_mode", "resident"); clearResident(); }}
                className={cn("flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-colors",
                  form.requestor_mode === "resident" ? "border-accent-primary bg-accent-bg text-accent-text" : "border-border hover:bg-muted text-muted-foreground")}>
                <User className="h-4 w-4" /> Registered Resident
              </button>
              <button onClick={() => { updateForm("requestor_mode", "manual"); clearResident(); }}
                className={cn("flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-colors",
                  form.requestor_mode === "manual" ? "border-accent-primary bg-accent-bg text-accent-text" : "border-border hover:bg-muted text-muted-foreground")}>
                <FileText className="h-4 w-4" /> Walk-in / Manual Entry
              </button>
            </div>
          </div>

          {form.requestor_mode === "resident" ? (
            <div className="space-y-4">
              {selectedResident ? (
                <div className="p-4 rounded-lg border border-accent-primary bg-accent-bg/30">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{selectedResident.name}</p>
                      <p className="text-[11px] text-muted-foreground">{selectedResident.resident_number}</p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <Phone className="h-3 w-3" /> {selectedResident.contact}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {selectedResident.address}
                      </div>
                    </div>
                    <button onClick={clearResident} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Search Resident<span className="text-red-500 ml-0.5">*</span></label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input type="text" value={residentSearch} onChange={(e) => setResidentSearch(e.target.value)}
                      placeholder="Type name or resident number..."
                      className="w-full pl-9 pr-4 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring" />
                  </div>
                  {filteredResidents.length > 0 && (
                    <div className="mt-1 rounded-lg glass shadow-lg max-h-48 overflow-y-auto">
                      {filteredResidents.map((r) => (
                        <button key={r.id} onClick={() => selectResident(r)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors border-b border-border last:border-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {r.name.split(" ")[0][0]}{r.name.split(" ").slice(-1)[0][0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                            <p className="text-[11px] text-muted-foreground">{r.resident_number} -- {r.contact}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {residentSearch.length >= 2 && filteredResidents.length === 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">No residents found. Try a different search or use manual entry.</p>
                  )}
                  {formErrors.requestor && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.requestor}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <RequestInput label="Full Name" field="requestor_name" required placeholder="e.g. Juan Dela Cruz" value={form.requestor_name || ""} onChange={updateForm} />
                {formErrors.requestor_name && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.requestor_name}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <RequestInput label="Contact Number" field="requestor_contact" required placeholder="e.g. 0917-123-4567" value={form.requestor_contact || ""} onChange={updateForm} />
                <RequestInput label="Address" field="requestor_address" required placeholder="e.g. 123 Rizal St., Purok Sampaguita" value={form.requestor_address || ""} onChange={updateForm} />
              </div>
            </div>
          )}
        </div>
      );
      case 1: return (
        <div className="space-y-4">
          <div>
            <RequestSelect label="Document Type" field="document_type" options={documentTypes} required value={form.document_type || ""} onChange={updateForm} />
            {formErrors.document_type && (
              <p className="mt-1 text-xs text-red-500">{formErrors.document_type}</p>
            )}
          </div>
          <RequestInput label="Purpose" field="purpose" required placeholder="e.g. Employment, School enrollment, NBI Clearance requirement" value={form.purpose || ""} onChange={updateForm} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Number of Copies<span className="text-red-500 ml-0.5">*</span></label>
              <div className="flex items-center gap-2">
                <button onClick={() => updateForm("copies", String(Math.max(1, parseInt(form.copies || "1") - 1)))}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors text-foreground font-medium">-</button>
                <input type="number" min="1" max="20" value={form.copies || "1"} onChange={(e) => updateForm("copies", e.target.value)}
                  className="w-16 text-center px-2 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring" />
                <button onClick={() => updateForm("copies", String(Math.min(20, parseInt(form.copies || "1") + 1)))}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors text-foreground font-medium">+</button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Estimated Fee</label>
              <div className="flex items-center h-[38px] px-3 text-sm rounded-lg border border-border bg-muted/50 text-muted-foreground">
                {form.document_type === "Certificate of Indigency" ? "Free" :
                 form.document_type === "Cedula" ? "Varies" :
                 form.document_type === "Business Permit Clearance" ? `₱${100 * parseInt(form.copies || "1")}` :
                 form.document_type ? `₱${50 * parseInt(form.copies || "1")}` : "--"}
              </div>
            </div>
          </div>
        </div>
      );
      case 2: return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Priority</label>
              <div className="flex gap-2">
                {priorityOptions.map((p) => (
                  <button key={p} onClick={() => updateForm("priority", p)}
                    className={cn("flex-1 px-4 py-2 text-sm rounded-lg border transition-colors text-center",
                      form.priority === p
                        ? p === "Rush"
                          ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700"
                          : "border-accent-primary bg-accent-bg text-accent-text"
                        : "border-border hover:bg-muted text-muted-foreground")}>
                    {p === "Rush" && <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />}
                    {p}
                  </button>
                ))}
              </div>
              {form.priority === "Rush" && (
                <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400">Rush requests may incur additional processing fees.</p>
              )}
              {formErrors.priority && (
                <p className="mt-1 text-xs text-red-500">{formErrors.priority}</p>
              )}
            </div>
            <RequestInput label="Estimated Pickup Date" field="estimated_pickup" type="date" value={form.estimated_pickup || ""} onChange={updateForm} />
          </div>
          <div>
            <RequestTextarea label="Notes / Special Instructions" field="special_instructions" placeholder="e.g. Please include middle name on the certificate, Pickup by authorized representative..." rows={4} value={form.special_instructions || ""} onChange={updateForm} />
            <p className="text-[10px] text-muted-foreground mt-1">Include any special requirements: rush processing, additional copies, delivery instructions.</p>
          </div>
        </div>
      );
      default: return null;
    }
  };

  // ── New/Edit Request Form Modal ──
  const isFormOpen = showCreate || showEdit;
  const closeForm = () => { setShowCreate(false); setShowEdit(false); };

  const requestFormModal = (
    <Modal open={isFormOpen} onClose={closeForm}
      title={showEdit ? "Edit Request" : "New Service Request"}
      description={showEdit ? "Update request details" : "Create a new document request"}
      size="xl"
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
            <ModalButton variant="secondary" onClick={closeForm}>Cancel</ModalButton>
            {formTab < formTabs.length - 1 ? (
              <ModalButton variant="primary" onClick={() => setFormTab((t) => t + 1)}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </ModalButton>
            ) : (
              <ModalButton variant="primary" onClick={handleFormSubmit} disabled={isSubmitting}>
                <Save className="w-4 h-4 mr-1" /> {isSubmitting ? "Saving..." : showEdit ? "Update Request" : "Submit Request"}
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
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Requests"
        description="Track document requests and service transactions"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Services" }, { label: "Requests" }]}
        actions={
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
            <Plus className="h-4 w-4" /> New Request
          </button>
        }
      />

      {/* Mabini AI Insight */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-bg/30 border border-accent-primary/20">
        <Bot className="h-4 w-4 shrink-0" style={{ color: "var(--accent-primary)" }} />
        <p className="text-[11px] text-muted-foreground"><span className="font-semibold text-foreground">Mabini:</span> 2 requests pending over 24 hours. Average processing time is 4 hours. Barangay Clearance is the most requested document (60%).</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Requests" value={mockRequests.length} icon={<Receipt className="h-5 w-5" />} />
        <StatCard label="Pending / Processing" value={pendingCount} icon={<Clock className="h-5 w-5" />} trend={{ value: 2, label: "today" }} />
        <StatCard label="Ready for Pickup" value={readyCount} icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatCard label="Revenue (Mar 6)" value={`₱${todayRevenue.toLocaleString()}`} icon={<Receipt className="h-5 w-5" />} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by request number, name, or document type..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={cn("flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors",
              showFilters ? "border-accent-primary bg-accent-bg text-accent-text" : "border-border hover:bg-muted")}>
            <Filter className="h-4 w-4" /> Filters
            {(docFilter !== "All Documents" || statusFilter !== "All Status") && (
              <span className="w-2 h-2 rounded-full bg-accent-primary" />
            )}
          </button>
        </div>
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg glass-subtle">
            <select value={docFilter} onChange={(e) => { setDocFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring">
              {docFilterOptions.map((d) => <option key={d}>{d}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring">
              {statusOptions.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => { setDocFilter("All Documents"); setStatusFilter("All Status"); }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"><X className="h-3 w-3" /> Clear</button>
          </div>
        )}
      </div>

      {/* Requests Table */}
      <div className="rounded-xl glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Request #</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Document</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Requestor</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Purpose</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-12" />
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Inbox className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">No document requests yet</p>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">Requests from residents will appear here.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setViewReq(r)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{r.request_number}</p>
                          <p className="text-[11px] text-muted-foreground">{r.requested_at}</p>
                        </div>
                        {r.priority === "rush" && <Badge variant="warning">Rush</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-sm text-foreground"><FileText className="h-3.5 w-3.5 text-muted-foreground" /> {r.document_type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground">{r.requestor_name}</p>
                      <p className="text-[11px] text-muted-foreground">{r.requestor_contact}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">{r.purpose}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium capitalize">
                        {statusIcon(r.status)} {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{r.amount > 0 ? `₱${r.amount}` : "Free"}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <button onClick={() => setActionMenu(actionMenu === r.id ? null : r.id)} className="p-1.5 rounded hover:bg-muted transition-colors">
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </button>
                        {actionMenu === r.id && (
                          <div className="absolute right-0 top-8 z-20 w-44 glass rounded-lg shadow-lg py-1">
                            <button onClick={() => { setViewReq(r); setActionMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left">
                              <Eye className="h-3.5 w-3.5" /> View Details
                            </button>
                            {(r.status === "pending" || r.status === "processing") && (
                              <button onClick={() => openEdit(r)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left">
                                <Edit className="h-3.5 w-3.5" /> Edit
                              </button>
                            )}
                            {r.status === "pending" && (
                              <button onClick={() => { setActionMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left">
                                <Play className="h-3.5 w-3.5" /> Process
                              </button>
                            )}
                            {r.status === "processing" && (
                              <button onClick={() => { setActionMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Mark Ready
                              </button>
                            )}
                            {r.status === "ready" && (
                              <button onClick={() => { setActionMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left">
                                <Printer className="h-3.5 w-3.5" /> Print & Release
                              </button>
                            )}
                            {(r.status === "pending" || r.status === "processing") && (
                              <>
                                <div className="border-t border-border my-1" />
                                <button onClick={() => openDelete(r)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left text-red-600">
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing {start + 1}--{Math.min(start + pageSize, filtered.length)} of {filtered.length}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={safePage <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronsLeft className="h-4 w-4" /></button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
            <span className="px-3 py-1 text-sm">{safePage} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
            <button onClick={() => setPage(totalPages)} disabled={safePage >= totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronsRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {/* View Request Modal (Enhanced) */}
      <Modal open={!!viewReq && !showDelete} onClose={() => { setViewReq(null); setShowReject(false); setRejectionReason(""); setRejectionError(""); }} title={viewReq?.request_number || ""} description={viewReq?.document_type || ""} size="lg"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { setViewReq(null); setShowReject(false); setRejectionReason(""); setRejectionError(""); }}>Close</ModalButton>
            {(viewReq?.status === "pending" || viewReq?.status === "processing") && !showReject && (
              <ModalButton variant="danger" onClick={() => { setShowReject(true); setRejectionReason(""); setRejectionError(""); }}>
                <XCircle className="h-4 w-4 mr-1" /> Reject
              </ModalButton>
            )}
            {showReject && (
              <ModalButton variant="danger" onClick={() => {
                if (!rejectionReason.trim()) {
                  setRejectionError("Rejection reason is required.");
                  return;
                }
                addToast("Request rejected.", "error");
                setShowReject(false); setRejectionReason(""); setRejectionError(""); setViewReq(null);
              }}>
                <XCircle className="h-4 w-4 mr-1" /> Confirm Reject
              </ModalButton>
            )}
            {viewReq?.status === "pending" && !showReject && (
              <ModalButton variant="primary" onClick={() => { addToast("Request approved and now processing.", "success"); setViewReq(null); }}><Play className="h-4 w-4 mr-1" /> Process Request</ModalButton>
            )}
            {viewReq?.status === "processing" && !showReject && (
              <ModalButton variant="primary" onClick={() => { addToast("Request approved and marked as ready for pickup.", "success"); setViewReq(null); }}><CheckCircle2 className="h-4 w-4 mr-1" /> Mark Ready</ModalButton>
            )}
            {viewReq?.status === "ready" && (
              <ModalButton variant="primary" onClick={() => setViewReq(null)}><Printer className="h-4 w-4 mr-1" /> Print & Release</ModalButton>
            )}
          </>
        }>
        {viewReq && (
          <div className="space-y-5">
            {/* Status & Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={viewReq.status} />
              {viewReq.priority === "rush" && <Badge variant="warning">Rush</Badge>}
              {viewReq.or_number && <Badge variant="success">OR: {viewReq.or_number}</Badge>}
              {viewReq.copies > 1 && <Badge variant="info"><Copy className="h-3 w-3 mr-1" />{viewReq.copies} copies</Badge>}
            </div>

            {/* Rejection Notes */}
            {viewReq.status === "rejected" && viewReq.rejection_notes && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-red-700 dark:text-red-400 uppercase tracking-wider mb-1">Rejection Reason</p>
                    <p className="text-sm text-red-700 dark:text-red-300">{viewReq.rejection_notes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Requestor Section */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Requestor Information</h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase">Name</p>
                  <p className="text-sm font-medium">{viewReq.requestor_name}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase">Contact</p>
                  <p className="text-sm">{viewReq.requestor_contact}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[11px] text-muted-foreground uppercase">Address</p>
                  <p className="text-sm">{viewReq.requestor_address}</p>
                </div>
                {viewReq.requestor_resident_id && (
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase">Resident ID</p>
                    <p className="text-sm font-mono text-accent-text">{viewReq.requestor_resident_id}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Request Details Section */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Request Details</h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase">Purpose</p>
                  <p className="text-sm">{viewReq.purpose}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase">Amount</p>
                  <p className="text-sm">{viewReq.amount > 0 ? `₱${viewReq.amount}` : "Free"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase">Copies</p>
                  <p className="text-sm">{viewReq.copies}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase">Priority</p>
                  <p className="text-sm capitalize">{viewReq.priority}</p>
                </div>
              </div>
            </div>

            {/* Timeline Section */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Timeline</h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase">Requested At</p>
                  <p className="text-sm">{viewReq.requested_at}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase">Est. Pickup</p>
                  <p className="text-sm">{viewReq.estimated_pickup || "--"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase">Processed At</p>
                  <p className="text-sm">{viewReq.processed_at || "--"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase">Processed By</p>
                  <p className="text-sm">{viewReq.processed_by || "--"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase">Released At</p>
                  <p className="text-sm">{viewReq.released_at || "--"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase">OR Number</p>
                  <p className="text-sm">{viewReq.or_number || "--"}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {(viewReq.notes || viewReq.special_instructions) && (
              <div className="p-4 rounded-lg glass-subtle">
                {viewReq.notes && (
                  <div className="mb-2">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Processing Notes</p>
                    <p className="text-sm text-foreground">{viewReq.notes}</p>
                  </div>
                )}
                {viewReq.special_instructions && (
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Special Instructions</p>
                    <p className="text-sm text-foreground">{viewReq.special_instructions}</p>
                  </div>
                )}
              </div>
            )}

            {/* Rejection Reason */}
            {showReject && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 space-y-2">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-xs font-medium text-red-700 dark:text-red-400 uppercase tracking-wider">Rejection Reason<span className="text-red-500 ml-0.5">*</span></p>
                </div>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => { setRejectionReason(e.target.value); if (e.target.value.trim()) setRejectionError(""); }}
                  placeholder="Explain why this request is being rejected..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-red-300 dark:border-red-800 bg-background focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
                {rejectionError && (
                  <p className="text-xs text-red-500">{rejectionError}</p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* New/Edit Request Form Modal */}
      {requestFormModal}

      {/* Delete Confirmation Modal */}
      <Modal open={showDelete} onClose={() => { setShowDelete(false); setDeleteTarget(null); }} title="Delete Request" size="sm"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { setShowDelete(false); setDeleteTarget(null); }}>Cancel</ModalButton>
            <ModalButton variant="danger" onClick={() => { addToast("Request deleted.", "error"); setShowDelete(false); setDeleteTarget(null); setViewReq(null); }}>Delete Request</ModalButton>
          </>
        }>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
            <Trash2 className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">This will permanently delete this request. The requestor will need to submit a new one if needed.</p>
          </div>
          {deleteTarget && (
            <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-1">
              <p className="text-sm font-medium text-foreground">{deleteTarget.request_number}</p>
              <p className="text-xs text-muted-foreground">{deleteTarget.document_type} for {deleteTarget.requestor_name}</p>
            </div>
          )}
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this request?</p>
        </div>
      </Modal>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          {toasts.map((t) => (
            <div key={t.id}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-bottom-2 fade-in duration-200",
                t.type === "success" && "bg-emerald-600 text-white",
                t.type === "error" && "bg-red-600 text-white",
                t.type === "info" && "bg-blue-600 text-white"
              )}>
              {t.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
              {t.type === "error" && <XCircle className="h-4 w-4 shrink-0" />}
              {t.type === "info" && <Clock className="h-4 w-4 shrink-0" />}
              {t.message}
              <button onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} className="ml-2 p-0.5 rounded hover:bg-white/20 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <MabiniButton pageContext="You are on the Service Requests page. This page manages pending document requests from residents." />
    </div>
  );
}
