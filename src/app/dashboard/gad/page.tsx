"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  Plus,
  Download,
  Users,
  Calendar,
  FileText,
  TrendingUp,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Bot,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

interface GadProgram {
  id: string;
  name: string;
  category: string;
  target_beneficiaries: string;
  budget: number;
  spent: number;
  beneficiaries_count: number;
  status: string;
  period: string;
}

const mockPrograms: GadProgram[] = [
  { id: "1", name: "Women's Livelihood Training", category: "Economic Empowerment", target_beneficiaries: "Women (18-60)", budget: 50000, spent: 35000, beneficiaries_count: 25, status: "ongoing", period: "Q1 2026" },
  { id: "2", name: "Anti-VAWC Awareness Campaign", category: "Protection", target_beneficiaries: "All residents", budget: 20000, spent: 18000, beneficiaries_count: 150, status: "completed", period: "Q4 2025" },
  { id: "3", name: "Solo Parents Support Program", category: "Social Protection", target_beneficiaries: "Solo parents", budget: 30000, spent: 0, beneficiaries_count: 0, status: "planned", period: "Q2 2026" },
  { id: "4", name: "Youth Gender Sensitivity Training", category: "Education", target_beneficiaries: "Youth (15-24)", budget: 15000, spent: 15000, beneficiaries_count: 40, status: "completed", period: "Q4 2025" },
  { id: "5", name: "Health Services for Women", category: "Health", target_beneficiaries: "Women (all ages)", budget: 40000, spent: 22000, beneficiaries_count: 80, status: "ongoing", period: "Q1 2026" },
  { id: "6", name: "PWD Inclusive Access Program", category: "Social Protection", target_beneficiaries: "PWDs", budget: 25000, spent: 10000, beneficiaries_count: 15, status: "ongoing", period: "Q1 2026" },
];

const formTabs = ["Program Info", "Budget & Status"];

