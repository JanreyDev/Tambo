"use client";

import { useState, useCallback } from "react";
import {
  Building2,
  Plus,
  Search,
  Filter,
  Download,
  MapPin,
  Phone,
  Mail,
  User,
  Clock,
  FileText,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Store,
  Wrench,
  ShoppingBag,
  UtensilsCrossed,
  Pill,
  Wifi,
  Droplets,
  Scissors,
  Hammer,
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

interface Establishment {
  id: string;
  establishment_number: string;
  name: string;
  type: string;
  business_type: string;
  purok: string;
  street: string;
  address: string;
  contact_number: string;
  email: string;
  owner_name: string;
  owner_contact_number: string;
  dti_sec_registration_number: string;
  business_permit_number: string;
  permit_expiry_date: string;
  operating_hours: string;
  employee_count: number;
  status: string;
  created_at: string;
}

const mockEstablishments: Establishment[] = [
  { id: "1", establishment_number: "EST-2026-0001", name: "Maria's Sari-sari Store", type: "commercial", business_type: "Retail", purok: "Sampaguita", street: "Rizal St.", address: "123 Rizal St., Purok Sampaguita", contact_number: "09171111111", email: "", owner_name: "Maria Dela Cruz", owner_contact_number: "09171234567", dti_sec_registration_number: "DTI-NCR-2024-123456", business_permit_number: "BP-2026-001", permit_expiry_date: "2026-12-31", operating_hours: "6:00 AM - 10:00 PM", employee_count: 2, status: "active", created_at: "2026-01-10" },
  { id: "2", establishment_number: "EST-2026-0002", name: "Juan's Auto Repair", type: "commercial", business_type: "Automotive", purok: "Rosal", street: "Mabini St.", address: "45 Mabini St., Purok Rosal", contact_number: "09282222222", email: "juan.auto@email.com", owner_name: "Juan Santos", owner_contact_number: "09281234567", dti_sec_registration_number: "DTI-NCR-2023-789012", business_permit_number: "BP-2026-002", permit_expiry_date: "2026-06-30", operating_hours: "8:00 AM - 6:00 PM", employee_count: 5, status: "active", created_at: "2026-01-15" },
  { id: "3", establishment_number: "EST-2026-0003", name: "Mang Totoy's Carinderia", type: "commercial", business_type: "Food Service", purok: "Ilang-Ilang", street: "Bonifacio Ave.", address: "67 Bonifacio Ave., Purok Ilang-Ilang", contact_number: "09353333333", email: "", owner_name: "Ernesto Garcia", owner_contact_number: "09351234567", dti_sec_registration_number: "", business_permit_number: "BP-2026-003", permit_expiry_date: "2026-12-31", operating_hours: "5:00 AM - 8:00 PM", employee_count: 3, status: "active", created_at: "2026-01-20" },
  { id: "4", establishment_number: "EST-2026-0004", name: "Tambo Hardware & Construction Supply", type: "commercial", business_type: "Hardware", purok: "Dahlia", street: "Del Pilar St.", address: "89 Del Pilar St., Purok Dahlia", contact_number: "09454444444", email: "tambo.hardware@email.com", owner_name: "Roberto Manalo", owner_contact_number: "09271234567", dti_sec_registration_number: "DTI-NCR-2022-345678", business_permit_number: "BP-2026-004", permit_expiry_date: "2026-12-31", operating_hours: "7:00 AM - 7:00 PM", employee_count: 8, status: "active", created_at: "2026-02-01" },
  { id: "5", establishment_number: "EST-2026-0005", name: "HealthPlus Pharmacy", type: "commercial", business_type: "Pharmacy", purok: "Sampaguita", street: "Rizal St.", address: "101 Rizal St., Purok Sampaguita", contact_number: "09165555555", email: "healthplus@email.com", owner_name: "Liza Villanueva", owner_contact_number: "09381234567", dti_sec_registration_number: "SEC-2024-A00123", business_permit_number: "BP-2026-005", permit_expiry_date: "2026-12-31", operating_hours: "8:00 AM - 9:00 PM", employee_count: 4, status: "active", created_at: "2026-02-10" },
  { id: "6", establishment_number: "EST-2026-0006", name: "Fresh & Clean Laundry", type: "commercial", business_type: "Laundry", purok: "Rosal", street: "Luna St.", address: "33 Luna St., Purok Rosal", contact_number: "09276666666", email: "", owner_name: "Angelo Pascual", owner_contact_number: "09471234567", dti_sec_registration_number: "DTI-NCR-2025-567890", business_permit_number: "BP-2026-006", permit_expiry_date: "2027-03-31", operating_hours: "7:00 AM - 7:00 PM", employee_count: 3, status: "active", created_at: "2026-02-15" },
  { id: "7", establishment_number: "EST-2026-0007", name: "NetZone Internet Cafe", type: "commercial", business_type: "Internet Cafe", purok: "Jasmine", street: "Aguinaldo St.", address: "55 Aguinaldo St., Purok Jasmine", contact_number: "09387777777", email: "netzone@email.com", owner_name: "Mark Chavez", owner_contact_number: "09331234567", dti_sec_registration_number: "DTI-NCR-2025-112233", business_permit_number: "BP-2026-007", permit_expiry_date: "2026-12-31", operating_hours: "9:00 AM - 12:00 AM", employee_count: 2, status: "active", created_at: "2026-02-20" },
  { id: "8", establishment_number: "EST-2026-0008", name: "AquaPure Water Refilling Station", type: "commercial", business_type: "Water Refilling", purok: "Sunflower", street: "Quezon Blvd.", address: "77 Quezon Blvd., Purok Sunflower", contact_number: "09198888888", email: "", owner_name: "Carlos Rivera", owner_contact_number: "09191234567", dti_sec_registration_number: "", business_permit_number: "BP-2026-008", permit_expiry_date: "2026-09-30", operating_hours: "6:00 AM - 8:00 PM", employee_count: 2, status: "active", created_at: "2026-03-01" },
  { id: "9", establishment_number: "EST-2026-0009", name: "Glow Beauty Salon", type: "commercial", business_type: "Salon", purok: "Orchid", street: "Mabini St.", address: "22 Mabini St., Purok Orchid", contact_number: "09429999999", email: "glow.salon@email.com", owner_name: "Ana Garcia", owner_contact_number: "09351234567", dti_sec_registration_number: "DTI-NCR-2024-998877", business_permit_number: "", permit_expiry_date: "", operating_hours: "9:00 AM - 7:00 PM", employee_count: 3, status: "pending", created_at: "2026-03-04" },
  { id: "10", establishment_number: "EST-2026-0010", name: "Old Town Bakery (Closed)", type: "commercial", business_type: "Bakery", purok: "Dahlia", street: "Rizal St.", address: "44 Rizal St., Purok Dahlia", contact_number: "", email: "", owner_name: "Pedro Reyes", owner_contact_number: "09451234567", dti_sec_registration_number: "", business_permit_number: "BP-2025-010", permit_expiry_date: "2025-12-31", operating_hours: "", employee_count: 0, status: "closed", created_at: "2025-06-01" },
];

const businessTypes = ["All Types", "Retail", "Automotive", "Food Service", "Hardware", "Pharmacy", "Laundry", "Internet Cafe", "Water Refilling", "Salon", "Bakery"];
const statusOptions = ["All Status", "Active", "Pending", "Closed"];

const typeIcons: Record<string, React.ElementType> = {
  Retail: Store, Automotive: Wrench, "Food Service": UtensilsCrossed, Hardware: Hammer,
  Pharmacy: Pill, Laundry: ShoppingBag, "Internet Cafe": Wifi, "Water Refilling": Droplets,
  Salon: Scissors, Bakery: Store,
};

const formTabs = ["Business Info", "Location & Permit", "Details"];
const purokOptions = ["", "Sampaguita", "Rosal", "Ilang-Ilang", "Dahlia", "Sunflower", "Orchid", "Jasmine"];
const formBusinessTypes = ["", "Sari-sari Store", "Restaurant/Eatery", "Pharmacy", "Hardware", "Grocery", "Salon/Barbershop", "Internet Cafe", "Repair Shop", "Manufacturing", "Services", "Others"];
const incomeRanges = ["", "Below ₱100K", "₱100K-₱500K", "₱500K-₱1M", "₱1M-₱5M", "Above ₱5M"];
const formStatusOptions = ["", "Active", "Inactive", "Closed", "Suspended"];

const emptyForm: Record<string, string> = {
  business_name: "", business_type: "", owner_name: "", owner_contact: "",
  address: "", purok: "", business_permit_number: "", permit_expiry: "", dti_registration: "",
  number_of_employees: "", business_area_sqm: "", annual_income_range: "", status: "", notes: "",
};

function FormInput({ label, name, value, placeholder, required, type, error, onChange }: { label: string; name: string; value: string; placeholder?: string; required?: boolean; type?: string; error?: string; onChange: (name: string, value: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type || "text"} value={value} onChange={(e) => onChange(name, e.target.value)} placeholder={placeholder} className={cn("w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring", error ? "border-red-500" : "border-border")} />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormSelect({ label, name, value, options, required, error, onChange }: { label: string; name: string; value: string; options: string[]; required?: boolean; error?: string; onChange: (name: string, value: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select value={value} onChange={(e) => onChange(name, e.target.value)} className={cn("w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring", error ? "border-red-500" : "border-border")}>
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
      <textarea value={value} onChange={(e) => onChange(name, e.target.value)} placeholder={placeholder} rows={rows || 3} className="w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none" />
    </div>
  );
}

export default function EstablishmentsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [viewEstablishment, setViewEstablishment] = useState<Establishment | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [formTab, setFormTab] = useState(0);
  const [form, setForm] = useState<Record<string, string>>(emptyForm);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const pageSize = 10;

  // Toast system
  interface Toast { id: string; type: "success" | "error" | "warning" | "info"; title: string; message?: string; duration?: number; }
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);
  const dismissToast = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const handleFieldChange = (name: string, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.business_name.trim()) errors.business_name = "Business name is required.";
    if (!form.business_type.trim()) errors.business_type = "Business type is required.";
    if (!form.owner_name.trim()) errors.owner_name = "Owner name is required.";
    if (!form.address.trim()) errors.address = "Address is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = () => {
    if (!validateForm()) return;
    if (showEdit) {
      addToast({ type: "success", title: "Establishment Updated", message: "Changes have been saved." });
    } else {
      addToast({ type: "success", title: "Establishment Registered", message: "New establishment has been added successfully." });
    }
    setShowCreate(false);
    setShowEdit(false);
    setFormErrors({});
  };

  const openCreate = () => { setForm(emptyForm); setFormTab(0); setFormErrors({}); setShowCreate(true); };
  const openEdit = (e: Establishment) => {
    setForm({
      business_name: e.name, business_type: e.business_type, owner_name: e.owner_name, owner_contact: e.owner_contact_number,
      address: e.address, purok: e.purok, business_permit_number: e.business_permit_number, permit_expiry: e.permit_expiry_date, dti_registration: e.dti_sec_registration_number,
      number_of_employees: String(e.employee_count), business_area_sqm: "", annual_income_range: "", status: e.status.charAt(0).toUpperCase() + e.status.slice(1), notes: "",
    });
    setFormTab(0);
    setFormErrors({});
    setShowEdit(true);
  };

  const filtered = mockEstablishments.filter((e) => {
    if (search) {
      const q = search.toLowerCase();
      if (!e.name.toLowerCase().includes(q) && !e.establishment_number.toLowerCase().includes(q) && !e.owner_name.toLowerCase().includes(q)) return false;
    }
    if (typeFilter !== "All Types" && e.business_type !== typeFilter) return false;
    if (statusFilter !== "All Status" && e.status !== statusFilter.toLowerCase()) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey as keyof Establishment];
    const bVal = b[sortKey as keyof Establishment];
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

  const activeCount = mockEstablishments.filter((e) => e.status === "active").length;
  const totalEmployees = mockEstablishments.reduce((sum, e) => sum + e.employee_count, 0);
  const expiringPermits = mockEstablishments.filter((e) => {
    if (!e.permit_expiry_date) return false;
    const exp = new Date(e.permit_expiry_date);
    const now = new Date();
    const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 90 && diff > 0;
  }).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Establishments"
        description="Manage registered businesses and commercial establishments"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Records" }, { label: "Establishments" }]}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors">
              <Download className="h-4 w-4" /> Export
            </button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
              <Plus className="h-4 w-4" /> New Establishment
            </button>
          </div>
        }
      />

      {/* Mabini AI Insight */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-bg/30 border border-accent-primary/20">
        <Bot className="h-4 w-4 shrink-0" style={{ color: "var(--accent-primary)" }} />
        <p className="text-[11px] text-muted-foreground"><span className="font-semibold text-foreground">Mabini:</span> 2 business permits expiring within 30 days. 3 establishments missing updated contact info.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Establishments" value={mockEstablishments.length} icon={<Building2 className="h-5 w-5" />} trend={{ value: 5, label: "vs last month" }} />
        <StatCard label="Active Businesses" value={activeCount} icon={<Store className="h-5 w-5" />} trend={{ value: 2, label: "new this month" }} />
        <StatCard label="Total Employees" value={totalEmployees} icon={<User className="h-5 w-5" />} />
        <StatCard label="Permits Expiring Soon" value={expiringPermits} icon={<Clock className="h-5 w-5" />} trend={{ value: -3, label: "within 90 days" }} />
      </div>

      {/* Toolbar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, number, or owner..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={cn("flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors",
              showFilters ? "border-accent-primary bg-accent-bg text-accent-text" : "border-border hover:bg-muted")}>
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg glass-subtle">
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring">
              {businessTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring">
              {statusOptions.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => { setTypeFilter("All Types"); setStatusFilter("All Status"); }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /> Clear</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label="Establishment" field="name" />
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label="Type" field="business_type" />
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Location</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Owner</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Permit</th>
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label="Employees" field="employee_count" />
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">No establishments found</p>
                      <p className="text-xs text-muted-foreground mt-1">Get started by registering your first business establishment.</p>
                    </div>
                    <button onClick={() => openCreate()} className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
                      + New Establishment
                    </button>
                  </div>
                </td></tr>
              ) : (
                paged.map((e) => {
                  const TypeIcon = typeIcons[e.business_type] || Building2;
                  const permitExpiring = e.permit_expiry_date && new Date(e.permit_expiry_date) < new Date("2026-07-01");
                  return (
                    <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setViewEstablishment(e)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-accent-bg flex items-center justify-center shrink-0">
                            <TypeIcon className="h-4 w-4 text-accent-text" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{e.name}</p>
                            <p className="text-[11px] text-muted-foreground">{e.establishment_number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge variant="info">{e.business_type}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-muted-foreground" /><span className="text-sm">{e.purok}</span></div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{e.street}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground">{e.owner_name}</p>
                        <p className="text-[11px] text-muted-foreground">{e.owner_contact_number}</p>
                      </td>
                      <td className="px-4 py-3">
                        {e.business_permit_number ? (
                          <div>
                            <p className="text-sm text-foreground">{e.business_permit_number}</p>
                            <p className={cn("text-[11px]", permitExpiring ? "text-amber-500 font-medium" : "text-muted-foreground")}>
                              Exp: {e.permit_expiry_date || "N/A"}
                            </p>
                          </div>
                        ) : (
                          <Badge variant="warning">No Permit</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground text-center">{e.employee_count}</td>
                      <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative" onClick={(ev) => ev.stopPropagation()}>
                          <button onClick={() => setActionMenu(actionMenu === e.id ? null : e.id)} className="p-1.5 rounded hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </button>
                          {actionMenu === e.id && (
                            <div className="absolute right-0 top-8 z-20 w-44 glass rounded-lg shadow-lg py-1">
                              <button onClick={() => { setViewEstablishment(e); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Eye className="h-3.5 w-3.5" /> View</button>
                              <button onClick={() => { openEdit(e); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Edit className="h-3.5 w-3.5" /> Edit</button>
                              <button onClick={() => { setViewEstablishment(e); setShowDelete(true); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-muted flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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
      <Modal open={!!viewEstablishment && !showDelete} onClose={() => setViewEstablishment(null)}
        title={viewEstablishment?.name || ""} description={viewEstablishment?.establishment_number} size="lg"
        footer={<><ModalButton variant="secondary" onClick={() => setViewEstablishment(null)}>Close</ModalButton><ModalButton variant="primary" onClick={() => { if (viewEstablishment) { openEdit(viewEstablishment); setViewEstablishment(null); } }}>Edit</ModalButton></>}>
        {viewEstablishment && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <InfoItem icon={<Building2 className="h-4 w-4" />} label="Business Type" value={viewEstablishment.business_type} />
              <InfoItem icon={<MapPin className="h-4 w-4" />} label="Address" value={viewEstablishment.address} />
              <InfoItem icon={<Phone className="h-4 w-4" />} label="Contact" value={viewEstablishment.contact_number || "\u2014"} />
              <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={viewEstablishment.email || "\u2014"} />
              <InfoItem icon={<User className="h-4 w-4" />} label="Owner" value={viewEstablishment.owner_name} />
              <InfoItem icon={<Phone className="h-4 w-4" />} label="Owner Contact" value={viewEstablishment.owner_contact_number} />
              <InfoItem icon={<FileText className="h-4 w-4" />} label="DTI/SEC No." value={viewEstablishment.dti_sec_registration_number || "\u2014"} />
              <InfoItem icon={<FileText className="h-4 w-4" />} label="Business Permit" value={viewEstablishment.business_permit_number || "\u2014"} />
              <InfoItem icon={<Clock className="h-4 w-4" />} label="Operating Hours" value={viewEstablishment.operating_hours || "\u2014"} />
              <InfoItem icon={<User className="h-4 w-4" />} label="Employees" value={String(viewEstablishment.employee_count)} />
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <StatusBadge status={viewEstablishment.status} />
              {viewEstablishment.permit_expiry_date && (
                <Badge variant={new Date(viewEstablishment.permit_expiry_date) < new Date() ? "danger" : "info"}>
                  Permit expires {viewEstablishment.permit_expiry_date}
                </Badge>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Create / Edit Form Modal */}
      <Modal open={showCreate || showEdit} onClose={() => { setShowCreate(false); setShowEdit(false); }} title={showEdit ? "Edit Establishment" : "Register Establishment"} size="lg"
        footer={<>
          <ModalButton variant="secondary" onClick={() => { setShowCreate(false); setShowEdit(false); }}>Cancel</ModalButton>
          {formTab > 0 && <ModalButton variant="secondary" onClick={() => setFormTab((t) => t - 1)}>Previous</ModalButton>}
          {formTab < formTabs.length - 1 ? <ModalButton variant="primary" onClick={() => setFormTab((t) => t + 1)}>Next</ModalButton> : <ModalButton variant="primary" onClick={handleFormSubmit}>{showEdit ? "Update" : "Save"}</ModalButton>}
        </>}>
        <div className="flex border-b border-border mb-6">
          {formTabs.map((tab, i) => (
            <button key={tab} onClick={() => setFormTab(i)} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors", formTab === i ? "border-accent-primary text-accent-text" : "border-transparent text-muted-foreground hover:text-foreground")}>{tab}</button>
          ))}
        </div>
        {formTab === 0 && (
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Business Name" name="business_name" value={form.business_name} placeholder="Enter business name" required error={formErrors.business_name} onChange={handleFieldChange} />
            <FormSelect label="Business Type" name="business_type" value={form.business_type} options={formBusinessTypes} required error={formErrors.business_type} onChange={handleFieldChange} />
            <FormInput label="Owner Name" name="owner_name" value={form.owner_name} placeholder="Full name of owner" required error={formErrors.owner_name} onChange={handleFieldChange} />
            <FormInput label="Owner Contact" name="owner_contact" value={form.owner_contact} placeholder="09XX XXX XXXX" onChange={handleFieldChange} />
          </div>
        )}
        {formTab === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Address" name="address" value={form.address} placeholder="Street address" required error={formErrors.address} onChange={handleFieldChange} />
            <FormSelect label="Purok" name="purok" value={form.purok} options={purokOptions} onChange={handleFieldChange} />
            <FormInput label="Business Permit Number" name="business_permit_number" value={form.business_permit_number} placeholder="BP-XXXX-XXX" onChange={handleFieldChange} />
            <div>
              <FormInput label="Permit Expiry" name="permit_expiry" value={form.permit_expiry} type="date" onChange={handleFieldChange} />
              <p className="text-[10px] text-muted-foreground mt-1">Business permit must be renewed annually. Set this to the expiration date on the current permit.</p>
            </div>
            <FormInput label="DTI/SEC Registration" name="dti_registration" value={form.dti_registration} placeholder="DTI-XXX-XXXX" onChange={handleFieldChange} />
          </div>
        )}
        {formTab === 2 && (
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Number of Employees" name="number_of_employees" value={form.number_of_employees} placeholder="0" type="number" onChange={handleFieldChange} />
            <FormInput label="Business Area (sqm)" name="business_area_sqm" value={form.business_area_sqm} placeholder="0" type="number" onChange={handleFieldChange} />
            <FormSelect label="Annual Income Range" name="annual_income_range" value={form.annual_income_range} options={incomeRanges} onChange={handleFieldChange} />
            <FormSelect label="Status" name="status" value={form.status} options={formStatusOptions} onChange={handleFieldChange} />
            <FormTextarea label="Notes" name="notes" value={form.notes} placeholder="Additional notes..." onChange={handleFieldChange} />
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Establishment" description="This action cannot be undone." size="sm"
        footer={<><ModalButton variant="secondary" onClick={() => { setShowDelete(false); setViewEstablishment(null); }}>Cancel</ModalButton><ModalButton variant="danger" onClick={() => { addToast({ type: "success", title: "Establishment Deleted", message: "The record has been permanently removed." }); setShowDelete(false); setViewEstablishment(null); }}>Yes, Delete &quot;{viewEstablishment?.name}&quot;</ModalButton></>}>
        <p className="text-sm text-muted-foreground">Are you sure you want to permanently delete <span className="font-semibold text-foreground">&quot;{viewEstablishment?.name}&quot;</span> ({viewEstablishment?.establishment_number})? This will remove all associated records including permit history and employee data.</p>
      </Modal>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className={cn("flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border min-w-[320px] max-w-[420px] animate-in slide-in-from-right",
            toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/30" :
            toast.type === "error" ? "bg-red-500/10 border-red-500/30" :
            toast.type === "warning" ? "bg-amber-500/10 border-amber-500/30" :
            "bg-blue-500/10 border-blue-500/30"
          )}>
            <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
              toast.type === "success" ? "text-emerald-500" : toast.type === "error" ? "text-red-500" : toast.type === "warning" ? "text-amber-500" : "text-blue-500"
            )}>
              {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : toast.type === "error" ? <X className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{toast.title}</p>
              {toast.message && <p className="text-xs text-muted-foreground mt-0.5">{toast.message}</p>}
            </div>
            <button onClick={() => dismissToast(toast.id)} className="text-muted-foreground hover:text-foreground shrink-0"><X className="w-3.5 h-3.5" /></button>
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
