// D:/dev/primex/bcmp-web/src/app/dashboard/finance/page.tsx
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Plus,
  Search,
  Download,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Landmark,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Bot,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  FileText,
  Receipt,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { MabiniButton } from "@/components/ui/mabini-button";
import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────

interface Budget {
  id: string;
  fiscal_year: number;
  appropriation: number;
  allotment: number;
  obligations: number;
  unobligated: number;
  beginning_cash_treasury: number | null;
  beginning_cash_bank: number | null;
  beginning_cash_advance: number | null;
  beginning_petty_cash: number | null;
  gad_budget: number | null;
  sk_budget: number | null;
  status: string;
  created_at: string;
}

interface DisbursementVoucher {
  id: string;
  dv_number: string;
  dv_date: string;
  payee: string;
  amount: number;
  fund_cluster: string | null;
  purpose: string | null;
  status: string;
  signatory_id: string | null;
  created_at: string;
}

interface CashbookEntry {
  id: string;
  entry_date: string;
  entry_type: "receipt" | "disbursement";
  description: string;
  amount: number;
  reference_number: string | null;
  fund_cluster: string | null;
  created_at: string;
}

interface Collection {
  id: string;
  [key: string]: unknown;
}

type ActiveTab = "budgets" | "disbursements" | "cashbook" | "collections";

// ── Toast ─────────────────────────────────────────────────────────────────

interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function peso(n: number | null | undefined): string {
  if (n == null) return "\u2014";
  return "\u20B1" + n.toLocaleString("en-PH", { minimumFractionDigits: 2 });
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "\u2014";
  try {
    return new Date(d.includes("T") ? d : `${d}T00:00:00`).toLocaleDateString("en-PH", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch { return d; }
}

// ── Field components ───────────────────────────────────────────────────────

function FInput({
  label, name, value, placeholder, required, type, error, hint, onChange,
}: {
  label: string; name: string; value: string; placeholder?: string;
  required?: boolean; type?: string; error?: string; hint?: string;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2",
          error ? "border-red-500 focus:ring-red-300" : "border-border focus:ring-accent-ring"
        )}
      />
      {hint && !error && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
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
          <option key={o.value} value={o.value}>{o.label || "\u2014 Select \u2014"}</option>
        ))}
      </select>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FTextarea({
  label, name, value, placeholder, rows, required, error, onChange,
}: {
  label: string; name: string; value: string; placeholder?: string;
  rows?: number; required?: boolean; error?: string;
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
        rows={rows || 3}
        className={cn(
          "w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 resize-none",
          error ? "border-red-500 focus:ring-red-300" : "border-border focus:ring-accent-ring"
        )}
      />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ── Skeleton row ───────────────────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-border last:border-0">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-muted rounded animate-pulse" style={{ width: `${50 + (i % 4) * 15}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ── Toast renderer ─────────────────────────────────────────────────────────

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => onDismiss(toast.id)}
          className={cn(
            "flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border cursor-pointer min-w-[300px] max-w-[400px] animate-in slide-in-from-right-5",
            toast.type === "success" && "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800",
            toast.type === "error" && "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800",
            toast.type === "warning" && "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800",
            toast.type === "info" && "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800",
          )}
        >
          <div className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold text-white",
            toast.type === "success" && "bg-emerald-500",
            toast.type === "error" && "bg-red-500",
            toast.type === "warning" && "bg-amber-500",
            toast.type === "info" && "bg-blue-500",
          )}>
            {toast.type === "success" ? "\u2713" : toast.type === "error" ? "\u2715" : toast.type === "warning" ? "!" : "i"}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-sm font-semibold",
              toast.type === "success" && "text-emerald-800 dark:text-emerald-200",
              toast.type === "error" && "text-red-800 dark:text-red-200",
              toast.type === "warning" && "text-amber-800 dark:text-amber-200",
              toast.type === "info" && "text-blue-800 dark:text-blue-200",
            )}>{toast.title}</p>
            {toast.message && (
              <p className={cn(
                "text-xs mt-0.5",
                toast.type === "success" && "text-emerald-600 dark:text-emerald-400",
                toast.type === "error" && "text-red-600 dark:text-red-400",
                toast.type === "warning" && "text-amber-600 dark:text-amber-400",
                toast.type === "info" && "text-blue-600 dark:text-blue-400",
              )}>{toast.message}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface BudgetForm {
  fiscal_year: string;
  appropriation: string;
  allotment: string;
  obligations: string;
  unobligated: string;
  beginning_cash_treasury: string;
  beginning_cash_bank: string;
  beginning_cash_advance: string;
  beginning_petty_cash: string;
  gad_budget: string;
  sk_budget: string;
  status: string;
}

interface DvForm {
  dv_number: string;
  dv_date: string;
  payee: string;
  amount: string;
  fund_cluster: string;
  purpose: string;
  status: string;
}

interface CashbookForm {
  entry_date: string;
  entry_type: string;
  description: string;
  amount: string;
  reference_number: string;
  fund_cluster: string;
}

const emptyBudgetForm: BudgetForm = {
  fiscal_year: "",
  appropriation: "",
  allotment: "",
  obligations: "",
  unobligated: "",
  beginning_cash_treasury: "",
  beginning_cash_bank: "",
  beginning_cash_advance: "",
  beginning_petty_cash: "",
  gad_budget: "",
  sk_budget: "",
  status: "draft",
};

const emptyDvForm: DvForm = {
  dv_number: "",
  dv_date: "",
  payee: "",
  amount: "",
  fund_cluster: "",
  purpose: "",
  status: "draft",
};

const emptyCashbookForm: CashbookForm = {
  entry_date: "",
  entry_type: "receipt",
  description: "",
  amount: "",
  reference_number: "",
  fund_cluster: "",
};

// ── Main Page ─────────────────────────────────────────────────────────────

export default function FinancePage() {
  const router = useRouter();

  // ── Data state ─────────────────────────────────────────────────────────
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [dvouchers, setDvouchers] = useState<DisbursementVoucher[]>([]);
  const [cashbook, setCashbook] = useState<CashbookEntry[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  // ── Summary stats derived from loaded data ─────────────────────────────
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalCollections, setTotalCollections] = useState(0);
  const [cashBalance, setCashBalance] = useState(0);

  // ── Filters ─────────────────────────────────────────────────────────────
  const [dvSearch, setDvSearch] = useState("");
  const [dvStatus, setDvStatus] = useState("");
  const [dvYear, setDvYear] = useState("");
  const [cashbookType, setCashbookType] = useState("");
  const [budgetYear, setBudgetYear] = useState("");
  const [budgetStatus, setBudgetStatus] = useState("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Tabs ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>("budgets");

  // ── Action menus ─────────────────────────────────────────────────────────
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  // ── Modals: Budget ────────────────────────────────────────────────────────
  const [viewBudget, setViewBudget] = useState<Budget | null>(null);
  const [showBudgetCreate, setShowBudgetCreate] = useState(false);
  const [showBudgetEdit, setShowBudgetEdit] = useState(false);
  const [showBudgetDelete, setShowBudgetDelete] = useState(false);
  const [deleteBudgetTarget, setDeleteBudgetTarget] = useState<Budget | null>(null);
  const [budgetForm, setBudgetForm] = useState<BudgetForm>(emptyBudgetForm);
  const [budgetFormErrors, setBudgetFormErrors] = useState<Record<string, string>>({});
  const [budgetSaving, setBudgetSaving] = useState(false);

  // ── Modals: Disbursement voucher ──────────────────────────────────────────
  const [viewDv, setViewDv] = useState<DisbursementVoucher | null>(null);
  const [showDvCreate, setShowDvCreate] = useState(false);
  const [showDvEdit, setShowDvEdit] = useState(false);
  const [showDvDelete, setShowDvDelete] = useState(false);
  const [deleteDvTarget, setDeleteDvTarget] = useState<DisbursementVoucher | null>(null);
  const [dvForm, setDvForm] = useState<DvForm>(emptyDvForm);
  const [dvFormErrors, setDvFormErrors] = useState<Record<string, string>>({});
  const [dvSaving, setDvSaving] = useState(false);

  // ── Modals: Cashbook entry ────────────────────────────────────────────────
  const [showCashbookCreate, setShowCashbookCreate] = useState(false);
  const [cashbookForm, setCashbookForm] = useState<CashbookForm>(emptyCashbookForm);
  const [cashbookFormErrors, setCashbookFormErrors] = useState<Record<string, string>>({});
  const [cashbookSaving, setCashbookSaving] = useState(false);

  // ── Toasts ───────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((type: Toast["type"], title: string, message?: string) => {
    const id = crypto.randomUUID();
    setToasts((p) => [...p, { id, type, title, message }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);
  const dismissToast = useCallback((id: string) => {
    setToasts((p) => p.filter((t) => t.id !== id));
  }, []);

  // ── Fetch functions ───────────────────────────────────────────────────────

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (budgetYear) query.set("fiscal_year", budgetYear);
      if (budgetStatus) query.set("status", budgetStatus);
      const qs = query.toString();
      const res = await api.get<{ data: Budget[]; total: number }>(`/budgets${qs ? `?${qs}` : ""}`);
      const list = res.data ?? [];
      setBudgets(list);
      // Derive summary stats from active budgets
      const active = list.filter((b) => b.status === "active" || b.status === "approved");
      setTotalBudget(active.reduce((s, b) => s + (b.appropriation || 0), 0));
      setTotalExpenses(active.reduce((s, b) => s + (b.obligations || 0), 0));
      // Cash balance = beginning cash (treasury + bank) - obligations
      const beginningCash = active.reduce((s, b) =>
        s + (b.beginning_cash_treasury || 0) + (b.beginning_cash_bank || 0), 0);
      setCashBalance(beginningCash - active.reduce((s, b) => s + (b.obligations || 0), 0));
    } catch {
      addToast("error", "Failed to load budgets");
    } finally {
      setLoading(false);
    }
  }, [budgetYear, budgetStatus, addToast]);

  const fetchDisbursements = useCallback(async () => {
    setTabLoading(true);
    try {
      const query = new URLSearchParams();
      if (dvSearch) query.set("search", dvSearch);
      if (dvStatus) query.set("status", dvStatus);
      if (dvYear) query.set("fiscal_year", dvYear);
      const qs = query.toString();
      const res = await api.get<{ data: DisbursementVoucher[] }>(`/disbursement-vouchers${qs ? `?${qs}` : ""}`);
      setDvouchers(res.data ?? []);
    } catch {
      addToast("error", "Failed to load disbursement vouchers");
    } finally {
      setTabLoading(false);
    }
  }, [dvSearch, dvStatus, dvYear, addToast]);

  const fetchCashbook = useCallback(async () => {
    setTabLoading(true);
    try {
      const query = new URLSearchParams();
      if (cashbookType) query.set("type", cashbookType);
      const qs = query.toString();
      const res = await api.get<{ data: CashbookEntry[] }>(`/cashbook-entries${qs ? `?${qs}` : ""}`);
      const list = res.data ?? [];
      setCashbook(list);
      // Update total collections from receipt entries
      const receipts = list.filter((e) => e.entry_type === "receipt");
      setTotalCollections(receipts.reduce((s, e) => s + (e.amount || 0), 0));
    } catch {
      addToast("error", "Failed to load cashbook entries");
    } finally {
      setTabLoading(false);
    }
  }, [cashbookType, addToast]);

  const fetchCollections = useCallback(async () => {
    setTabLoading(true);
    try {
      const [depositsRes, paymentsRes] = await Promise.all([
        api.get<{ data: Collection[] }>("/collections-deposits").catch(() => ({ data: [] })),
        api.get<{ data: Collection[] }>("/payments").catch(() => ({ data: [] })),
      ]);
      setCollections([
        ...(depositsRes.data ?? []),
        ...(paymentsRes.data ?? []),
      ]);
    } catch {
      addToast("error", "Failed to load collections");
    } finally {
      setTabLoading(false);
    }
  }, [addToast]);

  // ── Effects ───────────────────────────────────────────────────────────────

  // Initial load: budgets + cashbook for stats
  useEffect(() => {
    fetchBudgets();
    fetchCashbook();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tab switching
  useEffect(() => {
    if (activeTab === "budgets") fetchBudgets();
    else if (activeTab === "disbursements") fetchDisbursements();
    else if (activeTab === "cashbook") fetchCashbook();
    else if (activeTab === "collections") fetchCollections();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Debounce DV search
  useEffect(() => {
    if (activeTab !== "disbursements") return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchDisbursements();
    }, 400);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [dvSearch, fetchDisbursements, activeTab]);

  // Close action menu on outside click
  useEffect(() => {
    if (!actionMenu) return;
    const fn = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-action-menu]")) setActionMenu(null);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [actionMenu]);

  // ── Form helpers ──────────────────────────────────────────────────────────

  const handleBudgetFieldChange = (name: string, value: string) => {
    setBudgetForm((f) => ({ ...f, [name]: value } as BudgetForm));
    setBudgetFormErrors((e) => { const n = { ...e }; delete n[name]; return n; });
  };

  const handleDvFieldChange = (name: string, value: string) => {
    setDvForm((f) => ({ ...f, [name]: value } as DvForm));
    setDvFormErrors((e) => { const n = { ...e }; delete n[name]; return n; });
  };

  const handleCashbookFieldChange = (name: string, value: string) => {
    setCashbookForm((f) => ({ ...f, [name]: value } as CashbookForm));
    setCashbookFormErrors((e) => { const n = { ...e }; delete n[name]; return n; });
  };

  // ── Budget CRUD ───────────────────────────────────────────────────────────

  const openBudgetCreate = () => {
    setBudgetForm({ ...emptyBudgetForm, status: "draft", fiscal_year: String(new Date().getFullYear()) });
    setBudgetFormErrors({});
    setShowBudgetCreate(true);
  };

  const openBudgetEdit = (b: Budget) => {
    setBudgetForm({
      fiscal_year: String(b.fiscal_year),
      appropriation: String(b.appropriation),
      allotment: String(b.allotment),
      obligations: String(b.obligations),
      unobligated: String(b.unobligated),
      beginning_cash_treasury: String(b.beginning_cash_treasury ?? ""),
      beginning_cash_bank: String(b.beginning_cash_bank ?? ""),
      beginning_cash_advance: String(b.beginning_cash_advance ?? ""),
      beginning_petty_cash: String(b.beginning_petty_cash ?? ""),
      gad_budget: String(b.gad_budget ?? ""),
      sk_budget: String(b.sk_budget ?? ""),
      status: b.status,
    });
    setBudgetFormErrors({});
    setViewBudget(b);
    setShowBudgetEdit(true);
    setActionMenu(null);
  };

  const validateBudgetForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!budgetForm.fiscal_year?.trim()) errors.fiscal_year = "Fiscal year is required";
    else if (isNaN(Number(budgetForm.fiscal_year))) errors.fiscal_year = "Must be a valid year";
    if (!budgetForm.appropriation?.trim()) errors.appropriation = "Appropriation is required";
    else if (isNaN(Number(budgetForm.appropriation))) errors.appropriation = "Must be a valid number";
    setBudgetFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBudgetSave = async () => {
    if (!validateBudgetForm()) return;
    setBudgetSaving(true);
    try {
      const payload = {
        fiscal_year: parseInt(budgetForm.fiscal_year),
        appropriation: parseFloat(budgetForm.appropriation || "0"),
        allotment: parseFloat(budgetForm.allotment || "0"),
        obligations: parseFloat(budgetForm.obligations || "0"),
        unobligated: parseFloat(budgetForm.unobligated || "0"),
        beginning_cash_treasury: budgetForm.beginning_cash_treasury ? parseFloat(budgetForm.beginning_cash_treasury) : null,
        beginning_cash_bank: budgetForm.beginning_cash_bank ? parseFloat(budgetForm.beginning_cash_bank) : null,
        beginning_cash_advance: budgetForm.beginning_cash_advance ? parseFloat(budgetForm.beginning_cash_advance) : null,
        beginning_petty_cash: budgetForm.beginning_petty_cash ? parseFloat(budgetForm.beginning_petty_cash) : null,
        gad_budget: budgetForm.gad_budget ? parseFloat(budgetForm.gad_budget) : null,
        sk_budget: budgetForm.sk_budget ? parseFloat(budgetForm.sk_budget) : null,
        status: budgetForm.status || "draft",
      };
      if (showBudgetEdit && viewBudget) {
        await api.put(`/budgets/${viewBudget.id}`, payload);
        addToast("success", "Budget Updated", "Budget record has been updated.");
      } else {
        await api.post("/budgets", payload);
        addToast("success", "Budget Created", "New budget record has been saved.");
      }
      setShowBudgetCreate(false);
      setShowBudgetEdit(false);
      setViewBudget(null);
      fetchBudgets();
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast("error", "Save Failed", e?.message || "Could not save budget.");
    } finally {
      setBudgetSaving(false);
    }
  };

  const handleBudgetDelete = async () => {
    if (!deleteBudgetTarget) return;
    try {
      await api.delete(`/budgets/${deleteBudgetTarget.id}`);
      addToast("success", "Budget Deleted", `FY ${deleteBudgetTarget.fiscal_year} budget record removed.`);
      setShowBudgetDelete(false);
      setDeleteBudgetTarget(null);
      fetchBudgets();
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast("error", "Delete Failed", e?.message || "Could not delete budget.");
    }
  };

  // ── Disbursement Voucher CRUD ─────────────────────────────────────────────

  const openDvCreate = () => {
    setDvForm({ ...emptyDvForm, status: "draft" });
    setDvFormErrors({});
    setShowDvCreate(true);
  };

  const openDvEdit = (dv: DisbursementVoucher) => {
    setDvForm({
      dv_number: dv.dv_number,
      dv_date: dv.dv_date,
      payee: dv.payee,
      amount: String(dv.amount),
      fund_cluster: dv.fund_cluster ?? "",
      purpose: dv.purpose ?? "",
      status: dv.status,
    });
    setDvFormErrors({});
    setViewDv(dv);
    setShowDvEdit(true);
    setActionMenu(null);
  };

  const validateDvForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!dvForm.dv_number?.trim()) errors.dv_number = "DV number is required";
    if (!dvForm.dv_date?.trim()) errors.dv_date = "Date is required";
    if (!dvForm.payee?.trim()) errors.payee = "Payee is required";
    if (!dvForm.amount?.trim()) errors.amount = "Amount is required";
    else if (isNaN(Number(dvForm.amount)) || Number(dvForm.amount) <= 0) errors.amount = "Must be a positive number";
    setDvFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDvSave = async () => {
    if (!validateDvForm()) return;
    setDvSaving(true);
    try {
      const payload = {
        dv_number: dvForm.dv_number,
        dv_date: dvForm.dv_date,
        payee: dvForm.payee,
        amount: parseFloat(dvForm.amount),
        fund_cluster: dvForm.fund_cluster || null,
        purpose: dvForm.purpose || null,
        status: dvForm.status || "draft",
      };
      if (showDvEdit && viewDv) {
        await api.put(`/disbursement-vouchers/${viewDv.id}`, payload);
        addToast("success", "DV Updated", "Disbursement voucher has been updated.");
      } else {
        await api.post("/disbursement-vouchers", payload);
        addToast("success", "DV Created", "Disbursement voucher has been recorded.");
      }
      setShowDvCreate(false);
      setShowDvEdit(false);
      setViewDv(null);
      fetchDisbursements();
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast("error", "Save Failed", e?.message || "Could not save disbursement voucher.");
    } finally {
      setDvSaving(false);
    }
  };

  const handleDvDelete = async () => {
    if (!deleteDvTarget) return;
    try {
      await api.delete(`/disbursement-vouchers/${deleteDvTarget.id}`);
      addToast("success", "DV Deleted", `DV ${deleteDvTarget.dv_number} has been removed.`);
      setShowDvDelete(false);
      setDeleteDvTarget(null);
      fetchDisbursements();
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast("error", "Delete Failed", e?.message || "Could not delete DV.");
    }
  };

  // ── Cashbook CRUD ─────────────────────────────────────────────────────────

  const openCashbookCreate = () => {
    setCashbookForm({ ...emptyCashbookForm, entry_type: "receipt" });
    setCashbookFormErrors({});
    setShowCashbookCreate(true);
  };

  const validateCashbookForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!cashbookForm.entry_date?.trim()) errors.entry_date = "Date is required";
    if (!cashbookForm.entry_type?.trim()) errors.entry_type = "Type is required";
    if (!cashbookForm.description?.trim()) errors.description = "Description is required";
    if (!cashbookForm.amount?.trim()) errors.amount = "Amount is required";
    else if (isNaN(Number(cashbookForm.amount)) || Number(cashbookForm.amount) <= 0) errors.amount = "Must be a positive number";
    setCashbookFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCashbookSave = async () => {
    if (!validateCashbookForm()) return;
    setCashbookSaving(true);
    try {
      await api.post("/cashbook-entries", {
        entry_date: cashbookForm.entry_date,
        entry_type: cashbookForm.entry_type,
        description: cashbookForm.description,
        amount: parseFloat(cashbookForm.amount),
        reference_number: cashbookForm.reference_number || null,
        fund_cluster: cashbookForm.fund_cluster || null,
      });
      addToast("success", "Entry Recorded", "Cashbook entry has been saved.");
      setShowCashbookCreate(false);
      fetchCashbook();
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast("error", "Save Failed", e?.message || "Could not save cashbook entry.");
    } finally {
      setCashbookSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="Barangay financial management \u2014 budgets, disbursements, cashbook, and collections"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Operations" },
          { label: "Finance" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => addToast("info", "Export Started", "Financial records are being exported...")}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <Download className="h-4 w-4" /> Export
            </button>
            {activeTab === "budgets" && (
              <button
                onClick={openBudgetCreate}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors shadow-sm"
                style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
              >
                <Plus className="h-4 w-4" /> Add Budget
              </button>
            )}
            {activeTab === "disbursements" && (
              <button
                onClick={openDvCreate}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors shadow-sm"
                style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
              >
                <Plus className="h-4 w-4" /> New Voucher
              </button>
            )}
            {activeTab === "cashbook" && (
              <button
                onClick={openCashbookCreate}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors shadow-sm"
                style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
              >
                <Plus className="h-4 w-4" /> Add Entry
              </button>
            )}
          </div>
        }
      />

      {/* Mabini AI insight */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-accent-primary/20 bg-accent-bg/30">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-accent-bg">
          <Bot className="w-4 h-4 text-accent-text" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Mabini AI \u2014 Financial Summary</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            Ask Mabini for budget utilization analysis, expenditure trends, COA compliance checks, or IRA allocation breakdown.
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/ai")}
          className="shrink-0 px-3 py-1.5 text-[10px] font-semibold rounded-lg transition-colors hover:opacity-80"
          style={{ background: "var(--accent-primary)", color: "#fff" }}
        >
          Ask Mabini
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Budget"
          value={loading ? "\u2014" : peso(totalBudget)}
          icon={<Landmark className="h-5 w-5" />}
        />
        <StatCard
          label="Total Expenditures"
          value={loading ? "\u2014" : peso(totalExpenses)}
          icon={<TrendingDown className="h-5 w-5" />}
        />
        <StatCard
          label="Collections"
          value={loading ? "\u2014" : peso(totalCollections)}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          label="Cash Balance"
          value={loading ? "\u2014" : peso(cashBalance)}
          icon={<PiggyBank className="h-5 w-5" />}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg glass-subtle w-fit">
        {(
          [
            { key: "budgets", label: "Budgets", icon: <Landmark className="h-3.5 w-3.5" /> },
            { key: "disbursements", label: "Disbursements", icon: <FileText className="h-3.5 w-3.5" /> },
            { key: "cashbook", label: "Cashbook", icon: <BookOpen className="h-3.5 w-3.5" /> },
            { key: "collections", label: "Collections", icon: <Receipt className="h-3.5 w-3.5" /> },
          ] as { key: ActiveTab; label: string; icon: React.ReactNode }[]
        ).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors",
              activeTab === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── Budgets tab ───────────────────────────────────────────────────── */}
      {activeTab === "budgets" && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="number"
              value={budgetYear}
              onChange={(e) => setBudgetYear(e.target.value)}
              placeholder="Filter by year..."
              className="px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring w-40"
            />
            <select
              value={budgetStatus}
              onChange={(e) => setBudgetStatus(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
            <button
              onClick={fetchBudgets}
              className="px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
            >
              Apply
            </button>
          </div>

          <div className="rounded-xl glass overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">FY</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Appropriation</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Allotment</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Obligations</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Unobligated</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="w-10 px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
                ) : budgets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <Landmark className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground text-center">No budget records found</p>
                          <p className="text-xs text-muted-foreground mt-1 text-center">
                            Create an annual budget to track appropriations and expenditures.
                          </p>
                        </div>
                        <button
                          onClick={openBudgetCreate}
                          className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white"
                          style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
                        >
                          + Add Budget
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : budgets.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setViewBudget(b)}
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-foreground">FY {b.fiscal_year}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono">{peso(b.appropriation)}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono">{peso(b.allotment)}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono text-red-600 dark:text-red-400">{peso(b.obligations)}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono text-emerald-600 dark:text-emerald-400">{peso(b.unobligated)}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-2 py-3">
                      <div className="relative" data-action-menu onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActionMenu(actionMenu === b.id ? null : b.id)}
                          className="p-1.5 rounded hover:bg-muted"
                        >
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </button>
                        {actionMenu === b.id && (
                          <div className="absolute right-0 top-8 z-20 w-44 bg-white dark:bg-slate-800 border border-border rounded-lg shadow-lg py-1">
                            <button
                              onClick={() => { setViewBudget(b); setActionMenu(null); }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                            >
                              <Eye className="h-3.5 w-3.5" /> View
                            </button>
                            <button
                              onClick={() => openBudgetEdit(b)}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                            >
                              <Edit className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => { setDeleteBudgetTarget(b); setShowBudgetDelete(true); setActionMenu(null); }}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-muted flex items-center gap-2"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Disbursements tab ─────────────────────────────────────────────── */}
      {activeTab === "disbursements" && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={dvSearch}
                onChange={(e) => setDvSearch(e.target.value)}
                placeholder="Search DV number, payee..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring"
              />
            </div>
            <select
              value={dvStatus}
              onChange={(e) => { setDvStatus(e.target.value); }}
              className="px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="released">Released</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input
              type="number"
              value={dvYear}
              onChange={(e) => setDvYear(e.target.value)}
              placeholder="Year..."
              className="px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring w-28"
            />
          </div>

          <div className="rounded-xl glass overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">DV Number</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Payee</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Fund Cluster</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="w-10 px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {tabLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
                ) : dvouchers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <FileText className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground text-center">No disbursement vouchers found</p>
                          <p className="text-xs text-muted-foreground mt-1 text-center">
                            Record disbursement vouchers to track barangay expenditures.
                          </p>
                        </div>
                        <button
                          onClick={openDvCreate}
                          className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white"
                          style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
                        >
                          + New Voucher
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : dvouchers.map((dv) => (
                  <tr
                    key={dv.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setViewDv(dv)}
                  >
                    <td className="px-4 py-3 text-sm font-mono font-semibold">{dv.dv_number}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{fmtDate(dv.dv_date)}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{dv.payee}</p>
                      {dv.purpose && <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{dv.purpose}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono text-red-600 dark:text-red-400">
                      <span className="flex items-center justify-end gap-0.5">
                        <ArrowDownRight className="h-3.5 w-3.5" />
                        {peso(dv.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{dv.fund_cluster || "\u2014"}</td>
                    <td className="px-4 py-3"><StatusBadge status={dv.status} /></td>
                    <td className="px-2 py-3">
                      <div className="relative" data-action-menu onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActionMenu(actionMenu === dv.id ? null : dv.id)}
                          className="p-1.5 rounded hover:bg-muted"
                        >
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </button>
                        {actionMenu === dv.id && (
                          <div className="absolute right-0 top-8 z-20 w-44 bg-white dark:bg-slate-800 border border-border rounded-lg shadow-lg py-1">
                            <button
                              onClick={() => { setViewDv(dv); setActionMenu(null); }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                            >
                              <Eye className="h-3.5 w-3.5" /> View
                            </button>
                            <button
                              onClick={() => openDvEdit(dv)}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                            >
                              <Edit className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => { setDeleteDvTarget(dv); setShowDvDelete(true); setActionMenu(null); }}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-muted flex items-center gap-2"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {dvouchers.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/30">
                    <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-foreground text-right">Total</td>
                    <td className="px-4 py-3 text-sm font-bold text-right font-mono text-red-600 dark:text-red-400">
                      {peso(dvouchers.reduce((s, dv) => s + dv.amount, 0))}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}

      {/* ── Cashbook tab ──────────────────────────────────────────────────── */}
      {activeTab === "cashbook" && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 rounded-lg border border-border">
              {(["", "receipt", "disbursement"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setCashbookType(t); }}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize",
                    cashbookType === t
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t === "" ? "All" : t}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl glass overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Reference</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Fund Cluster</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody>
                {tabLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
                ) : cashbook.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground text-center">No cashbook entries found</p>
                          <p className="text-xs text-muted-foreground mt-1 text-center">
                            Record receipts and disbursements to maintain the barangay cashbook.
                          </p>
                        </div>
                        <button
                          onClick={openCashbookCreate}
                          className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white"
                          style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
                        >
                          + Add Entry
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : cashbook.map((e) => (
                  <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-muted-foreground">{fmtDate(e.entry_date)}</td>
                    <td className="px-4 py-3">
                      {e.entry_type === "receipt"
                        ? <Badge variant="success" dot>Receipt</Badge>
                        : <Badge variant="danger" dot>Disbursement</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {e.entry_type === "receipt"
                          ? <ArrowUpRight className="h-4 w-4 text-emerald-500 shrink-0" />
                          : <ArrowDownRight className="h-4 w-4 text-red-500 shrink-0" />}
                        <span className="text-sm text-foreground">{e.description}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{e.reference_number || "\u2014"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{e.fund_cluster || "\u2014"}</td>
                    <td className={cn(
                      "px-4 py-3 text-sm font-medium text-right font-mono",
                      e.entry_type === "receipt"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    )}>
                      {e.entry_type === "receipt" ? "+" : "-"}{peso(e.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {cashbook.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/30">
                    <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-foreground text-right">Net</td>
                    <td className={cn(
                      "px-4 py-3 text-sm font-bold text-right font-mono",
                      cashbook.reduce((s, e) => s + (e.entry_type === "receipt" ? e.amount : -e.amount), 0) >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    )}>
                      {peso(Math.abs(cashbook.reduce((s, e) => s + (e.entry_type === "receipt" ? e.amount : -e.amount), 0)))}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}

      {/* ── Collections tab ───────────────────────────────────────────────── */}
      {activeTab === "collections" && (
        <div className="rounded-xl glass overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">ID</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody>
              {tabLoading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={3} />)
              ) : collections.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Receipt className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground text-center">No collections or deposits found</p>
                        <p className="text-xs text-muted-foreground mt-1 text-center">
                          Collections and deposit records will appear here once recorded.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : collections.map((c, idx) => (
                <tr key={c.id as string} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-muted-foreground">{idx + 1}</td>
                  <td className="px-4 py-3 text-sm font-mono">{c.id as string}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {Object.entries(c)
                      .filter(([k]) => k !== "id")
                      .slice(0, 3)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(" \u00B7 ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── View Budget Modal ─────────────────────────────────────────────── */}
      <Modal
        open={!!viewBudget && !showBudgetEdit}
        onClose={() => setViewBudget(null)}
        title={viewBudget ? `FY ${viewBudget.fiscal_year} Budget` : ""}
        description={viewBudget ? `Status: ${viewBudget.status}` : ""}
        size="md"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setViewBudget(null)}>Close</ModalButton>
            <ModalButton variant="primary" onClick={() => { if (viewBudget) openBudgetEdit(viewBudget); }}>
              Edit Budget
            </ModalButton>
          </>
        }
      >
        {viewBudget && (
          <div className="space-y-4">
            <StatusBadge status={viewBudget.status} />
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Appropriation</p>
                <p className="text-sm font-mono font-semibold">{peso(viewBudget.appropriation)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Allotment</p>
                <p className="text-sm font-mono">{peso(viewBudget.allotment)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Obligations</p>
                <p className="text-sm font-mono text-red-600 dark:text-red-400">{peso(viewBudget.obligations)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Unobligated</p>
                <p className="text-sm font-mono text-emerald-600 dark:text-emerald-400">{peso(viewBudget.unobligated)}</p>
              </div>
              {viewBudget.beginning_cash_treasury != null && (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Cash \u2014 Treasury</p>
                  <p className="text-sm font-mono">{peso(viewBudget.beginning_cash_treasury)}</p>
                </div>
              )}
              {viewBudget.beginning_cash_bank != null && (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Cash \u2014 Bank</p>
                  <p className="text-sm font-mono">{peso(viewBudget.beginning_cash_bank)}</p>
                </div>
              )}
              {viewBudget.gad_budget != null && (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">GAD Budget</p>
                  <p className="text-sm font-mono">{peso(viewBudget.gad_budget)}</p>
                </div>
              )}
              {viewBudget.sk_budget != null && (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">SK Budget</p>
                  <p className="text-sm font-mono">{peso(viewBudget.sk_budget)}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Create / Edit Budget Modal ────────────────────────────────────── */}
      <Modal
        open={showBudgetCreate || showBudgetEdit}
        onClose={() => { setShowBudgetCreate(false); setShowBudgetEdit(false); }}
        title={showBudgetEdit ? `Edit FY ${viewBudget?.fiscal_year} Budget` : "Create Budget"}
        size="lg"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { setShowBudgetCreate(false); setShowBudgetEdit(false); }}>
              Cancel
            </ModalButton>
            <ModalButton variant="primary" disabled={budgetSaving} onClick={handleBudgetSave}>
              {budgetSaving ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Saving...</> : showBudgetEdit ? "Update" : "Save"}
            </ModalButton>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FInput
            label="Fiscal Year" name="fiscal_year" value={budgetForm.fiscal_year || ""}
            placeholder="e.g. 2026" type="number" required error={budgetFormErrors.fiscal_year}
            onChange={handleBudgetFieldChange}
          />
          <FSelect
            label="Status" name="status" value={budgetForm.status || "draft"}
            options={[
              { value: "draft", label: "Draft" },
              { value: "approved", label: "Approved" },
              { value: "active", label: "Active" },
              { value: "closed", label: "Closed" },
            ]}
            onChange={handleBudgetFieldChange}
          />
          <FInput
            label="Appropriation" name="appropriation" value={budgetForm.appropriation || ""}
            placeholder="0.00" type="number" required error={budgetFormErrors.appropriation}
            hint="Total approved budget"
            onChange={handleBudgetFieldChange}
          />
          <FInput
            label="Allotment" name="allotment" value={budgetForm.allotment || ""}
            placeholder="0.00" type="number" onChange={handleBudgetFieldChange}
          />
          <FInput
            label="Obligations" name="obligations" value={budgetForm.obligations || ""}
            placeholder="0.00" type="number" onChange={handleBudgetFieldChange}
          />
          <FInput
            label="Unobligated Balance" name="unobligated" value={budgetForm.unobligated || ""}
            placeholder="0.00" type="number" onChange={handleBudgetFieldChange}
          />
          <FInput
            label="Beginning Cash \u2014 Treasury" name="beginning_cash_treasury"
            value={budgetForm.beginning_cash_treasury || ""}
            placeholder="0.00" type="number" onChange={handleBudgetFieldChange}
          />
          <FInput
            label="Beginning Cash \u2014 Bank" name="beginning_cash_bank"
            value={budgetForm.beginning_cash_bank || ""}
            placeholder="0.00" type="number" onChange={handleBudgetFieldChange}
          />
          <FInput
            label="Cash Advance" name="beginning_cash_advance"
            value={budgetForm.beginning_cash_advance || ""}
            placeholder="0.00" type="number" onChange={handleBudgetFieldChange}
          />
          <FInput
            label="Petty Cash Fund" name="beginning_petty_cash"
            value={budgetForm.beginning_petty_cash || ""}
            placeholder="0.00" type="number" onChange={handleBudgetFieldChange}
          />
          <FInput
            label="GAD Budget" name="gad_budget" value={budgetForm.gad_budget || ""}
            placeholder="0.00" type="number" hint="Gender and Development allocation"
            onChange={handleBudgetFieldChange}
          />
          <FInput
            label="SK Budget" name="sk_budget" value={budgetForm.sk_budget || ""}
            placeholder="0.00" type="number" hint="Sangguniang Kabataan fund"
            onChange={handleBudgetFieldChange}
          />
        </div>
      </Modal>

      {/* ── Delete Budget Confirmation ────────────────────────────────────── */}
      <Modal
        open={showBudgetDelete}
        onClose={() => { setShowBudgetDelete(false); setDeleteBudgetTarget(null); }}
        title="Delete Budget Record"
        description="This action cannot be undone."
        size="sm"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { setShowBudgetDelete(false); setDeleteBudgetTarget(null); }}>Cancel</ModalButton>
            <ModalButton variant="danger" onClick={handleBudgetDelete}>Delete</ModalButton>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete the <strong>FY {deleteBudgetTarget?.fiscal_year}</strong> budget record ({peso(deleteBudgetTarget?.appropriation ?? null)})? This cannot be undone.
        </p>
      </Modal>

      {/* ── View DV Modal ─────────────────────────────────────────────────── */}
      <Modal
        open={!!viewDv && !showDvEdit}
        onClose={() => setViewDv(null)}
        title={viewDv ? `DV ${viewDv.dv_number}` : ""}
        description={viewDv ? `${fmtDate(viewDv.dv_date)} \u00B7 ${viewDv.payee}` : ""}
        size="md"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setViewDv(null)}>Close</ModalButton>
            <ModalButton variant="primary" onClick={() => { if (viewDv) openDvEdit(viewDv); }}>Edit</ModalButton>
          </>
        }
      >
        {viewDv && (
          <div className="space-y-4">
            <StatusBadge status={viewDv.status} />
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">DV Number</p>
                <p className="text-sm font-mono font-semibold">{viewDv.dv_number}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Date</p>
                <p className="text-sm">{fmtDate(viewDv.dv_date)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Payee</p>
                <p className="text-sm font-medium">{viewDv.payee}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Amount</p>
                <p className="text-sm font-mono font-semibold text-red-600 dark:text-red-400">{peso(viewDv.amount)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Fund Cluster</p>
                <p className="text-sm">{viewDv.fund_cluster || "\u2014"}</p>
              </div>
              {viewDv.purpose && (
                <div className="col-span-2">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Purpose</p>
                  <p className="text-sm">{viewDv.purpose}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Create / Edit DV Modal ────────────────────────────────────────── */}
      <Modal
        open={showDvCreate || showDvEdit}
        onClose={() => { setShowDvCreate(false); setShowDvEdit(false); }}
        title={showDvEdit ? `Edit DV ${viewDv?.dv_number}` : "New Disbursement Voucher"}
        size="lg"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { setShowDvCreate(false); setShowDvEdit(false); }}>Cancel</ModalButton>
            <ModalButton variant="primary" disabled={dvSaving} onClick={handleDvSave}>
              {dvSaving ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Saving...</> : showDvEdit ? "Update" : "Save"}
            </ModalButton>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FInput
            label="DV Number" name="dv_number" value={dvForm.dv_number || ""}
            placeholder="e.g. DV-2026-001" required error={dvFormErrors.dv_number}
            onChange={handleDvFieldChange}
          />
          <FInput
            label="Date" name="dv_date" value={dvForm.dv_date || ""}
            type="date" required error={dvFormErrors.dv_date}
            onChange={handleDvFieldChange}
          />
          <FInput
            label="Payee" name="payee" value={dvForm.payee || ""}
            placeholder="Name of payee" required error={dvFormErrors.payee}
            onChange={handleDvFieldChange}
          />
          <FInput
            label="Amount" name="amount" value={dvForm.amount || ""}
            placeholder="0.00" type="number" required error={dvFormErrors.amount}
            onChange={handleDvFieldChange}
          />
          <FInput
            label="Fund Cluster" name="fund_cluster" value={dvForm.fund_cluster || ""}
            placeholder="e.g. 01, 02" onChange={handleDvFieldChange}
          />
          <FSelect
            label="Status" name="status" value={dvForm.status || "draft"}
            options={[
              { value: "draft", label: "Draft" },
              { value: "approved", label: "Approved" },
              { value: "released", label: "Released" },
              { value: "cancelled", label: "Cancelled" },
            ]}
            onChange={handleDvFieldChange}
          />
          <FTextarea
            label="Purpose" name="purpose" value={dvForm.purpose || ""}
            placeholder="Purpose of disbursement..."
            onChange={handleDvFieldChange}
          />
        </div>
      </Modal>

      {/* ── Delete DV Confirmation ────────────────────────────────────────── */}
      <Modal
        open={showDvDelete}
        onClose={() => { setShowDvDelete(false); setDeleteDvTarget(null); }}
        title="Delete Disbursement Voucher"
        description="This action cannot be undone."
        size="sm"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { setShowDvDelete(false); setDeleteDvTarget(null); }}>Cancel</ModalButton>
            <ModalButton variant="danger" onClick={handleDvDelete}>Delete</ModalButton>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete DV <strong>{deleteDvTarget?.dv_number}</strong> ({peso(deleteDvTarget?.amount ?? null)}) payable to {deleteDvTarget?.payee}?
        </p>
      </Modal>

      {/* ── Create Cashbook Entry Modal ───────────────────────────────────── */}
      <Modal
        open={showCashbookCreate}
        onClose={() => setShowCashbookCreate(false)}
        title="Add Cashbook Entry"
        size="lg"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setShowCashbookCreate(false)}>Cancel</ModalButton>
            <ModalButton variant="primary" disabled={cashbookSaving} onClick={handleCashbookSave}>
              {cashbookSaving ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Saving...</> : "Save Entry"}
            </ModalButton>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FInput
            label="Entry Date" name="entry_date" value={cashbookForm.entry_date || ""}
            type="date" required error={cashbookFormErrors.entry_date}
            onChange={handleCashbookFieldChange}
          />
          <FSelect
            label="Entry Type" name="entry_type" value={cashbookForm.entry_type || "receipt"}
            options={[
              { value: "receipt", label: "Receipt" },
              { value: "disbursement", label: "Disbursement" },
            ]}
            required error={cashbookFormErrors.entry_type}
            onChange={handleCashbookFieldChange}
          />
          <FInput
            label="Amount" name="amount" value={cashbookForm.amount || ""}
            placeholder="0.00" type="number" required error={cashbookFormErrors.amount}
            onChange={handleCashbookFieldChange}
          />
          <FInput
            label="Reference Number" name="reference_number" value={cashbookForm.reference_number || ""}
            placeholder="e.g. OR-2026-001" onChange={handleCashbookFieldChange}
          />
          <FInput
            label="Fund Cluster" name="fund_cluster" value={cashbookForm.fund_cluster || ""}
            placeholder="e.g. 01" onChange={handleCashbookFieldChange}
          />
          <FTextarea
            label="Description" name="description" value={cashbookForm.description || ""}
            placeholder="Description of the transaction..." required error={cashbookFormErrors.description}
            onChange={handleCashbookFieldChange}
          />
        </div>
      </Modal>

      {/* ── Toasts ────────────────────────────────────────────────────────── */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <MabiniButton pageContext="You are on the Finance page. This page manages barangay financial records including budgets, disbursement vouchers, cashbook entries, and collections." />
    </div>
  );
}
