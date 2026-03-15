"use client";

import { useState, useCallback } from "react";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Clock,
  CheckCircle2,
  FileCheck2,
  QrCode,
  User,
  CreditCard,
  Save,
  Eye,
  Edit,
  Ban,
  Calendar,
  Hash,
  DollarSign,
  AlertTriangle,
  Trash2,
  Bot,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { SortableHeader } from "@/components/ui/sortable-header";
import { cn } from "@/lib/utils";
import { MabiniButton } from '@/components/ui/mabini-button';

interface IssuedDocument {
  id: string;
  document_number: string;
  resident_name: string;
  resident_number: string;
  document_type: string;
  purpose: string;
  status: string;
  amount_paid: number;
  or_number: string;
  issued_by: string;
  issued_at: string;
  valid_until: string;
  blockchain_hash: string;
  payment_method: string;
  validity_period: string;
  notes: string;
}

// ── Mock Residents for Search ──
const mockResidentsList = [
  { id: "1", resident_number: "RES-2026-0001", name: "Dela Cruz, Maria S.", purok: "Sampaguita", age: 41, sex: "Female", mobile: "09171234567" },
  { id: "2", resident_number: "RES-2026-0002", name: "Santos, Juan R. Jr.", purok: "Rosal", age: 35, sex: "Male", mobile: "09281234567" },
  { id: "3", resident_number: "RES-2026-0003", name: "Garcia, Ana L.", purok: "Ilang-Ilang", age: 53, sex: "Female", mobile: "09351234567" },
  { id: "4", resident_number: "RES-2026-0004", name: "Reyes, Pedro A.", purok: "Sampaguita", age: 28, sex: "Male", mobile: "09451234567" },
  { id: "5", resident_number: "RES-2026-0005", name: "De Los Santos, Rosa B.", purok: "Dahlia", age: 60, sex: "Female", mobile: "09161234567" },
  { id: "6", resident_number: "RES-2026-0006", name: "Manalo, Roberto C.", purok: "Rosal", age: 37, sex: "Male", mobile: "09271234567" },
  { id: "7", resident_number: "RES-2026-0007", name: "Villanueva, Liza T.", purok: "Jasmine", age: 24, sex: "Female", mobile: "09381234567" },
  { id: "8", resident_number: "RES-2026-0008", name: "Rivera, Carlos M. III", purok: "Sunflower", age: 70, sex: "Male", mobile: "09191234567" },
];

