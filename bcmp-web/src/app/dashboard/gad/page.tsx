"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  Plus,
  Download,
  TrendingUp,
  FileText,
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
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { MabiniButton } from "@/components/ui/mabini-button";
import { api } from "@/lib/api";

interface GadPlan {
  id: string;
  plan_type: string;
  fiscal_year: number;
  barangay_total_budget: string | null;
  gad_budget: string;
  status: "draft" | "submitted" | "approved" | "implemented";
  approved_at: string | null;
}

interface PaginatedGadPlans {
  data: GadPlan[];
  total: number;
  last_page: number;
}

const formTabs = ["Plan Details", "Budget & Status"];

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
  label: string; name: string; value: string; options: string[]; required?: boolean;
  error?: string; onChange: (n: string, v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select value={value} onChange={(e) => onChange(name, e.target.value)}
        className={cn("w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring", error ? "border-red-500" : "border-border")}>
        {options.map((o) => <option key={o} value={o}>{o || "— Select —"}</option>)}
      </select>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

type ToastType = "success" | "error" | "warning" | "info";

export default function GadPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<GadPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewPlan, setViewPlan] = useState<GadPlan | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GadPlan | null>(null);
  const [formTab, setFormTab] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: string; type: ToastType; title: string; message?: string }[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ per_page: "50", sort_by: "fiscal_year", sort_dir: "desc" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await api.get<PaginatedGadPlans>(`/gad-plans?${params}`);
      setPlans((res as PaginatedGadPlans).data ?? []);
    } catch {
      addToast("error", "Failed to load GAD plans");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, addToast]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const handleFieldChange = (name: string, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    setFormErrors((e) => { const next = { ...e }; delete next[name]; return next; });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.plan_type?.trim()) errors.plan_type = "Plan type is required";
    if (!form.fiscal_year?.trim()) errors.fiscal_year = "Fiscal year is required";
    else if (isNaN(Number(form.fiscal_year))) errors.fiscal_year = "Must be a valid year";
    if (!form.gad_budget?.trim()) errors.gad_budget = "GAD budget is required";
    else if (isNaN(Number(form.gad_budget)) || Number(form.gad_budget) < 0) errors.gad_budget = "Must be a valid amount";
    if (!form.status) errors.status = "Status is required";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      const tab0 = ["plan_type", "fiscal_year"];
      if (Object.keys(errors).some((k) => tab0.includes(k))) setFormTab(0);
      else setFormTab(1);
      return false;
    }
    return true;
  };

  const openCreate = () => {
    setForm({ fiscal_year: String(new Date().getFullYear()), status: "draft" });
    setFormErrors({}); setFormTab(0); setShowCreate(true);
  };
  const openEdit = (p: GadPlan) => {
    setForm({
      plan_type: p.plan_type,
      fiscal_year: String(p.fiscal_year),
      barangay_total_budget: p.barangay_total_budget ?? "",
      gad_budget: p.gad_budget,
      status: p.status,
    });
    setFormErrors({}); setFormTab(0); setShowEdit(true); setActionMenu(null);
    setViewPlan(null);
    setDeleteTarget(p);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setFormLoading(true);
    try {
      const payload = {
        plan_type: form.plan_type,
        fiscal_year: parseInt(form.fiscal_year, 10),
        barangay_total_budget: form.barangay_total_budget ? parseFloat(form.barangay_total_budget) : null,
        gad_budget: parseFloat(form.gad_budget),
        status: form.status,
      };
      if (showEdit && deleteTarget) {
        await api.put(`/gad-plans/${deleteTarget.id}`, payload);
        addToast("success", "Plan updated", `GAD Plan ${form.fiscal_year} has been updated.`);
      } else {
        await api.post("/gad-plans", payload);
        addToast("success", "Plan created", `GAD Plan ${form.fiscal_year} has been added.`);
      }
      setShowCreate(false); setShowEdit(false); setDeleteTarget(null);
      fetchPlans();
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
      await api.delete(`/gad-plans/${deleteTarget.id}`);
      addToast("success", "Plan deleted", `GAD Plan ${deleteTarget.fiscal_year} has been removed.`);
      setShowDelete(false); setDeleteTarget(null);
      fetchPlans();
    } catch {
      addToast("error", "Delete failed");
    } finally {
      setFormLoading(false);
    }
  };

  const filtered = plans.filter((p) => statusFilter === "all" || p.status === statusFilter);

  const totalBudget = plans.reduce((s, p) => s + parseFloat(p.gad_budget), 0);
  const approvedCount = plans.filter((p) => p.status === "approved" || p.status === "implemented").length;

  const utilizationPct = (p: GadPlan): number => {
    if (!p.barangay_total_budget || parseFloat(p.barangay_total_budget) === 0) return 0;
    return Math.round((parseFloat(p.gad_budget) / parseFloat(p.barangay_total_budget)) * 100);
  };

  const statusVariant = (s: string) => ({ draft: "muted", submitted: "info", approved: "success", implemented: "success" }[s] ?? "muted") as "muted" | "info" | "success";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gender and Development"
        description="GAD plans, budget allocation, and compliance tracking"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Operations" }, { label: "GAD" }]}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => addToast("info", "Generating report", "GAD compliance report is being prepared.")}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors">
              <Download className="h-4 w-4" /> GAD Report
            </button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
              <Plus className="h-4 w-4" /> Add Plan
            </button>
          </div>
        }
      />

      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-accent-primary/20 bg-accent-bg/30">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--accent-primary)", opacity: 0.15 }}>
          <Bot className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Mabini AI GAD Compliance</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            {plans.length === 0
              ? "No GAD plans recorded yet. RA 9710 (Magna Carta of Women) requires at least 5% of the barangay budget allocated to GAD annually."
              : `${plans.length} GAD plan(s) on record. ${approvedCount} approved/implemented. Total allocation: ₱${totalBudget.toLocaleString()}. Ensure 5% of AIP is allocated per RA 9710.`}
          </p>
        </div>
        <button onClick={() => router.push("/dashboard/ai")} className="shrink-0 px-3 py-1.5 text-[10px] font-semibold rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--accent-primary)", color: "#fff" }}>
          Ask Mabini
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total GAD Plans" value={loading ? "—" : plans.length} icon={<FileText className="h-5 w-5" />} />
        <StatCard label="Total Allocation" value={loading ? "—" : `₱${totalBudget.toLocaleString()}`} icon={<Heart className="h-5 w-5" />} />
        <StatCard label="Approved" value={loading ? "—" : approvedCount} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard label="Draft / Submitted" value={loading ? "—" : plans.filter((p) => p.status === "draft" || p.status === "submitted").length} icon={<FileText className="h-5 w-5" />} />
      </div>

      <div className="flex items-center gap-1 p-1 rounded-lg glass-subtle w-fit">
        {[{ id: "all", label: "All" }, { id: "draft", label: "Draft" }, { id: "submitted", label: "Submitted" }, { id: "approved", label: "Approved" }, { id: "implemented", label: "Implemented" }].map((tab) => (
          <button key={tab.id} onClick={() => setStatusFilter(tab.id)}
            className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
              statusFilter === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 rounded-xl glass flex items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading GAD plans...</span>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 rounded-xl glass flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Heart className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">No GAD plans found</p>
              <p className="text-xs text-muted-foreground mt-1">Create annual GAD plans to track gender-responsive budget allocation.</p>
            </div>
            <button onClick={openCreate} className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
              + Create GAD Plan
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p) => {
            const pct = utilizationPct(p);
            return (
              <div key={p.id} className="p-5 rounded-xl glass hover:shadow-md transition-all cursor-pointer" onClick={() => setViewPlan(p)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{p.plan_type}</h3>
                    <p className="text-xs text-muted-foreground">FY {p.fiscal_year}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setActionMenu(actionMenu === p.id ? null : p.id)} className="p-1.5 rounded hover:bg-muted">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </button>
                      {actionMenu === p.id && (
                        <div className="absolute right-0 top-8 z-20 w-44 glass rounded-lg shadow-lg py-1">
                          <button onClick={() => { setViewPlan(p); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Eye className="h-3.5 w-3.5" /> View</button>
                          <button onClick={() => openEdit(p)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Edit className="h-3.5 w-3.5" /> Edit</button>
                          <button onClick={() => { setDeleteTarget(p); setShowDelete(true); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-muted flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mb-3">
                  <p className="text-lg font-bold text-foreground">₱{parseFloat(p.gad_budget).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">GAD budget allocation</p>
                </div>
                {p.barangay_total_budget && (
                  <div>
                    <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                      <span>{pct}% of total budget (5% required)</span>
                      <span className={pct >= 5 ? "text-emerald-600" : "text-amber-600"}>{pct >= 5 ? "Compliant" : "Below 5%"}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: pct >= 5 ? "var(--accent-primary)" : "#f59e0b" }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* View Plan Modal */}
      <Modal open={!!viewPlan} onClose={() => setViewPlan(null)} title={viewPlan?.plan_type || ""} description={`FY ${viewPlan?.fiscal_year}`} size="md"
        footer={<>
          <ModalButton variant="secondary" onClick={() => setViewPlan(null)}>Close</ModalButton>
          <ModalButton variant="primary" onClick={() => { if (viewPlan) openEdit(viewPlan); }}>Edit Plan</ModalButton>
        </>}>
        {viewPlan && (
          <div className="space-y-4">
            <Badge variant={statusVariant(viewPlan.status)}>{viewPlan.status}</Badge>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div><p className="text-[11px] text-muted-foreground uppercase">Fiscal Year</p><p className="text-sm font-medium">{viewPlan.fiscal_year}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">GAD Budget</p><p className="text-sm font-medium">₱{parseFloat(viewPlan.gad_budget).toLocaleString()}</p></div>
              {viewPlan.barangay_total_budget && (
                <div><p className="text-[11px] text-muted-foreground uppercase">Total Barangay Budget</p><p className="text-sm">₱{parseFloat(viewPlan.barangay_total_budget).toLocaleString()}</p></div>
              )}
              <div><p className="text-[11px] text-muted-foreground uppercase">GAD Allocation %</p><p className="text-sm">{utilizationPct(viewPlan)}% {utilizationPct(viewPlan) >= 5 ? "(Compliant)" : "(Below 5% requirement)"}</p></div>
              {viewPlan.approved_at && (
                <div><p className="text-[11px] text-muted-foreground uppercase">Approved At</p><p className="text-sm">{new Date(viewPlan.approved_at).toLocaleDateString()}</p></div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal open={showCreate || showEdit} onClose={() => { setShowCreate(false); setShowEdit(false); setDeleteTarget(null); }}
        title={showEdit ? "Edit GAD Plan" : "Add GAD Plan"} size="lg"
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
          <div className="grid grid-cols-2 gap-4">
            <FormSelect label="Plan Type" name="plan_type" value={form.plan_type || ""}
              options={["", "Annual GAD Plan", "GAD Investment Plan", "GAD Supplemental Plan", "GAD Accomplishment Report"]}
              required error={formErrors.plan_type} onChange={handleFieldChange} />
            <FormInput label="Fiscal Year" name="fiscal_year" value={form.fiscal_year || ""} placeholder="e.g. 2026" type="number" required error={formErrors.fiscal_year} onChange={handleFieldChange} />
          </div>
        )}
        {formTab === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormInput label="Total Barangay Budget" name="barangay_total_budget" value={form.barangay_total_budget || ""} placeholder="e.g. 1000000" type="number" onChange={handleFieldChange} />
              <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">Used to compute 5% GAD requirement per RA 9710.</p>
            </div>
            <div>
              <FormInput label="GAD Budget Allocation" name="gad_budget" value={form.gad_budget || ""} placeholder="e.g. 50000" type="number" required error={formErrors.gad_budget} onChange={handleFieldChange} />
              <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">Minimum 5% of total budget required by RA 9710 (Magna Carta of Women).</p>
            </div>
            <FormSelect label="Status" name="status" value={form.status || ""}
              options={["", "draft", "submitted", "approved", "implemented"]}
              required error={formErrors.status} onChange={handleFieldChange} />
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal open={showDelete} onClose={() => { setShowDelete(false); setDeleteTarget(null); }} title="Confirm Delete" description="This action cannot be undone." size="sm"
        footer={<>
          <ModalButton variant="secondary" onClick={() => { setShowDelete(false); setDeleteTarget(null); }}>Cancel</ModalButton>
          <ModalButton variant="danger" onClick={handleDelete} disabled={formLoading}>{formLoading ? "Deleting..." : "Delete"}</ModalButton>
        </>}>
        <p className="text-sm text-muted-foreground">Are you sure you want to delete the <span className="font-semibold text-foreground">{deleteTarget?.plan_type}</span> ({deleteTarget?.fiscal_year})? This will permanently remove the GAD plan.</p>
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

      <MabiniButton pageContext="You are on the GAD (Gender and Development) page. This page manages annual GAD plans, budget allocations, and RA 9710 compliance tracking." />
    </div>
  );
}
