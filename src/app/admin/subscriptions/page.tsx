"use client";

import { useState } from "react";
import {
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Download,
  Filter,
  Search,
  Plus,
} from "lucide-react";

interface Plan {
  name: string;
  price: number;
  billingCycle: string;
  features: string[];
  tenants: number;
  color: string;
  popular?: boolean;
}

interface Transaction {
  id: string;
  barangay: string;
  plan: string;
  amount: number;
  type: string;
  status: string;
  date: string;
  statusColor: string;
  typeColor: string;
}

const plans: Plan[] = [
  {
    name: "Starter",
    price: 800,
    billingCycle: "per month",
    features: ["Up to 5 users", "Basic resident management", "Document generation", "Email support"],
    tenants: 8,
    color: "#64748b",
  },
  {
    name: "Standard",
    price: 1500,
    billingCycle: "per month",
    features: ["Up to 10 users", "All modules", "SMS integration", "AI Assistant (basic)", "Priority support"],
    tenants: 32,
    color: "#3b82f6",
    popular: true,
  },
  {
    name: "Professional",
    price: 2500,
    billingCycle: "per month",
    features: ["Up to 15 users", "All modules + Analytics", "SMS + Call credits", "AI Assistant (advanced)", "Dedicated support", "Custom branding"],
    tenants: 10,
    color: "#8b5cf6",
  },
  {
    name: "Enterprise",
    price: 5000,
    billingCycle: "per month",
    features: ["Unlimited users", "Everything in Professional", "White-label option", "API access", "SLA guarantee", "On-site training"],
    tenants: 2,
    color: "#f59e0b",
  },
];

const transactions: Transaction[] = [
  { id: "TXN-001", barangay: "Brgy. Tambo", plan: "Professional", amount: 2500, type: "Renewal", status: "Paid", date: "2026-03-01", statusColor: "#22c55e", typeColor: "#3b82f6" },
  { id: "TXN-002", barangay: "Brgy. Barretto", plan: "Professional", amount: 2500, type: "Renewal", status: "Paid", date: "2026-03-01", statusColor: "#22c55e", typeColor: "#3b82f6" },
  { id: "TXN-003", barangay: "Brgy. San Jose", plan: "Standard", amount: 1500, type: "Renewal", status: "Paid", date: "2026-02-28", statusColor: "#22c55e", typeColor: "#3b82f6" },
  { id: "TXN-004", barangay: "Brgy. Kalaklan", plan: "Trial", amount: 0, type: "New Trial", status: "Active", date: "2026-03-01", statusColor: "#f59e0b", typeColor: "#22c55e" },
  { id: "TXN-005", barangay: "Brgy. Pag-asa", plan: "Standard", amount: 1500, type: "Renewal", status: "Overdue", date: "2025-12-01", statusColor: "#ef4444", typeColor: "#ef4444" },
  { id: "TXN-006", barangay: "Brgy. Mabayuan", plan: "Standard", amount: 1500, type: "Upgrade", status: "Paid", date: "2026-02-15", statusColor: "#22c55e", typeColor: "#8b5cf6" },
  { id: "TXN-007", barangay: "Brgy. East Tapinac", plan: "Standard", amount: 1500, type: "Renewal", status: "Paid", date: "2026-02-01", statusColor: "#22c55e", typeColor: "#3b82f6" },
];

export default function SubscriptionsPage() {
  const [tab, setTab] = useState<"plans" | "transactions">("plans");

  const totalMRR = tenants_mrr();
  const totalARR = totalMRR * 12;

  function tenants_mrr() {
    return plans.reduce((acc, p) => acc + (p.price * p.tenants), 0);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subscriptions & Billing</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage plans, pricing, and payment tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors">
            <Download className="w-4 h-4" /> Export Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" /> New Plan
          </button>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: "Monthly Recurring Revenue", value: `P${totalMRR.toLocaleString()}`, trend: "+7.4%", trendUp: true, icon: TrendingUp, color: "#22c55e" },
          { label: "Annual Run Rate", value: `P${totalARR.toLocaleString()}`, trend: "+12%", trendUp: true, icon: CreditCard, color: "#3b82f6" },
          { label: "Average Revenue/Tenant", value: `P${Math.round(totalMRR / 52).toLocaleString()}`, trend: "+3.2%", trendUp: true, icon: Building2, color: "#8b5cf6" },
          { label: "Overdue Payments", value: "2", trend: "P3,000 outstanding", trendUp: false, icon: AlertTriangle, color: "#ef4444" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-[0.05]" style={{ background: s.color }} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</p>
                <p className="text-xl font-bold text-foreground mt-1">{s.value}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  {s.trendUp ? (
                    <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-red-400" />
                  )}
                  <span className={`text-[11px] font-medium ${s.trendUp ? "text-emerald-500" : "text-red-400"}`}>{s.trend}</span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${s.color}12` }}>
                <s.icon className="w-4.5 h-4.5" style={{ color: s.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        {(["plans", "transactions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "plans" ? "Plans & Pricing" : "Transactions"}
          </button>
        ))}
      </div>

      {/* Plans Tab */}
      {tab === "plans" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-card border rounded-xl p-5 relative overflow-hidden transition-all hover:shadow-lg ${
                plan.popular ? "border-blue-500 ring-1 ring-blue-500/20" : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-600 text-white">
                  POPULAR
                </div>
              )}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${plan.color}12` }}>
                <CreditCard className="w-5 h-5" style={{ color: plan.color }} />
              </div>
              <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mt-1 mb-4">
                <span className="text-2xl font-bold text-foreground">P{plan.price.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">/{plan.billingCycle}</span>
              </div>
              <div className="space-y-2 mb-5">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Active Tenants</p>
                    <p className="text-lg font-bold text-foreground">{plan.tenants}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="text-lg font-bold text-foreground">P{(plan.price * plan.tenants).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <button className="w-full mt-4 px-4 py-2 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors">
                Edit Plan
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Transactions Tab */}
      {tab === "transactions" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Search */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search transactions..." className="flex-1 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none" />
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors">
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-[80px_1fr_100px_100px_80px_100px_100px] gap-3 px-5 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/30">
            <span>ID</span>
            <span>Barangay</span>
            <span>Plan</span>
            <span className="text-center">Type</span>
            <span className="text-right">Amount</span>
            <span className="text-center">Status</span>
            <span className="text-right">Date</span>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-border">
            {transactions.map((txn) => (
              <div key={txn.id} className="grid grid-cols-[80px_1fr_100px_100px_80px_100px_100px] gap-3 items-center px-5 py-3 hover:bg-muted/30 transition-colors">
                <span className="text-[11px] font-mono text-muted-foreground">{txn.id}</span>
                <span className="text-sm font-medium text-foreground truncate">{txn.barangay}</span>
                <span className="text-xs text-muted-foreground">{txn.plan}</span>
                <div className="flex justify-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ background: `${txn.typeColor}15`, color: txn.typeColor }}>
                    {txn.type}
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground text-right">
                  {txn.amount > 0 ? `P${txn.amount.toLocaleString()}` : "Free"}
                </span>
                <div className="flex justify-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: `${txn.statusColor}15`, color: txn.statusColor }}>
                    {txn.status}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground text-right">{txn.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
