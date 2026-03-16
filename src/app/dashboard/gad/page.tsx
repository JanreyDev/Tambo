"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Heart,
  Plus,
  Search,
  FileText,
  TrendingUp,
  Users,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { MabiniButton } from "@/components/ui/mabini-button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface GadPlan {
  id: string;
  fiscal_year: number;
  title: string;
  mandate: string | null;
  ppas_summary: string | null;
  total_budget: string | null;
  gad_budget: string | null;
  status: "draft" | "approved" | "active" | "completed";
  approved_by_id: string | null;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse {
  data: GadPlan[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

interface GadPlanFormData {
  fiscal_year: string;
  title: string;
  mandate: string;
  ppas_summary: string;
  total_budget: string;
  gad_budget: string;
  status: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function peso(n: number | string | null | undefined): string {
  const num = typeof n === "string" ? parseFloat(n) : (n ?? 0);
  if (isNaN(num)) return "₱0.00";
  return "₱" + num.toLocaleString("en-PH", { minimumFractionDigits: 2 });
}

function statusBadge(status: GadPlan["status"]) {
  const map: Record<GadPlan["status"], { label: string; variant: "muted" | "info" | "success" | "accent" }> = {
    draft: { label: "Draft", variant: "muted" },
    approved: { label: "Approved", variant: "info" },
    active: { label: "Active", variant: "success" },
    completed: { label: "Completed", variant: "accent" },
  };
  const cfg = map[status] ?? { label: status, variant: "muted" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

// ── Sub-components ──────────────────────────────────────────────────────────

function FInput({
  label, name, value, placeholder, required, type, error, onChange,
}: {
  label: string; name: string; value: string; placeholder?: string;
  required?: boolean; type?: string; error?: string;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type ?? "text"}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2",
          error ? "border-red-500 focus:ring-red-300" : "border-border focus:ring-accent-ring"
        )}
      />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FSelect({
  label, name, value, options, required, error, onChange,
}: {
  label: string; name: string; value: string;
  options: { value: string; label: string }[];
  required?: boolean; error?: string;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className={cn(
          "w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2",
          error ? "border-red-500 focus:ring-red-300" : "border-border focus:ring-accent-ring"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FTextarea({
  label, name, value, placeholder, rows, required, onChange,
}: {
  label: string; name: string; value: string; placeholder?: string;
  rows?: number; required?: boolean;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <div className="col-span-2">
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        rows={rows ?? 3}
        className="w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none"
      />
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "warning" | "info";
interface Toast { id: string; type: ToastType; title: string; message?: string }

function Toasts({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border min-w-[320px] max-w-[420px] animate-in slide-in-from-right-5",
            t.type === "success" && "bg-green-50 border-green-200 dark:bg-green-950/50 dark:border-green-800",
            t.type === "error" && "bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800",
            t.type === "warning" && "bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800",
            t.type === "info" && "bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800"
          )}
        >
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-sm font-medium",
              t.type === "success" && "text-green-800 dark:text-green-200",
              t.type === "error" && "text-red-800 dark:text-red-200",
              t.type === "warning" && "text-amber-800 dark:text-amber-200",
              t.type === "info" && "text-blue-800 dark:text-blue-200"
            )}>{t.title}</p>
            {t.message && (
              <p className={cn(
                "text-xs mt-0.5",
                t.type === "success" && "text-green-600 dark:text-green-300",
                t.type === "error" && "text-red-600 dark:text-red-300",
                t.type === "warning" && "text-amber-600 dark:text-amber-300",
                t.type === "info" && "text-blue-600 dark:text-blue-300"
              )}>{t.message}</p>
            )}
          </div>
          <button onClick={() => dismiss(t.id)} className="shrink-0 text-muted-foreground hover:text-foreground text-lg leading-none">&times;</button>
        </div>
      ))}
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "", label: "— Select Status —" },
  { value: "draft", label: "Draft" },
  { value: "approved", label: "Approved" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

const FILTER_STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "approved", label: "Approved" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

const EMPTY_FORM: GadPlanFormData = {
  fiscal_year: "",
  title: "",
  mandate: "",
  ppas_summary: "",
  total_budget: "",
  gad_budget: "",
  status: "",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GadPage() {
  // ── List state ──
  const [plans, setPlans] = useState<GadPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ── Modal state ──
  const [viewPlan, setViewPlan] = useState<GadPlan | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editPlan, setEditPlan] = useState<GadPlan | null>(null);
  const [deletePlan, setDeletePlan] = useState<GadPlan | null>(null);

  // ── Form state ──
  const [form, setForm] = useState<GadPlanFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Toast state ──
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Fetch plans ──────────────────────────────────────────────────────────

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("per_page", "15");
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await api.get<PaginatedResponse>(`/gad-plans?${params.toString()}`);
      setPlans(res.data);
      setLastPage(res.last_page);
      setTotal(res.total);
    } catch {
      addToast("error", "Failed to load GAD plans", "Please try again.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter, addToast]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  // ── Stat derivations ──────────────────────────────────────────────────────

  const totalPlans = total;
  const activePlans = plans.filter((p) => p.status === "active").length;
  const totalGadBudget = plans
    .filter((p) => p.status === "active")
    .reduce((sum, p) => sum + (parseFloat(p.gad_budget ?? "0") || 0), 0);

  // ── Search debounce ────────────────────────────────────────────────────────

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Form helpers ───────────────────────────────────────────────────────────

  const handleFieldChange = (name: string, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    setFormErrors((e) => { const n = { ...e }; delete n[name]; return n; });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.fiscal_year.trim()) {
      errors.fiscal_year = "Fiscal year is required";
    } else if (isNaN(Number(form.fiscal_year)) || Number(form.fiscal_year) < 2000 || Number(form.fiscal_year) > 2100) {
      errors.fiscal_year = "Enter a valid year (e.g. 2026)";
    }
    if (!form.title.trim()) errors.title = "Title is required";
    if (!form.status) errors.status = "Status is required";
    if (form.total_budget && isNaN(parseFloat(form.total_budget))) errors.total_budget = "Must be a valid number";
    if (form.gad_budget && isNaN(parseFloat(form.gad_budget))) errors.gad_budget = "Must be a valid number";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowCreate(true);
  };

  const openEdit = (plan: GadPlan) => {
    setForm({
      fiscal_year: String(plan.fiscal_year),
      title: plan.title,
      mandate: plan.mandate ?? "",
      ppas_summary: plan.ppas_summary ?? "",
      total_budget: plan.total_budget ?? "",
      gad_budget: plan.gad_budget ?? "",
      status: plan.status,
    });
    setFormErrors({});
    setEditPlan(plan);
  };

  const closeForm = () => {
    setShowCreate(false);
    setEditPlan(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
  };

  // ── CRUD handlers ──────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      await api.post("/gad-plans", {
        fiscal_year: parseInt(form.fiscal_year, 10),
        title: form.title.trim(),
        mandate: form.mandate.trim() || null,
        ppas_summary: form.ppas_summary.trim() || null,
        total_budget: form.total_budget ? parseFloat(form.total_budget) : null,
        gad_budget: form.gad_budget ? parseFloat(form.gad_budget) : null,
        status: form.status,
      });
      addToast("success", "GAD plan created", `"${form.title}" has been added.`);
      closeForm();
      fetchPlans();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Failed to create plan.";
      addToast("error", "Create failed", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editPlan || !validateForm()) return;
    setSubmitting(true);
    try {
      await api.put(`/gad-plans/${editPlan.id}`, {
        fiscal_year: parseInt(form.fiscal_year, 10),
        title: form.title.trim(),
        mandate: form.mandate.trim() || null,
        ppas_summary: form.ppas_summary.trim() || null,
        total_budget: form.total_budget ? parseFloat(form.total_budget) : null,
        gad_budget: form.gad_budget ? parseFloat(form.gad_budget) : null,
        status: form.status,
      });
      addToast("success", "GAD plan updated", `"${form.title}" has been saved.`);
      closeForm();
      if (viewPlan?.id === editPlan.id) setViewPlan(null);
      fetchPlans();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Failed to update plan.";
      addToast("error", "Update failed", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePlan) return;
    setDeleting(true);
    try {
      await api.delete(`/gad-plans/${deletePlan.id}`);
      addToast("success", "GAD plan deleted", `"${deletePlan.title}" has been removed.`);
      setDeletePlan(null);
      if (viewPlan?.id === deletePlan.id) setViewPlan(null);
      fetchPlans();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Failed to delete plan.";
      addToast("error", "Delete failed", msg);
    } finally {
      setDeleting(false);
    }
  };

  // ── Skeleton ───────────────────────────────────────────────────────────────

  const SkeletonRow = () => (
    <tr className="border-b border-border">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-muted rounded animate-pulse" style={{ width: `${60 + (i * 7) % 30}%` }} />
        </td>
      ))}
    </tr>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="GAD"
        description="Gender and Development planning and monitoring"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "GAD" },
        ]}
        actions={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors"
            style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
          >
            <Plus className="h-4 w-4" />
            Add GAD Plan
          </button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          label="Total Plans"
          value={loading ? "—" : totalPlans}
          icon={<FileText className="h-5 w-5" />}
        />
        <StatCard
          label="Active Plans"
          value={loading ? "—" : activePlans}
          icon={<Heart className="h-5 w-5" />}
        />
        <StatCard
          label="Total GAD Budget (Active)"
          value={loading ? "—" : peso(totalGadBudget)}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search title or year..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring"
        >
          {FILTER_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl glass overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Fiscal Year</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Title</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Total Budget</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">GAD Budget</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="w-24 px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : plans.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Heart className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">No GAD plans found</p>
                      <p className="text-xs text-muted-foreground mt-1">Create a GAD plan to track gender and development budgets and activities.</p>
                    </div>
                    <button
                      onClick={openCreate}
                      className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white"
                      style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
                    >
                      + New GAD Plan
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              plans.map((plan) => (
                <tr
                  key={plan.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => setViewPlan(plan)}
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-foreground">{plan.fiscal_year}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-foreground font-medium line-clamp-1">{plan.title}</p>
                    {plan.ppas_summary && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{plan.ppas_summary}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground hidden md:table-cell">
                    {plan.total_budget ? peso(plan.total_budget) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground hidden lg:table-cell">
                    {plan.gad_budget ? peso(plan.gad_budget) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">{statusBadge(plan.status)}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setViewPlan(plan)}
                        title="View"
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60"
                      >
                        <Eye className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      </button>
                      <button
                        onClick={() => openEdit(plan)}
                        title="Edit"
                        className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60"
                      >
                        <Edit className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      </button>
                      <button
                        onClick={() => setDeletePlan(plan)}
                        title="Delete"
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && lastPage > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {currentPage} of {lastPage} — {total} total plan{total !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
              disabled={currentPage === lastPage}
              className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* View Modal */}
      <Modal
        open={!!viewPlan}
        onClose={() => setViewPlan(null)}
        title={viewPlan?.title ?? ""}
        description={`Fiscal Year ${viewPlan?.fiscal_year ?? ""}`}
        size="md"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setViewPlan(null)}>Close</ModalButton>
            <ModalButton
              variant="primary"
              onClick={() => {
                if (viewPlan) { openEdit(viewPlan); setViewPlan(null); }
              }}
            >
              Edit Plan
            </ModalButton>
          </>
        }
      >
        {viewPlan && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">{statusBadge(viewPlan.status)}</div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Fiscal Year</p>
                <p className="text-sm font-medium mt-0.5">{viewPlan.fiscal_year}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Status</p>
                <p className="text-sm font-medium capitalize mt-0.5">{viewPlan.status}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Total Budget</p>
                <p className="text-sm font-medium mt-0.5">{viewPlan.total_budget ? peso(viewPlan.total_budget) : "—"}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">GAD Budget</p>
                <p className="text-sm font-medium mt-0.5">{viewPlan.gad_budget ? peso(viewPlan.gad_budget) : "—"}</p>
              </div>
            </div>

            {viewPlan.mandate && (
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Mandate</p>
                <p className="text-sm mt-0.5 leading-relaxed">{viewPlan.mandate}</p>
              </div>
            )}

            {viewPlan.ppas_summary && (
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">PPAS Summary</p>
                <p className="text-sm mt-0.5 leading-relaxed whitespace-pre-wrap">{viewPlan.ppas_summary}</p>
              </div>
            )}

            {viewPlan.total_budget && viewPlan.gad_budget && (
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">
                  GAD Budget Allocation (RA 9710 requires min. 5%)
                </p>
                <div className="w-full h-2.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (parseFloat(viewPlan.gad_budget) / parseFloat(viewPlan.total_budget)) * 100)}%`,
                      background: "var(--accent-primary)",
                    }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {((parseFloat(viewPlan.gad_budget) / parseFloat(viewPlan.total_budget)) * 100).toFixed(1)}% of total budget
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal
        open={showCreate}
        onClose={closeForm}
        title="Add GAD Plan"
        description="Create a new Gender and Development plan for a fiscal year."
        size="lg"
        footer={
          <>
            <ModalButton variant="secondary" onClick={closeForm}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={handleCreate} disabled={submitting}>
              {submitting ? "Saving..." : "Save Plan"}
            </ModalButton>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FInput
            label="Fiscal Year"
            name="fiscal_year"
            value={form.fiscal_year}
            placeholder="e.g. 2026"
            required
            type="number"
            error={formErrors.fiscal_year}
            onChange={handleFieldChange}
          />
          <FSelect
            label="Status"
            name="status"
            value={form.status}
            options={STATUS_OPTIONS}
            required
            error={formErrors.status}
            onChange={handleFieldChange}
          />
          <div className="col-span-2">
            <FInput
              label="Title"
              name="title"
              value={form.title}
              placeholder="e.g. 2026 GAD Annual Plan and Budget"
              required
              error={formErrors.title}
              onChange={handleFieldChange}
            />
          </div>
          <FInput
            label="Total Budget"
            name="total_budget"
            value={form.total_budget}
            placeholder="e.g. 500000"
            type="number"
            error={formErrors.total_budget}
            onChange={handleFieldChange}
          />
          <div>
            <FInput
              label="GAD Budget"
              name="gad_budget"
              value={form.gad_budget}
              placeholder="e.g. 25000"
              type="number"
              error={formErrors.gad_budget}
              onChange={handleFieldChange}
            />
            <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
              RA 9710 (Magna Carta of Women) requires at least 5% of total budget.
            </p>
          </div>
          <FTextarea
            label="Mandate"
            name="mandate"
            value={form.mandate}
            placeholder="Legal basis, mandate, or policy reference..."
            rows={2}
            onChange={handleFieldChange}
          />
          <FTextarea
            label="PPAS Summary"
            name="ppas_summary"
            value={form.ppas_summary}
            placeholder="Programs, Projects, and Activities summary..."
            rows={3}
            onChange={handleFieldChange}
          />
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editPlan}
        onClose={closeForm}
        title="Edit GAD Plan"
        description={editPlan ? `Editing: ${editPlan.title}` : ""}
        size="lg"
        footer={
          <>
            <ModalButton variant="secondary" onClick={closeForm}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={handleUpdate} disabled={submitting}>
              {submitting ? "Saving..." : "Update Plan"}
            </ModalButton>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FInput
            label="Fiscal Year"
            name="fiscal_year"
            value={form.fiscal_year}
            placeholder="e.g. 2026"
            required
            type="number"
            error={formErrors.fiscal_year}
            onChange={handleFieldChange}
          />
          <FSelect
            label="Status"
            name="status"
            value={form.status}
            options={STATUS_OPTIONS}
            required
            error={formErrors.status}
            onChange={handleFieldChange}
          />
          <div className="col-span-2">
            <FInput
              label="Title"
              name="title"
              value={form.title}
              placeholder="e.g. 2026 GAD Annual Plan and Budget"
              required
              error={formErrors.title}
              onChange={handleFieldChange}
            />
          </div>
          <FInput
            label="Total Budget"
            name="total_budget"
            value={form.total_budget}
            placeholder="e.g. 500000"
            type="number"
            error={formErrors.total_budget}
            onChange={handleFieldChange}
          />
          <div>
            <FInput
              label="GAD Budget"
              name="gad_budget"
              value={form.gad_budget}
              placeholder="e.g. 25000"
              type="number"
              error={formErrors.gad_budget}
              onChange={handleFieldChange}
            />
            <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
              RA 9710 (Magna Carta of Women) requires at least 5% of total budget.
            </p>
          </div>
          <FTextarea
            label="Mandate"
            name="mandate"
            value={form.mandate}
            placeholder="Legal basis, mandate, or policy reference..."
            rows={2}
            onChange={handleFieldChange}
          />
          <FTextarea
            label="PPAS Summary"
            name="ppas_summary"
            value={form.ppas_summary}
            placeholder="Programs, Projects, and Activities summary..."
            rows={3}
            onChange={handleFieldChange}
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deletePlan}
        onClose={() => setDeletePlan(null)}
        title="Delete GAD Plan"
        description="This action cannot be undone."
        size="sm"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setDeletePlan(null)}>Cancel</ModalButton>
            <ModalButton variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </ModalButton>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-foreground">&ldquo;{deletePlan?.title}&rdquo;</span> (FY {deletePlan?.fiscal_year})?
          All associated records will be permanently removed.
        </p>
      </Modal>

      <Toasts toasts={toasts} dismiss={dismissToast} />

      <MabiniButton
        pageContext="You are on the GAD (Gender and Development) page. This module helps barangay manage their Gender and Development plans, budgets, and activities as required by RA 9710 (Magna Carta of Women). Barangays must allocate at least 5% of their budget to GAD activities."
      />
    </div>
  );
}
