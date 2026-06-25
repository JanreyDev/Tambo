"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Map, MapPin, Users, AlertTriangle, Loader2,
  Navigation,
  Activity, BarChart3, Search, X,
  Layers, Building2, Shield,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { MabiniButton } from "@/components/ui/mabini-button";
import { api } from "@/lib/api";
import type {
  MapResident,
  MapHazardPin,
  MapEvacuationCenter,
  MapEstablishment,
  BaseLayer,
} from "@/components/map/all-residents-map-dynamic";
import AllResidentsMap from "@/components/map/all-residents-map-dynamic";
import type { GeoJsonFeatureCollection } from "@/lib/types";
import { isPointInsideBoundary } from "@/lib/geo";

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

  // Boundary (auto-fetched from OSM at onboarding via BarangayObserver)
  const [boundary, setBoundary] = useState<GeoJsonFeatureCollection | null>(null);

  // Residents data
  const [residents, setResidents] = useState<MapResident[]>([]);
  const [loadingResidents, setLoadingResidents] = useState(true);
  const [residentsError, setResidentsError] = useState(false);
  const [totalResidents, setTotalResidents] = useState(0);
  const [mappedCount, setMappedCount] = useState(0);

  // Stats
  const [stats, setStats] = useState<MapStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Overlay layer data
  const [hazardPins, setHazardPins] = useState<MapHazardPin[]>([]);
  const [evacuationCenters, setEvacuationCenters] = useState<MapEvacuationCenter[]>([]);
  const [establishments, setEstablishments] = useState<MapEstablishment[]>([]);

  // UI state
  const [selectedResident, setSelectedResident] = useState<MapResident | null>(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState<string | null>(null);
  const [activePurokFilter, setActivePurokFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"puroks" | "status" | "resident">("puroks");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Map appearance + overlay toggles
  const [baseLayer, setBaseLayer] = useState<BaseLayer>("streets");
  const [showHazards, setShowHazards] = useState(false);
  const [showEvacuation, setShowEvacuation] = useState(false);
  const [showEstablishments, setShowEstablishments] = useState(false);
  const [cluster, setCluster] = useState(true);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [hoverCoords, setHoverCoords] = useState<{ lat: number; lng: number } | null>(null);

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

  // ── Load map residents (also returns boundary GeoJSON) ──────────────
  const loadResidents = useCallback(() => {
    setLoadingResidents(true);
    setResidentsError(false);
    api.map.residents()
      .then((res) => {
        setResidents(res.residents);
        setTotalResidents(res.total);
        setMappedCount(res.mapped);
        setBoundary(res.barangay?.boundary_geojson ?? null);
        // If barangay has its own lat/lng (more authoritative), use it
        if (res.barangay?.latitude !== null && res.barangay?.latitude !== undefined && res.barangay.longitude !== null && res.barangay.longitude !== undefined) {
          setCenterLat(Number(res.barangay.latitude));
          setCenterLng(Number(res.barangay.longitude));
        }
        setLastRefresh(new Date());
      })
      .catch(() => setResidentsError(true))
      .finally(() => setLoadingResidents(false));
  }, []);

  // ── Load overlay layers (hazards, evacuation, establishments) ───────
  const loadLayers = useCallback(() => {
    api.map.layers()
      .then((res) => {
        setHazardPins(res.hazard_pins);
        setEvacuationCenters(res.evacuation_centers);
        setEstablishments(res.establishments);
      })
      .catch(() => {});
  }, []);

  // ── Manual boundary refresh (admin tool) ────────────────────────────
  const [refreshingBoundary, setRefreshingBoundary] = useState(false);
  const refreshBoundary = useCallback(async () => {
    setRefreshingBoundary(true);
    try {
      const res = await api.map.refreshBoundary();
      if (res.fetched && res.boundary_geojson) {
        setBoundary(res.boundary_geojson);
      }
    } catch {
      // silent — admin can retry
    } finally {
      setRefreshingBoundary(false);
    }
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
      loadLayers();
    }, 0);
    return () => clearTimeout(timer);
  }, [centerLoaded, loadResidents, loadStats, loadLayers]);

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

  // ── Detect residents whose pins fall outside the barangay boundary ───
  // Returns Set<resident.id>. Empty set when no boundary is set (cannot know).
  const outsideBoundaryIds = useMemo(() => {
    const set = new Set<string>();
    if (!boundary) return set;
    for (const r of residents) {
      if (!isPointInsideBoundary(r.latitude, r.longitude, boundary)) {
        set.add(r.id);
      }
    }
    return set;
  }, [residents, boundary]);

  const outsideBoundaryCount = outsideBoundaryIds.size;

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
    <div className="flex flex-col h-[calc(100vh-80px)] gap-0 p-4 lg:p-6 -mt-1">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <PageHeader
        title="Barangay Map"
        description="Household location map — one pin per registered household"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Map" }]}
        className="mb-3 shrink-0"
      />

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
                placeholder="Search households on map..."
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

          {/* Pin count + Layers button overlay */}
          {!loadingResidents && (
            <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-background/95 backdrop-blur-sm border border-border text-[11px] shadow-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="font-semibold text-foreground">{filteredResidents.length}</span>
                <span className="text-muted-foreground">households visible</span>
              </div>
              <button
                onClick={() => setShowLayerPanel((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg backdrop-blur-sm border text-[11px] shadow-sm font-semibold transition-colors",
                  showLayerPanel
                    ? "bg-accent-primary text-white border-accent-primary"
                    : "bg-background/95 text-foreground border-border hover:bg-muted"
                )}
                title="Layers"
              >
                <Layers className="h-3.5 w-3.5" />
                Layers
              </button>
            </div>
          )}

          {/* Layer panel — pop out below the Layers button */}
          {showLayerPanel && (
            <div className="absolute top-14 right-3 z-[1001] w-64 rounded-xl bg-background/98 backdrop-blur-sm border border-border shadow-2xl p-3 space-y-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Base Map</p>
                <div className="grid grid-cols-3 gap-1">
                  {(["streets", "satellite", "light"] as const).map((bl) => (
                    <button
                      key={bl}
                      onClick={() => setBaseLayer(bl)}
                      className={cn(
                        "px-2 py-1.5 rounded-lg text-[10px] font-semibold capitalize transition-colors",
                        baseLayer === bl ? "bg-accent-primary text-white" : "bg-muted hover:bg-muted/70 text-foreground"
                      )}
                    >
                      {bl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Overlays</p>
                <div className="space-y-1.5">
                  {[
                    { label: "Hazard Pins", count: hazardPins.length, icon: AlertTriangle, color: "text-red-500", checked: showHazards, onChange: setShowHazards },
                    { label: "Evacuation Centers", count: evacuationCenters.length, icon: Shield, color: "text-blue-500", checked: showEvacuation, onChange: setShowEvacuation },
                    { label: "Establishments", count: establishments.length, icon: Building2, color: "text-violet-500", checked: showEstablishments, onChange: setShowEstablishments },
                  ].map(({ label, count, icon: Icon, color, checked, onChange }) => (
                    <label key={label} className="flex items-center gap-2 cursor-pointer hover:bg-muted/40 rounded-lg p-1.5 transition-colors">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => onChange(e.target.checked)}
                        className="h-3.5 w-3.5 rounded accent-blue-500"
                      />
                      <Icon className={cn("h-3.5 w-3.5", color)} />
                      <span className="flex-1 text-xs font-medium text-foreground">{label}</span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">{count}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Options</p>
                <label className="flex items-center gap-2 cursor-pointer hover:bg-muted/40 rounded-lg p-1.5 transition-colors">
                  <input
                    type="checkbox"
                    checked={cluster}
                    onChange={(e) => setCluster(e.target.checked)}
                    className="h-3.5 w-3.5 rounded accent-blue-500"
                  />
                  <span className="flex-1 text-xs font-medium text-foreground">Cluster pins at low zoom</span>
                </label>
              </div>

              <div className="pt-2 border-t border-border">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Barangay Boundary</p>
                {boundary ? (
                  <div className="flex items-start gap-2 text-[10px] text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1" />
                    <span className="leading-relaxed">Boundary loaded from OpenStreetMap. <button onClick={refreshBoundary} disabled={refreshingBoundary} className="text-accent-primary font-semibold hover:underline disabled:opacity-50">{refreshingBoundary ? "Refreshing..." : "Re-fetch"}</button></span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2 text-[10px] text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1" />
                      <span className="leading-relaxed">No boundary set. Try fetching from OSM.</span>
                    </div>
                    <button
                      onClick={refreshBoundary}
                      disabled={refreshingBoundary}
                      className="w-full px-2 py-1.5 text-[10px] font-semibold rounded-lg bg-accent-primary text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {refreshingBoundary ? "Fetching..." : "Fetch Boundary"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Coordinate hover readout */}
          {hoverCoords && (
            <div className="absolute bottom-3 right-3 z-[1000] px-2.5 py-1.5 rounded-lg bg-background/95 backdrop-blur-sm border border-border shadow-sm font-mono text-[10px] text-muted-foreground">
              {hoverCoords.lat.toFixed(6)}, {hoverCoords.lng.toFixed(6)}
            </div>
          )}

          {/* Legend overlay — household pin */}
          <div className="absolute bottom-3 left-3 z-[1000] p-2.5 rounded-lg bg-background/95 backdrop-blur-sm border border-border shadow-sm">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Legend</p>
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white shadow-sm flex items-center justify-center">
                <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <span className="text-foreground">Household</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] mt-1">
              <div className="w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white shadow-sm flex items-center justify-center">
                <span className="text-white font-bold text-[7px]">!</span>
              </div>
              <span className="text-muted-foreground">Outside boundary</span>
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
          ) : (
            <AllResidentsMap
              residents={filteredResidents}
              centerLat={centerLat}
              centerLng={centerLng}
              selectedId={selectedResident?.id ?? null}
              onSelect={handleSelectResident}
              className="w-full h-full"
              boundary={boundary}
              baseLayer={baseLayer}
              showHazards={showHazards}
              showEvacuation={showEvacuation}
              showEstablishments={showEstablishments}
              hazardPins={hazardPins}
              evacuationCenters={evacuationCenters}
              establishments={establishments}
              cluster={cluster}
              outsideBoundaryIds={outsideBoundaryIds}
              onCoordinateHover={(lat, lng) =>
                lat !== null && lng !== null
                  ? setHoverCoords({ lat, lng })
                  : setHoverCoords(null)
              }
            />
          )}
        </div>

        {/* ── Right sidebar ─────────────────────────────────────────────── */}
        <div className="w-72 shrink-0 flex flex-col gap-3 overflow-y-auto hidden lg:flex">

          {/* Quick stats — 2x2 grid */}
          <div className="grid grid-cols-2 gap-2 shrink-0">
            {[
              { label: "Total Households", value: loadingStats ? "..." : totalResidents.toLocaleString(), icon: Users, color: "text-blue-600" },
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
              <p className="text-xs font-semibold text-foreground">Household Coverage</p>
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

          {/* Outside-boundary warning */}
          {outsideBoundaryCount > 0 && (
            <div className="p-3 rounded-xl border border-amber-300/60 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/40 shrink-0">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                    {outsideBoundaryCount} pin{outsideBoundaryCount > 1 ? "s" : ""} outside barangay
                  </p>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400/80 mt-0.5 leading-relaxed">
                    Coordinates fall outside the registered boundary. Edit each resident profile and verify their pin.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs: Puroks / Status / Selected */}
          <div className="flex-1 flex flex-col glass rounded-xl overflow-hidden min-h-0">
            <div className="flex border-b border-border shrink-0">
              {[
                { id: "puroks", label: "Puroks", icon: <BarChart3 className="h-3 w-3" /> },
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

              {activeTab === "resident" && selectedResident && (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground leading-tight">{selectedResident.full_name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">HH# {selectedResident.resident_number}</p>
                    </div>
                    <button onClick={clearResident} className="shrink-0 p-1 rounded-lg hover:bg-muted transition-colors">
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    {[
                      { label: "Purok", value: selectedResident.purok || "Not indicated" },
                      ...(selectedResident.member_count ? [{ label: "Members", value: `${selectedResident.member_count} member${selectedResident.member_count !== 1 ? "s" : ""}` }] : []),
                      ...(selectedResident.address ? [{ label: "Address", value: selectedResident.address }] : []),
                      { label: "Latitude", value: selectedResident.latitude.toFixed(7), mono: true },
                      { label: "Longitude", value: selectedResident.longitude.toFixed(7), mono: true },
                    ].map(({ label, value, mono }) => (
                      <div key={label} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-muted/30">
                        <span className="text-muted-foreground shrink-0">{label}</span>
                        <span className={cn("font-semibold text-right text-foreground", mono && "font-mono text-[10px]")}>{value}</span>
                      </div>
                    ))}
                  </div>
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

      <MabiniButton pageContext="You are on the Barangay Map page. This page shows all residents that have GPS coordinates as live pins on a Google Map. Stats show total residents, mapped count, coverage percentage, per-purok breakdown, and per-status breakdown." />
    </div>
  );
}
