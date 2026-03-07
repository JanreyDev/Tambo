"use client";

import { useState } from "react";
import {
  Building2,
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Users,
  FileText,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  Trash2,
  Power,
  ExternalLink,
} from "lucide-react";

type TenantStatus = "Active" | "Trial" | "Expired" | "Suspended";

interface Tenant {
  id: string;
  name: string;
  municipality: string;
  province: string;
  region: string;
  status: TenantStatus;
  plan: string;
  users: number;
  maxUsers: number;
  residents: number;
  documents: number;
  subscriptionStart: string;
  subscriptionEnd: string;
  lastActive: string;
  monthlyFee: number;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
}

const tenants: Tenant[] = [
  { id: "BRG-001", name: "Brgy. Tambo", municipality: "Paranaque", province: "Metro Manila", region: "NCR", status: "Active", plan: "Professional", users: 8, maxUsers: 15, residents: 1247, documents: 342, subscriptionStart: "2025-01-15", subscriptionEnd: "2026-01-15", lastActive: "2 min ago", monthlyFee: 2500, contactPerson: "Kap. Juan Santos", contactEmail: "tambo@brgy.gov.ph", contactPhone: "09171234567" },
  { id: "BRG-002", name: "Brgy. San Jose", municipality: "Olongapo", province: "Zambales", region: "Region III", status: "Active", plan: "Standard", users: 5, maxUsers: 10, residents: 2341, documents: 218, subscriptionStart: "2024-06-01", subscriptionEnd: "2025-06-01", lastActive: "15 min ago", monthlyFee: 1500, contactPerson: "Kap. Maria Reyes", contactEmail: "sanjose@brgy.gov.ph", contactPhone: "09181234567" },
  { id: "BRG-003", name: "Brgy. Mabayuan", municipality: "Olongapo", province: "Zambales", region: "Region III", status: "Active", plan: "Standard", users: 4, maxUsers: 10, residents: 1856, documents: 156, subscriptionStart: "2024-08-15", subscriptionEnd: "2025-08-15", lastActive: "1 hr ago", monthlyFee: 1500, contactPerson: "Kap. Pedro Cruz", contactEmail: "mabayuan@brgy.gov.ph", contactPhone: "09191234567" },
  { id: "BRG-004", name: "Brgy. Kalaklan", municipality: "Olongapo", province: "Zambales", region: "Region III", status: "Trial", plan: "Trial (14 days)", users: 2, maxUsers: 5, residents: 456, documents: 23, subscriptionStart: "2026-03-01", subscriptionEnd: "2026-03-15", lastActive: "3 hrs ago", monthlyFee: 0, contactPerson: "Kap. Ana Villanueva", contactEmail: "kalaklan@brgy.gov.ph", contactPhone: "09201234567" },
  { id: "BRG-005", name: "Brgy. Pag-asa", municipality: "Olongapo", province: "Zambales", region: "Region III", status: "Expired", plan: "Standard", users: 0, maxUsers: 10, residents: 987, documents: 89, subscriptionStart: "2024-12-01", subscriptionEnd: "2025-12-01", lastActive: "2 weeks ago", monthlyFee: 1500, contactPerson: "Kap. Jose Garcia", contactEmail: "pagasa@brgy.gov.ph", contactPhone: "09211234567" },
  { id: "BRG-006", name: "Brgy. Barretto", municipality: "Olongapo", province: "Zambales", region: "Region III", status: "Active", plan: "Professional", users: 6, maxUsers: 15, residents: 3210, documents: 478, subscriptionStart: "2024-03-01", subscriptionEnd: "2025-03-01", lastActive: "5 min ago", monthlyFee: 2500, contactPerson: "Kap. Ricardo Torres", contactEmail: "barretto@brgy.gov.ph", contactPhone: "09221234567" },
  { id: "BRG-007", name: "Brgy. East Tapinac", municipality: "Olongapo", province: "Zambales", region: "Region III", status: "Active", plan: "Standard", users: 3, maxUsers: 10, residents: 1123, documents: 167, subscriptionStart: "2024-09-15", subscriptionEnd: "2025-09-15", lastActive: "30 min ago", monthlyFee: 1500, contactPerson: "Kap. Lorna Bautista", contactEmail: "etapinac@brgy.gov.ph", contactPhone: "09231234567" },
  { id: "BRG-008", name: "Brgy. Sta. Rita", municipality: "Olongapo", province: "Zambales", region: "Region III", status: "Suspended", plan: "Standard", users: 0, maxUsers: 10, residents: 678, documents: 54, subscriptionStart: "2024-07-01", subscriptionEnd: "2025-07-01", lastActive: "1 month ago", monthlyFee: 1500, contactPerson: "Kap. Roberto Mendoza", contactEmail: "starita@brgy.gov.ph", contactPhone: "09241234567" },
];

const statusConfig: Record<TenantStatus, { icon: React.ElementType; color: string; bg: string }> = {
  Active: { icon: CheckCircle2, color: "#22c55e", bg: "#22c55e15" },
  Trial: { icon: Clock, color: "#f59e0b", bg: "#f59e0b15" },
  Expired: { icon: XCircle, color: "#ef4444", bg: "#ef444415" },
  Suspended: { icon: AlertTriangle, color: "#94a3b8", bg: "#94a3b815" },
};

