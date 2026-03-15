"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Download,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PiggyBank,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { MabiniButton } from '@/components/ui/mabini-button';

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: "income" | "expense";
  amount: number;
  reference: string;
  recorded_by: string;
}

const mockTransactions: Transaction[] = [
  { id: "1", date: "2026-03-07", description: "Barangay Clearance issuance (5 pcs)", type: "income", category: "Document Fees", amount: 250, reference: "OR-2026-0155", recorded_by: "Treasurer Reyes" },
  { id: "2", date: "2026-03-07", description: "Certificate of Residency (3 pcs)", type: "income", category: "Document Fees", amount: 90, reference: "OR-2026-0154", recorded_by: "Treasurer Reyes" },
  { id: "3", date: "2026-03-06", description: "Office supplies - paper and ink", type: "expense", category: "Office Supplies", amount: 2500, reference: "CV-2026-0080", recorded_by: "Treasurer Reyes" },
  { id: "4", date: "2026-03-06", description: "Business Permit clearance fees (10 pcs)", type: "income", category: "Permit Fees", amount: 1000, reference: "OR-2026-0153", recorded_by: "Treasurer Reyes" },
  { id: "5", date: "2026-03-05", description: "Tanod monthly allowance - March", type: "expense", category: "Personnel", amount: 15000, reference: "CV-2026-0079", recorded_by: "Treasurer Reyes" },
  { id: "6", date: "2026-03-05", description: "Electricity bill - Barangay Hall", type: "expense", category: "Utilities", amount: 3200, reference: "CV-2026-0078", recorded_by: "Treasurer Reyes" },
  { id: "7", date: "2026-03-04", description: "IRA allocation - March 2026", type: "income", category: "IRA", amount: 150000, reference: "JV-2026-0012", recorded_by: "Treasurer Reyes" },
  { id: "8", date: "2026-03-03", description: "SK Fund allocation - Q1 2026", type: "income", category: "SK Fund", amount: 25000, reference: "JV-2026-0011", recorded_by: "Treasurer Reyes" },
];

const categories = ["All", "Document Fees", "Permit Fees", "IRA", "SK Fund", "Office Supplies", "Personnel", "Utilities"];

const formTabs = ["Transaction", "Details"];
const transactionTypes = ["", "Income", "Expense"];
const incomeCategories = ["", "Document Fees", "Permit Fees", "Rental", "IRA", "Other Income"];
const expenseCategories = ["", "Supplies", "Utilities", "Honorarium", "Maintenance", "Programs", "Other Expense"];

const emptyForm: Record<string, string> = {
  transaction_type: "", category: "", amount: "", or_number: "", date: "",
  description: "", payee_payor: "", reference_number: "", remarks: "",
};

