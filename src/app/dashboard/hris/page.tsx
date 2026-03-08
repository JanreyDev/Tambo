"use client";

import { useState } from "react";
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

function FormInput({ label, name, value, placeholder, required, type, onChange }: { label: string; name: string; value: string; placeholder?: string; required?: boolean; type?: string; onChange: (name: string, value: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type || "text"} value={value} onChange={(e) => onChange(name, e.target.value)} placeholder={placeholder} className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring" />
    </div>
  );
}

function FormSelect({ label, name, value, options, required, onChange }: { label: string; name: string; value: string; options: string[]; required?: boolean; onChange: (name: string, value: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select value={value} onChange={(e) => onChange(name, e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
        {options.map((o) => <option key={o} value={o}>{o || "\u2014 Select \u2014"}</option>)}
      </select>
    </div>
  );
}

export default function HrisPage() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [viewPerson, setViewPerson] = useState<Personnel | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [formTab, setFormTab] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({});
  const [actionMenu, setActionMenu] = useState<string | null>(null);

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
    setFormTab(0);
    setShowEdit(true);
    setActionMenu(null);
  };

  const handleFieldChange = (name: string, value: string) => setForm((f) => ({ ...f, [name]: value }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="HRIS"
        description="Barangay personnel and human resources"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Operations" }, { label: "HRIS" }]}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><Download className="h-4 w-4" /> Export</button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}><Plus className="h-4 w-4" /> Add Personnel</button>
          </div>
        }
      />

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
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring" />
        </div>
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
          {departments.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
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
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No personnel found.</td></tr>
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
                        <div className="absolute right-0 top-8 z-20 w-44 bg-card border border-border rounded-lg shadow-lg py-1">
                          <button onClick={() => { setViewPerson(p); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Eye className="h-3.5 w-3.5" /> View</button>
                          <button onClick={() => openEdit(p)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Edit className="h-3.5 w-3.5" /> Edit</button>
                          <button onClick={() => { setShowDelete(true); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-muted flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
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
          {formTab < formTabs.length - 1 ? <ModalButton variant="primary" onClick={() => setFormTab((t) => t + 1)}>Next</ModalButton> : <ModalButton variant="primary">{showEdit ? "Update" : "Save"}</ModalButton>}
        </>}>
        <div className="flex border-b border-border mb-6">
          {formTabs.map((tab, i) => (
            <button key={tab} onClick={() => setFormTab(i)} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors", formTab === i ? "border-accent-primary text-accent-text" : "border-transparent text-muted-foreground hover:text-foreground")}>{tab}</button>
          ))}
        </div>
        {formTab === 0 && (
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="First Name" name="first_name" value={form.first_name || ""} placeholder="e.g. Juan" required onChange={handleFieldChange} />
            <FormInput label="Middle Name" name="middle_name" value={form.middle_name || ""} placeholder="e.g. Dela" onChange={handleFieldChange} />
            <FormInput label="Last Name" name="last_name" value={form.last_name || ""} placeholder="e.g. Cruz" required onChange={handleFieldChange} />
            <FormSelect label="Extension" name="extension" value={form.extension || ""} options={["", "Jr.", "Sr.", "II", "III"]} onChange={handleFieldChange} />
            <FormSelect label="Sex" name="sex" value={form.sex || ""} options={["", "Male", "Female"]} onChange={handleFieldChange} />
            <FormInput label="Date of Birth" name="date_of_birth" value={form.date_of_birth || ""} type="date" onChange={handleFieldChange} />
            <FormSelect label="Civil Status" name="civil_status" value={form.civil_status || ""} options={["", "Single", "Married", "Widowed", "Separated"]} onChange={handleFieldChange} />
            <FormInput label="Contact Number" name="contact_number" value={form.contact_number || ""} placeholder="e.g. 0917-000-0000" onChange={handleFieldChange} />
            <FormInput label="Email" name="email" value={form.email || ""} placeholder="e.g. juan@email.com" type="email" onChange={handleFieldChange} />
          </div>
        )}
        {formTab === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Position" name="position" value={form.position || ""} placeholder="e.g. Kagawad" required onChange={handleFieldChange} />
            <FormSelect label="Department" name="department" value={form.department || ""} options={["", "Executive", "Legislative", "Health", "Peace & Order", "Social Services", "Administrative", "SK Council"]} required onChange={handleFieldChange} />
            <FormSelect label="Employment Type" name="employment_type" value={form.employment_type || ""} options={["", "Elected", "Appointed", "Job Order", "Volunteer"]} onChange={handleFieldChange} />
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
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Confirm Delete" description="This action cannot be undone." size="sm"
        footer={<><ModalButton variant="secondary" onClick={() => setShowDelete(false)}>Cancel</ModalButton><ModalButton variant="danger" onClick={() => setShowDelete(false)}>Delete</ModalButton></>}>
        <p className="text-sm text-muted-foreground">Are you sure you want to delete this personnel record?</p>
      </Modal>
    </div>
  );
}
