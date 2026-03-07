"use client";

import { useState } from "react";
import {
  Gavel,
  Plus,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Clock,
  AlertTriangle,
  MapPin,
  Calendar,
  Users,
  Shield,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

interface BlotterRecord {
  id: string;
  blotter_number: string;
  incident_type: string;
  narrative: string;
  complainant_name: string;
  respondent_name: string;
  incident_date: string;
  incident_time: string;
  incident_location: string;
  status: string;
  action_taken: string;
  recorded_by: string;
  recorded_at: string;
}

const mockBlotters: BlotterRecord[] = [
  { id: "1", blotter_number: "BLO-2026-001", incident_type: "Theft", narrative: "Complainant reported that their motorcycle (Honda Click 125i, red) was stolen from in front of their residence between 2:00 AM and 5:00 AM. No CCTV footage available.", complainant_name: "Maria Dela Cruz", respondent_name: "Unknown", incident_date: "2026-03-06", incident_time: "05:30 AM", incident_location: "Purok Sampaguita, Rizal St.", status: "open", action_taken: "Forwarded to PNP Station 7", recorded_by: "Tanod Chief Garcia", recorded_at: "2026-03-06 06:00" },
  { id: "2", blotter_number: "BLO-2026-002", incident_type: "Domestic Dispute", narrative: "Neighbors reported shouting and breaking of objects from the residence. Upon investigation, couple admitted to verbal argument over finances. No physical injuries.", complainant_name: "Neighbor (Anonymous)", respondent_name: "Juan Santos / Wife", incident_date: "2026-03-04", incident_time: "10:30 PM", incident_location: "Purok Rosal, Mabini St.", status: "resolved", action_taken: "Mediation conducted. Both parties signed agreement.", recorded_by: "Kag. Lopez", recorded_at: "2026-03-05 08:00" },
  { id: "3", blotter_number: "BLO-2026-003", incident_type: "Physical Altercation", narrative: "Complainant was punched in the face by respondent during a basketball game argument. Visible bruising on left cheek. Medical certificate obtained.", complainant_name: "Angelo Pascual", respondent_name: "Pedro Reyes", incident_date: "2026-02-28", incident_time: "04:00 PM", incident_location: "Barangay Basketball Court", status: "active", action_taken: "KP case filed (KP-2026-003). Respondent summoned.", recorded_by: "Secretary Santos", recorded_at: "2026-02-28 17:00" },
  { id: "4", blotter_number: "BLO-2025-009", incident_type: "Vandalism", narrative: "Barangay Hall wall spray-painted with graffiti. CCTV captured 2 male juveniles. Identified through community cooperation.", complainant_name: "Barangay Tambo", respondent_name: "2 Minor Respondents", incident_date: "2025-12-15", incident_time: "11:00 PM", incident_location: "Barangay Hall, Purok Dahlia", status: "closed", action_taken: "Parents summoned. Restitution made. Minors counseled by BCPC.", recorded_by: "Tanod Chief Garcia", recorded_at: "2025-12-16 08:00" },
];

const incidentTypes = ["All Types", "Theft", "Domestic Dispute", "Physical Altercation", "Vandalism", "Trespassing", "Disturbance"];
const statusOptions = ["All Status", "Open", "Active", "Resolved", "Closed"];

export default function BlotterPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [viewBlotter, setViewBlotter] = useState<BlotterRecord | null>(null);
  const pageSize = 10;

  const filtered = mockBlotters.filter((b) => {
    if (search) {
      const q = search.toLowerCase();
      if (!b.blotter_number.toLowerCase().includes(q) && !b.complainant_name.toLowerCase().includes(q)
        && !b.respondent_name.toLowerCase().includes(q) && !b.incident_type.toLowerCase().includes(q)) return false;
    }
    if (typeFilter !== "All Types" && b.incident_type !== typeFilter) return false;
    if (statusFilter !== "All Status" && b.status !== statusFilter.toLowerCase()) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  const activeCount = mockBlotters.filter((b) => b.status === "open" || b.status === "active").length;
  const resolvedCount = mockBlotters.filter((b) => b.status === "resolved" || b.status === "closed").length;

  const statusColor = (status: string): string => {
    switch (status) { case "open": return "#ef4444"; case "active": return "#f59e0b"; case "resolved": return "#22c55e"; default: return "#64748b"; }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blotter Records"
        description="Record and track barangay incident reports"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Judicial" }, { label: "Blotter Records" }]}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><Download className="h-4 w-4" /> Export</button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}><Plus className="h-4 w-4" /> Record Blotter</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Records" value={mockBlotters.length} icon={<Gavel className="h-5 w-5" />} />
        <StatCard label="Active / Open" value={activeCount} icon={<AlertTriangle className="h-5 w-5" />} trend={{ value: -1, label: "this month" }} />
        <StatCard label="Resolved / Closed" value={resolvedCount} icon={<Shield className="h-5 w-5" />} />
        <StatCard label="This Month" value={mockBlotters.filter((b) => b.incident_date >= "2026-03-01").length} icon={<Calendar className="h-5 w-5" />} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by blotter number, party names, or type..."
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
              {incidentTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
              {statusOptions.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => { setTypeFilter("All Types"); setStatusFilter("All Status"); }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /> Clear</button>
          </div>
        )}
      </div>

      {/* Blotter Cards */}
      <div className="space-y-3">
        {paged.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground rounded-xl border border-border bg-card">No blotter records found.</div>
        ) : (
          paged.map((b) => (
            <div key={b.id} className="p-5 rounded-xl border bg-card hover:shadow-md transition-all cursor-pointer"
              style={{ borderLeftWidth: "4px", borderLeftColor: statusColor(b.status) }}
              onClick={() => setViewBlotter(b)}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${statusColor(b.status)}15` }}>
                    <Gavel className="h-5 w-5" style={{ color: statusColor(b.status) }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-foreground">{b.blotter_number}</span>
                      <StatusBadge status={b.status} />
                      <Badge variant="muted">{b.incident_type}</Badge>
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{b.narrative}</p>
                    <div className="flex items-center gap-4 mt-2 text-[12px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {b.complainant_name} vs. {b.respondent_name}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {b.incident_location}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end"><Calendar className="h-3 w-3" /> {b.incident_date}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5"><Clock className="h-3 w-3 inline mr-1" />{b.incident_time}</p>
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

      {/* View Blotter Modal */}
      <Modal open={!!viewBlotter} onClose={() => setViewBlotter(null)} title={viewBlotter?.blotter_number || ""} description={`${viewBlotter?.incident_type} — ${viewBlotter?.incident_date}`} size="lg"
        footer={<><ModalButton variant="secondary" onClick={() => setViewBlotter(null)}>Close</ModalButton><ModalButton variant="primary">Update Record</ModalButton></>}>
        {viewBlotter && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <StatusBadge status={viewBlotter.status} />
              <Badge variant="muted">{viewBlotter.incident_type}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-border">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Complainant</p>
                <p className="text-sm text-foreground font-medium">{viewBlotter.complainant_name}</p>
              </div>
              <div className="p-4 rounded-lg border border-border">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Respondent</p>
                <p className="text-sm text-foreground font-medium">{viewBlotter.respondent_name}</p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Incident Narrative</p>
              <p className="text-sm text-foreground leading-relaxed">{viewBlotter.narrative}</p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div><p className="text-[11px] text-muted-foreground uppercase">Date & Time</p><p className="text-sm">{viewBlotter.incident_date} at {viewBlotter.incident_time}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Location</p><p className="text-sm">{viewBlotter.incident_location}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Recorded By</p><p className="text-sm">{viewBlotter.recorded_by}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Recorded At</p><p className="text-sm">{viewBlotter.recorded_at}</p></div>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
              <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">Action Taken</p>
              <p className="text-sm text-emerald-800 dark:text-emerald-300">{viewBlotter.action_taken}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
