"use client";

import { useState } from "react";
import {
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

export default function FinancePage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [viewItem, setViewItem] = useState<Transaction | null>(null);
  const [formTab, setFormTab] = useState(0);
  const [form, setForm] = useState<Record<string, string>>(emptyForm);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const Input = ({ label, name, value, placeholder, required, type }: { label: string; name: string; value: string; placeholder?: string; required?: boolean; type?: string }) => (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type || "text"} value={value} onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))} placeholder={placeholder} className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring" />
    </div>
  );
  const Select = ({ label, name, value, options, required }: { label: string; name: string; value: string; options: string[]; required?: boolean }) => (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select value={value} onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
        {options.map((o) => <option key={o} value={o}>{o || "\u2014 Select \u2014"}</option>)}
      </select>
    </div>
  );
  const Textarea = ({ label, name, value, placeholder, rows, required }: { label: string; name: string; value: string; placeholder?: string; rows?: number; required?: boolean }) => (
    <div className="col-span-2">
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <textarea value={value} onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))} placeholder={placeholder} rows={rows || 3} className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none" />
    </div>
  );

  const openCreate = () => { setForm(emptyForm); setFormTab(0); setShowCreate(true); };
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
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}><Plus className="h-4 w-4" /> Record Transaction</button>
          </div>
        }
      />

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
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring" />
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
          className="px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Transaction Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
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
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No transactions found.</td></tr>
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
                        <div className="absolute right-0 top-8 z-20 w-44 bg-card border border-border rounded-lg shadow-lg py-1">
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
          {formTab < formTabs.length - 1 ? <ModalButton variant="primary" onClick={() => setFormTab((t) => t + 1)}>Next</ModalButton> : <ModalButton variant="primary" onClick={() => { setShowCreate(false); setShowEdit(false); }}>{showEdit ? "Update" : "Save"}</ModalButton>}
        </>}>
        <div className="flex border-b border-border mb-6">
          {formTabs.map((tab, i) => (
            <button key={tab} onClick={() => setFormTab(i)} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors", formTab === i ? "border-accent-primary text-accent-text" : "border-transparent text-muted-foreground hover:text-foreground")}>{tab}</button>
          ))}
        </div>
        {formTab === 0 && (
          <div className="grid grid-cols-2 gap-4">
            <Select label="Transaction Type" name="transaction_type" value={form.transaction_type} options={transactionTypes} />
            <Select label="Category" name="category" value={form.category} options={categoryOptions} />
            <Input label="Amount" name="amount" value={form.amount} placeholder="0.00" type="number" required />
            <Input label="OR/CV Number" name="or_number" value={form.or_number} placeholder="OR-XXXX-XXXX" />
            <Input label="Date" name="date" value={form.date} type="date" />
          </div>
        )}
        {formTab === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <Input label="Description" name="description" value={form.description} placeholder="Transaction description" required />
            <Input label="Payee / Payor" name="payee_payor" value={form.payee_payor} placeholder="Name of payee or payor" />
            <Input label="Reference Number" name="reference_number" value={form.reference_number} placeholder="Reference number" />
            <Textarea label="Remarks" name="remarks" value={form.remarks} placeholder="Additional remarks..." />
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Confirm Delete" description="This action cannot be undone." size="sm"
        footer={<><ModalButton variant="secondary" onClick={() => { setShowDelete(false); setViewItem(null); }}>Cancel</ModalButton><ModalButton variant="danger" onClick={() => { setShowDelete(false); setViewItem(null); }}>Delete</ModalButton></>}>
        <p className="text-sm text-muted-foreground">Are you sure you want to delete this transaction (<span className="font-medium text-foreground">{viewItem?.reference}</span>)? This will permanently remove this financial record.</p>
      </Modal>
    </div>
  );
}