const mockDocuments: IssuedDocument[] = [
  { id: "1", document_number: "DOC-2026-0342", resident_name: "Dela Cruz, Maria S.", resident_number: "RES-2026-0001", document_type: "Barangay Clearance", purpose: "Local Employment", status: "released", amount_paid: 50, or_number: "OR-2026-0342", issued_by: "Secretary Santos", issued_at: "2026-03-07 10:30", valid_until: "2026-09-07", blockchain_hash: "0x8a4f...", payment_method: "Cash", validity_period: "6 months", notes: "" },
  { id: "2", document_number: "DOC-2026-0341", resident_name: "Santos, Juan R.", resident_number: "RES-2026-0002", document_type: "Certificate of Residency", purpose: "School Enrollment", status: "released", amount_paid: 30, or_number: "OR-2026-0341", issued_by: "Secretary Santos", issued_at: "2026-03-07 09:15", valid_until: "2026-06-07", blockchain_hash: "0x7b3e...", payment_method: "Cash", validity_period: "3 months", notes: "" },
  { id: "3", document_number: "DOC-2026-0340", resident_name: "Garcia, Ana L.", resident_number: "RES-2026-0003", document_type: "Certificate of Indigency", purpose: "Medical Assistance", status: "released", amount_paid: 0, or_number: "", issued_by: "Kap. Reyes", issued_at: "2026-03-06 14:00", valid_until: "2026-06-06", blockchain_hash: "0x6c2d...", payment_method: "Waived", validity_period: "3 months", notes: "For PhilHealth coverage application" },
  { id: "4", document_number: "DOC-2026-0339", resident_name: "Reyes, Pedro A.", resident_number: "RES-2026-0004", document_type: "Barangay Clearance", purpose: "NBI Clearance", status: "pending", amount_paid: 50, or_number: "OR-2026-0339", issued_by: "", issued_at: "", valid_until: "", blockchain_hash: "", payment_method: "Cash", validity_period: "6 months", notes: "" },
  { id: "5", document_number: "DOC-2026-0338", resident_name: "De Los Santos, Rosa B.", resident_number: "RES-2026-0005", document_type: "Business Permit Endorsement", purpose: "Business Permit Renewal", status: "released", amount_paid: 200, or_number: "OR-2026-0338", issued_by: "Kap. Reyes", issued_at: "2026-03-05 11:00", valid_until: "2027-03-05", blockchain_hash: "0x5d1c...", payment_method: "Cash", validity_period: "1 year", notes: "Sari-sari store renewal" },
  { id: "6", document_number: "DOC-2026-0337", resident_name: "Manalo, Roberto C.", resident_number: "RES-2026-0006", document_type: "Barangay Clearance", purpose: "Overseas Employment", status: "released", amount_paid: 50, or_number: "OR-2026-0337", issued_by: "Secretary Santos", issued_at: "2026-03-05 09:30", valid_until: "2026-09-05", blockchain_hash: "0x4e0b...", payment_method: "Cash", validity_period: "6 months", notes: "" },
  { id: "7", document_number: "DOC-2026-0336", resident_name: "Villanueva, Liza T.", resident_number: "RES-2026-0007", document_type: "Certificate of Good Moral", purpose: "Job Application", status: "draft", amount_paid: 0, or_number: "", issued_by: "", issued_at: "", valid_until: "", blockchain_hash: "", payment_method: "", validity_period: "6 months", notes: "" },
  { id: "8", document_number: "DOC-2026-0335", resident_name: "Rivera, Carlos M.", resident_number: "RES-2026-0008", document_type: "Certificate of Residency", purpose: "Pension Application", status: "released", amount_paid: 30, or_number: "OR-2026-0335", issued_by: "Secretary Santos", issued_at: "2026-03-04 15:00", valid_until: "2026-06-04", blockchain_hash: "0x3f9a...", payment_method: "Check", validity_period: "3 months", notes: "For GSIS pension claim" },
];

const documentTypes = ["All Types", "Barangay Clearance", "Certificate of Residency", "Certificate of Indigency", "Business Permit Endorsement", "Certificate of Good Moral"];
const statusOptions = ["All Status", "Draft", "Pending", "Released", "Revoked"];

// Document type -> default fee mapping
const documentFees: Record<string, number> = {
  "Barangay Clearance": 50,
  "Certificate of Residency": 30,
  "Certificate of Indigency": 0,
  "Business Permit Endorsement": 200,
  "Certificate of Good Moral": 30,
  "Cedula": 50,
};

const issueDocumentTypes = ["Barangay Clearance", "Certificate of Residency", "Certificate of Indigency", "Business Permit Endorsement", "Certificate of Good Moral", "Cedula"];
const validityOptions = [
  { value: "3 months", label: "3 Months" },
  { value: "6 months", label: "6 Months" },
  { value: "1 year", label: "1 Year" },
];
const paymentMethods = ["Cash", "Check", "Waived"];

