"use client";

import { useState } from "react";
import {
  BarChart3,
  Download,
  FileText,
  Calendar,
  Printer,
  Filter,
  ChevronRight,
  Users,
  Building2,
  Scale,
  Receipt,
  Shield,
  TrendingUp,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ReportTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ElementType;
  frequency: string;
  last_generated: string;
  dilg_required: boolean;
}

const reportTemplates: ReportTemplate[] = [
  { id: "1", name: "Barangay Profile Report", category: "General", description: "Complete demographic profile including population count, household summary, and barangay statistics", icon: Users, frequency: "Quarterly", last_generated: "2026-01-15", dilg_required: true },
  { id: "2", name: "Resident Master List", category: "Records", description: "Complete list of all registered residents with personal details and household info", icon: Users, frequency: "Monthly", last_generated: "2026-03-01", dilg_required: false },
  { id: "3", name: "Household Summary Report", category: "Records", description: "Summary of households by purok with member count, income bracket, and household head", icon: Users, frequency: "Quarterly", last_generated: "2026-01-15", dilg_required: true },
  { id: "4", name: "Voter Statistics Report", category: "Records", description: "Voter registration summary by precinct, age group, and gender", icon: Users, frequency: "As needed", last_generated: "2025-10-01", dilg_required: false },
  { id: "5", name: "Establishment Master List", category: "Establishments", description: "List of all registered business establishments with permit status and owner details", icon: Building2, frequency: "Annually", last_generated: "2026-01-05", dilg_required: false },
  { id: "6", name: "KP Case Summary", category: "Judicial", description: "Summary of Katarungang Pambarangay cases filed, settled, and elevated to court", icon: Scale, frequency: "Monthly", last_generated: "2026-03-01", dilg_required: true },
  { id: "7", name: "Blotter Summary Report", category: "Judicial", description: "Monthly summary of blotter entries by incident type, status, and resolution", icon: Scale, frequency: "Monthly", last_generated: "2026-03-01", dilg_required: true },
  { id: "8", name: "VAWC Statistical Report", category: "Judicial", description: "Statistical report on VAWC cases (anonymized) for DILG and DSWD submission", icon: Shield, frequency: "Quarterly", last_generated: "2026-01-15", dilg_required: true },
  { id: "9", name: "Document Issuance Report", category: "Services", description: "Summary of documents issued with revenue collected per document type", icon: FileText, frequency: "Monthly", last_generated: "2026-03-01", dilg_required: false },
  { id: "10", name: "Revenue Collection Report", category: "Finance", description: "Summary of all collections from document issuances, permits, and fees", icon: Receipt, frequency: "Monthly", last_generated: "2026-03-01", dilg_required: false },
  { id: "11", name: "Barangay Annual Report", category: "General", description: "Comprehensive annual report covering all barangay operations for DILG submission", icon: BarChart3, frequency: "Annually", last_generated: "2025-12-31", dilg_required: true },
  { id: "12", name: "Disaster Risk Assessment", category: "Operations", description: "Disaster risk and vulnerability profile of the barangay for DRRM planning", icon: Shield, frequency: "Annually", last_generated: "2025-06-15", dilg_required: true },
];

const categories = ["All", "General", "Records", "Establishments", "Judicial", "Services", "Finance", "Operations"];

export default function ReportsPage() {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showDilgOnly, setShowDilgOnly] = useState(false);

  const filtered = reportTemplates.filter((r) => {
    if (categoryFilter !== "All" && r.category !== categoryFilter) return false;
    if (showDilgOnly && !r.dilg_required) return false;
    return true;
  });

  const dilgCount = reportTemplates.filter((r) => r.dilg_required).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate and export barangay reports"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Services" }, { label: "Reports" }]}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><TrendingUp className="h-4 w-4" /> Analytics</button>
          </div>
        }
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Templates</p>
          <p className="text-2xl font-bold text-foreground mt-1">{reportTemplates.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">DILG Required</p>
          <p className="text-2xl font-bold text-foreground mt-1">{dilgCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Categories</p>
          <p className="text-2xl font-bold text-foreground mt-1">{categories.length - 1}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border">
          {categories.map((c) => (
            <button key={c} onClick={() => setCategoryFilter(c)}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                categoryFilter === c ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {c}
            </button>
          ))}
        </div>
        <button onClick={() => setShowDilgOnly(!showDilgOnly)}
          className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
            showDilgOnly ? "border-accent-primary bg-accent-bg text-accent-text" : "border-border hover:bg-muted text-muted-foreground")}>
          <Filter className="h-3 w-3" /> DILG Required Only
        </button>
      </div>

      {/* Report Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.id} className="p-5 rounded-xl border border-border bg-card hover:shadow-md transition-all group cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-bg)" }}>
                  <Icon className="h-5 w-5" style={{ color: "var(--accent-primary)" }} />
                </div>
                <div className="flex items-center gap-1.5">
                  {r.dilg_required && <Badge variant="warning">DILG</Badge>}
                  <Badge variant="muted">{r.category}</Badge>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{r.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{r.description}</p>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {r.frequency}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {r.last_generated}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 rounded hover:bg-muted" title="Download"><Download className="h-3.5 w-3.5" /></button>
                  <button className="p-1.5 rounded hover:bg-muted" title="Print"><Printer className="h-3.5 w-3.5" /></button>
                  <button className="p-1.5 rounded hover:bg-muted" title="Generate"><ChevronRight className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="p-12 text-center text-muted-foreground rounded-xl border border-border bg-card">No reports found for this filter.</div>
      )}
    </div>
  );
}
