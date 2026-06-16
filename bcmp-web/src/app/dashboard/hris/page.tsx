"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  UserCog,
  Plus,
  Search,
  Download,
  Users,
  Briefcase,
  Award,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Bot,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { MabiniButton } from "@/components/ui/mabini-button";
import { api } from "@/lib/api";

interface Resident {
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  contact_number?: string | null;
  email?: string | null;
}

interface Office {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  employee_number: string;
  position: string;
  employment_type: "regular" | "casual" | "job_order" | "elected" | "appointed";
  date_hired: string;
  status: "active" | "inactive" | "resigned" | "terminated";
  office_id: string | null;
  resident_id: string;
  resident?: Resident | null;
  office?: Office | null;
}

interface PaginatedEmployees {
  data: Employee[];
  total: number;
  last_page: number;
}

interface ResidentSearchResult {
  data: Resident[];
}

const formTabs = ["Assignment", "Employment"];

function FormInput({ label, name, value, placeholder, required, type, error, onChange }: {
  label: string; name: string; value: string; placeholder?: string; required?: boolean;
  type?: string; error?: string; onChange: (n: string, v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type || "text"} value={value} onChange={(e) => onChange(name, e.target.value)} placeholder={placeholder}
        className={cn("w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring", error ? "border-red-500" : "border-border")} />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormSelect({ label, name, value, options, required, error, onChange }: {
  label: string; name: string; value: string; options: { value: string; label: string }[]; required?: boolean;
  error?: string; onChange: (n: string, v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select value={value} onChange={(e) => onChange(name, e.target.value)}
        className={cn("w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring", error ? "border-red-500" : "border-border")}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

type ToastType = "success" | "error" | "warning" | "info";

const fullName = (r?: Resident | null) =>
  r ? `${r.first_name}${r.middle_name ? ` ${r.middle_name.charAt(0)}.` : ""} ${r.last_name}` : "—";

export default function HrisPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [officeFilter, setOfficeFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [formTab, setFormTab] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  // Resident search for create form
  const [residentSearch, setResidentSearch] = useState("");
  const [residentResults, setResidentResults] = useState<Resident[]>([]);
  const [residentSearchLoading, setResidentSearchLoading] = useState(false);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [toasts, setToasts] = useState<{ id: string; type: ToastType; title: string; message?: string }[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ per_page: "100", sort_by: "employee_number", sort_dir: "asc" });
      if (search) params.set("search", search);
      if (officeFilter) params.set("office_id", officeFilter);
      if (typeFilter) params.set("employment_type", typeFilter);
      const [empRes, officeRes] = await Promise.all([
        api.get<PaginatedEmployees>(`/employees?${params}`),
        api.get<{ data: Office[] }>("/offices"),
      ]);
      setEmployees((empRes as PaginatedEmployees).data ?? []);
      setOffices((officeRes as { data: Office[] }).data ?? []);
    } catch {
      addToast("error", "Failed to load employee data");
    } finally {
      setLoading(false);
    }
  }, [search, officeFilter, typeFilter, addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const searchResidents = useCallback(async (q: string) => {
    if (q.length < 2) { setResidentResults([]); return; }
    setResidentSearchLoading(true);
    try {
      const res = await api.get<ResidentSearchResult>(`/residents?search=${encodeURIComponent(q)}&per_page=10`);
      setResidentResults((res as ResidentSearchResult).data ?? []);
    } catch {
      setResidentResults([]);
    } finally {
      setResidentSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { searchResidents(residentSearch); }, 300);
    return () => clearTimeout(t);
  }, [residentSearch, searchResidents]);

  const handleFieldChange = (name: string, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    setFormErrors((e) => { const next = { ...e }; delete next[name]; return next; });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!showEdit && !selectedResident) errors.resident_id = "Select a resident from the barangay directory";
    if (!form.position?.trim()) errors.position = "Position is required";
    if (!form.employment_type) errors.employment_type = "Employment type is required";
    if (!form.date_hired) errors.date_hired = "Date hired is required";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      const tab0 = ["resident_id"];
      if (Object.keys(errors).some((k) => tab0.includes(k))) setFormTab(0);
      else setFormTab(1);
      return false;
    }
    return true;
  };

  const openCreate = () => {
    setForm({ status: "active" }); setFormErrors({}); setFormTab(0);
    setSelectedResident(null); setResidentSearch(""); setResidentResults([]);
    setShowCreate(true);
  };
  const openEdit = (e: Employee) => {
    setForm({
      office_id: e.office_id ?? "",
      position: e.position,
      employment_type: e.employment_type,
      date_hired: e.date_hired,
      status: e.status,
    });
    setFormErrors({}); setFormTab(0); setDeleteTarget(e); setShowEdit(true);
    setViewEmployee(null); setActionMenu(null);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setFormLoading(true);
    try {
      if (showEdit && deleteTarget) {
        const payload = {
          office_id: form.office_id || null,
          position: form.position,
          employment_type: form.employment_type,
          date_hired: form.date_hired,
          status: form.status,
        };
        await api.put(`/employees/${deleteTarget.id}`, payload);
        addToast("success", "Record updated", `${fullName(deleteTarget.resident)}'s record has been updated.`);
      } else {
        const payload = {
          resident_id: selectedResident!.id,
          office_id: form.office_id || null,
          position: form.position,
          employment_type: form.employment_type,
          date_hired: form.date_hired,
          status: form.status || "active",
        };
        await api.post("/employees", payload);
        addToast("success", "Employee added", `${fullName(selectedResident)} has been added to the roster.`);
      }
      setShowCreate(false); setShowEdit(false); setDeleteTarget(null);
      fetchData();
    } catch {
      addToast("error", "Save failed", "Please check your inputs and try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setFormLoading(true);
    try {
      await api.delete(`/employees/${deleteTarget.id}`);
      addToast("success", "Record deleted", `${fullName(deleteTarget.resident)}'s record has been removed.`);
      setShowDelete(false); setDeleteTarget(null);
      fetchData();
    } catch {
      addToast("error", "Delete failed");
    } finally {
      setFormLoading(false);
    }
  };

  const activeCount = employees.filter((e) => e.status === "active").length;
  const electedCount = employees.filter((e) => e.employment_type === "elected").length;

  const typeVariant = (t: string) => ({ elected: "info", appointed: "muted", regular: "success", casual: "warning", job_order: "muted" }[t] ?? "muted") as "info" | "muted" | "success" | "warning";

  const officeOptions = [
    { value: "", label: "All Offices" },
    ...offices.map((o) => ({ value: o.id, label: o.name })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="HRIS"
        description="Barangay personnel and human resources"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Operations" }, { label: "HRIS" }]}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => addToast("info", "Exporting records", "Personnel records are being exported.")}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors">
              <Download className="h-4 w-4" /> Export
            </button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
              <Plus className="h-4 w-4" /> Add Personnel
            </button>
          </div>
        }
      />

      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-accent-primary/20 bg-accent-bg/30">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--accent-primary)", opacity: 0.15 }}>
          <Bot className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Mabini AI HR Overview</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            {employees.length === 0
              ? "No personnel records yet. Add barangay officials and staff to manage HR records, attendance, and payroll."
              : `${activeCount} active personnel across ${offices.length} office(s). ${electedCount} elected officials on record.`}
          </p>
        </div>
        <button onClick={() => router.push("/dashboard/ai")} className="shrink-0 px-3 py-1.5 text-[10px] font-semibold rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--accent-primary)", color: "#fff" }}>
          Ask Mabini
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Personnel" value={loading ? "—" : employees.length} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Active" value={loading ? "—" : activeCount} icon={<UserCog className="h-5 w-5" />} />
        <StatCard label="Elected Officials" value={loading ? "—" : electedCount} icon={<Award className="h-5 w-5" />} />
        <StatCard label="Offices" value={loading ? "—" : offices.length} icon={<Briefcase className="h-5 w-5" />} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by position or employee number..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring" />
        </div>
        <select value={officeFilter} onChange={(e) => setOfficeFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring">
          {officeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring">
          <option value="">All Types</option>
          <option value="elected">Elected</option>
          <option value="appointed">Appointed</option>
          <option value="regular">Regular</option>
          <option value="casual">Casual</option>
          <option value="job_order">Job Order</option>
        </select>
      </div>

      <div className="rounded-xl glass overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Position</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Office</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="w-10 px-2 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center">
                <div className="flex items-center justify-center gap-3 text-muted-foreground">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Loading personnel...</span>
                </div>
              </td></tr>
            ) : employees.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <UserCog className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">No employee records found</p>
                    <p className="text-xs text-muted-foreground mt-1">Add barangay officials and staff to manage attendance, and service records.</p>
                  </div>
                  <button onClick={openCreate} className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
                    + Add Employee
                  </button>
                </div>
              </td></tr>
            ) : employees.map((e) => (
              <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setViewEmployee(e)}>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-foreground">{fullName(e.resident)}</p>
                  <p className="text-[11px] text-muted-foreground">#{e.employee_number}</p>
                </td>
                <td className="px-4 py-3 text-sm text-foreground">{e.position}</td>
                <td className="px-4 py-3"><Badge variant="muted">{e.office?.name ?? "—"}</Badge></td>
                <td className="px-4 py-3"><Badge variant={typeVariant(e.employment_type)}>{e.employment_type.replace("_", " ")}</Badge></td>
                <td className="px-4 py-3"><StatusBadge status={e.status === "active" ? "active" : "inactive"} /></td>
                <td className="px-2 py-3">
                  <div className="relative" onClick={(ev) => ev.stopPropagation()}>
                    <button onClick={() => setActionMenu(actionMenu === e.id ? null : e.id)} className="p-1.5 rounded hover:bg-muted">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </button>
                    {actionMenu === e.id && (
                      <div className="absolute right-0 top-8 z-20 w-44 glass rounded-lg shadow-lg py-1">
                        <button onClick={() => { setViewEmployee(e); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Eye className="h-3.5 w-3.5" /> View</button>
                        <button onClick={() => openEdit(e)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Edit className="h-3.5 w-3.5" /> Edit</button>
                        <button onClick={() => { setDeleteTarget(e); setShowDelete(true); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-muted flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      <Modal open={!!viewEmployee} onClose={() => setViewEmployee(null)} title={fullName(viewEmployee?.resident)} description={viewEmployee?.position || ""} size="md"
        footer={<>
          <ModalButton variant="secondary" onClick={() => setViewEmployee(null)}>Close</ModalButton>
          <ModalButton variant="primary" onClick={() => { if (viewEmployee) openEdit(viewEmployee); }}>Edit Record</ModalButton>
        </>}>
        {viewEmployee && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusBadge status={viewEmployee.status === "active" ? "active" : "inactive"} />
              <Badge variant={typeVariant(viewEmployee.employment_type)}>{viewEmployee.employment_type.replace("_", " ")}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div><p className="text-[11px] text-muted-foreground uppercase">Employee #</p><p className="text-sm">{viewEmployee.employee_number}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Office</p><p className="text-sm">{viewEmployee.office?.name ?? "—"}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Contact</p><p className="text-sm">{viewEmployee.resident?.contact_number ?? "—"}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Email</p><p className="text-sm">{viewEmployee.resident?.email ?? "—"}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Date Hired</p><p className="text-sm">{viewEmployee.date_hired}</p></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal open={showCreate || showEdit} onClose={() => { setShowCreate(false); setShowEdit(false); setDeleteTarget(null); }}
        title={showEdit ? "Edit Personnel Record" : "Add Personnel"} size="lg"
        footer={<>
          <ModalButton variant="secondary" onClick={() => { setShowCreate(false); setShowEdit(false); setDeleteTarget(null); }}>Cancel</ModalButton>
          {formTab > 0 && <ModalButton variant="secondary" onClick={() => setFormTab((t) => t - 1)}>Previous</ModalButton>}
          {formTab < formTabs.length - 1
            ? <ModalButton variant="primary" onClick={() => setFormTab((t) => t + 1)}>Next</ModalButton>
            : <ModalButton variant="primary" onClick={handleSubmit} disabled={formLoading}>{formLoading ? "Saving..." : showEdit ? "Update" : "Save"}</ModalButton>}
        </>}>
        <div className="flex border-b border-border mb-6">
          {formTabs.map((tab, i) => (
            <button key={tab} onClick={() => setFormTab(i)}
              className={cn("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors", formTab === i ? "border-accent-primary text-accent-text" : "border-transparent text-muted-foreground hover:text-foreground")}>
              {tab}
            </button>
          ))}
        </div>
        {formTab === 0 && (
          <div className="space-y-4">
            {showCreate ? (
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                  Resident <span className="text-red-500">*</span>
                </label>
                {selectedResident ? (
                  <div className="flex items-center justify-between p-3 rounded-xl glass border border-accent-primary/30">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{fullName(selectedResident)}</p>
                      {selectedResident.contact_number && <p className="text-xs text-muted-foreground">{selectedResident.contact_number}</p>}
                    </div>
                    <button onClick={() => { setSelectedResident(null); setResidentSearch(""); }} className="text-xs text-muted-foreground hover:text-foreground">Change</button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input type="text" value={residentSearch} onChange={(e) => setResidentSearch(e.target.value)}
                      placeholder="Search resident by name..."
                      className={cn("w-full pl-9 pr-4 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring", formErrors.resident_id ? "border-red-500" : "border-border")} />
                    {residentResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-20 glass rounded-xl shadow-lg max-h-48 overflow-auto">
                        {residentResults.map((r) => (
                          <button key={r.id} onClick={() => { setSelectedResident(r); setResidentResults([]); setResidentSearch(""); }}
                            className="w-full px-3 py-2.5 text-left hover:bg-muted transition-colors border-b border-border last:border-0">
                            <p className="text-sm font-medium text-foreground">{fullName(r)}</p>
                            {r.contact_number && <p className="text-xs text-muted-foreground">{r.contact_number}</p>}
                          </button>
                        ))}
                      </div>
                    )}
                    {residentSearchLoading && <p className="text-xs text-muted-foreground mt-1">Searching...</p>}
                    {formErrors.resident_id && <p className="text-[11px] text-red-500 mt-1">{formErrors.resident_id}</p>}
                  </div>
                )}
              </div>
            ) : deleteTarget && (
              <div className="p-3 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground uppercase mb-1">Employee</p>
                <p className="text-sm font-semibold">{fullName(deleteTarget.resident)}</p>
                <p className="text-xs text-muted-foreground">#{deleteTarget.employee_number}</p>
              </div>
            )}
            <FormSelect label="Office / Department" name="office_id" value={form.office_id || ""}
              options={[{ value: "", label: "— No office assigned —" }, ...offices.map((o) => ({ value: o.id, label: o.name }))]}
              onChange={handleFieldChange} />
          </div>
        )}
        {formTab === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormInput label="Position" name="position" value={form.position || ""} placeholder="e.g. Kagawad" required error={formErrors.position} onChange={handleFieldChange} />
              <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">Use official DILG position titles.</p>
            </div>
            <div>
              <FormSelect label="Employment Type" name="employment_type" value={form.employment_type || ""}
                options={[
                  { value: "", label: "— Select —" },
                  { value: "elected", label: "Elected" },
                  { value: "appointed", label: "Appointed" },
                  { value: "regular", label: "Regular" },
                  { value: "casual", label: "Casual" },
                  { value: "job_order", label: "Job Order" },
                ]}
                required error={formErrors.employment_type} onChange={handleFieldChange} />
              <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">Elected officials serve 3-year terms. Appointed staff follow CSC rules.</p>
            </div>
            <FormInput label="Date Hired / Appointed" name="date_hired" value={form.date_hired || ""} type="date" required error={formErrors.date_hired} onChange={handleFieldChange} />
            <FormSelect label="Status" name="status" value={form.status || "active"}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "resigned", label: "Resigned" },
                { value: "terminated", label: "Terminated" },
              ]}
              onChange={handleFieldChange} />
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal open={showDelete} onClose={() => { setShowDelete(false); setDeleteTarget(null); }} title="Confirm Delete" description="This action cannot be undone." size="sm"
        footer={<>
          <ModalButton variant="secondary" onClick={() => { setShowDelete(false); setDeleteTarget(null); }}>Cancel</ModalButton>
          <ModalButton variant="danger" onClick={handleDelete} disabled={formLoading}>{formLoading ? "Deleting..." : "Delete"}</ModalButton>
        </>}>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <span className="font-semibold text-foreground">{fullName(deleteTarget?.resident)}</span>
          {deleteTarget?.position ? <> ({deleteTarget.position})</> : null}? This will permanently remove their personnel record.
        </p>
      </Modal>

      {/* Toasts */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
          {toasts.map((toast) => (
            <div key={toast.id} className={cn("flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg animate-in slide-in-from-right-5 fade-in duration-300",
              toast.type === "success" && "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800",
              toast.type === "error" && "bg-red-50 dark:bg-red-950/80 border-red-200 dark:border-red-800",
              toast.type === "info" && "bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800",
            )}>
              <div className="shrink-0 mt-0.5">
                {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                {toast.type === "error" && <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />}
                {toast.type === "info" && <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-semibold",
                  toast.type === "success" && "text-emerald-800 dark:text-emerald-200",
                  toast.type === "error" && "text-red-800 dark:text-red-200",
                  toast.type === "info" && "text-blue-800 dark:text-blue-200",
                )}>{toast.title}</p>
                {toast.message && <p className={cn("text-xs mt-0.5",
                  toast.type === "success" && "text-emerald-700 dark:text-emerald-300",
                  toast.type === "error" && "text-red-700 dark:text-red-300",
                  toast.type === "info" && "text-blue-700 dark:text-blue-300",
                )}>{toast.message}</p>}
              </div>
              <button onClick={() => setToasts((p) => p.filter((t) => t.id !== toast.id))} className="shrink-0 p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}

      <MabiniButton pageContext="You are on the HRIS (Human Resource Information System) page. This page manages barangay officials and staff records, linked to the resident directory." />
    </div>
  );
}
