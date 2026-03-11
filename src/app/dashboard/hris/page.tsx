"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  UserCog,
  Plus,
  Search,
  Download,
  Phone,
  Users,
  Briefcase,
  Award,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Bot,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

interface Personnel {
  id: string;
  name: string;
  position: string;
  department: string;
  employment_type: string;
  status: string;
  contact: string;
  email: string;
  start_date: string;
  monthly_rate: number;
}

const mockPersonnel: Personnel[] = [
  { id: "1", name: "Hon. Roberto Dela Cruz", position: "Punong Barangay", department: "Executive", employment_type: "Elected", status: "active", contact: "0917-000-0001", email: "captain@brgy-tambo.gov.ph", start_date: "2023-06-30", monthly_rate: 15000 },
  { id: "2", name: "Elena Santos", position: "Barangay Secretary", department: "Administrative", employment_type: "Appointed", status: "active", contact: "0918-000-0002", email: "secretary@brgy-tambo.gov.ph", start_date: "2023-07-01", monthly_rate: 12000 },
  { id: "3", name: "Carmen Reyes", position: "Barangay Treasurer", department: "Finance", employment_type: "Appointed", status: "active", contact: "0919-000-0003", email: "treasurer@brgy-tambo.gov.ph", start_date: "2023-07-01", monthly_rate: 12000 },
  { id: "4", name: "Marco Lopez", position: "Kagawad", department: "Legislative", employment_type: "Elected", status: "active", contact: "0920-000-0004", email: "", start_date: "2023-06-30", monthly_rate: 10000 },
  { id: "5", name: "Angelica Reyes", position: "Kagawad", department: "Legislative", employment_type: "Elected", status: "active", contact: "0921-000-0005", email: "", start_date: "2023-06-30", monthly_rate: 10000 },
  { id: "6", name: "Rosa Pascual", position: "SK Chairperson", department: "SK", employment_type: "Elected", status: "active", contact: "0922-000-0006", email: "sk@brgy-tambo.gov.ph", start_date: "2023-10-30", monthly_rate: 5000 },
  { id: "7", name: "Maria Cruz", position: "Barangay Health Worker", department: "Health", employment_type: "Volunteer", status: "active", contact: "0923-000-0007", email: "", start_date: "2024-01-15", monthly_rate: 3000 },
  { id: "8", name: "Ricardo Garcia", position: "Tanod Chief", department: "Peace & Order", employment_type: "Appointed", status: "active", contact: "0917-111-2222", email: "", start_date: "2022-01-15", monthly_rate: 5000 },
  { id: "9", name: "Luisa Mendoza", position: "Day Care Worker", department: "Social Services", employment_type: "Appointed", status: "active", contact: "0924-000-0009", email: "", start_date: "2020-06-01", monthly_rate: 8000 },
  { id: "10", name: "Pedro Bautista", position: "Utility Worker", department: "Administrative", employment_type: "Job Order", status: "active", contact: "0925-000-0010", email: "", start_date: "2025-01-02", monthly_rate: 6000 },
];

const departments = ["All", "Executive", "Administrative", "Finance", "Legislative", "SK", "Health", "Peace & Order", "Social Services"];

const formTabs = ["Personal", "Employment", "Government IDs"];

