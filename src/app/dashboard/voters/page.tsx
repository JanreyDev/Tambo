"use client";

import { useState } from "react";
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Upload,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

interface VoterRecord {
  id: string;
  resident_number: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  sex: string;
  birth_date: string;
  precinct_number: string;
  voter_id_number: string;
  barangay: string;
  purok: string;
  is_sk_voter: boolean;
  is_registered: boolean;
  registration_date: string;
  last_voted: string;
}

const mockVoters: VoterRecord[] = [
  { id: "1", resident_number: "RES-2026-0001", first_name: "Maria", middle_name: "Santos", last_name: "Dela Cruz", suffix: "", sex: "Female", birth_date: "1985-05-12", precinct_number: "0045A", voter_id_number: "VRN-2022-78901", barangay: "Tambo", purok: "Sampaguita", is_sk_voter: false, is_registered: true, registration_date: "2022-01-15", last_voted: "2025-10-28" },
  { id: "2", resident_number: "RES-2026-0002", first_name: "Juan", middle_name: "Pascual", last_name: "Santos", suffix: "Jr.", sex: "Male", birth_date: "1990-08-22", precinct_number: "0045A", voter_id_number: "VRN-2022-78902", barangay: "Tambo", purok: "Rosal", is_sk_voter: false, is_registered: true, registration_date: "2022-01-15", last_voted: "2025-10-28" },
  { id: "3", resident_number: "RES-2026-0003", first_name: "Angelo", middle_name: "Reyes", last_name: "Pascual", suffix: "", sex: "Male", birth_date: "2003-11-15", precinct_number: "0045B", voter_id_number: "VRN-2025-11001", barangay: "Tambo", purok: "Dahlia", is_sk_voter: true, is_registered: true, registration_date: "2025-09-01", last_voted: "" },
  { id: "4", resident_number: "RES-2026-0005", first_name: "Ana", middle_name: "Lopez", last_name: "Garcia", suffix: "", sex: "Female", birth_date: "1978-03-08", precinct_number: "0046A", voter_id_number: "VRN-2019-55001", barangay: "Tambo", purok: "Sampaguita", is_sk_voter: false, is_registered: true, registration_date: "2019-06-20", last_voted: "2025-10-28" },
  { id: "5", resident_number: "RES-2026-0008", first_name: "Pedro", middle_name: "Manalo", last_name: "Reyes", suffix: "", sex: "Male", birth_date: "1995-07-30", precinct_number: "0046A", voter_id_number: "", barangay: "Tambo", purok: "Ilang-Ilang", is_sk_voter: false, is_registered: false, registration_date: "", last_voted: "" },
  { id: "6", resident_number: "RES-2026-0010", first_name: "Rosa", middle_name: "Villanueva", last_name: "Mendoza", suffix: "", sex: "Female", birth_date: "2005-01-20", precinct_number: "0045B", voter_id_number: "VRN-2025-11010", barangay: "Tambo", purok: "Rosal", is_sk_voter: true, is_registered: true, registration_date: "2025-09-01", last_voted: "" },
  { id: "7", resident_number: "RES-2026-0012", first_name: "Roberto", middle_name: "Bautista", last_name: "Cruz", suffix: "Sr.", sex: "Male", birth_date: "1960-12-01", precinct_number: "0047A", voter_id_number: "VRN-2016-33001", barangay: "Tambo", purok: "Dahlia", is_sk_voter: false, is_registered: true, registration_date: "2016-03-15", last_voted: "2025-10-28" },
  { id: "8", resident_number: "RES-2026-0015", first_name: "Liza", middle_name: "Ramos", last_name: "De Los Santos", suffix: "", sex: "Female", birth_date: "2000-06-18", precinct_number: "0046B", voter_id_number: "VRN-2022-78950", barangay: "Tambo", purok: "Sampaguita", is_sk_voter: false, is_registered: true, registration_date: "2022-02-10", last_voted: "2025-10-28" },
];

const precincts = ["All Precincts", "0045A", "0045B", "0046A", "0046B", "0047A"];
const registrationStatuses = ["All Status", "Registered", "Not Registered"];

