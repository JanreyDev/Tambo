"use client";

import { useState } from "react";
import {
  Map,
  Layers,
  Users,
  Building2,
  MapPin,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Navigation,
  Bot,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { MabiniButton } from '@/components/ui/mabini-button';

interface MapLayer {
  id: string;
  name: string;
  icon: React.ElementType;
  enabled: boolean;
  color: string;
  count: number;
}

const mapLayers: MapLayer[] = [
  { id: "puroks", name: "Purok Boundaries", icon: MapPin, enabled: true, color: "#3b82f6", count: 8 },
  { id: "residents", name: "Households", icon: Users, enabled: false, color: "#22c55e", count: 612 },
  { id: "establishments", name: "Establishments", icon: Building2, enabled: false, color: "#f59e0b", count: 42 },
  { id: "hazards", name: "Hazard Zones", icon: AlertTriangle, enabled: false, color: "#ef4444", count: 3 },
  { id: "facilities", name: "Facilities", icon: Building2, enabled: true, color: "#8b5cf6", count: 6 },
];

const purokStats = [
  { name: "Purok Sampaguita", population: 523, households: 112, establishments: 15 },
  { name: "Purok Rosal", population: 487, households: 98, establishments: 8 },
  { name: "Purok Dahlia", population: 412, households: 85, establishments: 7 },
  { name: "Purok Ilang-Ilang", population: 380, households: 78, establishments: 5 },
  { name: "Purok Jasmine", population: 345, households: 72, establishments: 4 },
  { name: "Purok Camia", population: 298, households: 65, establishments: 2 },
  { name: "Purok Orchid", population: 234, households: 58, establishments: 1 },
  { name: "Purok Sunflower", population: 168, households: 44, establishments: 0 },
];

export default function MapPage() {
  const router = useRouter();
  const [layers, setLayers] = useState(mapLayers);
  const [selectedPurok, setSelectedPurok] = useState<string | null>(null);

  const toggleLayer = (id: string) => {
    setLayers((prev) => prev.map((l) => l.id === id ? { ...l, enabled: !l.enabled } : l));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Barangay Map"
        description="Interactive map with purok boundaries, household locations, and facilities"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Map" }]}
      />

      {/* Mabini AI Insight */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-accent-primary/20 bg-accent-bg/30">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--accent-primary)", opacity: 0.15 }}>
          <Bot className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Mabini AI Spatial Analysis</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            Purok Sampaguita has the highest population density (1,820 residents). 2 hazard zones overlap with residential areas. 3 establishments are outside mapped purok boundaries.
          </p>
        </div>
        <button onClick={() => router.push("/dashboard/ai")} className="shrink-0 px-3 py-1.5 text-[10px] font-semibold rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--accent-primary)", color: "#fff" }}>
          Ask Mabini
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Map Area */}
        <div className="xl:col-span-3">
          <div className="rounded-xl glass overflow-hidden" style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}>
            {/* Map Placeholder */}
            <div className="relative w-full h-full bg-muted/30 flex items-center justify-center">
              {/* Map controls */}
              <div className="absolute top-4 right-4 flex flex-col gap-1">
                <button className="p-2 rounded-lg glass shadow-sm hover:bg-muted"><ZoomIn className="h-4 w-4" /></button>
                <button className="p-2 rounded-lg glass shadow-sm hover:bg-muted"><ZoomOut className="h-4 w-4" /></button>
                <button className="p-2 rounded-lg glass shadow-sm hover:bg-muted"><Maximize2 className="h-4 w-4" /></button>
                <button className="p-2 rounded-lg glass shadow-sm hover:bg-muted"><Navigation className="h-4 w-4" /></button>
              </div>

              {/* Placeholder content */}
              <div className="text-center">
                <Map className="h-16 w-16 mx-auto mb-4" style={{ color: "var(--accent-primary)", opacity: 0.3 }} />
                <p className="text-sm text-muted-foreground mb-1">Leaflet + OpenStreetMap</p>
                <p className="text-xs text-muted-foreground">Interactive map will load here with purok boundaries,<br />household pins, establishment markers, and facility locations.</p>
                <p className="text-xs text-muted-foreground mt-4 font-mono">Center: 14.8385° N, 120.2840° E (Olongapo, Zambales)</p>
              </div>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 p-3 rounded-lg glass shadow-sm">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Legend</p>
                <div className="space-y-1">
                  {layers.filter((l) => l.enabled).map((l) => (
                    <div key={l.id} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
                      <span className="text-[11px] text-foreground">{l.name} ({l.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Layers */}
          <div className="p-4 rounded-xl glass">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Map Layers</h3>
            </div>
            <div className="space-y-2">
              {layers.map((l) => {
                const Icon = l.icon;
                return (
                  <button key={l.id} onClick={() => toggleLayer(l.id)}
                    className={cn("w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition-colors",
                      l.enabled ? "bg-muted/50" : "hover:bg-muted/30")}>
                    <div className="w-3 h-3 rounded-sm border" style={{ background: l.enabled ? l.color : "transparent", borderColor: l.color }} />
                    <Icon className="h-4 w-4" style={{ color: l.enabled ? l.color : "var(--muted-foreground)" }} />
                    <span className={cn("text-xs flex-1", l.enabled ? "text-foreground font-medium" : "text-muted-foreground")}>{l.name}</span>
                    <span className="text-[10px] text-muted-foreground">{l.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Purok Stats */}
          <div className="p-4 rounded-xl glass">
            <h3 className="text-sm font-semibold text-foreground mb-3">Purok Statistics</h3>
            <div className="space-y-2">
              {purokStats.map((p) => (
                <button key={p.name} onClick={() => setSelectedPurok(selectedPurok === p.name ? null : p.name)}
                  className={cn("w-full p-2 rounded-lg text-left transition-colors",
                    selectedPurok === p.name ? "bg-accent-bg border border-accent-primary/30" : "hover:bg-muted/30")}>
                  <p className="text-xs font-medium text-foreground">{p.name}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                    <span>{p.population} residents</span>
                    <span>{p.households} households</span>
                    <span>{p.establishments} businesses</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <MabiniButton pageContext="You are on the Barangay Map page. This page shows geospatial information including resident locations, puroks, and barangay boundaries." />
    </div>
  );
}
