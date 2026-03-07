"use client";

import { useState } from "react";
import {
  Users,
  UserPlus,
  Home,
  MapPin,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Flag,
  AlertTriangle,
  Phone,
  Mail,
  Calendar,
  User,
  Heart,
  FileText,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { SortableHeader } from "@/components/ui/sortable-header";
import { cn } from "@/lib/utils";

// ── Types ──
interface Resident {
  id: string;
  resident_number: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  extension_name: string;
  sex: string;
  date_of_birth: string;
  age: number;
  civil_status: string;
  purok: string;
  street: string;
  mobile_number: string;
  email: string;
  status: string;
  is_voter: boolean;
  is_head_of_household: boolean;
  resident_type: string;
  occupation: string;
  profile_completion_pct: number;
  flags: { type: "grey" | "red"; label: string }[];
  created_at: string;
}

// ── Mock Data ──
const mockResidents: Resident[] = [
  { id: "1", resident_number: "RES-2026-0001", first_name: "Maria", middle_name: "Santos", last_name: "Dela Cruz", extension_name: "", sex: "female", date_of_birth: "1985-03-15", age: 41, civil_status: "married", purok: "Sampaguita", street: "Rizal St.", mobile_number: "09171234567", email: "maria@email.com", status: "active", is_voter: true, is_head_of_household: true, resident_type: "permanent", occupation: "Teacher", profile_completion_pct: 92, flags: [], created_at: "2026-01-15" },
  { id: "2", resident_number: "RES-2026-0002", first_name: "Juan", middle_name: "Reyes", last_name: "Santos", extension_name: "Jr.", sex: "male", date_of_birth: "1990-07-22", age: 35, civil_status: "single", purok: "Rosal", street: "Mabini St.", mobile_number: "09281234567", email: "", status: "active", is_voter: true, is_head_of_household: false, resident_type: "permanent", occupation: "Tricycle Driver", profile_completion_pct: 78, flags: [{ type: "grey", label: "Also registered in Brgy. Amucao" }], created_at: "2026-01-20" },
  { id: "3", resident_number: "RES-2026-0003", first_name: "Ana", middle_name: "Lopez", last_name: "Garcia", extension_name: "", sex: "female", date_of_birth: "1972-11-08", age: 53, civil_status: "widowed", purok: "Ilang-Ilang", street: "Bonifacio Ave.", mobile_number: "09351234567", email: "ana.garcia@email.com", status: "active", is_voter: true, is_head_of_household: true, resident_type: "permanent", occupation: "Sari-sari Store Owner", profile_completion_pct: 85, flags: [], created_at: "2026-02-01" },
  { id: "4", resident_number: "RES-2026-0004", first_name: "Pedro", middle_name: "Aquino", last_name: "Reyes", extension_name: "", sex: "male", date_of_birth: "1998-01-30", age: 28, civil_status: "single", purok: "Sampaguita", street: "Luna St.", mobile_number: "09451234567", email: "", status: "active", is_voter: false, is_head_of_household: false, resident_type: "permanent", occupation: "Construction Worker", profile_completion_pct: 65, flags: [{ type: "red", label: "Active blotter case (BLO-2026-003)" }], created_at: "2026-02-05" },
  { id: "5", resident_number: "RES-2026-0005", first_name: "Rosa", middle_name: "Bautista", last_name: "De Los Santos", extension_name: "", sex: "female", date_of_birth: "1965-05-12", age: 60, civil_status: "married", purok: "Dahlia", street: "Del Pilar St.", mobile_number: "09161234567", email: "", status: "active", is_voter: true, is_head_of_household: true, resident_type: "permanent", occupation: "Barangay Health Worker", profile_completion_pct: 98, flags: [], created_at: "2026-02-10" },
  { id: "6", resident_number: "RES-2026-0006", first_name: "Roberto", middle_name: "Cruz", last_name: "Manalo", extension_name: "", sex: "male", date_of_birth: "1988-09-03", age: 37, civil_status: "married", purok: "Rosal", street: "Aguinaldo St.", mobile_number: "09271234567", email: "roberto.m@email.com", status: "active", is_voter: true, is_head_of_household: true, resident_type: "permanent", occupation: "Fisherman", profile_completion_pct: 80, flags: [], created_at: "2026-02-14" },
  { id: "7", resident_number: "RES-2026-0007", first_name: "Liza", middle_name: "Tan", last_name: "Villanueva", extension_name: "", sex: "female", date_of_birth: "2001-12-25", age: 24, civil_status: "single", purok: "Jasmine", street: "Rizal St.", mobile_number: "09381234567", email: "liza.v@email.com", status: "active", is_voter: true, is_head_of_household: false, resident_type: "permanent", occupation: "Nurse", profile_completion_pct: 88, flags: [], created_at: "2026-02-18" },
  { id: "8", resident_number: "RES-2026-0008", first_name: "Carlos", middle_name: "Mendoza", last_name: "Rivera", extension_name: "III", sex: "male", date_of_birth: "1955-06-18", age: 70, civil_status: "married", purok: "Sunflower", street: "Quezon Blvd.", mobile_number: "09191234567", email: "", status: "active", is_voter: true, is_head_of_household: true, resident_type: "permanent", occupation: "Retired", profile_completion_pct: 72, flags: [], created_at: "2026-03-01" },
  { id: "9", resident_number: "RES-2026-0009", first_name: "Josephine", middle_name: "Ramos", last_name: "Ocampo", extension_name: "", sex: "female", date_of_birth: "1995-04-07", age: 30, civil_status: "married", purok: "Orchid", street: "Mabini St.", mobile_number: "09421234567", email: "josie.o@email.com", status: "inactive", is_voter: false, is_head_of_household: false, resident_type: "transient", occupation: "Vendor", profile_completion_pct: 55, flags: [], created_at: "2026-03-03" },
  { id: "10", resident_number: "RES-2026-0010", first_name: "Mark", middle_name: "Lim", last_name: "Chavez", extension_name: "", sex: "male", date_of_birth: "2000-08-14", age: 25, civil_status: "single", purok: "Sampaguita", street: "Luna St.", mobile_number: "09331234567", email: "mark.c@email.com", status: "active", is_voter: true, is_head_of_household: false, resident_type: "permanent", occupation: "IT Freelancer", profile_completion_pct: 70, flags: [], created_at: "2026-03-05" },
  { id: "11", resident_number: "RES-2026-0011", first_name: "Gloria", middle_name: "Pangilinan", last_name: "Tolentino", extension_name: "", sex: "female", date_of_birth: "1978-02-28", age: 48, civil_status: "separated", purok: "Dahlia", street: "Bonifacio Ave.", mobile_number: "09251234567", email: "", status: "deceased", is_voter: false, is_head_of_household: false, resident_type: "permanent", occupation: "Laundrywoman", profile_completion_pct: 90, flags: [], created_at: "2025-11-15" },
  { id: "12", resident_number: "RES-2026-0012", first_name: "Angelo", middle_name: "Dizon", last_name: "Pascual", extension_name: "", sex: "male", date_of_birth: "1993-10-19", age: 32, civil_status: "married", purok: "Ilang-Ilang", street: "Del Pilar St.", mobile_number: "09471234567", email: "angelo.p@email.com", status: "active", is_voter: true, is_head_of_household: true, resident_type: "permanent", occupation: "Electrician", profile_completion_pct: 82, flags: [], created_at: "2026-03-06" },
];

const puroks = ["All Puroks", "Sampaguita", "Rosal", "Ilang-Ilang", "Dahlia", "Sunflower", "Orchid", "Jasmine"];
const statuses = ["All Status", "Active", "Inactive", "Deceased", "Transferred"];
const sexOptions = ["All", "Male", "Female"];

export default function ResidentsPage() {
  const [search, setSearch] = useState("");
  const [purokFilter, setPurokFilter] = useState("All Puroks");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [sexFilter, setSexFilter] = useState("All");
  const [voterFilter, setVoterFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [viewResident, setViewResident] = useState<Resident | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const pageSize = 10;

  // Filter logic
  const filtered = mockResidents.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      const fullName = `${r.last_name} ${r.first_name} ${r.middle_name}`.toLowerCase();
      if (!fullName.includes(q) && !r.resident_number.toLowerCase().includes(q) && !r.mobile_number.includes(q)) return false;
    }
    if (purokFilter !== "All Puroks" && r.purok !== purokFilter) return false;
    if (statusFilter !== "All Status" && r.status !== statusFilter.toLowerCase()) return false;
    if (sexFilter !== "All" && r.sex !== sexFilter.toLowerCase()) return false;
    if (voterFilter === "voter" && !r.is_voter) return false;
    if (voterFilter === "non-voter" && r.is_voter) return false;
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey as keyof Resident];
    const bVal = b[sortKey as keyof Resident];
    if (aVal === bVal) return 0;
    const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
    return sortDir === "asc" ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paged = sorted.slice(start, start + pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const householdCount = mockResidents.filter((r) => r.is_head_of_household).length;
  const voterCount = mockResidents.filter((r) => r.is_voter).length;
  const maleCount = mockResidents.filter((r) => r.sex === "male").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Residents"
        description="Manage barangay resident records and profiles"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Records" },
          { label: "Residents" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors">
              <Upload className="h-4 w-4" /> Import
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors">
              <Download className="h-4 w-4" /> Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}>
              <UserPlus className="h-4 w-4" /> New Resident
            </button>
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Residents" value={mockResidents.length} icon={<Users className="h-5 w-5" />} trend={{ value: 8, label: "vs last month" }} />
        <StatCard label="Households" value={householdCount} icon={<Home className="h-5 w-5" />} trend={{ value: 3, label: "vs last month" }} />
        <StatCard label="Registered Voters" value={voterCount} icon={<FileText className="h-5 w-5" />} trend={{ value: 0, label: "no change" }} />
        <StatCard label="Male / Female" value={`${maleCount} / ${mockResidents.length - maleCount}`} icon={<Heart className="h-5 w-5" />} />
      </div>

      {/* Toolbar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, resident number, or mobile..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors",
              showFilters ? "border-accent-primary bg-accent-bg text-accent-text" : "border-border hover:bg-muted"
            )}
          >
            <Filter className="h-4 w-4" /> Filters
            {(purokFilter !== "All Puroks" || statusFilter !== "All Status" || sexFilter !== "All" || voterFilter !== "all") && (
              <span className="w-2 h-2 rounded-full bg-accent-primary" />
            )}
          </button>
        </div>

        {/* Filter Row */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg border border-border bg-card">
            <select
              value={purokFilter}
              onChange={(e) => { setPurokFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring"
            >
              {puroks.map((p) => <option key={p}>{p}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring"
            >
              {statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select
              value={sexFilter}
              onChange={(e) => { setSexFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring"
            >
              {sexOptions.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select
              value={voterFilter}
              onChange={(e) => { setVoterFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring"
            >
              <option value="all">All Voters</option>
              <option value="voter">Registered Voter</option>
              <option value="non-voter">Non-Voter</option>
            </select>
            <button
              onClick={() => { setPurokFilter("All Puroks"); setStatusFilter("All Status"); setSexFilter("All"); setVoterFilter("all"); }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label="Resident" field="last_name" />
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label="Purok" field="purok" />
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contact</th>
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label="Age" field="age" />
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sex</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Voter</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Profile</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground w-12" />
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    No residents found matching your criteria.
                  </td>
                </tr>
              ) : (
                paged.map((r) => {
                  const initials = `${r.first_name[0]}${r.last_name[0]}`;
                  const fullName = `${r.last_name}, ${r.first_name} ${r.middle_name ? r.middle_name[0] + "." : ""} ${r.extension_name}`.trim();
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setViewResident(r)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-foreground truncate">{fullName}</p>
                              {r.flags.map((f, i) => (
                                <Flag key={i} className={cn("h-3 w-3 shrink-0", f.type === "red" ? "text-red-500" : "text-gray-400")} />
                              ))}
                              {r.is_head_of_household && <span title="Head of Household"><Home className="h-3 w-3 text-amber-500 shrink-0" /></span>}
                            </div>
                            <p className="text-[11px] text-muted-foreground">{r.resident_number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="text-sm text-foreground">{r.purok}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{r.street}</p>
                      </td>
                      <td className="px-4 py-3">
                        {r.mobile_number && (
                          <div className="flex items-center gap-1.5 text-sm text-foreground">
                            <Phone className="h-3 w-3 text-muted-foreground" /> {r.mobile_number}
                          </div>
                        )}
                        {r.email && (
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                            <Mail className="h-3 w-3" /> {r.email}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{r.age}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "text-sm capitalize",
                          r.sex === "male" ? "text-blue-600 dark:text-blue-400" : "text-pink-600 dark:text-pink-400"
                        )}>
                          {r.sex}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3">
                        {r.is_voter ? (
                          <Badge variant="success" dot>Voter</Badge>
                        ) : (
                          <Badge variant="muted">Non-voter</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${r.profile_completion_pct}%`,
                                background: r.profile_completion_pct >= 80 ? "#22c55e" : r.profile_completion_pct >= 50 ? "#f59e0b" : "#ef4444",
                              }}
                            />
                          </div>
                          <span className="text-[11px] text-muted-foreground">{r.profile_completion_pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button className="p-1.5 rounded hover:bg-muted transition-colors">
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {start + 1}–{Math.min(start + pageSize, sorted.length)} of {sorted.length} residents
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={safePage <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronsLeft className="h-4 w-4" /></button>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              <span className="px-3 py-1 text-sm">{safePage} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
              <button onClick={() => setPage(totalPages)} disabled={safePage >= totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronsRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* View Resident Modal */}
      <Modal
        open={!!viewResident}
        onClose={() => setViewResident(null)}
        title={viewResident ? `${viewResident.last_name}, ${viewResident.first_name} ${viewResident.middle_name ? viewResident.middle_name[0] + "." : ""} ${viewResident.extension_name}`.trim() : ""}
        description={viewResident?.resident_number}
        size="lg"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setViewResident(null)}>Close</ModalButton>
            <ModalButton variant="primary">Edit Profile</ModalButton>
          </>
        }
      >
        {viewResident && (
          <div className="space-y-6">
            {/* Flags */}
            {viewResident.flags.length > 0 && (
              <div className="space-y-2">
                {viewResident.flags.map((f, i) => (
                  <div key={i} className={cn(
                    "flex items-center gap-2 p-3 rounded-lg text-sm",
                    f.type === "red" ? "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900" : "bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-800"
                  )}>
                    {f.type === "red" ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <Flag className="h-4 w-4 shrink-0" />}
                    {f.label}
                  </div>
                ))}
              </div>
            )}

            {/* Profile Completion */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Profile Completion</span>
                <span className="text-sm font-bold" style={{
                  color: viewResident.profile_completion_pct >= 80 ? "#22c55e" : viewResident.profile_completion_pct >= 50 ? "#f59e0b" : "#ef4444"
                }}>{viewResident.profile_completion_pct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${viewResident.profile_completion_pct}%`,
                    background: viewResident.profile_completion_pct >= 80 ? "#22c55e" : viewResident.profile_completion_pct >= 50 ? "#f59e0b" : "#ef4444",
                  }}
                />
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <InfoItem icon={<User className="h-4 w-4" />} label="Sex" value={viewResident.sex} />
              <InfoItem icon={<Calendar className="h-4 w-4" />} label="Date of Birth" value={`${viewResident.date_of_birth} (${viewResident.age} yrs)`} />
              <InfoItem icon={<Heart className="h-4 w-4" />} label="Civil Status" value={viewResident.civil_status} />
              <InfoItem icon={<MapPin className="h-4 w-4" />} label="Address" value={`${viewResident.street}, ${viewResident.purok}`} />
              <InfoItem icon={<Phone className="h-4 w-4" />} label="Mobile" value={viewResident.mobile_number || "—"} />
              <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={viewResident.email || "—"} />
              <InfoItem icon={<FileText className="h-4 w-4" />} label="Occupation" value={viewResident.occupation || "—"} />
              <InfoItem icon={<Users className="h-4 w-4" />} label="Resident Type" value={viewResident.resident_type} />
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <StatusBadge status={viewResident.status} />
              {viewResident.is_voter && <Badge variant="success" dot>Registered Voter</Badge>}
              {viewResident.is_head_of_household && <Badge variant="warning" dot>Head of Household</Badge>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm text-foreground capitalize">{value}</p>
      </div>
    </div>
  );
}