function FormInput({ label, name, value, placeholder, required, type, error, onChange }: { label: string; name: string; value: string; placeholder?: string; required?: boolean; type?: string; error?: string; onChange: (name: string, value: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type || "text"} value={value} onChange={(e) => onChange(name, e.target.value)} placeholder={placeholder} className={cn("w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2", error ? "border-red-500 focus:ring-red-300" : "border-border focus:ring-accent-ring")} />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormSelect({ label, name, value, options, required, error, onChange }: { label: string; name: string; value: string; options: string[]; required?: boolean; error?: string; onChange: (name: string, value: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select value={value} onChange={(e) => onChange(name, e.target.value)} className={cn("w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2", error ? "border-red-500 focus:ring-red-300" : "border-border focus:ring-accent-ring")}>
        {options.map((o) => <option key={o} value={o}>{o || "\u2014 Select \u2014"}</option>)}
      </select>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormTextarea({ label, name, value, placeholder, rows, required, onChange }: { label: string; name: string; value: string; placeholder?: string; rows?: number; required?: boolean; onChange: (name: string, value: string) => void }) {
  return (
    <div className="col-span-2">
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <textarea value={value} onChange={(e) => onChange(name, e.target.value)} placeholder={placeholder} rows={rows || 3} className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none" />
    </div>
  );
}

export default function GadPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewProgram, setViewProgram] = useState<GadProgram | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GadProgram | null>(null);
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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.program_name?.trim()) errors.program_name = "Program name is required";
    if (!form.category) errors.category = "Category is required";
    if (!form.budget?.trim()) {
      errors.budget = "Budget is required";
    } else if (isNaN(Number(form.budget)) || Number(form.budget) <= 0) {
      errors.budget = "Budget must be a positive number";
    }
    if (!form.status) errors.status = "Status is required";
    if (form.beneficiary_count?.trim() && (isNaN(Number(form.beneficiary_count)) || Number(form.beneficiary_count) < 0)) {
      errors.beneficiary_count = "Beneficiary count must be a non-negative number";
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      // Jump to the tab containing the first error
      const tab0Fields = ["program_name", "category"];
      const hasTab0Error = tab0Fields.some((f) => errors[f]);
      if (hasTab0Error) setFormTab(0);
      else setFormTab(1);
    }
    return Object.keys(errors).length === 0;
  };

  const filtered = mockPrograms.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  const totalBudget = mockPrograms.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = mockPrograms.reduce((sum, p) => sum + p.spent, 0);
  const totalBeneficiaries = mockPrograms.reduce((sum, p) => sum + p.beneficiaries_count, 0);

  const openCreate = () => {
    setForm({});
    setFormErrors({});
    setFormTab(0);
    setShowCreate(true);
  };

  const openEdit = (p: GadProgram) => {
    setForm({
      program_name: p.name,
      category: p.category === "Economic Empowerment" ? "Livelihood" : p.category === "Protection" ? "Violence Prevention" : p.category,
      target_beneficiaries: p.target_beneficiaries,
      budget: String(p.budget),
      amount_spent: String(p.spent),
      status: p.status === "ongoing" ? "Active" : p.status === "completed" ? "Completed" : "Planning",
    });
    setFormErrors({});
    setFormTab(0);
    setShowEdit(true);
    setActionMenu(null);
  };

  const handleFieldChange = (name: string, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    setFormErrors((e) => { const next = { ...e }; delete next[name]; return next; });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gender and Development"
        description="GAD programs, budget utilization, and compliance tracking"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Operations" }, { label: "GAD" }]}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => addToast("info", "Generating report", "GAD compliance report is being prepared.")} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><Download className="h-4 w-4" /> GAD Report</button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}><Plus className="h-4 w-4" /> Add Program</button>
          </div>
        }
      />

      {/* Mabini AI Insight */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-accent-primary/20 bg-accent-bg/30">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--accent-primary)", opacity: 0.15 }}>
          <Bot className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Mabini AI GAD Compliance</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            GAD budget utilization at 56% — on track for 5% AIP requirement. 2 programs still in &quot;Planned&quot; status need activation this quarter. Anti-VAWC seminar has the highest beneficiary count.
          </p>
        </div>
        <button onClick={() => router.push("/dashboard/ai")} className="shrink-0 px-3 py-1.5 text-[10px] font-semibold rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--accent-primary)", color: "#fff" }}>
          Ask Mabini
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total GAD Budget" value={`\u20B1${totalBudget.toLocaleString()}`} icon={<Heart className="h-5 w-5" />} />
        <StatCard label="Budget Utilized" value={`\u20B1${totalSpent.toLocaleString()}`} icon={<TrendingUp className="h-5 w-5" />} trend={{ value: Math.round((totalSpent / totalBudget) * 100), label: "utilization" }} />
        <StatCard label="Programs" value={mockPrograms.length} icon={<FileText className="h-5 w-5" />} />
        <StatCard label="Beneficiaries" value={totalBeneficiaries} icon={<Users className="h-5 w-5" />} />
      </div>

      {/* Budget Utilization Bar */}
      <div className="p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-foreground">GAD Budget Utilization (5% of AIP Required)</p>
          <p className="text-sm text-muted-foreground">{Math.round((totalSpent / totalBudget) * 100)}%</p>
        </div>
        <div className="w-full h-3 rounded-full bg-muted">
          <div className="h-full rounded-full" style={{ width: `${Math.round((totalSpent / totalBudget) * 100)}%`, background: "var(--accent-primary)" }} />
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">{"\u20B1"}{totalSpent.toLocaleString()} spent of {"\u20B1"}{totalBudget.toLocaleString()} allocated</p>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border w-fit">
        {[{ id: "all", label: "All" }, { id: "ongoing", label: "Ongoing" }, { id: "planned", label: "Planned" }, { id: "completed", label: "Completed" }].map((tab) => (
          <button key={tab.id} onClick={() => setStatusFilter(tab.id)}
            className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
              statusFilter === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 flex justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">No GAD activities found</p>
                <p className="text-xs text-muted-foreground mt-1">Plan gender-responsive programs and track GAD budget utilization.</p>
              </div>
              <button onClick={() => openCreate()} className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
                + New GAD Activity
              </button>
            </div>
          </div>
        ) : (
          filtered.map((p) => {
            const pct = p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0;
            return (
              <div key={p.id} className="p-5 rounded-xl border border-border bg-card hover:shadow-md transition-all cursor-pointer" onClick={() => setViewProgram(p)}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">{p.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.status === "ongoing" ? "info" : p.status === "completed" ? "success" : "muted"}>{p.status}</Badge>
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setActionMenu(actionMenu === p.id ? null : p.id)} className="p-1.5 rounded hover:bg-muted"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></button>
                      {actionMenu === p.id && (
                        <div className="absolute right-0 top-8 z-20 w-44 bg-card border border-border rounded-lg shadow-lg py-1">
                          <button onClick={() => { setViewProgram(p); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Eye className="h-3.5 w-3.5" /> View</button>
                          <button onClick={() => openEdit(p)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Edit className="h-3.5 w-3.5" /> Edit</button>
                          <button onClick={() => { setDeleteTarget(p); setShowDelete(true); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-muted flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[12px] text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {p.target_beneficiaries}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {p.period}</span>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                    <span>{"\u20B1"}{p.spent.toLocaleString()} / {"\u20B1"}{p.budget.toLocaleString()}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--accent-primary)" }} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{p.beneficiaries_count} beneficiaries served</p>
              </div>
            );
          })
        )}
      </div>

      {/* View Program Modal */}
      <Modal open={!!viewProgram} onClose={() => setViewProgram(null)} title={viewProgram?.name || ""} description={viewProgram?.category || ""} size="md"
        footer={<><ModalButton variant="secondary" onClick={() => setViewProgram(null)}>Close</ModalButton><ModalButton variant="primary" onClick={() => { if (viewProgram) { openEdit(viewProgram); setViewProgram(null); } }}>Edit Program</ModalButton></>}>
        {viewProgram && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={viewProgram.status === "ongoing" ? "info" : viewProgram.status === "completed" ? "success" : "muted"}>{viewProgram.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div><p className="text-[11px] text-muted-foreground uppercase">Target Beneficiaries</p><p className="text-sm">{viewProgram.target_beneficiaries}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Period</p><p className="text-sm">{viewProgram.period}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Budget</p><p className="text-sm">{"\u20B1"}{viewProgram.budget.toLocaleString()}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Spent</p><p className="text-sm">{"\u20B1"}{viewProgram.spent.toLocaleString()}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Utilization</p><p className="text-sm">{viewProgram.budget > 0 ? Math.round((viewProgram.spent / viewProgram.budget) * 100) : 0}%</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Beneficiaries Served</p><p className="text-sm">{viewProgram.beneficiaries_count}</p></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit GAD Program Form Modal */}
      <Modal open={showCreate || showEdit} onClose={() => { setShowCreate(false); setShowEdit(false); }} title={showEdit ? "Edit GAD Program" : "Add New GAD Program"} size="lg"
        footer={<>
          <ModalButton variant="secondary" onClick={() => { setShowCreate(false); setShowEdit(false); }}>Cancel</ModalButton>
          {formTab > 0 && <ModalButton variant="secondary" onClick={() => setFormTab((t) => t - 1)}>Previous</ModalButton>}
          {formTab < formTabs.length - 1 ? <ModalButton variant="primary" onClick={() => setFormTab((t) => t + 1)}>Next</ModalButton> : <ModalButton variant="primary" onClick={() => { if (validateForm()) { addToast("success", showEdit ? "Program updated" : "Program created", showEdit ? "GAD program has been updated successfully." : "New GAD program has been added."); setShowCreate(false); setShowEdit(false); } }}>{showEdit ? "Update" : "Save"}</ModalButton>}
        </>}>
        <div className="flex border-b border-border mb-6">
          {formTabs.map((tab, i) => (
            <button key={tab} onClick={() => setFormTab(i)} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors", formTab === i ? "border-accent-primary text-accent-text" : "border-transparent text-muted-foreground hover:text-foreground")}>{tab}</button>
          ))}
        </div>
        {formTab === 0 && (
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Program Name" name="program_name" value={form.program_name || ""} placeholder="e.g. Women's Livelihood Training" required error={formErrors.program_name} onChange={handleFieldChange} />
            <FormSelect label="Category" name="category" value={form.category || ""} options={["", "Health", "Education", "Livelihood", "Violence Prevention", "Leadership", "Youth Development"]} required error={formErrors.category} onChange={handleFieldChange} />
            <FormTextarea label="Description" name="description" value={form.description || ""} placeholder="Brief description of the program..." onChange={handleFieldChange} />
            <FormInput label="Target Beneficiaries" name="target_beneficiaries" value={form.target_beneficiaries || ""} placeholder="e.g. Women (18-60)" onChange={handleFieldChange} />
            <FormInput label="Start Date" name="start_date" value={form.start_date || ""} type="date" onChange={handleFieldChange} />
            <FormInput label="End Date" name="end_date" value={form.end_date || ""} type="date" onChange={handleFieldChange} />
          </div>
        )}
        {formTab === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormInput label="Budget" name="budget" value={form.budget || ""} placeholder="e.g. 50000" type="number" required error={formErrors.budget} onChange={handleFieldChange} />
              <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">Minimum 5% of total barangay budget required by RA 9710 (Magna Carta of Women).</p>
            </div>
            <FormInput label="Amount Spent" name="amount_spent" value={form.amount_spent || ""} placeholder="e.g. 35000" type="number" onChange={handleFieldChange} />
            <FormSelect label="Funding Source" name="funding_source" value={form.funding_source || ""} options={["", "GAD Fund", "General Fund", "External Grant", "Donation"]} onChange={handleFieldChange} />
            <FormSelect label="Status" name="status" value={form.status || ""} options={["", "Planning", "Active", "Completed", "Cancelled"]} required error={formErrors.status} onChange={handleFieldChange} />
            <FormInput label="Responsible Person" name="responsible_person" value={form.responsible_person || ""} placeholder="e.g. Elena Santos" onChange={handleFieldChange} />
            <FormTextarea label="Remarks" name="remarks" value={form.remarks || ""} placeholder="Additional remarks..." onChange={handleFieldChange} />
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={showDelete} onClose={() => { setShowDelete(false); setDeleteTarget(null); }} title="Confirm Delete" description="This action cannot be undone." size="sm"
        footer={<><ModalButton variant="secondary" onClick={() => { setShowDelete(false); setDeleteTarget(null); }}>Cancel</ModalButton><ModalButton variant="danger" onClick={() => { addToast("success", "Program deleted", `"${deleteTarget?.name}" has been removed.`); setShowDelete(false); setDeleteTarget(null); }}>Delete</ModalButton></>}>
        <p className="text-sm text-muted-foreground">Are you sure you want to delete <span className="font-semibold text-foreground">{deleteTarget?.name}</span>? This GAD program and all its records will be permanently removed.</p>
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
