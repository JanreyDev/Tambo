"use client";

import { ChevronRight, BarChart3, FileText, Users, TrendingUp } from "lucide-react";
import { MabiniInsightBanner } from "@/components/mabini-insight-banner";

export default function BcmpAnalyticsPage() {
  const documentTypes = [
    { type: "Barangay Clearance", count: 4820, pct: 35 },
    { type: "Certificate of Residency", count: 3210, pct: 23 },
    { type: "Certificate of Indigency", count: 2840, pct: 21 },
    { type: "Business Permit", count: 1560, pct: 11 },
    { type: "Others", count: 1370, pct: 10 },
  ];

  const topBarangays = [
    { name: "Brgy. Tambo", residents: 12450, docs: 342 },
    { name: "Brgy. East Bajac-Bajac", residents: 9870, docs: 287 },
    { name: "Brgy. San Jose", residents: 8920, docs: 218 },
    { name: "Brgy. Pag-asa", residents: 5670, docs: 89 },
    { name: "Brgy. West Tapinac", residents: 5430, docs: 164 },
  ];

  const adoptionMetrics = [
    { metric: "Feature Adoption", value: 78, color: "#3b82f6" },
    { metric: "User Engagement", value: 89, color: "#22c55e" },
    { metric: "Document Digitization", value: 92, color: "#ea580c" },
    { metric: "AI Usage", value: 45, color: "#f59e0b" },
    { metric: "SMS Integration", value: 67, color: "#ec4899" },
  ];

  return (
    <div className="p-6 space-y-4">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span>BCMP</span><ChevronRight className="w-3 h-3" /><span className="text-foreground font-medium">Analytics</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">BCMP Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Cross-barangay data insights for kapitan.ph</p>
      </div>

      <MabiniInsightBanner message="AI adoption is at 45% — the lowest metric. Consider adding training resources and in-app prompts to boost Mabini AI engagement." />

      {/* Quick stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: "Total Documents", value: "13,800", icon: FileText, color: "#3b82f6" },
          { label: "Active Users", value: "247", icon: Users, color: "#ea580c" },
          { label: "Avg Docs/Day", value: "148", icon: BarChart3, color: "#22c55e" },
          { label: "Growth Rate", value: "+7.4%", icon: TrendingUp, color: "#f59e0b" },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Document Types */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Document Types Distribution</h3>
          <div className="space-y-3">
            {documentTypes.map((d) => (
              <div key={d.type}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{d.type}</span>
                  <span className="text-xs font-semibold text-foreground">{d.count.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${d.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Barangays */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Top Barangays by Residents</h3>
          <div className="space-y-3">
            {topBarangays.map((b, i) => (
              <div key={b.name} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{b.name}</p>
                  <p className="text-[10px] text-muted-foreground">{b.docs} documents issued</p>
                </div>
                <span className="text-sm font-bold text-foreground">{b.residents.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Adoption metrics */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Platform Adoption Metrics</h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {adoptionMetrics.map((m) => (
            <div key={m.metric} className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-2">
                <svg width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="27" fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/50" />
                  <circle cx="32" cy="32" r="27" fill="none" stroke={m.color} strokeWidth="5"
                    strokeDasharray={`${2 * Math.PI * 27}`}
                    strokeDashoffset={`${2 * Math.PI * 27 * (1 - m.value / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 32 32)" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">{m.value}%</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">{m.metric}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
