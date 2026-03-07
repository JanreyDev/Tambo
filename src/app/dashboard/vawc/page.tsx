"use client";

import { useState } from "react";
import {
  Shield,
  Plus,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  AlertTriangle,
  Calendar,
  Users,
  Lock,
  EyeOff,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

interface VawcCase {
  id: string;
  case_number: string;
  case_type: string;
  complainant_name: string;
  complainant_relationship: string;
  respondent_name: string;
  incident_date: string;
  report_date: string;
  status: string;
  risk_level: string;
  protection_order: boolean;
  referred_to: string;
  case_officer: string;
  is_confidential: boolean;
}

const mockCases: VawcCase[] = [
  { id: "1", case_number: "VAWC-2026-001", case_type: "Physical Abuse", complainant_name: "Complainant A", complainant_relationship: "Spouse", respondent_name: "Respondent A", incident_date: "2026-03-01", report_date: "2026-03-02", status: "active", risk_level: "high", protection_order: true, referred_to: "PNP Women's Desk", case_officer: "Kag. Reyes", is_confidential: true },
  { id: "2", case_number: "VAWC-2026-002", case_type: "Economic Abuse", complainant_name: "Complainant B", complainant_relationship: "Common-law partner", respondent_name: "Respondent B", incident_date: "2026-02-15", report_date: "2026-02-16", status: "active", risk_level: "medium", protection_order: false, referred_to: "DSWD", case_officer: "Kag. Lopez", is_confidential: true },
  { id: "3", case_number: "VAWC-2025-008", case_type: "Psychological Abuse", complainant_name: "Complainant C", complainant_relationship: "Spouse", respondent_name: "Respondent C", incident_date: "2025-11-20", report_date: "2025-11-22", status: "resolved", risk_level: "medium", protection_order: true, referred_to: "PAO", case_officer: "Kag. Reyes", is_confidential: true },
  { id: "4", case_number: "VAWC-2025-005", case_type: "Physical Abuse", complainant_name: "Complainant D", complainant_relationship: "Daughter", respondent_name: "Respondent D", incident_date: "2025-09-10", report_date: "2025-09-10", status: "closed", risk_level: "high", protection_order: true, referred_to: "PNP Women's Desk, DSWD", case_officer: "Kag. Lopez", is_confidential: true },
  { id: "5", case_number: "VAWC-2026-003", case_type: "Sexual Harassment", complainant_name: "Complainant E", complainant_relationship: "Not related", respondent_name: "Respondent E", incident_date: "2026-03-04", report_date: "2026-03-05", status: "under_investigation", risk_level: "high", protection_order: false, referred_to: "PNP", case_officer: "Kag. Reyes", is_confidential: true },
];

const caseTypes = ["All Types", "Physical Abuse", "Economic Abuse", "Psychological Abuse", "Sexual Harassment"];
const riskLevels = ["All Risk", "High", "Medium", "Low"];

export default function VawcPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [riskFilter, setRiskFilter] = useState("All Risk");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [viewCase, setViewCase] = useState<VawcCase | null>(null);
  const pageSize = 10;

  const filtered = mockCases.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      if (!c.case_number.toLowerCase().includes(q) && !c.case_type.toLowerCase().includes(q)) return false;
    }
    if (typeFilter !== "All Types" && c.case_type !== typeFilter) return false;
    if (riskFilter !== "All Risk" && c.risk_level !== riskFilter.toLowerCase()) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  const activeCount = mockCases.filter((c) => c.status === "active" || c.status === "under_investigation").length;
  const highRiskCount = mockCases.filter((c) => c.risk_level === "high").length;
  const withPO = mockCases.filter((c) => c.protection_order).length;

  const riskColor = (level: string) => {
    switch (level) { case "high": return "danger"; case "medium": return "warning"; default: return "muted"; }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="VAWC Records"
        description="Violence Against Women and Children case management"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Judicial" }, { label: "VAWC Records" }]}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><Download className="h-4 w-4" /> Export</button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}><Plus className="h-4 w-4" /> New Case</button>
          </div>
        }
      />

      <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 flex items-start gap-3">
        <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Confidential Records</p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">VAWC cases are protected under RA 9262 and RA 10173. Names are anonymized. Access is restricted to authorized personnel only.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Cases" value={mockCases.length} icon={<Shield className="h-5 w-5" />} />
        <StatCard label="Active Cases" value={activeCount} icon={<AlertTriangle className="h-5 w-5" />} />
        <StatCard label="High Risk" value={highRiskCount} icon={<AlertTriangle className="h-5 w-5" />} />
        <StatCard label="Protection Orders" value={withPO} icon={<Lock className="h-5 w-5" />} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by case number or type..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={cn("flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors",
              showFilters ? "border-accent-primary bg-accent-bg text-accent-text" : "border-border hover:bg-muted")}>
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg border border-border bg-card">
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
              {caseTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select value={riskFilter} onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
              {riskLevels.map((r) => <option key={r}>{r}</option>)}
            </select>
            <button onClick={() => { setTypeFilter("All Types"); setRiskFilter("All Risk"); }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /> Clear</button>
          </div>
        )}
      </div>

      {/* Case Cards */}
      <div className="space-y-3">
        {paged.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground rounded-xl border border-border bg-card">No VAWC cases found.</div>
        ) : (
          paged.map((c) => (
            <div key={c.id} className="p-5 rounded-xl border bg-card hover:shadow-md transition-all cursor-pointer"
              style={{ borderLeftWidth: "4px", borderLeftColor: c.risk_level === "high" ? "#ef4444" : c.risk_level === "medium" ? "#f59e0b" : "#64748b" }}
              onClick={() => setViewCase(c)}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-foreground">{c.case_number}</span>
                    <StatusBadge status={c.status} />
                    <Badge variant={riskColor(c.risk_level) as "danger" | "warning" | "muted"}>{c.risk_level.toUpperCase()} RISK</Badge>
                    {c.protection_order && <Badge variant="info">PO Issued</Badge>}
                  </div>
                  <p className="text-sm text-foreground">{c.case_type}</p>
                  <div className="flex items-center gap-4 mt-2 text-[12px] text-muted-foreground">
                    <span className="flex items-center gap-1"><EyeOff className="h-3 w-3" /> Confidential parties</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {c.complainant_relationship}</span>
                    <span>Referred: {c.referred_to}</span>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end"><Calendar className="h-3 w-3" /> {c.incident_date}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Officer: {c.case_officer}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing {start + 1}–{Math.min(start + pageSize, filtered.length)} of {filtered.length}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={safePage <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronsLeft className="h-4 w-4" /></button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
            <span className="px-3 py-1 text-sm">{safePage} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
            <button onClick={() => setPage(totalPages)} disabled={safePage >= totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronsRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {/* View Case Modal */}
      <Modal open={!!viewCase} onClose={() => setViewCase(null)} title={viewCase?.case_number || ""} description={viewCase?.case_type || ""} size="lg"
        footer={<><ModalButton variant="secondary" onClick={() => setViewCase(null)}>Close</ModalButton><ModalButton variant="primary">Update Case</ModalButton></>}>
        {viewCase && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <StatusBadge status={viewCase.status} />
              <Badge variant={riskColor(viewCase.risk_level) as "danger" | "warning" | "muted"}>{viewCase.risk_level.toUpperCase()} RISK</Badge>
              {viewCase.protection_order && <Badge variant="info">Protection Order Issued</Badge>}
            </div>
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
              <p className="text-xs font-medium text-red-700 dark:text-red-400 uppercase mb-1">Confidential Notice</p>
              <p className="text-sm text-red-800 dark:text-red-300">Party names are anonymized per RA 9262. Full details accessible to authorized case officers only.</p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div><p className="text-[11px] text-muted-foreground uppercase">Complainant</p><p className="text-sm">{viewCase.complainant_name}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Relationship</p><p className="text-sm">{viewCase.complainant_relationship}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Respondent</p><p className="text-sm">{viewCase.respondent_name}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Incident Date</p><p className="text-sm">{viewCase.incident_date}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Report Date</p><p className="text-sm">{viewCase.report_date}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Case Officer</p><p className="text-sm">{viewCase.case_officer}</p></div>
              <div className="col-span-2"><p className="text-[11px] text-muted-foreground uppercase">Referred To</p><p className="text-sm">{viewCase.referred_to}</p></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
