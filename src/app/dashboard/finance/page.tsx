"use client";

import { useState } from "react";
import {
  Receipt,
  Download,
  Plus,
  Search,
  Filter,
  X,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  FileText,
  Wallet,
  PiggyBank,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
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

export default function FinancePage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");

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
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}><Plus className="h-4 w-4" /> Record Transaction</button>
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
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No transactions found.</td></tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
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
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