export default function TenantsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TenantStatus | "All">("All");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const filtered = tenants.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.municipality.toLowerCase().includes(search.toLowerCase()) ||
      t.province.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === "Active").length,
    trial: tenants.filter(t => t.status === "Trial").length,
    expired: tenants.filter(t => t.status === "Expired").length,
    suspended: tenants.filter(t => t.status === "Suspended").length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Barangay Tenants</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage all barangay subscriptions and access</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Barangay
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, color: "#3b82f6", icon: Building2 },
          { label: "Active", value: stats.active, color: "#22c55e", icon: CheckCircle2 },
          { label: "Trial", value: stats.trial, color: "#f59e0b", icon: Clock },
          { label: "Expired", value: stats.expired, color: "#ef4444", icon: XCircle },
          { label: "Suspended", value: stats.suspended, color: "#94a3b8", icon: AlertTriangle },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setStatusFilter(s.label === "Total" ? "All" : s.label as TenantStatus)}
            className={`bg-card border rounded-xl p-4 text-left transition-all hover:shadow-md ${
              (statusFilter === "All" && s.label === "Total") || statusFilter === s.label
                ? "border-blue-500 ring-1 ring-blue-500/20"
                : "border-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
              </div>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${s.color}12` }}>
                <s.icon className="w-4.5 h-4.5" style={{ color: s.color }} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Search + Filter Bar */}
      <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search barangays by name, municipality, or province..."
          className="flex-1 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors">
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Tenant Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_100px_80px_80px_100px_100px_48px] gap-3 px-5 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/30">
          <span>Barangay</span>
          <span className="text-center">Status</span>
          <span className="text-center">Users</span>
          <span className="text-center">Residents</span>
          <span className="text-center">Plan</span>
          <span className="text-right">Last Active</span>
          <span />
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border">
          {filtered.map((t) => {
            const sc = statusConfig[t.status];
            const StatusIcon = sc.icon;
            return (
              <div
                key={t.id}
                onClick={() => setSelectedTenant(t)}
                className="grid grid-cols-[1fr_100px_80px_80px_100px_100px_48px] gap-3 items-center px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                    style={{ background: t.status === "Active" ? "#3b82f6" : t.status === "Trial" ? "#f59e0b" : "#94a3b8" }}>
                    {t.name.replace("Brgy. ", "").charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground">{t.municipality}, {t.province}</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: sc.bg, color: sc.color }}>
                    <StatusIcon className="w-3 h-3" />
                    {t.status}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium text-foreground">{t.users}</span>
                  <span className="text-[10px] text-muted-foreground">/{t.maxUsers}</span>
                </div>
                <span className="text-sm font-medium text-foreground text-center">{t.residents.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground text-center">{t.plan}</span>
                <span className="text-[11px] text-muted-foreground text-right">{t.lastActive}</span>
                <button
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors justify-self-center"
                  onClick={(e) => { e.stopPropagation(); }}
                >
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/20">
          <span className="text-xs text-muted-foreground">Showing {filtered.length} of {tenants.length} barangays</span>
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" disabled>
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <span className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-lg">1</span>
            <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" disabled>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Tenant Detail Drawer */}
      {selectedTenant && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelectedTenant(null)} />
          <div className="fixed right-0 top-0 bottom-0 w-[420px] bg-card border-l border-border z-50 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-foreground">{selectedTenant.name}</h2>
                <button onClick={() => setSelectedTenant(null)} className="p-1.5 rounded-lg hover:bg-muted">
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 mb-6">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: statusConfig[selectedTenant.status].bg, color: statusConfig[selectedTenant.status].color }}>
                  {selectedTenant.status}
                </span>
                <span className="text-xs text-muted-foreground">ID: {selectedTenant.id}</span>
              </div>

              {/* Info Grid */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Municipality", value: selectedTenant.municipality, icon: MapPin },
                    { label: "Province", value: selectedTenant.province, icon: MapPin },
                    { label: "Plan", value: selectedTenant.plan, icon: Building2 },
                    { label: "Monthly Fee", value: `P${selectedTenant.monthlyFee.toLocaleString()}`, icon: Building2 },
                    { label: "Users", value: `${selectedTenant.users} / ${selectedTenant.maxUsers}`, icon: Users },
                    { label: "Residents", value: selectedTenant.residents.toLocaleString(), icon: Users },
                    { label: "Documents", value: selectedTenant.documents.toLocaleString(), icon: FileText },
                    { label: "Last Active", value: selectedTenant.lastActive, icon: Clock },
                  ].map((item) => (
                    <div key={item.label} className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{item.label}</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Subscription Period */}
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Subscription Period</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm text-foreground">{selectedTenant.subscriptionStart} to {selectedTenant.subscriptionEnd}</span>
                  </div>
                </div>

                {/* Contact Person */}
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Contact Person</p>
                  <p className="text-sm font-semibold text-foreground">{selectedTenant.contactPerson}</p>
                  <p className="text-xs text-muted-foreground">{selectedTenant.contactEmail}</p>
                  <p className="text-xs text-muted-foreground">{selectedTenant.contactPhone}</p>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                    <ExternalLink className="w-4 h-4" /> Open Barangay Dashboard
                  </button>
                  <div className="grid grid-cols-3 gap-2">
                    <button className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors">
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors">
                      <Power className="w-3.5 h-3.5" /> {selectedTenant.status === "Suspended" ? "Enable" : "Suspend"}
                    </button>
                    <button className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