export default function VotersPage() {
  const [search, setSearch] = useState("");
  const [precinctFilter, setPrecinctFilter] = useState("All Precincts");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [viewVoter, setViewVoter] = useState<VoterRecord | null>(null);
  const pageSize = 10;

  const filtered = mockVoters.filter((v) => {
    if (search) {
      const q = search.toLowerCase();
      const fullName = `${v.first_name} ${v.middle_name} ${v.last_name}`.toLowerCase();
      if (!fullName.includes(q) && !v.resident_number.toLowerCase().includes(q)
        && !v.voter_id_number.toLowerCase().includes(q) && !v.precinct_number.toLowerCase().includes(q)) return false;
    }
    if (precinctFilter !== "All Precincts" && v.precinct_number !== precinctFilter) return false;
    if (statusFilter === "Registered" && !v.is_registered) return false;
    if (statusFilter === "Not Registered" && v.is_registered) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  const registeredCount = mockVoters.filter((v) => v.is_registered).length;
  const skVoterCount = mockVoters.filter((v) => v.is_sk_voter).length;
  const votedLastElection = mockVoters.filter((v) => v.last_voted === "2025-10-28").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Voters"
        description="Manage voter registration and precinct records"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Records" }, { label: "Voters" }]}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><Upload className="h-4 w-4" /> Import BIMS</button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><Download className="h-4 w-4" /> Export</button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}><Plus className="h-4 w-4" /> Add Voter</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Voters" value={mockVoters.length} icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard label="Registered" value={registeredCount} icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatCard label="SK Voters" value={skVoterCount} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Voted (Oct 2025)" value={votedLastElection} icon={<Calendar className="h-5 w-5" />} trend={{ value: Math.round((votedLastElection / registeredCount) * 100), label: "turnout" }} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, voter ID, or precinct..."
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
            <select value={precinctFilter} onChange={(e) => { setPrecinctFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
              {precincts.map((p) => <option key={p}>{p}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
              {registrationStatuses.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => { setPrecinctFilter("All Precincts"); setStatusFilter("All Status"); }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /> Clear</button>
          </div>
        )}
      </div>

      {/* Voters Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Voter</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Precinct</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Purok</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Last Voted</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">SK</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No voter records found.</td></tr>
              ) : (
                paged.map((v) => {
                  const fullName = `${v.last_name}, ${v.first_name}${v.middle_name ? ` ${v.middle_name.charAt(0)}.` : ""}${v.suffix ? ` ${v.suffix}` : ""}`;
                  return (
                    <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setViewVoter(v)}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{fullName}</p>
                        <p className="text-[11px] text-muted-foreground">{v.voter_id_number || "No Voter ID"}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{v.precinct_number}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{v.purok}</td>
                      <td className="px-4 py-3">
                        {v.is_registered
                          ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Registered</span>
                          : <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500"><XCircle className="h-3.5 w-3.5" /> Not Registered</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{v.last_voted || "—"}</td>
                      <td className="px-4 py-3">
                        {v.is_sk_voter && <Badge variant="info">SK</Badge>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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

      {/* View Voter Modal */}
      <Modal open={!!viewVoter} onClose={() => setViewVoter(null)} title={viewVoter ? `${viewVoter.first_name} ${viewVoter.last_name}` : ""} description="Voter Details" size="lg"
        footer={<><ModalButton variant="secondary" onClick={() => setViewVoter(null)}>Close</ModalButton><ModalButton variant="primary">Edit Record</ModalButton></>}>
        {viewVoter && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              {viewVoter.is_registered
                ? <Badge variant="success">Registered Voter</Badge>
                : <Badge variant="danger">Not Registered</Badge>}
              {viewVoter.is_sk_voter && <Badge variant="info">SK Voter</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div><p className="text-[11px] text-muted-foreground uppercase">Resident Number</p><p className="text-sm">{viewVoter.resident_number}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Voter ID Number</p><p className="text-sm">{viewVoter.voter_id_number || "—"}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Full Name</p><p className="text-sm">{viewVoter.first_name} {viewVoter.middle_name} {viewVoter.last_name}{viewVoter.suffix ? ` ${viewVoter.suffix}` : ""}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Sex</p><p className="text-sm">{viewVoter.sex}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Birth Date</p><p className="text-sm">{viewVoter.birth_date}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Precinct Number</p><p className="text-sm">{viewVoter.precinct_number}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Purok</p><p className="text-sm">{viewVoter.purok}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Registration Date</p><p className="text-sm">{viewVoter.registration_date || "—"}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Last Election Voted</p><p className="text-sm">{viewVoter.last_voted || "Never voted"}</p></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
