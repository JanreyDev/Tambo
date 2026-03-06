"use client";

import { useState } from "react";
import {
  Heart,
  Plus,
  Download,
  Search,
  Users,
  BarChart3,
  Calendar,
  FileText,
  TrendingUp,
  PieChart,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
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

export default function GadPage() {
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = mockPrograms.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  const totalBudget = mockPrograms.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = mockPrograms.reduce((sum, p) => sum + p.spent, 0);
  const totalBeneficiaries = mockPrograms.reduce((sum, p) => sum + p.beneficiaries_count, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gender and Development"
        description="GAD programs, budget utilization, and compliance tracking"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Operations" }, { label: "GAD" }]}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><Download className="h-4 w-4" /> GAD Report</button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}><Plus className="h-4 w-4" /> Add Program</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total GAD Budget" value={`₱${totalBudget.toLocaleString()}`} icon={<Heart className="h-5 w-5" />} />
        <StatCard label="Budget Utilized" value={`₱${totalSpent.toLocaleString()}`} icon={<TrendingUp className="h-5 w-5" />} trend={{ value: Math.round((totalSpent / totalBudget) * 100), label: "utilization" }} />
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
        <p className="text-[11px] text-muted-foreground mt-1">₱{totalSpent.toLocaleString()} spent of ₱{totalBudget.toLocaleString()} allocated</p>
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
        {filtered.map((p) => {
          const pct = p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0;
          return (
            <div key={p.id} className="p-5 rounded-xl border border-border bg-card hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">{p.category}</p>
                </div>
                <Badge variant={p.status === "ongoing" ? "info" : p.status === "completed" ? "success" : "muted"}>{p.status}</Badge>
              </div>
              <div className="flex items-center gap-3 text-[12px] text-muted-foreground mb-3">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {p.target_beneficiaries}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {p.period}</span>
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                  <span>₱{p.spent.toLocaleString()} / ₱{p.budget.toLocaleString()}</span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--accent-primary)" }} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{p.beneficiaries_count} beneficiaries served</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
