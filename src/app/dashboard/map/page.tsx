"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Map, MapPin, Users, AlertTriangle, Loader2,
  RefreshCw, Bot, Navigation, ChevronRight,
  Activity, BarChart3, Search, X, ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { MabiniButton } from "@/components/ui/mabini-button";
import { api } from "@/lib/api";
import type { MapResident } from "@/components/map/all-residents-map-dynamic";
import AllResidentsMap from "@/components/map/all-residents-map-dynamic";

// ── Types ────────────────────────────────────────────────────────────────────

interface MapStats {
  total: number;
  mapped: number;
  unmapped: number;
  coverage: number;
  by_purok: Array<{ purok: string; total: number; mapped: number }>;
  by_status: Array<{ status: string; count: number }>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  active:      "#22c55e",
  deceased:    "#64748b",
  transferred: "#f59e0b",
  archived:    "#ef4444",
};

const STATUS_BG: Record<string, string> = {
  active:      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  deceased:    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  transferred: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  archived:    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function MapPage() {
  const router = useRouter();

  // Map center — from barangay settings (onboarding coordinates)
  const [centerLat, setCenterLat] = useState<number>(14.5995); // fallback: Manila
  const [centerLng, setCenterLng] = useState<number>(120.9842);
  const [centerLoaded, setCenterLoaded] = useState(false);

  // Residents data
  const [residents, setResidents] = useState<MapResident[]>([]);
  // filteredResidents computed via useMemo below
  const [loadingResidents, setLoadingResidents] = useState(true);
  const [residentsError, setResidentsError] = useState(false);
  const [totalResidents, setTotalResidents] = useState(0);
  const [mappedCount, setMappedCount] = useState(0);

  // Stats
  const [stats, setStats] = useState<MapStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // UI state
  const [selectedResident, setSelectedResident] = useState<MapResident | null>(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState<string | null>(null);
  const [activePurokFilter, setActivePurokFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"puroks" | "status" | "resident">("puroks");
  const [refreshKey, setRefreshKey] = useState(0);

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // ── Load barangay center from settings ──────────────────────────────
  useEffect(() => {
    api.settings.get()
      .then((settings) => {
        if (settings.latitude && settings.longitude) {
          setCenterLat(Number(settings.latitude));
          setCenterLng(Number(settings.longitude));
        }
      })
      .catch(() => {})
      .finally(() => setCenterLoaded(true));
  }, []);

  // ── Load map residents ───────────────────────────────────────────────
  const loadResidents = useCallback(() => {
    setLoadingResidents(true);
    setResidentsError(false);
    api.map.residents()
      .then((res) => {
        setResidents(res.residents);
        setTotalResidents(res.total);
        setMappedCount(res.mapped);
        setLastRefresh(new Date());
      })
      .catch(() => setResidentsError(true))
      .finally(() => setLoadingResidents(false));
  }, []);

  // ── Load stats ───────────────────────────────────────────────────────
  const loadStats = useCallback(() => {
    setLoadingStats(true);
    api.map.stats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, []);

  useEffect(() => {
    if (!centerLoaded) return;
    const timer = setTimeout(() => {
      loadResidents();
      loadStats();
    }, 0);
    return () => clearTimeout(timer);
  }, [centerLoaded, loadResidents, loadStats, refreshKey]);

  // ── Apply filters (computed, not effect) ─────────────────────────────
  const filteredResidents = useMemo(() => {
    let result = residents;
    if (activeStatusFilter) result = result.filter((r) => r.status === activeStatusFilter);
    if (activePurokFilter) result = result.filter((r) => (r.purok ?? "Unclassified") === activePurokFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.full_name.toLowerCase().includes(q) ||
          r.resident_number.toLowerCase().includes(q) ||
          (r.purok ?? "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [residents, activeStatusFilter, activePurokFilter, search]);

  // ── Refresh ──────────────────────────────────────────────────────────
  const handleRefresh = () => {
    setSelectedResident(null);
    setRefreshKey((k) => k + 1);
  };

  // ── When resident selected, switch to resident tab ──────────────────
  const handleSelectResident = (r: MapResident) => {
    setSelectedResident(r);
    setActiveTab("resident");
  };

  const clearResident = () => {
    setSelectedResident(null);
    setActiveTab("puroks");
  };

  const coverage = totalResidents > 0 ? Math.round((mappedCount / totalResidents) * 100) : 0;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] gap-0 -mt-1">
      {/* ── Header bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1 pb-3 shrink-0">
        <PageHeader
          title="Barangay Map"
          description="Live resident location map — pins from registered coordinates"
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Map" }]}
          className="mb-0"
        />
        <div className="flex items-center gap-2 shrink-0">
          {/* Coverage pill */}
          {!loadingResidents && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span><span className="font-semibold text-foreground">{mappedCount}</span> / {totalResidents} mapped</span>
              <span className="text-accent-primary font-semibold">{coverage}%</span>
            </div>
          )}
          <button
            onClick={handleRefresh}
            disabled={loadingResidents}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3 w-3", loadingResidents && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Mabini AI Insight ──────────────────────────────────────────── */}
      <div className="flex items-start gap-3 px-4 py-2.5 rounded-xl border border-accent-primary/20 bg-accent-bg/30 mb-3 shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--accent-primary)", opacity: 0.15 }}>
          <Bot className="w-3.5 h-3.5" style={{ color: "var(--accent-primary)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Mabini AI — Spatial Analysis</p>
          {stats ? (
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              {mappedCount > 0
                ? `${mappedCount} of ${totalResidents} residents (${coverage}%) have location data.
                  ${stats.by_purok[0] ? `${stats.by_purok[0].purok} has the most residents (${stats.by_purok[0].total}).` : ""}
                  ${stats.unmapped > 0 ? ` ${stats.unmapped} residents still need coordinates — edit their profile to add a pin.` : " All residents are mapped."}`
                : `No residents have location coordinates yet. Edit a resident profile and use the map to drop a pin.`}
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground mt-0.5">Loading spatial analysis...</p>
          )}
        </div>
        <button
          onClick={() => router.push("/dashboard/ai")}
          className="shrink-0 px-3 py-1.5 text-[10px] font-semibold rounded-lg transition-colors hover:opacity-80"
          style={{ background: "var(--accent-primary)", color: "#fff" }}
        >
          Ask Mabini
        </button>
      </div>

      {/* ── Map + Sidebar ──────────────────────────────────────────────── */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* Map area */}
        <div className="flex-1 min-w-0 rounded-xl glass overflow-hidden relative">
          {/* Search overlay */}
          <div className="absolute top-3 left-3 z-[1000] flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search residents on map..."
                className="pl-8 pr-8 py-1.5 text-xs rounded-lg border border-border bg-background/95 backdrop-blur-sm shadow-sm w-56 focus:outline-none focus:ring-2 focus:ring-accent-ring"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {(activeStatusFilter || activePurokFilter) && (
              <button
                onClick={() => { setActiveStatusFilter(null); setActivePurokFilter(null); }}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border border-accent-primary/30 bg-accent-bg/80 backdrop-blur-sm text-accent-primary font-medium shadow-sm"
              >
                <X className="h-3 w-3" />
                Clear filter
              </button>
            )}
          </div>

          {/* Pin count overlay */}
          {!loadingResidents && (
            <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-background/95 backdrop-blur-sm border border-border text-[11px] shadow-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-semibold text-foreground">{filteredResidents.length}</span>
              <span className="text-muted-foreground">pins visible</span>
            </div>
          )}

          {/* Legend overlay */}
          <div className="absolute bottom-3 left-3 z-[1000] p-2.5 rounded-lg bg-background/95 backdrop-blur-sm border border-border shadow-sm">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Legend</p>
            <div className="space-y-1">
              {Object.entries(STATUS_COLOR).map(([status, color]) => (
                <button
                  key={status}
                  onClick={() => setActiveStatusFilter(activeStatusFilter === status ? null : status)}
                  className={cn(
                    "flex items-center gap-1.5 text-[10px] rounded px-1 py-0.5 transition-colors w-full text-left",
                    activeStatusFilter === status ? "bg-muted" : "hover:bg-muted/50"
                  )}
                >
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                  <span className="capitalize text-foreground">{status}</span>
                  {stats && (
                    <span className="ml-auto text-muted-foreground">
                      {stats.by_status.find((s) => s.status === status)?.count ?? 0}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Map or loading/error state */}
          {loadingResidents || !centerLoaded ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-accent-primary" />
                <p className="text-sm font-medium text-foreground">Loading resident locations...</p>
                <p className="text-xs text-muted-foreground mt-1">Fetching {totalResidents || "..."} residents</p>
              </div>
            </div>
          ) : residentsError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-amber-500" />
                <p className="text-sm font-medium text-foreground mb-2">Failed to load map data</p>
                <button onClick={loadResidents} className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent-primary text-white">
                  Try Again
                </button>
              </div>
            </div>
          ) : filteredResidents.length === 0 && residents.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
              <div className="text-center max-w-xs px-4">
                <Map className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm font-semibold text-foreground mb-1">No location data yet</p>
                <p className="text-xs text-muted-foreground">
                  Residents need coordinates to appear on the map. Open a resident profile, go to the Address tab, and drop a pin.
                </p>
              </div>
            </div>
          ) : (
            <AllResidentsMap
              residents={filteredResidents}
              centerLat={centerLat}
              centerLng={centerLng}
              selectedId={selectedResident?.id ?? null}
              onSelect={handleSelectResident}
              className="w-full h-full"
            />
          )}
        </div>

        {/* ── Right sidebar ─────────────────────────────────────────────── */}
        <div className="w-72 shrink-0 flex flex-col gap-3 overflow-y-auto">

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-2 shrink-0">
            {[
              { label: "Total Residents", value: loadingStats ? "..." : totalResidents.toLocaleString(), icon: Users, color: "text-blue-600" },
              { label: "Mapped", value: loadingStats ? "..." : mappedCount.toLocaleString(), icon: MapPin, color: "text-green-600" },
              { label: "Unmapped", value: loadingStats ? "..." : (totalResidents - mappedCount).toLocaleString(), icon: Navigation, color: "text-amber-600" },
              { label: "Coverage", value: loadingStats ? "..." : coverage + "%", icon: Activity, color: "text-purple-600" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="p-3 rounded-xl glass">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={cn("h-3.5 w-3.5", color)} />
                  <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
                </div>
                <p className="text-lg font-bold text-foreground tabular-nums">{value}</p>
              </div>
            ))}
          </div>

          {/* Coverage bar */}
          <div className="p-3 rounded-xl glass shrink-0">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-foreground">Mapping Coverage</p>
              <span className="text-xs font-bold text-accent-primary">{coverage}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${coverage}%`,
                  background: coverage >= 80 ? "#22c55e" : coverage >= 50 ? "#f59e0b" : "#ef4444",
                }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {coverage >= 80 ? "Excellent coverage" : coverage >= 50 ? "Moderate coverage — add more pins" : "Low coverage — many residents need location data"}
            </p>
          </div>

          {/* Tabs: Puroks / Status / Selected */}
          <div className="flex-1 flex flex-col glass rounded-xl overflow-hidden min-h-0">
            <div className="flex border-b border-border shrink-0">
              {[
                { id: "puroks", label: "Puroks", icon: <BarChart3 className="h-3 w-3" /> },
                { id: "status", label: "Status", icon: <Activity className="h-3 w-3" /> },
                { id: "resident", label: "Selected", icon: <MapPin className="h-3 w-3" />, disabled: !selectedResident },
              ].map(({ id, label, icon, disabled }) => (
                <button
                  key={id}
                  onClick={() => !disabled && setActiveTab(id as typeof activeTab)}
                  disabled={disabled}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 px-2 py-2.5 text-[10px] font-semibold transition-colors",
                    activeTab === id
                      ? "text-accent-primary border-b-2 border-accent-primary bg-accent-bg/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
                    disabled && "opacity-30 cursor-not-allowed"
                  )}
                >
                  {icon} {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3 min-h-0">

              {/* Puroks tab */}
              {activeTab === "puroks" && (
                <div className="space-y-1.5">
                  {loadingStats ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : stats?.by_purok.length ? (
                    stats.by_purok.map((p) => {
                      const pct = p.total > 0 ? Math.round((p.mapped / p.total) * 100) : 0;
                      const isActive = activePurokFilter === p.purok;
                      return (
                        <button
                          key={p.purok}
                          onClick={() => setActivePurokFilter(isActive ? null : p.purok)}
                          className={cn(
                            "w-full p-2.5 rounded-xl text-left transition-colors",
                            isActive ? "bg-accent-bg border border-accent-primary/30" : "hover:bg-muted/30 border border-transparent"
                          )}
                        >
                          <div className="flex items-start justify-between gap-1 mb-1.5">
                            <p className="text-xs font-semibold text-foreground leading-tight">{p.purok}</p>
                            <span className="text-[10px] text-muted-foreground shrink-0">{p.total} res.</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mb-1">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                background: pct >= 80 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444",
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>{p.mapped} mapped</span>
                            <span className="font-semibold">{pct}%</span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-8">No purok data</p>
                  )}
                </div>
              )}

              {/* Status tab */}
              {activeTab === "status" && (
                <div className="space-y-2">
                  {loadingStats ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : stats?.by_status.length ? (
                    <>
                      {stats.by_status.map((s) => {
                        const pct = totalResidents > 0 ? Math.round((s.count / totalResidents) * 100) : 0;
                        const isActive = activeStatusFilter === s.status;
                        return (
                          <button
                            key={s.status}
                            onClick={() => setActiveStatusFilter(isActive ? null : s.status)}
                            className={cn(
                              "w-full flex items-center gap-2.5 p-2.5 rounded-xl transition-colors text-left",
                              isActive ? "bg-accent-bg border border-accent-primary/30" : "hover:bg-muted/30 border border-transparent"
                            )}
                          >
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: STATUS_COLOR[s.status] ?? "#94a3b8" }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold capitalize text-foreground">{s.status}</span>
                                <span className="text-xs text-muted-foreground">{s.count.toLocaleString()}</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${pct}%`, background: STATUS_COLOR[s.status] ?? "#94a3b8" }}
                                />
                              </div>
                            </div>
                            <span className="text-[10px] text-muted-foreground shrink-0">{pct}%</span>
                          </button>
                        );
                      })}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-8">No status data</p>
                  )}
                </div>
              )}

              {/* Selected resident tab */}
              {activeTab === "resident" && selectedResident && (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground leading-tight">{selectedResident.full_name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{selectedResident.resident_number}</p>
                    </div>
                    <button onClick={clearResident} className="shrink-0 p-1 rounded-lg hover:bg-muted transition-colors">
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    {[
                      { label: "Purok", value: selectedResident.purok || "Not indicated" },
                      { label: "Sex", value: selectedResident.sex ? (selectedResident.sex === "M" ? "Male" : "Female") : "Not indicated" },
                      { label: "Latitude", value: selectedResident.latitude.toFixed(7), mono: true },
                      { label: "Longitude", value: selectedResident.longitude.toFixed(7), mono: true },
                    ].map(({ label, value, mono }) => (
                      <div key={label} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-muted/30">
                        <span className="text-muted-foreground shrink-0">{label}</span>
                        <span className={cn("font-semibold text-right text-foreground", mono && "font-mono text-[10px]")}>{value}</span>
                      </div>
                    ))}

                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <span className="text-muted-foreground">Status</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize",
                        STATUS_BG[selectedResident.status ?? ""] ?? "bg-muted text-muted-foreground"
                      )}>
                        {selectedResident.status ?? "unknown"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/dashboard/residents/${selectedResident.id}`)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-colors"
                    style={{ background: "var(--accent-primary)", color: "#fff" }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View Full Profile
                    <ChevronRight className="h-3.5 w-3.5 ml-auto" />
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* Last refreshed */}
          <p className="text-[10px] text-muted-foreground text-center shrink-0 pb-1">
            Last updated: {lastRefresh.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      <MabiniButton pageContext="You are on the Barangay Map page. This page shows all residents that have GPS coordinates as live pins on a Leaflet map. Stats show total residents, mapped count, coverage percentage, per-purok breakdown, and per-status breakdown." />
    </div>
  );
}
