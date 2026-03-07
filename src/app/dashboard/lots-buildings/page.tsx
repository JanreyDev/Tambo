"use client";

import { useState } from "react";
import {
  MapPin,
  Plus,
  Search,
  Filter,
  Download,
  Phone,
  Mail,
  User,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Home,
  Building,
  LandPlot,
  Ruler,
  Hash,
  FileText,
  Compass,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { SortableHeader } from "@/components/ui/sortable-header";
import { cn } from "@/lib/utils";

interface LotBuilding {
  id: string;
  record_number: string;
  record_type: "lot" | "building" | "both";
  classification: string;
  purok: string;
  street: string;
  address: string;
  lot_number: string;
  block_number: string;
  tct_oct_number: string;
  tax_declaration_number: string;
  land_area_sqm: number;
  assessed_value: number;
  year_constructed: number | null;
  owner_name: string;
  owner_contact_number: string;
  owner_email: string;
  owner_address: string;
  landmark_north: string;
  landmark_south: string;
  landmark_east: string;
  landmark_west: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  created_at: string;
}

const mockRecords: LotBuilding[] = [
  { id: "1", record_number: "LB-2026-0001", record_type: "building", classification: "residential", purok: "Sampaguita", street: "Rizal St.", address: "123 Rizal St.", lot_number: "L-001", block_number: "B-05", tct_oct_number: "TCT-123456", tax_declaration_number: "TD-2024-001", land_area_sqm: 150, assessed_value: 500000, year_constructed: 2010, owner_name: "Maria Dela Cruz", owner_contact_number: "09171234567", owner_email: "maria@email.com", owner_address: "123 Rizal St., Purok Sampaguita", landmark_north: "Santos Residence", landmark_south: "Main Road", landmark_east: "Vacant Lot", landmark_west: "Garcia Store", latitude: 14.4793, longitude: 121.0198, status: "active", created_at: "2026-01-10" },
  { id: "2", record_number: "LB-2026-0002", record_type: "building", classification: "commercial", purok: "Rosal", street: "Mabini St.", address: "45 Mabini St.", lot_number: "L-012", block_number: "B-02", tct_oct_number: "TCT-789012", tax_declaration_number: "TD-2024-002", land_area_sqm: 200, assessed_value: 1200000, year_constructed: 2018, owner_name: "Juan Santos", owner_contact_number: "09281234567", owner_email: "juan@email.com", owner_address: "45 Mabini St., Purok Rosal", landmark_north: "Clinic", landmark_south: "Barangay Road", landmark_east: "Reyes Lot", landmark_west: "Creek", latitude: 14.4801, longitude: 121.0205, status: "active", created_at: "2026-01-15" },
  { id: "3", record_number: "LB-2026-0003", record_type: "lot", classification: "agricultural", purok: "Ilang-Ilang", street: "Bonifacio Ave.", address: "Lot 45, Bonifacio Ave.", lot_number: "L-045", block_number: "", tct_oct_number: "", tax_declaration_number: "TD-2023-045", land_area_sqm: 5000, assessed_value: 300000, year_constructed: null, owner_name: "Rosa De Los Santos", owner_contact_number: "09161234567", owner_email: "", owner_address: "Del Pilar St., Purok Dahlia", landmark_north: "Rice Paddies", landmark_south: "River", landmark_east: "Farm Road", landmark_west: "Coconut Grove", latitude: 14.4780, longitude: 121.0180, status: "active", created_at: "2026-02-01" },
  { id: "4", record_number: "LB-2026-0004", record_type: "both", classification: "institutional", purok: "Dahlia", street: "Del Pilar St.", address: "1 Del Pilar St.", lot_number: "L-001", block_number: "B-01", tct_oct_number: "TCT-GOV-001", tax_declaration_number: "TD-GOV-001", land_area_sqm: 800, assessed_value: 5000000, year_constructed: 1995, owner_name: "Barangay Tambo (Government)", owner_contact_number: "09451234567", owner_email: "tambo@kapitan.ph", owner_address: "Barangay Hall, Del Pilar St.", landmark_north: "Health Center", landmark_south: "Main Road", landmark_east: "Covered Court", landmark_west: "Day Care Center", latitude: 14.4795, longitude: 121.0200, status: "active", created_at: "2025-01-01" },
  { id: "5", record_number: "LB-2026-0005", record_type: "building", classification: "residential", purok: "Jasmine", street: "Luna St.", address: "78 Luna St.", lot_number: "L-078", block_number: "B-10", tct_oct_number: "TCT-345678", tax_declaration_number: "TD-2024-078", land_area_sqm: 120, assessed_value: 350000, year_constructed: 2020, owner_name: "Liza Villanueva", owner_contact_number: "09381234567", owner_email: "liza@email.com", owner_address: "78 Luna St., Purok Jasmine", landmark_north: "School", landmark_south: "Store", landmark_east: "Parking", landmark_west: "Chapel", latitude: 14.4810, longitude: 121.0190, status: "active", created_at: "2026-02-10" },
];

const recordTypes = ["All Types", "Lot", "Building", "Both"];
const classifications = ["All", "Residential", "Commercial", "Agricultural", "Institutional", "Industrial"];

export default function LotsBuildingsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [classFilter, setClassFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [viewRecord, setViewRecord] = useState<LotBuilding | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const pageSize = 10;

  const filtered = mockRecords.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      if (!r.owner_name.toLowerCase().includes(q) && !r.record_number.toLowerCase().includes(q) && !r.address.toLowerCase().includes(q)) return false;
    }
    if (typeFilter !== "All Types" && r.record_type !== typeFilter.toLowerCase()) return false;
    if (classFilter !== "All" && r.classification !== classFilter.toLowerCase()) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey as keyof LotBuilding];
    const bVal = b[sortKey as keyof LotBuilding];
    const cmp = String(aVal ?? "").localeCompare(String(bVal ?? ""), undefined, { numeric: true });
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

  const lotCount = mockRecords.filter((r) => r.record_type === "lot" || r.record_type === "both").length;
  const buildingCount = mockRecords.filter((r) => r.record_type === "building" || r.record_type === "both").length;
  const totalAssessed = mockRecords.reduce((sum, r) => sum + r.assessed_value, 0);

  const typeIcon = (type: string) => {
    switch (type) { case "lot": return <LandPlot className="h-4 w-4" />; case "building": return <Building className="h-4 w-4" />; default: return <Home className="h-4 w-4" />; }
  };

  const typeBadge = (type: string) => {
    switch (type) {
      case "lot": return <Badge variant="success">Lot</Badge>;
      case "building": return <Badge variant="info">Building</Badge>;
      default: return <Badge variant="accent">Lot + Building</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lots & Buildings"
        description="Manage barangay lot and building records"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Records" }, { label: "Lots & Buildings" }]}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><Download className="h-4 w-4" /> Export</button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}><Plus className="h-4 w-4" /> New Record</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Records" value={mockRecords.length} icon={<MapPin className="h-5 w-5" />} />
        <StatCard label="Lots Registered" value={lotCount} icon={<LandPlot className="h-5 w-5" />} />
        <StatCard label="Buildings Registered" value={buildingCount} icon={<Building className="h-5 w-5" />} />
        <StatCard label="Total Assessed Value" value={`₱${(totalAssessed / 1000000).toFixed(1)}M`} icon={<FileText className="h-5 w-5" />} />
      </div>

      {/* Toolbar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by owner, record number, or address..."
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
              {recordTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
              {classifications.map((c) => <option key={c}>{c}</option>)}
            </select>
            <button onClick={() => { setTypeFilter("All Types"); setClassFilter("All"); }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /> Clear</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label="Record" field="record_number" />
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Classification</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Location</th>
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label="Owner" field="owner_name" />
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label="Area (sqm)" field="land_area_sqm" />
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Assessed Value</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No records found.</td></tr>
              ) : (
                paged.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setViewRecord(r)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-accent-bg flex items-center justify-center text-accent-text shrink-0">
                          {typeIcon(r.record_type)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{r.record_number}</p>
                          <p className="text-[11px] text-muted-foreground">{r.lot_number}{r.block_number ? ` / ${r.block_number}` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{typeBadge(r.record_type)}</td>
                    <td className="px-4 py-3"><span className="text-sm capitalize">{r.classification}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-muted-foreground" /><span className="text-sm">{r.purok}</span></div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{r.address}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground">{r.owner_name}</p>
                      <p className="text-[11px] text-muted-foreground">{r.owner_contact_number}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{r.land_area_sqm.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-foreground">₱{r.assessed_value.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right" onClick={(ev) => ev.stopPropagation()}>
                      <button className="p-1.5 rounded hover:bg-muted"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">Showing {start + 1}–{Math.min(start + pageSize, sorted.length)} of {sorted.length}</p>
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

      {/* View Modal */}
      <Modal open={!!viewRecord} onClose={() => setViewRecord(null)} title={viewRecord?.record_number || ""} description={viewRecord ? `${viewRecord.owner_name} — ${viewRecord.classification}` : ""} size="lg"
        footer={<><ModalButton variant="secondary" onClick={() => setViewRecord(null)}>Close</ModalButton><ModalButton variant="primary">Edit</ModalButton></>}>
        {viewRecord && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              {typeBadge(viewRecord.record_type)}
              <Badge variant="default" className="capitalize">{viewRecord.classification}</Badge>
              <StatusBadge status={viewRecord.status} />
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <InfoItem icon={<Hash className="h-4 w-4" />} label="Lot Number" value={viewRecord.lot_number || "—"} />
              <InfoItem icon={<Hash className="h-4 w-4" />} label="Block Number" value={viewRecord.block_number || "—"} />
              <InfoItem icon={<MapPin className="h-4 w-4" />} label="Address" value={`${viewRecord.address}, ${viewRecord.purok}`} />
              <InfoItem icon={<Ruler className="h-4 w-4" />} label="Land Area" value={`${viewRecord.land_area_sqm.toLocaleString()} sqm`} />
              <InfoItem icon={<FileText className="h-4 w-4" />} label="TCT/OCT Number" value={viewRecord.tct_oct_number || "—"} />
              <InfoItem icon={<FileText className="h-4 w-4" />} label="Tax Declaration" value={viewRecord.tax_declaration_number || "—"} />
              <InfoItem icon={<FileText className="h-4 w-4" />} label="Assessed Value" value={`₱${viewRecord.assessed_value.toLocaleString()}`} />
              {viewRecord.year_constructed && <InfoItem icon={<Building className="h-4 w-4" />} label="Year Constructed" value={String(viewRecord.year_constructed)} />}
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Owner Information</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                <InfoItem icon={<User className="h-4 w-4" />} label="Owner Name" value={viewRecord.owner_name} />
                <InfoItem icon={<Phone className="h-4 w-4" />} label="Contact" value={viewRecord.owner_contact_number} />
                <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={viewRecord.owner_email || "—"} />
                <InfoItem icon={<MapPin className="h-4 w-4" />} label="Owner Address" value={viewRecord.owner_address} />
              </div>
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Boundaries / Landmarks</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                <InfoItem icon={<Compass className="h-4 w-4" />} label="North" value={viewRecord.landmark_north || "—"} />
                <InfoItem icon={<Compass className="h-4 w-4" />} label="South" value={viewRecord.landmark_south || "—"} />
                <InfoItem icon={<Compass className="h-4 w-4" />} label="East" value={viewRecord.landmark_east || "—"} />
                <InfoItem icon={<Compass className="h-4 w-4" />} label="West" value={viewRecord.landmark_west || "—"} />
              </div>
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
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}
