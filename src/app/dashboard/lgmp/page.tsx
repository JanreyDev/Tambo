"use client";

import { toast } from "sonner";
import { ChevronRight, Landmark, Clock, Users, Building } from "lucide-react";
import { MabiniInsightBanner } from "@/components/mabini-insight-banner";

const departments = [
  { name: "Provincial Governor's Office (PGO)", status: "Active", users: 15, head: "Gov. Christian Yap" },
  { name: "Provincial Planning & Dev Office (PPDO)", status: "Active", users: 12, head: "Dir. Maria Santos" },
  { name: "Provincial Social Operations Center (PSOC)", status: "Active", users: 8, head: "Dir. Juan Reyes" },
  { name: "Public Employment Service Office (PESO)", status: "Onboarding", users: 0, head: "Dir. Elena Cruz" },
  { name: "Provincial Engineering Office (PEO)", status: "Onboarding", users: 0, head: "Dir. Pedro Lim" },
];

export default function LgmpPage() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span>LGMP</span><ChevronRight className="w-3 h-3" /><span className="text-foreground font-medium">Departments</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">LGMP - Tarlac Province</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Department management for tarlac.ph</p>
      </div>

      <MabiniInsightBanner message="PESO and PEO are onboarding. Prepare department templates and user accounts before they go live." />

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: "Active Departments", value: "3", icon: Building, color: "#22c55e" },
          { label: "Onboarding", value: "2", icon: Clock, color: "#f59e0b" },
          { label: "Total Users", value: "35", icon: Users, color: "#3b82f6" },
          { label: "Monthly Revenue", value: "P250K", icon: Landmark, color: "#ea580c" },
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

      {/* Departments */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-foreground">Departments</h3>
        </div>
        <div className="divide-y divide-border">
          {departments.map((d) => (
            <div key={d.name} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Landmark className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{d.name}</p>
                <p className="text-[11px] text-muted-foreground">Head: {d.head}</p>
              </div>
              <span className="text-xs text-muted-foreground">{d.users} users</span>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                d.status === "Active" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
              }`}>{d.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30">
        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Client: Tarlac Province under Governor Christian Yap</p>
        <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/60 mt-1">
          Revenue: P250,000/month (team embedded in provincial payroll). 2 more departments incoming for onboarding.
        </p>
      </div>
    </div>
  );
}
