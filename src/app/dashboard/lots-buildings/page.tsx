"use client";

import { useState, useCallback, useEffect } from "react";
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
  Eye,
  Edit,
  Trash2,
  Bot,
  CheckCircle2,
  AlertTriangle,
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

const formTabs = ["Property Info", "Location", "Details"];
const purokOptions = ["", "Sampaguita", "Rosal", "Ilang-Ilang", "Dahlia", "Sunflower", "Orchid", "Jasmine"];
const propertyTypes = ["", "Residential Lot", "Commercial Lot", "Agricultural", "Government", "Residential Building", "Commercial Building", "Mixed-Use", "Vacant Lot"];
const classificationOptions = ["", "Residential", "Commercial", "Agricultural", "Industrial", "Government"];

const emptyForm: Record<string, string> = {
  record_name: "", property_type: "", lot_number: "", block_number: "", area_sqm: "", owner_name: "",
  address: "", purok: "", boundaries_north: "", boundaries_south: "", boundaries_east: "", boundaries_west: "",
  tax_declaration_number: "", assessed_value: "", market_value: "", classification: "", zoning: "", remarks: "",
};

const requiredFields: Record<string, string> = {
  record_name: "Record name is required",
  property_type: "Type is required",
  classification: "Classification is required",
  address: "Location is required",
  owner_name: "Owner name is required",
};