// ── Form Field Components (module-level to avoid re-creation during render) ──
function FormInput({ label, value, onChange, required, type = "text", placeholder = "", disabled = false, error }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string; placeholder?: string; disabled?: boolean; error?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        className={cn("w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring", error ? "border-red-500" : "border-border", disabled && "opacity-60 cursor-not-allowed bg-muted")} />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormSelect({ label, value, onChange, options, required, disabled = false, error }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; required?: boolean; disabled?: boolean; error?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
        className={cn("w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring", error ? "border-red-500" : "border-border", disabled && "opacity-60 cursor-not-allowed bg-muted")}>
        <option value="" disabled>Select {label}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const pageSize = 10;

  // Modal states
  const [showIssue, setShowIssue] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [viewDocument, setViewDocument] = useState<IssuedDocument | null>(null);
  const [showRevoke, setShowRevoke] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<IssuedDocument | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IssuedDocument | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  // Issue Document form state
  const [issueTab, setIssueTab] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({
    resident_search: "",
    selected_resident_id: "",
    selected_resident_name: "",
    selected_resident_number: "",
    selected_resident_purok: "",
    selected_resident_age: "",
    selected_resident_sex: "",
    selected_resident_mobile: "",
    document_type: "",
    purpose: "",
    validity_period: "6 months",
    amount: "",
    or_number: "",
    payment_method: "Cash",
    notes: "",
  });
  const [residentSearchResults, setResidentSearchResults] = useState<typeof mockResidentsList>([]);
  const [showResidentDropdown, setShowResidentDropdown] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast state
  const [toasts, setToasts] = useState<{ id: number; title: string; description: string }[]>([]);
  const addToast = useCallback((title: string, description: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, description }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const filtered = mockDocuments.filter((d) => {
    if (search) {
      const q = search.toLowerCase();
      if (!d.resident_name.toLowerCase().includes(q) && !d.document_number.toLowerCase().includes(q) && !d.document_type.toLowerCase().includes(q)) return false;
    }
    if (typeFilter !== "All Types" && d.document_type !== typeFilter) return false;
    if (statusFilter !== "All Status" && d.status !== statusFilter.toLowerCase()) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey as keyof IssuedDocument];
    const bVal = b[sortKey as keyof IssuedDocument];
    return sortDir === "asc" ? String(aVal).localeCompare(String(bVal), undefined, { numeric: true }) : String(bVal).localeCompare(String(aVal), undefined, { numeric: true });
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paged = sorted.slice(start, start + pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const releasedCount = mockDocuments.filter((d) => d.status === "released").length;
  const pendingCount = mockDocuments.filter((d) => d.status === "pending" || d.status === "draft").length;
  const totalRevenue = mockDocuments.reduce((sum, d) => sum + d.amount_paid, 0);

  const docTypeColor = (type: string): string => {
    if (type.includes("Clearance")) return "#3b82f6";
    if (type.includes("Residency")) return "#8b5cf6";
    if (type.includes("Indigency")) return "#22c55e";
    if (type.includes("Business")) return "#f59e0b";
    if (type.includes("Good Moral")) return "#06b6d4";
    if (type.includes("Cedula")) return "#ec4899";
    return "#64748b";
  };

  // ── Issue Document Helpers ──
  const openIssueModal = () => {
    setForm({
      resident_search: "", selected_resident_id: "", selected_resident_name: "",
      selected_resident_number: "", selected_resident_purok: "", selected_resident_age: "",
      selected_resident_sex: "", selected_resident_mobile: "",
      document_type: "", purpose: "", validity_period: "6 months",
      amount: "", or_number: "", payment_method: "Cash", notes: "",
    });
    setIssueTab(0);
    setResidentSearchResults([]);
    setShowResidentDropdown(false);
    setFormErrors({});
    setShowIssue(true);
  };

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) setFormErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  };

  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!form.selected_resident_id) errors.resident = "Resident is required. Please search and select a resident.";
    if (!form.document_type) errors.document_type = "Document type is required.";
    if (!form.purpose || !form.purpose.trim()) errors.purpose = "Purpose is required.";
    if (form.amount && (isNaN(Number(form.amount)) || Number(form.amount) < 0)) errors.amount = "Amount must be a non-negative number.";
    setFormErrors(errors);
    return errors;
  };

  const handleFormSubmit = () => {
    if (isSubmitting) return;
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      // Jump to the first tab that has errors
      if (errors.resident) { setIssueTab(0); return; }
      if (errors.document_type || errors.purpose) { setIssueTab(1); return; }
      if (errors.amount) { setIssueTab(2); return; }
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      if (showEdit) {
        addToast("Document Updated", "Document details have been saved successfully.");
      } else {
        addToast("Document Issued", `${form.document_type} has been issued for ${form.selected_resident_name}.`);
      }
      setShowIssue(false);
      setShowEdit(false);
      setFormErrors({});
      setIsSubmitting(false);
    }, 300);
  };

  const handleResidentSearch = (query: string) => {
    updateForm("resident_search", query);
    if (query.length >= 2) {
      const q = query.toLowerCase();
      const results = mockResidentsList.filter(
        (r) => r.name.toLowerCase().includes(q) || r.resident_number.toLowerCase().includes(q)
      );
      setResidentSearchResults(results);
      setShowResidentDropdown(true);
    } else {
      setResidentSearchResults([]);
      setShowResidentDropdown(false);
    }
  };

  const selectResident = (resident: typeof mockResidentsList[0]) => {
    setForm((prev) => ({
      ...prev,
      resident_search: resident.name,
      selected_resident_id: resident.id,
      selected_resident_name: resident.name,
      selected_resident_number: resident.resident_number,
      selected_resident_purok: resident.purok,
      selected_resident_age: String(resident.age),
      selected_resident_sex: resident.sex,
      selected_resident_mobile: resident.mobile,
    }));
    setShowResidentDropdown(false);
    setResidentSearchResults([]);
    if (formErrors.resident) setFormErrors((prev) => { const next = { ...prev }; delete next.resident; return next; });
  };

  const clearSelectedResident = () => {
    setForm((prev) => ({
      ...prev,
      resident_search: "", selected_resident_id: "", selected_resident_name: "",
      selected_resident_number: "", selected_resident_purok: "", selected_resident_age: "",
      selected_resident_sex: "", selected_resident_mobile: "",
    }));
    if (formErrors.resident) setFormErrors((prev) => { const next = { ...prev }; delete next.resident; return next; });
  };

  const openRevoke = (doc: IssuedDocument) => {
    setRevokeTarget(doc);
    setShowRevoke(true);
    setActionMenu(null);
  };

  const openEdit = (doc: IssuedDocument) => {
    setForm({
      resident_search: doc.resident_name,
      selected_resident_id: doc.id,
      selected_resident_name: doc.resident_name,
      selected_resident_number: doc.resident_number,
      selected_resident_purok: "",
      selected_resident_age: "",
      selected_resident_sex: "",
      selected_resident_mobile: "",
      document_type: doc.document_type,
      purpose: doc.purpose,
      validity_period: doc.validity_period || "6 months",
      amount: String(doc.amount_paid),
      or_number: doc.or_number,
      payment_method: doc.payment_method || "Cash",
      notes: doc.notes,
    });
    setIssueTab(0);
    setFormErrors({});
    setShowEdit(true);
    setActionMenu(null);
  };

  const openDelete = (doc: IssuedDocument) => {
    setDeleteTarget(doc);
    setShowDelete(true);
    setActionMenu(null);
  };

  const issueTabs = ["Resident", "Document", "Payment"];


  // ── Render Issue Tab Content ──
  const renderIssueTab = () => {
    switch (issueTab) {
      case 0: return (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">Search and select a resident to issue a document for.</p>
          {/* Resident Search */}
          <div className="relative">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Resident Lookup<span className="text-red-500 ml-0.5">*</span></label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={form.resident_search}
                onChange={(e) => handleResidentSearch(e.target.value)}
                onFocus={() => { if (residentSearchResults.length > 0) setShowResidentDropdown(true); }}
                placeholder="Type resident name or number (e.g. Dela Cruz, RES-2026-0001)"
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring"
                disabled={!!form.selected_resident_id}
              />
              {form.selected_resident_id && (
                <button onClick={clearSelectedResident} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted">
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            {/* Search Dropdown */}
            {showResidentDropdown && residentSearchResults.length > 0 && (
              <div className="absolute z-20 w-full mt-1 glass rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {residentSearchResults.map((r) => (
                  <button key={r.id} onClick={() => selectResident(r)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border last:border-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {r.name.split(",")[0][0]}{r.name.split(" ").pop()?.[0] || ""}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                      <p className="text-[11px] text-muted-foreground">{r.resident_number} | Purok {r.purok}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{r.sex}, {r.age} yrs</span>
                  </button>
                ))}
              </div>
            )}
            {showResidentDropdown && form.resident_search.length >= 2 && residentSearchResults.length === 0 && (
              <div className="absolute z-20 w-full mt-1 glass rounded-lg shadow-lg">
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">No residents found matching your search.</div>
              </div>
            )}
          </div>

          {formErrors.resident && !form.selected_resident_id && (
            <p className="text-[11px] text-red-500 -mt-2">{formErrors.resident}</p>
          )}

          {/* Selected Resident Info */}
          {form.selected_resident_id && (
            <div className="p-4 rounded-lg glass-subtle space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {form.selected_resident_name.split(",")[0][0]}{form.selected_resident_name.split(" ").pop()?.[0] || ""}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{form.selected_resident_name}</p>
                  <p className="text-[11px] text-muted-foreground">{form.selected_resident_number}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <InfoItem label="Purok" value={form.selected_resident_purok} />
                <InfoItem label="Age" value={`${form.selected_resident_age} years old`} />
                <InfoItem label="Sex" value={form.selected_resident_sex} />
                <InfoItem label="Mobile" value={form.selected_resident_mobile} />
              </div>
            </div>
          )}
        </div>
      );
      case 1: return (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">Select the document type and provide the purpose of request.</p>
          <FormSelect label="Document Type" value={form["document_type"] || ""} onChange={(v) => updateForm("document_type", v)} required
            options={issueDocumentTypes.map((t) => ({ value: t, label: t }))}
            error={formErrors.document_type}
          />
          {form.document_type && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: `${docTypeColor(form.document_type)}15`, color: docTypeColor(form.document_type) }}>
              <FileText className="h-3.5 w-3.5" />
              <span className="font-medium">{form.document_type}</span>
              <span className="text-muted-foreground ml-1">| Default fee: {documentFees[form.document_type] === 0 ? "Free" : `₱${documentFees[form.document_type]}`}</span>
            </div>
          )}
          <div>
            <FormInput label="Purpose" value={form["purpose"] || ""} onChange={(v) => updateForm("purpose", v)} required placeholder="e.g. Local Employment, School Enrollment, Medical Assistance" error={formErrors.purpose} />
            <p className="text-[10px] text-muted-foreground mt-1">Common purposes: employment, travel, school enrollment, bank requirement</p>
          </div>
          <FormSelect label="Validity Period" value={form["validity_period"] || ""} onChange={(v) => updateForm("validity_period", v)} required
            options={validityOptions}
          />
        </div>
      );
      case 2: return (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">Enter payment details. Amount auto-fills based on document type.</p>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Amount (PHP)" value={form["amount"] || ""} onChange={(v) => updateForm("amount", v)} required type="number" placeholder="0" error={formErrors.amount} />
            <FormInput label="OR Number" value={form["or_number"] || ""} onChange={(v) => updateForm("or_number", v)} placeholder="e.g. OR-2026-0343" />
          </div>
          <FormSelect label="Payment Method" value={form["payment_method"] || ""} onChange={(v) => updateForm("payment_method", v)} required
            options={paymentMethods.map((m) => ({ value: m, label: m }))}
          />
          {form.payment_method === "Waived" && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-xs border border-amber-200 dark:border-amber-900">
              <AlertTriangle className="h-3.5 w-3.5" />
              Payment is waived. OR number is not required.
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => updateForm("notes", e.target.value)}
              placeholder="Optional notes about this document issuance..."
              className="w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring resize-y min-h-[80px]" />
          </div>

          {/* Summary Card */}
          <div className="p-4 rounded-lg glass-subtle space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Issuance Summary</h4>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Resident:</span>
                <span className="ml-2 font-medium text-foreground">{form.selected_resident_name || "Not selected"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Document:</span>
                <span className="ml-2 font-medium text-foreground">{form.document_type || "Not selected"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Purpose:</span>
                <span className="ml-2 font-medium text-foreground">{form.purpose || "Not provided"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Validity:</span>
                <span className="ml-2 font-medium text-foreground">{form.validity_period}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Amount:</span>
                <span className="ml-2 font-medium text-foreground">{Number(form.amount) > 0 ? `₱${Number(form.amount).toLocaleString()}` : "Free"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Payment:</span>
                <span className="ml-2 font-medium text-foreground">{form.payment_method || "Not selected"}</span>
              </div>
            </div>
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Issue and manage barangay certificates, clearances, and permits"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Services" }, { label: "Documents" }]}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><Download className="h-4 w-4" /> Export</button>
            <button onClick={openIssueModal} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}><Plus className="h-4 w-4" /> Issue Document</button>
          </div>
        }
      />

      {/* Mabini AI Insight */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-bg/30 border border-accent-primary/20">
        <Bot className="h-4 w-4 shrink-0" style={{ color: "var(--accent-primary)" }} />
        <p className="text-[11px] text-muted-foreground"><span className="font-semibold text-foreground">Mabini:</span> 2 documents pending review for over 24 hours. Barangay Clearance is the most issued document this month (45%). Revenue up 12% vs last month.</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Issued" value={mockDocuments.length} icon={<FileText className="h-5 w-5" />} trend={{ value: 12, label: "vs last month" }} />
        <StatCard label="Released" value={releasedCount} icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatCard label="Pending / Draft" value={pendingCount} icon={<Clock className="h-5 w-5" />} trend={{ value: -2, label: "processing" }} />
        <StatCard label="Revenue This Month" value={`₱${totalRevenue.toLocaleString()}`} icon={<FileCheck2 className="h-5 w-5" />} trend={{ value: 8, label: "vs last month" }} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by resident, document number, or type..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring" />
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
              className="px-3 py-1.5 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring">
              {documentTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring">
              {statusOptions.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => { setTypeFilter("All Types"); setStatusFilter("All Status"); }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /> Clear</button>
          </div>
        )}
      </div>

      <div className="rounded-xl glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label="Document" field="document_number" />
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Resident</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Purpose</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Blockchain</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                      <FileText className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">No documents issued yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Issue your first barangay document.</p>
                    </div>
                    <button onClick={openIssueModal} className="flex items-center gap-1.5 px-4 py-2 mt-1 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
                      <Plus className="h-4 w-4" /> Issue Document
                    </button>
                  </div>
                </td></tr>
              ) : (
                paged.map((d) => {
                  const typeColor = docTypeColor(d.document_type);
                  return (
                    <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setViewDocument(d)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${typeColor}15` }}>
                            <FileText className="h-4 w-4" style={{ color: typeColor }} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{d.document_number}</p>
                            <p className="text-[11px] text-muted-foreground">{d.issued_at || "Not yet issued"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground">{d.resident_name}</p>
                        <p className="text-[11px] text-muted-foreground">{d.resident_number}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium" style={{ background: `${typeColor}15`, color: typeColor }}>{d.document_type}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{d.purpose}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{d.amount_paid > 0 ? `₱${d.amount_paid}` : "Free"}</td>
                      <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                      <td className="px-4 py-3">
                        {d.blockchain_hash ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <QrCode className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-mono">{d.blockchain_hash}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(ev) => ev.stopPropagation()}>
                        <div className="relative">
                          <button onClick={() => setActionMenu(actionMenu === d.id ? null : d.id)} className="p-1.5 rounded hover:bg-muted transition-colors">
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </button>
                          {actionMenu === d.id && (
                            <div className="absolute right-0 top-8 z-20 w-44 glass rounded-lg shadow-lg py-1">
                              <button onClick={() => { setViewDocument(d); setActionMenu(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left">
                                <Eye className="h-3.5 w-3.5" /> View Details
                              </button>
                              <button onClick={() => openEdit(d)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left">
                                <Edit className="h-3.5 w-3.5" /> Edit
                              </button>
                              {d.status === "released" && (
                                <button onClick={() => { setActionMenu(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left">
                                  <Printer className="h-3.5 w-3.5" /> Print
                                </button>
                              )}
                              {(d.status === "released" || d.status === "pending") && (
                                <>
                                  <div className="border-t border-border my-1" />
                                  <button onClick={() => openRevoke(d)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left text-red-600">
                                    <Ban className="h-3.5 w-3.5" /> Revoke
                                  </button>
                                </>
                              )}
                              {d.status === "draft" && (
                                <>
                                  <div className="border-t border-border my-1" />
                                  <button onClick={() => openDelete(d)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left text-red-600">
                                    <Trash2 className="h-3.5 w-3.5" /> Delete
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">Showing {start + 1}–{Math.min(start + pageSize, sorted.length)} of {sorted.length}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={safePage <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronsLeft className="h-4 w-4" /></button>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              <span className="px-3 py-1 text-sm">{safePage} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
              <button onClick={() => setPage(totalPages)} disabled={safePage >= totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronsRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* ── Issue / Edit Document Modal ── */}
      <Modal open={showIssue || showEdit} onClose={() => { setShowIssue(false); setShowEdit(false); }}
        title={showEdit ? "Edit Document" : "Issue Document"}
        description={showEdit ? "Update document details" : "Create a new barangay document for a resident"}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {issueTab > 0 && (
                <ModalButton variant="secondary" onClick={() => setIssueTab((t) => t - 1)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </ModalButton>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ModalButton variant="secondary" onClick={() => { setShowIssue(false); setShowEdit(false); }}>Cancel</ModalButton>
              {issueTab < issueTabs.length - 1 ? (
                <ModalButton variant="primary" onClick={() => setIssueTab((t) => t + 1)}
                  disabled={issueTab === 0 && !form.selected_resident_id || issueTab === 1 && (!form.document_type || !form.purpose)}>
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </ModalButton>
              ) : (
                <ModalButton variant="primary" onClick={handleFormSubmit} disabled={isSubmitting}>
                  <Save className="w-4 h-4 mr-1" /> {isSubmitting ? "Saving..." : showEdit ? "Update Document" : "Issue Document"}
                </ModalButton>
              )}
            </div>
          </div>
        }>
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {issueTabs.map((tab, i) => {
            const tabIcons = [<User key="u" className="h-3.5 w-3.5 mr-1.5" />, <FileText key="f" className="h-3.5 w-3.5 mr-1.5" />, <CreditCard key="c" className="h-3.5 w-3.5 mr-1.5" />];
            return (
              <button key={tab} onClick={() => setIssueTab(i)}
                className={cn("flex items-center px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors",
                  issueTab === i ? "bg-accent-bg text-accent-text" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold mr-1.5"
                  style={issueTab === i ? { background: "var(--accent-primary)", color: "#fff" } : { background: "var(--muted)", color: "var(--muted-foreground)" }}>
                  {i + 1}
                </span>
                {tabIcons[i]}
                {tab}
              </button>
            );
          })}
        </div>
        {renderIssueTab()}
      </Modal>

      {/* ── View Document Modal ── */}
      <Modal open={!!viewDocument && !showRevoke} onClose={() => setViewDocument(null)}
        title={viewDocument ? viewDocument.document_number : ""}
        description={viewDocument ? viewDocument.document_type : ""}
        size="lg"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setViewDocument(null)}>Close</ModalButton>
            {viewDocument?.status === "released" && (
              <ModalButton variant="primary"><Printer className="h-4 w-4 mr-1" /> Print</ModalButton>
            )}
          </>
        }>
        {viewDocument && (
          <div className="space-y-6">
            {/* Status Banner */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${docTypeColor(viewDocument.document_type)}15` }}>
                  <FileText className="h-5 w-5" style={{ color: docTypeColor(viewDocument.document_type) }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{viewDocument.document_number}</p>
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium" style={{ background: `${docTypeColor(viewDocument.document_type)}15`, color: docTypeColor(viewDocument.document_type) }}>
                    {viewDocument.document_type}
                  </span>
                </div>
              </div>
              <StatusBadge status={viewDocument.status} />
            </div>

            {/* Resident Info */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Resident Information</h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                <InfoItem icon={<User className="h-4 w-4" />} label="Name" value={viewDocument.resident_name} />
                <InfoItem icon={<Hash className="h-4 w-4" />} label="Resident Number" value={viewDocument.resident_number} />
              </div>
            </div>

            {/* Document Details */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Document Details</h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                <InfoItem icon={<FileText className="h-4 w-4" />} label="Purpose" value={viewDocument.purpose} />
                <InfoItem icon={<Calendar className="h-4 w-4" />} label="Valid Until" value={viewDocument.valid_until || "Not yet issued"} />
                <InfoItem label="Validity Period" value={viewDocument.validity_period || "—"} />
                <InfoItem label="Issued By" value={viewDocument.issued_by || "Not yet issued"} />
                <InfoItem label="Issue Date" value={viewDocument.issued_at || "Not yet issued"} />
              </div>
            </div>

            {/* Payment Info */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Payment Information</h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                <InfoItem icon={<DollarSign className="h-4 w-4" />} label="Amount Paid" value={viewDocument.amount_paid > 0 ? `₱${viewDocument.amount_paid.toLocaleString()}` : "Free"} />
                <InfoItem label="OR Number" value={viewDocument.or_number || "—"} />
                <InfoItem icon={<CreditCard className="h-4 w-4" />} label="Payment Method" value={viewDocument.payment_method || "—"} />
              </div>
            </div>

            {/* Blockchain Verification */}
            {viewDocument.blockchain_hash && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Blockchain Verification</h4>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
                  <QrCode className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Verified on Blockchain</p>
                    <p className="text-[11px] font-mono text-emerald-600/80 dark:text-emerald-400/80">{viewDocument.blockchain_hash}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {viewDocument.notes && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Notes</h4>
                <p className="text-sm text-foreground bg-muted/30 p-3 rounded-lg border border-border">{viewDocument.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Revoke Confirmation Modal ── */}
      <Modal open={showRevoke} onClose={() => { setShowRevoke(false); setRevokeTarget(null); }} title="Revoke Document" size="sm"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { setShowRevoke(false); setRevokeTarget(null); }}>Cancel</ModalButton>
            <ModalButton variant="danger" onClick={() => { addToast("Document Revoked", `${revokeTarget?.document_number || "Document"} has been revoked.`); setShowRevoke(false); setRevokeTarget(null); setViewDocument(null); }}>Revoke Document</ModalButton>
          </>
        }>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">This will permanently revoke the document. The resident will need to request a new one if needed.</p>
          </div>
          {revokeTarget && (
            <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-1">
              <p className="text-sm font-medium text-foreground">{revokeTarget.document_number}</p>
              <p className="text-xs text-muted-foreground">{revokeTarget.document_type} for {revokeTarget.resident_name}</p>
            </div>
          )}
          <p className="text-sm text-muted-foreground">Are you sure you want to revoke this document?</p>
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal open={showDelete} onClose={() => { setShowDelete(false); setDeleteTarget(null); }} title="Delete Document" size="sm"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { setShowDelete(false); setDeleteTarget(null); }}>Cancel</ModalButton>
            <ModalButton variant="danger" onClick={() => { setShowDelete(false); setDeleteTarget(null); setViewDocument(null); }}>Delete Document</ModalButton>
          </>
        }>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
            <Trash2 className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">This will permanently delete this draft document. This action cannot be undone.</p>
          </div>
          {deleteTarget && (
            <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-1">
              <p className="text-sm font-medium text-foreground">{deleteTarget.document_number}</p>
              <p className="text-xs text-muted-foreground">{deleteTarget.document_type} for {deleteTarget.resident_name}</p>
            </div>
          )}
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this document?</p>
        </div>
      </Modal>

      {/* ── Toast Notifications ── */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          {toasts.map((toast) => (
            <div key={toast.id} className="flex items-start gap-3 px-4 py-3 rounded-lg glass shadow-lg animate-in slide-in-from-bottom-2 max-w-sm">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{toast.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{toast.description}</p>
              </div>
              <button onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))} className="p-0.5 rounded hover:bg-muted shrink-0">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      {icon && <div className="mt-0.5 text-muted-foreground">{icon}</div>}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
      <MabiniButton pageContext="You are on the Documents page. This page manages issuance of barangay clearances, certificates, and other official documents." />
    </div>
  );
}