function FormInput({ label, name, value, placeholder, required, type, error, onChange }: { label: string; name: string; value: string; placeholder?: string; required?: boolean; type?: string; error?: string; onChange: (name: string, value: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type || "text"} value={value} onChange={(e) => onChange(name, e.target.value)} placeholder={placeholder} className={cn("w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring", error ? "border-red-500" : "border-border")} />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormSelect({ label, name, value, options, required, error, onChange }: { label: string; name: string; value: string; options: string[]; required?: boolean; error?: string; onChange: (name: string, value: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select value={value} onChange={(e) => onChange(name, e.target.value)} className={cn("w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring", error ? "border-red-500" : "border-border")}>
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
      <textarea value={value} onChange={(e) => onChange(name, e.target.value)} placeholder={placeholder} rows={rows || 3} className="w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none" />
    </div>
  );
}

export default function FinancePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [viewItem, setViewItem] = useState<Transaction | null>(null);
  const [formTab, setFormTab] = useState(0);
  const [form, setForm] = useState<Record<string, string>>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<{id: string; type: "success"|"error"|"warning"|"info"; title: string; message?: string}[]>([]);

  const addToast = useCallback((type: "success"|"error"|"warning"|"info", title: string, message?: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleFieldChange = (name: string, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    setFormErrors((e) => { const next = { ...e }; delete next[name]; return next; });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.description.trim()) errors.description = "Description is required";
    if (!form.transaction_type) errors.transaction_type = "Transaction type is required";
    if (!form.category) errors.category = "Category is required";
    if (!form.amount.trim()) errors.amount = "Amount is required";
    else if (isNaN(Number(form.amount)) || Number(form.amount) <= 0) errors.amount = "Amount must be a positive number";
    if (!form.date) errors.date = "Date is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreate = () => { setForm(emptyForm); setFormTab(0); setFormErrors({}); setShowCreate(true); };
  const openEdit = (t: Transaction) => {
    setForm({
      transaction_type: t.type === "income" ? "Income" : "Expense",
      category: t.category,
      amount: String(t.amount),
      or_number: t.reference,
      date: t.date,
      description: t.description,
      payee_payor: "",
      reference_number: t.reference,
      remarks: "",
    });
    setFormTab(0);
    setFormErrors({});
    setShowEdit(true);
  };

  const categoryOptions = form.transaction_type === "Expense" ? expenseCategories : incomeCategories;

  const filtered = mockTransactions.filter((t) => {
    if (search && !t.description.toLowerCase().includes(search.toLowerCase()) && !t.reference.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== "All" && t.category !== categoryFilter) return false;
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    return true;
  });

  const totalIncome = mockTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = mockTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="Barangay financial transactions and budget tracking"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Operations" }, { label: "Finance" }]}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><Download className="h-4 w-4" /> Export</button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}><Plus className="h-4 w-4" /> Record Transaction</button>
          </div>
        }
      />

      {/* Mabini AI Insight */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-accent-primary/20 bg-accent-bg/30">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--accent-primary)", opacity: 0.15 }}>
          <Bot className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Mabini AI Financial Summary</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            Net balance positive at P53,400. Utility expenses trending 12% higher than last quarter. IRA allocation on track. 2 uncategorized transactions need classification.
          </p>
        </div>
        <button onClick={() => router.push("/dashboard/ai")} className="shrink-0 px-3 py-1.5 text-[10px] font-semibold rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--accent-primary)", color: "#fff" }}>
          Ask Mabini
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Income" value={`₱${totalIncome.toLocaleString()}`} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard label="Total Expenses" value={`₱${totalExpense.toLocaleString()}`} icon={<TrendingDown className="h-5 w-5" />} />
        <StatCard label="Net Balance" value={`₱${balance.toLocaleString()}`} icon={<Wallet className="h-5 w-5" />} />
        <StatCard label="IRA This Month" value="₱150,000" icon={<PiggyBank className="h-5 w-5" />} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring" />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg border border-border">
          {(["all", "income", "expense"] as const).map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize",
                typeFilter === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {t}
            </button>
          ))}
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring">
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Transaction Table */}
      <div className="rounded-xl glass overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Reference</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
              <th className="px-4 py-3 w-12" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">No transactions found</p>
                    <p className="text-xs text-muted-foreground mt-1">Record your first income or expense to start tracking barangay finances.</p>
                  </div>
                  <button onClick={() => openCreate()} className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
                    + New Transaction
                  </button>
                </div>
              </td></tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setViewItem(t)}>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{t.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {t.type === "income"
                        ? <ArrowUpRight className="h-4 w-4 text-emerald-500 shrink-0" />
                        : <ArrowDownRight className="h-4 w-4 text-red-500 shrink-0" />}
                      <span className="text-sm text-foreground">{t.description}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge variant="muted">{t.category}</Badge></td>
                  <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{t.reference}</td>
                  <td className={cn("px-4 py-3 text-sm font-medium text-right", t.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                    {t.type === "income" ? "+" : "-"}₱{t.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="relative" onClick={(ev) => ev.stopPropagation()}>
                      <button onClick={() => setActionMenu(actionMenu === t.id ? null : t.id)} className="p-1.5 rounded hover:bg-muted">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </button>
                      {actionMenu === t.id && (
                        <div className="absolute right-0 top-8 z-20 w-44 glass rounded-lg shadow-lg py-1">
                          <button onClick={() => { setViewItem(t); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Eye className="h-3.5 w-3.5" /> View</button>
                          <button onClick={() => { openEdit(t); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Edit className="h-3.5 w-3.5" /> Edit</button>
                          <button onClick={() => { setViewItem(t); setShowDelete(true); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-muted flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/30">
                <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-foreground text-right">Net Total</td>
                <td className={cn("px-4 py-3 text-sm font-bold text-right",
                  filtered.reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0) >= 0
                    ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                  ₱{Math.abs(filtered.reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0)).toLocaleString()}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* View Transaction Modal */}
      <Modal open={!!viewItem && !showDelete} onClose={() => setViewItem(null)} title="Transaction Details" description={viewItem?.reference || ""} size="md"
        footer={<><ModalButton variant="secondary" onClick={() => setViewItem(null)}>Close</ModalButton><ModalButton variant="primary" onClick={() => { if (viewItem) { openEdit(viewItem); setViewItem(null); } }}>Edit</ModalButton></>}>
        {viewItem && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Badge variant={viewItem.type === "income" ? "success" : "danger"} className="capitalize">{viewItem.type}</Badge>
              <Badge variant="muted">{viewItem.category}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Date</p>
                <p className="text-sm text-foreground">{viewItem.date}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Amount</p>
                <p className={cn("text-sm font-semibold", viewItem.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                  {viewItem.type === "income" ? "+" : "-"}₱{viewItem.amount.toLocaleString()}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Description</p>
                <p className="text-sm text-foreground">{viewItem.description}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Reference Number</p>
                <p className="text-sm font-mono text-foreground">{viewItem.reference}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Recorded By</p>
                <p className="text-sm text-foreground">{viewItem.recorded_by}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create / Edit Transaction Form Modal */}
      <Modal open={showCreate || showEdit} onClose={() => { setShowCreate(false); setShowEdit(false); }} title={showEdit ? "Edit Transaction" : "Record Transaction"} size="lg"
        footer={<>
          <ModalButton variant="secondary" onClick={() => { setShowCreate(false); setShowEdit(false); }}>Cancel</ModalButton>
          {formTab > 0 && <ModalButton variant="secondary" onClick={() => setFormTab((t) => t - 1)}>Previous</ModalButton>}
          {formTab < formTabs.length - 1 ? <ModalButton variant="primary" onClick={() => setFormTab((t) => t + 1)}>Next</ModalButton> : <ModalButton variant="primary" disabled={isSubmitting} onClick={() => { if (isSubmitting) return; if (validateForm()) { setIsSubmitting(true); setTimeout(() => { if (showEdit) { addToast("success", "Transaction Updated", "The transaction record has been updated successfully."); } else { addToast("success", "Transaction Recorded", "New transaction has been recorded successfully."); } setShowCreate(false); setShowEdit(false); setIsSubmitting(false); }, 300); } }}>{isSubmitting ? "Saving..." : showEdit ? "Update" : "Save"}</ModalButton>}
        </>}>
        <div className="flex border-b border-border mb-6">
          {formTabs.map((tab, i) => (
            <button key={tab} onClick={() => setFormTab(i)} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors", formTab === i ? "border-accent-primary text-accent-text" : "border-transparent text-muted-foreground hover:text-foreground")}>{tab}</button>
          ))}
        </div>
        {formTab === 0 && (
          <div className="grid grid-cols-2 gap-4">
            <FormSelect label="Transaction Type" name="transaction_type" value={form.transaction_type} options={transactionTypes} required error={formErrors.transaction_type} onChange={handleFieldChange} />
            <FormSelect label="Category" name="category" value={form.category} options={categoryOptions} required error={formErrors.category} onChange={handleFieldChange} />
            <div>
              <FormInput label="Amount" name="amount" value={form.amount} placeholder="0.00" type="number" required error={formErrors.amount} onChange={handleFieldChange} />
              <p className="text-[10px] text-muted-foreground mt-1">Enter the exact amount in Philippine Pesos (PHP).</p>
            </div>
            <div>
              <FormInput label="OR/CV Number" name="or_number" value={form.or_number} placeholder="OR-XXXX-XXXX" onChange={handleFieldChange} />
              <p className="text-[10px] text-muted-foreground mt-1">Official Receipt number from the barangay receipt booklet.</p>
            </div>
            <FormInput label="Date" name="date" value={form.date} type="date" required error={formErrors.date} onChange={handleFieldChange} />
          </div>
        )}
        {formTab === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Description" name="description" value={form.description} placeholder="Transaction description" required error={formErrors.description} onChange={handleFieldChange} />
            <FormInput label="Payee / Payor" name="payee_payor" value={form.payee_payor} placeholder="Name of payee or payor" onChange={handleFieldChange} />
            <FormInput label="Reference Number" name="reference_number" value={form.reference_number} placeholder="Reference number" onChange={handleFieldChange} />
            <FormTextarea label="Remarks" name="remarks" value={form.remarks} placeholder="Additional remarks..." onChange={handleFieldChange} />
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Confirm Delete" description="This action cannot be undone." size="sm"
        footer={<><ModalButton variant="secondary" onClick={() => { setShowDelete(false); setViewItem(null); }}>Cancel</ModalButton><ModalButton variant="danger" onClick={() => { addToast("success", "Transaction Deleted", `"${viewItem?.description}" has been permanently removed.`); setShowDelete(false); setViewItem(null); }}>Delete</ModalButton></>}>
        <p className="text-sm text-muted-foreground">Are you sure you want to delete <span className="font-medium text-foreground">{viewItem?.description}</span> ({viewItem?.type === "income" ? "+" : "-"}P{viewItem?.amount.toLocaleString()}, ref: {viewItem?.reference})? This will permanently remove this financial record.</p>
      </Modal>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          {toasts.map((toast) => (
            <div key={toast.id} className={cn(
              "flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border min-w-[320px] max-w-[420px] animate-in slide-in-from-right-5 fade-in duration-300",
              toast.type === "success" && "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/80 dark:border-emerald-800",
              toast.type === "error" && "bg-red-50 border-red-200 dark:bg-red-950/80 dark:border-red-800",
              toast.type === "warning" && "bg-amber-50 border-amber-200 dark:bg-amber-950/80 dark:border-amber-800",
              toast.type === "info" && "bg-blue-50 border-blue-200 dark:bg-blue-950/80 dark:border-blue-800",
            )}>
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
                {toast.message && <p className={cn(
                  "text-xs mt-0.5",
                  toast.type === "success" && "text-emerald-600 dark:text-emerald-400",
                  toast.type === "error" && "text-red-600 dark:text-red-400",
                  toast.type === "warning" && "text-amber-600 dark:text-amber-400",
                  toast.type === "info" && "text-blue-600 dark:text-blue-400",
                )}>{toast.message}</p>}
              </div>
              <button onClick={() => dismissToast(toast.id)} className="shrink-0 p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}
      <MabiniButton pageContext="You are on the Finance page. This page manages barangay financial transactions, income, and expense records." />
    </div>
  );
}
