"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  ChevronRight,
  MapPin,
  MoreVertical,
  X,
} from "lucide-react";
import { MabiniInsightBanner } from "@/components/mabini-insight-banner";

const tenants = [
  { id: 1, name: "Brgy. Tambo", municipality: "Paranaque", province: "Metro Manila", status: "Active", users: 8, residents: 12450, docs: 342, plan: "Professional", fee: "P2,500", lastActive: "2 min ago", contact: "Kap. Maria Santos" },
  { id: 2, name: "Brgy. San Jose", municipality: "Olongapo", province: "Zambales", status: "Active", users: 5, residents: 8920, docs: 218, plan: "Standard", fee: "P1,500", lastActive: "15 min ago", contact: "Kap. Juan dela Cruz" },
  { id: 3, name: "Brgy. Mabayuan", municipality: "Olongapo", province: "Zambales", status: "Active", users: 4, residents: 6340, docs: 156, plan: "Standard", fee: "P1,500", lastActive: "1 hr ago", contact: "Kap. Pedro Reyes" },
  { id: 4, name: "Brgy. Kalaklan", municipality: "Olongapo", province: "Zambales", status: "Trial", users: 2, residents: 4210, docs: 23, plan: "Starter", fee: "P800", lastActive: "3 hrs ago", contact: "Kap. Ana Morales" },
  { id: 5, name: "Brgy. Pag-asa", municipality: "Olongapo", province: "Zambales", status: "Expired", users: 0, residents: 5670, docs: 89, plan: "Standard", fee: "P1,500", lastActive: "2 weeks ago", contact: "Kap. Roberto Lim" },
  { id: 6, name: "Brgy. East Bajac-Bajac", municipality: "Olongapo", province: "Zambales", status: "Active", users: 6, residents: 9870, docs: 287, plan: "Professional", fee: "P2,500", lastActive: "30 min ago", contact: "Kap. Elena Gutierrez" },
  { id: 7, name: "Brgy. West Tapinac", municipality: "Olongapo", province: "Zambales", status: "Active", users: 3, residents: 5430, docs: 164, plan: "Starter", fee: "P800", lastActive: "45 min ago", contact: "Kap. Marco Rivera" },
  { id: 8, name: "Brgy. San Miguel", municipality: "San Marcelino", province: "Zambales", status: "Suspended", users: 0, residents: 3200, docs: 45, plan: "Standard", fee: "P1,500", lastActive: "1 month ago", contact: "Kap. Rosa Garcia" },
];

const statusColors: Record<string, string> = {
  Active: "#22c55e",
  Trial: "#f59e0b",
  Expired: "#ef4444",
  Suspended: "#94a3b8",
};

export default function BcmpTenantsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedTenant, setSelectedTenant] = useState<typeof tenants[0] | null>(null);

  const filtered = tenants.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.municipality.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || t.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    All: tenants.length,
    Active: tenants.filter((t) => t.status === "Active").length,
    Trial: tenants.filter((t) => t.status === "Trial").length,
    Expired: tenants.filter((t) => t.status === "Expired").length,
    Suspended: tenants.filter((t) => t.status === "Suspended").length,
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>BCMP</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium">Barangay Tenants</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Barangay Tenants</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage all registered barangays on kapitan.ph</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white text-sm font-semibold hover:from-orange-700 hover:to-amber-700 transition-all shadow-lg shadow-orange-500/20">
          <Plus className="w-4 h-4" />
          Add Barangay
        </button>
      </div>

      <MabiniInsightBanner message="3 barangays on trial plans expire this week. Consider reaching out for conversion to paid plans." />

      {/* Status tabs */}
      <div className="flex items-center gap-2">
        {Object.entries(counts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === status
                ? "bg-blue-600 text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {status} ({count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search barangays..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-input-border bg-input-bg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-4 px-5 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
          <span>Barangay</span>
          <span className="w-16 text-center">Status</span>
          <span className="w-14 text-center">Users</span>
          <span className="w-20 text-center">Residents</span>
          <span className="w-14 text-center">Docs</span>
          <span className="w-24 text-center">Plan</span>
          <span className="w-24 text-right">Last Active</span>
        </div>
        <div className="divide-y divide-border">
          {filtered.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelectedTenant(t)}
              className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-4 items-center px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ background: statusColors[t.status] || "#94a3b8" }}>
                  {t.name.split(" ").pop()?.charAt(0) || "B"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {t.municipality}, {t.province}
                  </p>
                </div>
              </div>
              <span className="w-16 text-center">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ background: `${statusColors[t.status]}15`, color: statusColors[t.status] }}>
                  {t.status}
                </span>
              </span>
              <span className="w-14 text-center text-xs font-medium text-foreground">{t.users}</span>
              <span className="w-20 text-center text-xs font-medium text-foreground">{t.residents.toLocaleString()}</span>
              <span className="w-14 text-center text-xs font-medium text-foreground">{t.docs}</span>
              <span className="w-24 text-center text-[10px] font-medium text-foreground">{t.plan}</span>
              <span className="w-24 text-right text-[10px] text-muted-foreground">{t.lastActive}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detail drawer */}
      {selectedTenant && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelectedTenant(null)} />
          <div className="fixed right-0 top-0 h-full w-[400px] bg-card border-l border-border z-50 overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-foreground">{selectedTenant.name}</h2>
                <button onClick={() => setSelectedTenant(null)} className="p-1.5 rounded-lg hover:bg-muted">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Municipality", value: selectedTenant.municipality },
                    { label: "Province", value: selectedTenant.province },
                    { label: "Plan", value: selectedTenant.plan },
                    { label: "Monthly Fee", value: selectedTenant.fee },
                    { label: "Contact Person", value: selectedTenant.contact },
                    { label: "Status", value: selectedTenant.status },
                    { label: "Users", value: selectedTenant.users },
                    { label: "Residents", value: selectedTenant.residents.toLocaleString() },
                  ].map((f) => (
                    <div key={f.label} className="p-3 rounded-lg bg-muted/30">
                      <p className="text-[10px] text-muted-foreground font-medium">{f.label}</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{f.value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <button className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors">
                    Open Dashboard
                  </button>
                  <button className="px-3 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    Edit
                  </button>
                  <button className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