function FormInput({ label, name, value, placeholder, required, type, error, onChange }: { label: string; name: string; value: string; placeholder?: string; required?: boolean; type?: string; error?: string; onChange: (name: string, value: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type || "text"} value={value} onChange={(e) => onChange(name, e.target.value)} placeholder={placeholder} className={cn("w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring", error ? "border-red-500" : "border-border")} />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormSelect({ label, name, value, options, required, error, onChange }: { label: string; name: string; value: string; options: string[]; required?: boolean; error?: string; onChange: (name: string, value: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select value={value} onChange={(e) => onChange(name, e.target.value)} className={cn("w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring", error ? "border-red-500" : "border-border")}>
        {options.map((o) => <option key={o} value={o}>{o || "\u2014 Select \u2014"}</option>)}
      </select>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormTextarea({ label, name, value, placeholder, rows, required, onChange }: { label: string; name: string; value: string; placeholder?: string; rows?: number; required?: boolean; onChange: (name: string, value: string) => void }) {
  return (
    <div className="col-span-2">
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <textarea value={value} onChange={(e) => onChange(name, e.target.value)} placeholder={placeholder} rows={rows || 3} className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none" />
    </div>
  );
}

export default function LotsBuildingsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [classFilter, setClassFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [viewRecord, setViewRecord] = useState<LotBuilding | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [formTab, setFormTab] = useState(0);
  const [form, setForm] = useState<Record<string, string>>(emptyForm);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<{id: string; type: "success" | "error" | "warning" | "info"; title: string; message?: string}[]>([]);
  const addToast = useCallback((t: Omit<(typeof toasts)[0], "id">) => { setToasts(p => [...p, { ...t, id: Date.now().toString() }]); }, []);
  const dismissToast = useCallback((id: string) => setToasts(p => p.filter(t => t.id !== id)), []);
  const pageSize = 10;

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => { setToasts(p => p.slice(1)); }, 5000);
    return () => clearTimeout(timer);
  }, [toasts]);

  const handleFieldChange = (name: string, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    setFormErrors((e) => { const next = { ...e }; delete next[name]; return next; });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    for (const [field, message] of Object.entries(requiredFields)) {
      if (!form[field]?.trim()) errors[field] = message;
    }
    if (form.area_sqm && (isNaN(Number(form.area_sqm)) || Number(form.area_sqm) <= 0)) {
      errors.area_sqm = "Area must be a positive number";
    }
    if (form.assessed_value && (isNaN(Number(form.assessed_value)) || Number(form.assessed_value) <= 0)) {
      errors.assessed_value = "Assessed value must be a positive number";
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      const errorFields = Object.keys(errors);
      if (errorFields.some((f) => ["record_name", "property_type", "area_sqm", "owner_name"].includes(f))) setFormTab(0);
      else if (errorFields.some((f) => ["address"].includes(f))) setFormTab(1);
      else if (errorFields.some((f) => ["classification", "assessed_value"].includes(f))) setFormTab(2);
    }
    return Object.keys(errors).length === 0;
  };

  const openCreate = () => { setForm(emptyForm); setFormErrors({}); setFormTab(0); setShowCreate(true); };
  const openEdit = (r: LotBuilding) => {
    setForm({
      record_name: r.record_number, property_type: r.classification.charAt(0).toUpperCase() + r.classification.slice(1), lot_number: r.lot_number, block_number: r.block_number, area_sqm: String(r.land_area_sqm), owner_name: r.owner_name,
      address: r.address, purok: r.purok, boundaries_north: r.landmark_north, boundaries_south: r.landmark_south, boundaries_east: r.landmark_east, boundaries_west: r.landmark_west,
      tax_declaration_number: r.tax_declaration_number, assessed_value: String(r.assessed_value), market_value: "", classification: r.classification.charAt(0).toUpperCase() + r.classification.slice(1), zoning: "", remarks: "",
    });
    setFormErrors({});
    setFormTab(0);
    setShowEdit(true);
  };

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
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}><Plus className="h-4 w-4" /> New Record</button>
          </div>
        }
      />

      {/* Mabini AI Insight */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-bg/30 border border-accent-primary/20">
        <Bot className="h-4 w-4 shrink-0" style={{ color: "var(--accent-primary)" }} />
        <p className="text-[11px] text-muted-foreground"><span className="font-semibold text-foreground">Mabini:</span> Total assessed value is ₱7.35M across 5 properties. 1 property has no tax declaration number on file.</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Records" value={mockRecords.length} icon={<MapPin className="h-5 w-5" />} trend={{ value: 8, label: "this month" }} />
        <StatCard label="Lots Registered" value={lotCount} icon={<LandPlot className="h-5 w-5" />} trend={{ value: 5, label: "this quarter" }} />
        <StatCard label="Buildings Registered" value={buildingCount} icon={<Building className="h-5 w-5" />} trend={{ value: 12, label: "this quarter" }} />
        <StatCard label="Total Assessed Value" value={`₱${(totalAssessed / 1000000).toFixed(1)}M`} icon={<FileText className="h-5 w-5" />} trend={{ value: 4, label: "vs last quarter" }} />
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
                <tr><td colSpan={8} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"><MapPin className="w-6 h-6 text-muted-foreground" /></div>
                    <div>
                      <p className="text-sm font-medium text-foreground">No property records found</p>
                      <p className="text-xs text-muted-foreground mt-1">Start by adding lots, buildings, or land records for your barangay.</p>
                    </div>
                    <button onClick={() => openCreate()} className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>+ New Record</button>
                  </div>
                </td></tr>
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
                    <td className="px-4 py-3 text-right">
                      <div className="relative" onClick={(ev) => ev.stopPropagation()}>
                        <button onClick={() => setActionMenu(actionMenu === r.id ? null : r.id)} className="p-1.5 rounded hover:bg-muted">
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </button>
                        {actionMenu === r.id && (
                          <div className="absolute right-0 top-8 z-20 w-44 bg-card border border-border rounded-lg shadow-lg py-1">
                            <button onClick={() => { setViewRecord(r); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Eye className="h-3.5 w-3.5" /> View</button>
                            <button onClick={() => { openEdit(r); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Edit className="h-3.5 w-3.5" /> Edit</button>
                            <button onClick={() => { setViewRecord(r); setShowDelete(true); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-muted flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                          </div>
                        )}
                      </div>
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
      <Modal open={!!viewRecord && !showDelete} onClose={() => setViewRecord(null)} title={viewRecord?.record_number || ""} description={viewRecord ? `${viewRecord.owner_name} \u2014 ${viewRecord.classification}` : ""} size="lg"
        footer={<><ModalButton variant="secondary" onClick={() => setViewRecord(null)}>Close</ModalButton><ModalButton variant="primary" onClick={() => { if (viewRecord) { openEdit(viewRecord); setViewRecord(null); } }}>Edit</ModalButton></>}>
        {viewRecord && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              {typeBadge(viewRecord.record_type)}
              <Badge variant="default" className="capitalize">{viewRecord.classification}</Badge>
              <StatusBadge status={viewRecord.status} />
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <InfoItem icon={<Hash className="h-4 w-4" />} label="Lot Number" value={viewRecord.lot_number || "\u2014"} />
              <InfoItem icon={<Hash className="h-4 w-4" />} label="Block Number" value={viewRecord.block_number || "\u2014"} />
              <InfoItem icon={<MapPin className="h-4 w-4" />} label="Address" value={`${viewRecord.address}, ${viewRecord.purok}`} />
              <InfoItem icon={<Ruler className="h-4 w-4" />} label="Land Area" value={`${viewRecord.land_area_sqm.toLocaleString()} sqm`} />
              <InfoItem icon={<FileText className="h-4 w-4" />} label="TCT/OCT Number" value={viewRecord.tct_oct_number || "\u2014"} />
              <InfoItem icon={<FileText className="h-4 w-4" />} label="Tax Declaration" value={viewRecord.tax_declaration_number || "\u2014"} />
              <InfoItem icon={<FileText className="h-4 w-4" />} label="Assessed Value" value={`₱${viewRecord.assessed_value.toLocaleString()}`} />
              {viewRecord.year_constructed && <InfoItem icon={<Building className="h-4 w-4" />} label="Year Constructed" value={String(viewRecord.year_constructed)} />}
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Owner Information</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                <InfoItem icon={<User className="h-4 w-4" />} label="Owner Name" value={viewRecord.owner_name} />
                <InfoItem icon={<Phone className="h-4 w-4" />} label="Contact" value={viewRecord.owner_contact_number} />
                <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={viewRecord.owner_email || "\u2014"} />
                <InfoItem icon={<MapPin className="h-4 w-4" />} label="Owner Address" value={viewRecord.owner_address} />
              </div>
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Boundaries / Landmarks</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                <InfoItem icon={<Compass className="h-4 w-4" />} label="North" value={viewRecord.landmark_north || "\u2014"} />
                <InfoItem icon={<Compass className="h-4 w-4" />} label="South" value={viewRecord.landmark_south || "\u2014"} />
                <InfoItem icon={<Compass className="h-4 w-4" />} label="East" value={viewRecord.landmark_east || "\u2014"} />
                <InfoItem icon={<Compass className="h-4 w-4" />} label="West" value={viewRecord.landmark_west || "\u2014"} />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create / Edit Form Modal */}
      <Modal open={showCreate || showEdit} onClose={() => { setShowCreate(false); setShowEdit(false); }} title={showEdit ? "Edit Property Record" : "Add Property Record"} size="lg"
        footer={<>
          <ModalButton variant="secondary" onClick={() => { setShowCreate(false); setShowEdit(false); setFormErrors({}); }}>Cancel</ModalButton>
          {formTab > 0 && <ModalButton variant="secondary" onClick={() => setFormTab((t) => t - 1)}>Previous</ModalButton>}
          {formTab < formTabs.length - 1 ? <ModalButton variant="primary" onClick={() => setFormTab((t) => t + 1)}>Next</ModalButton> : <ModalButton variant="primary" onClick={() => { if (validateForm()) { addToast({ type: "success", title: showEdit ? "Record updated" : "Record created", message: showEdit ? "Property record has been updated successfully." : "New property record has been added." }); setShowCreate(false); setShowEdit(false); setFormErrors({}); } }}>{showEdit ? "Update" : "Save"}</ModalButton>}
        </>}>
        <div className="flex border-b border-border mb-6">
          {formTabs.map((tab, i) => (
            <button key={tab} onClick={() => setFormTab(i)} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors", formTab === i ? "border-accent-primary text-accent-text" : "border-transparent text-muted-foreground hover:text-foreground")}>{tab}</button>
          ))}
        </div>
        {formTab === 0 && (
          <div className="grid grid-cols-2 gap-4">
            <FormInput onChange={handleFieldChange} label="Record Name" name="record_name" value={form.record_name} placeholder="Property record name" required error={formErrors.record_name} />
            <FormSelect onChange={handleFieldChange} label="Property Type" name="property_type" value={form.property_type} options={propertyTypes} required error={formErrors.property_type} />
            <FormInput onChange={handleFieldChange} label="Lot Number" name="lot_number" value={form.lot_number} placeholder="L-XXX" />
            <FormInput onChange={handleFieldChange} label="Block Number" name="block_number" value={form.block_number} placeholder="B-XX" />
            <FormInput onChange={handleFieldChange} label="Area (sqm)" name="area_sqm" value={form.area_sqm} placeholder="0" type="number" error={formErrors.area_sqm} />
            <FormInput onChange={handleFieldChange} label="Owner Name" name="owner_name" value={form.owner_name} placeholder="Full name of owner" required error={formErrors.owner_name} />
          </div>
        )}
        {formTab === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <FormInput onChange={handleFieldChange} label="Address" name="address" value={form.address} placeholder="Street address" required error={formErrors.address} />
            <FormSelect onChange={handleFieldChange} label="Purok" name="purok" value={form.purok} options={purokOptions} />
            <FormInput onChange={handleFieldChange} label="Boundary - North" name="boundaries_north" value={form.boundaries_north} placeholder="North boundary/landmark" />
            <FormInput onChange={handleFieldChange} label="Boundary - South" name="boundaries_south" value={form.boundaries_south} placeholder="South boundary/landmark" />
            <FormInput onChange={handleFieldChange} label="Boundary - East" name="boundaries_east" value={form.boundaries_east} placeholder="East boundary/landmark" />
            <FormInput onChange={handleFieldChange} label="Boundary - West" name="boundaries_west" value={form.boundaries_west} placeholder="West boundary/landmark" />
            <div className="col-span-2">
              <p className="text-[10px] text-muted-foreground mt-1">Describe nearby landmarks. E.g., &quot;Corner of Rizal St. and Garcia Store&quot;</p>
            </div>
          </div>
        )}
        {formTab === 2 && (
          <div className="grid grid-cols-2 gap-4">
            <FormInput onChange={handleFieldChange} label="Tax Declaration Number" name="tax_declaration_number" value={form.tax_declaration_number} placeholder="TD-XXXX-XXX" />
            <div>
              <FormInput onChange={handleFieldChange} label="Assessed Value" name="assessed_value" value={form.assessed_value} placeholder="0" type="number" error={formErrors.assessed_value} />
              <p className="text-[10px] text-muted-foreground mt-1">Enter the value from the latest tax declaration or property assessment.</p>
            </div>
            <FormInput onChange={handleFieldChange} label="Market Value" name="market_value" value={form.market_value} placeholder="0" type="number" />
            <FormSelect onChange={handleFieldChange} label="Classification" name="classification" value={form.classification} options={classificationOptions} required error={formErrors.classification} />
            <FormInput onChange={handleFieldChange} label="Zoning" name="zoning" value={form.zoning} placeholder="Zone classification" />
            <FormTextarea onChange={handleFieldChange} label="Remarks" name="remarks" value={form.remarks} placeholder="Additional remarks..." />
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Confirm Delete" description="This action cannot be undone." size="sm"
        footer={<><ModalButton variant="secondary" onClick={() => { setShowDelete(false); setViewRecord(null); }}>Cancel</ModalButton><ModalButton variant="danger" onClick={() => { addToast({ type: "success", title: "Record deleted", message: `${viewRecord?.record_number} has been removed.` }); setShowDelete(false); setViewRecord(null); }}>Delete</ModalButton></>}>
        <p className="text-sm text-muted-foreground">Are you sure you want to delete <span className="font-medium text-foreground">{viewRecord?.record_number}</span> owned by <span className="font-medium text-foreground">{viewRecord?.owner_name}</span>? This will permanently remove this property record.</p>
      </Modal>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={cn("flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border min-w-[320px] max-w-[420px] animate-in slide-in-from-right-5",
            t.type === "success" ? "bg-emerald-500/10 border-emerald-500/30" : t.type === "error" ? "bg-red-500/10 border-red-500/30" : t.type === "warning" ? "bg-amber-500/10 border-amber-500/30" : "bg-blue-500/10 border-blue-500/30"
          )}>
            {t.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> : t.type === "error" ? <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{t.title}</p>
              {t.message && <p className="text-xs text-muted-foreground mt-0.5">{t.message}</p>}
            </div>
            <button onClick={() => dismissToast(t.id)} className="text-muted-foreground hover:text-foreground shrink-0"><X className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
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