function FormInput({ label, name, value, placeholder, required, type, error, onChange }: { label: string; name: string; value: string; placeholder?: string; required?: boolean; type?: string; error?: string; onChange: (name: string, value: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type || "text"} value={value} onChange={(e) => onChange(name, e.target.value)} placeholder={placeholder} className={cn("w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2", error ? "border-red-500 focus:ring-red-300" : "border-border focus:ring-accent-ring")} />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormSelect({ label, name, value, options, required, error, onChange }: { label: string; name: string; value: string; options: string[]; required?: boolean; error?: string; onChange: (name: string, value: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select value={value} onChange={(e) => onChange(name, e.target.value)} className={cn("w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2", error ? "border-red-500 focus:ring-red-300" : "border-border focus:ring-accent-ring")}>
        {options.map((o) => <option key={o} value={o}>{o || "\u2014 Select \u2014"}</option>)}
      </select>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default function HrisPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [viewPerson, setViewPerson] = useState<Personnel | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deletePerson, setDeletePerson] = useState<Personnel | null>(null);
  const [formTab, setFormTab] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{id: string; type: "success"|"error"|"warning"|"info"; title: string; message?: string}[]>([]);

  const addToast = useCallback((type: "success"|"error"|"warning"|"info", title: string, message?: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const filtered = mockPersonnel.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.position.toLowerCase().includes(q);
    }
    if (deptFilter !== "All" && p.department !== deptFilter) return false;
    return true;
  });

  const totalPayroll = mockPersonnel.filter((p) => p.status === "active").reduce((sum, p) => sum + p.monthly_rate, 0);
  const electedCount = mockPersonnel.filter((p) => p.employment_type === "Elected").length;

  const openCreate = () => {
    setForm({});
    setFormErrors({});
    setFormTab(0);
    setShowCreate(true);
  };

  const openEdit = (p: Personnel) => {
    setForm({
      first_name: p.name.split(" ").slice(0, -1).join(" "),
      last_name: p.name.split(" ").slice(-1)[0],
      position: p.position,
      department: p.department,
      employment_type: p.employment_type,
      contact_number: p.contact,
      email: p.email,
      date_appointed: p.start_date,
      monthly_salary: String(p.monthly_rate),
    });
    setFormErrors({});
    setFormTab(0);
    setShowEdit(true);
    setActionMenu(null);
  };

  const handleFieldChange = (name: string, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    setFormErrors((e) => {
      const next = { ...e };
      delete next[name];
      return next;
    });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.first_name?.trim()) errors.first_name = "First name is required";
    if (!form.last_name?.trim()) errors.last_name = "Last name is required";
    if (!form.position?.trim()) errors.position = "Position is required";
    if (!form.department?.trim()) errors.department = "Department is required";
    if (!form.employment_type?.trim()) errors.employment_type = "Employment type is required";
    if (!form.contact_number?.trim()) errors.contact_number = "Contact number is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="HRIS"
        description="Barangay personnel and human resources"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Operations" }, { label: "HRIS" }]}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => addToast("info", "Exporting records", "Personnel records are being exported.")} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><Download className="h-4 w-4" /> Export</button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}><Plus className="h-4 w-4" /> Add Personnel</button>
          </div>
        }
      />

      {/* Mabini AI Insight */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-accent-primary/20 bg-accent-bg/30">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--accent-primary)", opacity: 0.15 }}>
          <Bot className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Mabini AI HR Overview</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            10 active personnel across 8 departments. Monthly payroll at P88,000. 2 employees missing PhilHealth numbers — update required for compliance. No upcoming appointment expirations.
          </p>
        </div>
        <button onClick={() => router.push("/dashboard/ai")} className="shrink-0 px-3 py-1.5 text-[10px] font-semibold rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--accent-primary)", color: "#fff" }}>
          Ask Mabini
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Personnel" value={mockPersonnel.length} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Elected Officials" value={electedCount} icon={<Award className="h-5 w-5" />} />
        <StatCard label="Departments" value={departments.length - 1} icon={<Briefcase className="h-5 w-5" />} />
        <StatCard label="Monthly Payroll" value={`\u20B1${totalPayroll.toLocaleString()}`} icon={<UserCog className="h-5 w-5" />} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or position..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring" />
        </div>
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring">
          {departments.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      <div className="rounded-xl glass overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Position</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Department</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Monthly Rate</th>
              <th className="w-10 px-2 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <UserCog className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">No employee records found</p>
                    <p className="text-xs text-muted-foreground mt-1">Add barangay officials and staff to manage attendance, payroll, and service records.</p>
                  </div>
                  <button onClick={() => openCreate()} className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
                    + Add Employee
                  </button>
                </div>
              </td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setViewPerson(p)}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {p.contact}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{p.position}</td>
                  <td className="px-4 py-3"><Badge variant="muted">{p.department}</Badge></td>
                  <td className="px-4 py-3">
                    <Badge variant={p.employment_type === "Elected" ? "info" : p.employment_type === "Volunteer" ? "warning" : "muted"}>{p.employment_type}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground text-right">{"\u20B1"}{p.monthly_rate.toLocaleString()}</td>
                  <td className="px-2 py-3">
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setActionMenu(actionMenu === p.id ? null : p.id)} className="p-1.5 rounded hover:bg-muted"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></button>
                      {actionMenu === p.id && (
                        <div className="absolute right-0 top-8 z-20 w-44 glass rounded-lg shadow-lg py-1">
                          <button onClick={() => { setViewPerson(p); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Eye className="h-3.5 w-3.5" /> View</button>
                          <button onClick={() => openEdit(p)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Edit className="h-3.5 w-3.5" /> Edit</button>
                          <button onClick={() => { setDeletePerson(p); setShowDelete(true); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-muted flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
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

      {/* View Personnel Modal */}
      <Modal open={!!viewPerson} onClose={() => setViewPerson(null)} title={viewPerson?.name || ""} description={viewPerson?.position || ""} size="md"
        footer={<><ModalButton variant="secondary" onClick={() => setViewPerson(null)}>Close</ModalButton><ModalButton variant="primary" onClick={() => { if (viewPerson) { openEdit(viewPerson); setViewPerson(null); } }}>Edit Record</ModalButton></>}>
        {viewPerson && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusBadge status={viewPerson.status} />
              <Badge variant={viewPerson.employment_type === "Elected" ? "info" : "muted"}>{viewPerson.employment_type}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div><p className="text-[11px] text-muted-foreground uppercase">Department</p><p className="text-sm">{viewPerson.department}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Monthly Rate</p><p className="text-sm">{"\u20B1"}{viewPerson.monthly_rate.toLocaleString()}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Contact</p><p className="text-sm">{viewPerson.contact}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Email</p><p className="text-sm">{viewPerson.email || "\u2014"}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Start Date</p><p className="text-sm">{viewPerson.start_date}</p></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Personnel Form Modal */}
      <Modal open={showCreate || showEdit} onClose={() => { setShowCreate(false); setShowEdit(false); }} title={showEdit ? "Edit Personnel" : "Add New Personnel"} size="lg"
        footer={<>
          <ModalButton variant="secondary" onClick={() => { setShowCreate(false); setShowEdit(false); }}>Cancel</ModalButton>
          {formTab > 0 && <ModalButton variant="secondary" onClick={() => setFormTab((t) => t - 1)}>Previous</ModalButton>}
          {formTab < formTabs.length - 1 ? <ModalButton variant="primary" onClick={() => setFormTab((t) => t + 1)}>Next</ModalButton> : <ModalButton variant="primary" onClick={() => { if (validateForm()) { addToast("success", showEdit ? "Record updated" : "Employee added", showEdit ? "Personnel record has been updated successfully." : "New employee has been added to the roster."); setShowCreate(false); setShowEdit(false); } }}>{showEdit ? "Update" : "Save"}</ModalButton>}
        </>}>
        <div className="flex border-b border-border mb-6">
          {formTabs.map((tab, i) => (
            <button key={tab} onClick={() => setFormTab(i)} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors", formTab === i ? "border-accent-primary text-accent-text" : "border-transparent text-muted-foreground hover:text-foreground")}>{tab}</button>
          ))}
        </div>
        {formTab === 0 && (
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="First Name" name="first_name" value={form.first_name || ""} placeholder="e.g. Juan" required error={formErrors.first_name} onChange={handleFieldChange} />
            <FormInput label="Middle Name" name="middle_name" value={form.middle_name || ""} placeholder="e.g. Dela" onChange={handleFieldChange} />
            <FormInput label="Last Name" name="last_name" value={form.last_name || ""} placeholder="e.g. Cruz" required error={formErrors.last_name} onChange={handleFieldChange} />
            <FormSelect label="Extension" name="extension" value={form.extension || ""} options={["", "Jr.", "Sr.", "II", "III"]} onChange={handleFieldChange} />
            <FormSelect label="Sex" name="sex" value={form.sex || ""} options={["", "Male", "Female"]} onChange={handleFieldChange} />
            <FormInput label="Date of Birth" name="date_of_birth" value={form.date_of_birth || ""} type="date" onChange={handleFieldChange} />
            <FormSelect label="Civil Status" name="civil_status" value={form.civil_status || ""} options={["", "Single", "Married", "Widowed", "Separated"]} onChange={handleFieldChange} />
            <FormInput label="Contact Number" name="contact_number" value={form.contact_number || ""} placeholder="e.g. 0917-000-0000" required error={formErrors.contact_number} onChange={handleFieldChange} />
            <FormInput label="Email" name="email" value={form.email || ""} placeholder="e.g. juan@email.com" type="email" onChange={handleFieldChange} />
          </div>
        )}
        {formTab === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormInput label="Position" name="position" value={form.position || ""} placeholder="e.g. Kagawad" required error={formErrors.position} onChange={handleFieldChange} />
              <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">Use official DILG position titles: Punong Barangay, Barangay Secretary, Barangay Treasurer, etc.</p>
            </div>
            <FormSelect label="Department" name="department" value={form.department || ""} options={["", "Executive", "Legislative", "Health", "Peace & Order", "Social Services", "Administrative", "SK Council"]} required error={formErrors.department} onChange={handleFieldChange} />
            <div>
              <FormSelect label="Employment Type" name="employment_type" value={form.employment_type || ""} options={["", "Elected", "Appointed", "Job Order", "Volunteer"]} required error={formErrors.employment_type} onChange={handleFieldChange} />
              <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">Elected officials serve 3-year terms. Appointed staff follow CSC rules.</p>
            </div>
            <FormInput label="Date Appointed" name="date_appointed" value={form.date_appointed || ""} type="date" onChange={handleFieldChange} />
            <FormInput label="Salary Grade" name="salary_grade" value={form.salary_grade || ""} placeholder="e.g. SG-15" onChange={handleFieldChange} />
            <FormInput label="Monthly Salary" name="monthly_salary" value={form.monthly_salary || ""} placeholder="e.g. 15000" type="number" onChange={handleFieldChange} />
          </div>
        )}
        {formTab === 2 && (
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="PhilHealth No." name="philhealth" value={form.philhealth || ""} placeholder="e.g. 12-345678901-2" onChange={handleFieldChange} />
            <FormInput label="SSS / GSIS No." name="sss_gsis" value={form.sss_gsis || ""} placeholder="e.g. 33-1234567-8" onChange={handleFieldChange} />
            <FormInput label="Pag-IBIG No." name="pagibig" value={form.pagibig || ""} placeholder="e.g. 1234-5678-9012" onChange={handleFieldChange} />
            <FormInput label="TIN" name="tin" value={form.tin || ""} placeholder="e.g. 123-456-789-000" onChange={handleFieldChange} />
            <FormInput label="Emergency Contact Name" name="emergency_contact_name" value={form.emergency_contact_name || ""} placeholder="e.g. Maria Cruz" onChange={handleFieldChange} />
            <FormInput label="Emergency Contact Number" name="emergency_contact_number" value={form.emergency_contact_number || ""} placeholder="e.g. 0917-000-0000" onChange={handleFieldChange} />
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={showDelete} onClose={() => { setShowDelete(false); setDeletePerson(null); }} title="Confirm Delete" description="This action cannot be undone." size="sm"
        footer={<><ModalButton variant="secondary" onClick={() => { setShowDelete(false); setDeletePerson(null); }}>Cancel</ModalButton><ModalButton variant="danger" onClick={() => { addToast("success", "Record deleted", `"${deletePerson?.name}" has been removed.`); setShowDelete(false); setDeletePerson(null); }}>Delete</ModalButton></>}>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <span className="font-semibold text-foreground">{deletePerson?.name}</span>{deletePerson?.position ? <> ({deletePerson.position})</> : null}? This will permanently remove their personnel record.
        </p>
      </Modal>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map((toast) => (
            <div key={toast.id} className={cn("flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border min-w-[320px] max-w-[420px] animate-in slide-in-from-right-5",
              toast.type === "success" && "bg-green-50 border-green-200 dark:bg-green-950/50 dark:border-green-800",
              toast.type === "error" && "bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800",
              toast.type === "warning" && "bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800",
              toast.type === "info" && "bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800"
            )}>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium",
                  toast.type === "success" && "text-green-800 dark:text-green-200",
                  toast.type === "error" && "text-red-800 dark:text-red-200",
                  toast.type === "warning" && "text-amber-800 dark:text-amber-200",
                  toast.type === "info" && "text-blue-800 dark:text-blue-200"
                )}>{toast.title}</p>
                {toast.message && <p className={cn("text-xs mt-0.5",
                  toast.type === "success" && "text-green-600 dark:text-green-300",
                  toast.type === "error" && "text-red-600 dark:text-red-300",
                  toast.type === "warning" && "text-amber-600 dark:text-amber-300",
                  toast.type === "info" && "text-blue-600 dark:text-blue-300"
                )}>{toast.message}</p>}
              </div>
              <button onClick={() => dismissToast(toast.id)} className="shrink-0 text-muted-foreground hover:text-foreground text-lg leading-none">&times;</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
