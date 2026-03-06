"use client";

import { useState } from "react";
import {
  Scale,
  Plus,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Clock,
  Users,
  FileText,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

interface KpCase {
  id: string;
  case_number: string;
  title: string;
  case_type: string;
  complainants: string[];
  respondents: string[];
  status: string;
  date_filed: string;
  next_hearing: string;
  hearing_count: number;
  lupon_chairman: string;
  remarks: string;
}

const mockCases: KpCase[] = [
  { id: "1", case_number: "KP-2026-001", title: "Boundary Dispute - Lot 45/46", case_type: "Property Dispute", complainants: ["Maria Dela Cruz"], respondents: ["Juan Santos"], status: "mediation", date_filed: "2026-01-15", next_hearing: "2026-03-15", hearing_count: 3, lupon_chairman: "Kap. Ricardo Reyes", remarks: "Parties agreed to survey. Pending results." },
  { id: "2", case_number: "KP-2026-002", title: "Noise Complaint - Videoke", case_type: "Nuisance", complainants: ["Rosa De Los Santos", "Carlos Rivera"], respondents: ["Mark Chavez"], status: "filed", date_filed: "2026-02-20", next_hearing: "2026-03-10", hearing_count: 0, lupon_chairman: "Kap. Ricardo Reyes", remarks: "First hearing scheduled." },
  { id: "3", case_number: "KP-2026-003", title: "Unpaid Debt - Construction Materials", case_type: "Collection of Sum of Money", complainants: ["Roberto Manalo"], respondents: ["Pedro Reyes"], status: "conciliation", date_filed: "2026-02-01", next_hearing: "2026-03-12", hearing_count: 2, lupon_chairman: "Kag. Ana Santos", remarks: "Respondent offered installment plan." },
  { id: "4", case_number: "KP-2025-015", title: "Right of Way Dispute", case_type: "Property Dispute", complainants: ["Angelo Pascual"], respondents: ["Liza Villanueva"], status: "settled", date_filed: "2025-11-10", next_hearing: "", hearing_count: 4, lupon_chairman: "Kap. Ricardo Reyes", remarks: "Settlement agreement signed. Case closed." },
  { id: "5", case_number: "KP-2025-014", title: "Physical Altercation", case_type: "Physical Injury", complainants: ["Ana Garcia"], respondents: ["Pedro Reyes", "Mark Chavez"], status: "for_hearing", date_filed: "2025-10-05", next_hearing: "2026-03-08", hearing_count: 5, lupon_chairman: "Kag. Maria Lopez", remarks: "Multiple postponements. Final hearing set." },
  { id: "6", case_number: "KP-2025-013", title: "Verbal Harassment", case_type: "Oral Defamation", complainants: ["Josephine Ocampo"], respondents: ["Gloria Tolentino"], status: "dismissed", date_filed: "2025-09-20", next_hearing: "", hearing_count: 2, lupon_chairman: "Kap. Ricardo Reyes", remarks: "Complainant withdrew complaint." },
];

const caseTypes = ["All Types", "Property Dispute", "Nuisance", "Collection of Sum of Money", "Physical Injury", "Oral Defamation"];
const caseStatuses = ["All Status", "Filed", "Mediation", "Conciliation", "Arbitration", "For Hearing", "Settled", "Dismissed", "Closed"];

export default function KpCasesPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [viewCase, setViewCase] = useState<KpCase | null>(null);
  const pageSize = 10;

  const filtered = mockCases.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      if (!c.title.toLowerCase().includes(q) && !c.case_number.toLowerCase().includes(q)
        && !c.complainants.join(" ").toLowerCase().includes(q) && !c.respondents.join(" ").toLowerCase().includes(q)) return false;
    }
    if (typeFilter !== "All Types" && c.case_type !== typeFilter) return false;
    if (statusFilter !== "All Status" && c.status !== statusFilter.toLowerCase().replace(" ", "_")) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  const activeCount = mockCases.filter((c) => !["settled", "dismissed", "closed"].includes(c.status)).length;
  const settledCount = mockCases.filter((c) => c.status === "settled").length;
  const upcomingHearings = mockCases.filter((c) => c.next_hearing && new Date(c.next_hearing) >= new Date()).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Katarungang Pambarangay Cases"
        description="Manage KP case records, hearings, and settlements"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Judicial" }, { label: "KP Cases" }]}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><Download className="h-4 w-4" /> Export</button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}><Plus className="h-4 w-4" /> File New Case</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Cases" value={mockCases.length} icon={<Scale className="h-5 w-5" />} />
        <StatCard label="Active Cases" value={activeCount} icon={<AlertTriangle className="h-5 w-5" />} trend={{ value: -1, label: "vs last month" }} />
        <StatCard label="Settled" value={settledCount} icon={<FileText className="h-5 w-5" />} trend={{ value: 25, label: "settlement rate" }} />
        <StatCard label="Upcoming Hearings" value={upcomingHearings} icon={<Calendar className="h-5 w-5" />} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by case number, title, or party names..."
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
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
              {caseStatuses.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => { setTypeFilter("All Types"); setStatusFilter("All Status"); }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /> Clear</button>
          </div>
        )}
      </div>

      {/* Case Cards */}
      <div className="space-y-3">
        {paged.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground rounded-xl border border-border bg-card">No cases found.</div>
        ) : (
          paged.map((c) => (
            <div key={c.id} className="p-5 rounded-xl border border-border bg-card hover:shadow-md transition-all cursor-pointer" onClick={() => setViewCase(c)}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent-bg flex items-center justify-center shrink-0">
                    <Scale className="h-5 w-5 text-accent-text" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-foreground">{c.case_number}</span>
                      <StatusBadge status={c.status} />
                      <Badge variant="muted">{c.case_type}</Badge>
                    </div>
                    <p className="text-sm text-foreground font-medium">{c.title}</p>
                    <div className="flex items-center gap-4 mt-2 text-[12px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {c.complainants.join(", ")} <span className="text-muted-foreground/50">vs.</span> {c.respondents.join(", ")}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-[11px] text-muted-foreground">Filed {c.date_filed}</p>
                  {c.next_hearing && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1 flex items-center gap-1 justify-end">
                      <Clock className="h-3 w-3" /> Next: {c.next_hearing}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1">{c.hearing_count} hearing(s)</p>
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
      <Modal open={!!viewCase} onClose={() => setViewCase(null)} title={viewCase?.case_number || ""} description={viewCase?.title} size="lg"
        footer={<><ModalButton variant="secondary" onClick={() => setViewCase(null)}>Close</ModalButton><ModalButton variant="primary">Manage Case</ModalButton></>}>
        {viewCase && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <StatusBadge status={viewCase.status} />
              <Badge variant="muted">{viewCase.case_type}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-border">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Complainant(s)</p>
                {viewCase.complainants.map((c, i) => <p key={i} className="text-sm text-foreground font-medium">{c}</p>)}
              </div>
              <div className="p-4 rounded-lg border border-border">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Respondent(s)</p>
                {viewCase.respondents.map((r, i) => <p key={i} className="text-sm text-foreground font-medium">{r}</p>)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div><p className="text-[11px] text-muted-foreground uppercase">Date Filed</p><p className="text-sm">{viewCase.date_filed}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Next Hearing</p><p className="text-sm">{viewCase.next_hearing || "—"}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Hearings Held</p><p className="text-sm">{viewCase.hearing_count}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Lupon Chairman</p><p className="text-sm">{viewCase.lupon_chairman}</p></div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Remarks</p>
              <p className="text-sm text-foreground">{viewCase.remarks}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
