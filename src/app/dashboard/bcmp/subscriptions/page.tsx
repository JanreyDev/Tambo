"use client";

import { ChevronRight, CreditCard, TrendingUp, AlertCircle } from "lucide-react";
import { MabiniInsightBanner } from "@/components/mabini-insight-banner";

export default function BcmpSubscriptionsPage() {
  const plans = [
    { name: "Starter", price: "P800", tenants: 12, revenue: "P9,600", color: "#94a3b8" },
    { name: "Standard", price: "P1,500", tenants: 28, revenue: "P42,000", color: "#3b82f6" },
    { name: "Professional", price: "P2,500", tenants: 10, revenue: "P25,000", color: "#ea580c" },
    { name: "Enterprise", price: "P5,000", tenants: 2, revenue: "P10,000", color: "#f59e0b" },
  ];

  const transactions = [
    { barangay: "Brgy. Tambo", plan: "Professional", amount: "P2,500", type: "Renewal", status: "Paid", date: "Mar 5, 2026" },
    { barangay: "Brgy. San Jose", plan: "Standard", amount: "P1,500", type: "Renewal", status: "Paid", date: "Mar 3, 2026" },
    { barangay: "Brgy. Kalaklan", plan: "Starter", amount: "P800", type: "Trial", status: "Trial", date: "Mar 1, 2026" },
    { barangay: "Brgy. Mabayuan", plan: "Standard", amount: "P1,500", type: "Upgrade", status: "Paid", date: "Feb 28, 2026" },
    { barangay: "Brgy. Pag-asa", plan: "Standard", amount: "P1,500", type: "Renewal", status: "Overdue", date: "Feb 15, 2026" },
  ];

  return (
    <div className="p-6 space-y-4">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span>BCMP</span><ChevronRight className="w-3 h-3" /><span className="text-foreground font-medium">Subscriptions</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Subscriptions</h1>
        <p className="text-sm text-muted-foreground mt-0.5">BCMP billing and subscription management</p>
      </div>

      <MabiniInsightBanner message="Professional plan has the highest revenue per tenant at P2,500/mo. Consider promoting upgrades to Standard plan users." />

      {/* Revenue stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: "MRR", value: "P102,000", icon: CreditCard, color: "#3b82f6" },
          { label: "ARR", value: "P1.224M", icon: TrendingUp, color: "#22c55e" },
          { label: "Avg Revenue/Tenant", value: "P1,962", icon: CreditCard, color: "#ea580c" },
          { label: "Overdue Payments", value: "2 | P3K", icon: AlertCircle, color: "#ef4444" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
            </div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Plans */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {plans.map((p) => (
          <div key={p.name} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              <span className="text-sm font-semibold text-foreground">{p.name}</span>
            </div>
            <p className="text-lg font-bold text-foreground">{p.price}<span className="text-[10px] text-muted-foreground font-normal">/mo</span></p>
            <div className="mt-2 pt-2 border-t border-border flex justify-between">
              <span className="text-[10px] text-muted-foreground">{p.tenants} tenants</span>
              <span className="text-[10px] font-semibold text-foreground">{p.revenue}/mo</span>
            </div>
          </div>
        ))}
      </div>

      {/* Transactions */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-foreground">Recent Transactions</h3>
        </div>
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-5 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
          <span>Barangay</span>
          <span className="w-20 text-center">Plan</span>
          <span className="w-16 text-center">Amount</span>
          <span className="w-16 text-center">Type</span>
          <span className="w-16 text-center">Status</span>
          <span className="w-24 text-right">Date</span>
        </div>
        <div className="divide-y divide-border">
          {transactions.map((t, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 items-center px-5 py-3 hover:bg-muted/30 transition-colors">
              <span className="text-xs font-medium text-foreground">{t.barangay}</span>
              <span className="w-20 text-center text-xs text-muted-foreground">{t.plan}</span>
              <span className="w-16 text-center text-xs font-semibold text-foreground">{t.amount}</span>
              <span className="w-16 text-center text-[10px] text-muted-foreground">{t.type}</span>
              <span className="w-16 text-center">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  t.status === "Paid" ? "bg-emerald-500/10 text-emerald-600" :
                  t.status === "Trial" ? "bg-amber-500/10 text-amber-600" :
                  "bg-red-500/10 text-red-600"
                }`}>{t.status}</span>
              </span>
              <span className="w-24 text-right text-[10px] text-muted-foreground">{t.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
