"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Plus,
  Download,
  MapPin,
  Users,
  ShieldAlert,
  Package,
  Flame,
  Waves,
  Wind,
  Phone,
  Calendar,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";

interface DisasterEvent {
  id: string;
  event_name: string;
  event_type: string;
  severity: string;
  date: string;
  status: string;
  affected_puroks: string[];
  affected_families: number;
  evacuees: number;
  evacuation_center: string;
  relief_distributed: boolean;
  notes: string;
}

interface EvacuationCenter {
  id: string;
  name: string;
  location: string;
  capacity: number;
  current_occupancy: number;
  status: string;
}

const mockEvents: DisasterEvent[] = [
  { id: "1", event_name: "Typhoon Aghon", event_type: "Typhoon", severity: "high", date: "2026-02-20", status: "resolved", affected_puroks: ["Sampaguita", "Rosal", "Dahlia"], affected_families: 45, evacuees: 180, evacuation_center: "Barangay Covered Court", relief_distributed: true, notes: "All evacuees returned home after 3 days. Minor flooding in low-lying areas." },
  { id: "2", event_name: "Flash Flood - March 2026", event_type: "Flood", severity: "medium", date: "2026-03-02", status: "monitoring", affected_puroks: ["Ilang-Ilang"], affected_families: 12, evacuees: 48, evacuation_center: "Barangay Multi-Purpose Hall", relief_distributed: true, notes: "Caused by heavy rain. Water level subsiding. BDRRMC on standby." },
  { id: "3", event_name: "Fire Incident - Purok Sampaguita", event_type: "Fire", severity: "low", date: "2026-01-15", status: "resolved", affected_puroks: ["Sampaguita"], affected_families: 2, evacuees: 8, evacuation_center: "Neighbor residence", relief_distributed: true, notes: "Kitchen fire in residential area. BFP responded. 2 houses partially damaged." },
];

const mockCenters: EvacuationCenter[] = [
  { id: "1", name: "Barangay Covered Court", location: "Main Road, Purok Dahlia", capacity: 200, current_occupancy: 0, status: "available" },
  { id: "2", name: "Multi-Purpose Hall", location: "Barangay Hall Complex", capacity: 150, current_occupancy: 48, status: "in_use" },
  { id: "3", name: "Barangay Elementary School", location: "School Road, Purok Rosal", capacity: 300, current_occupancy: 0, status: "available" },
];

export default function DisasterPage() {
  const [activeTab, setActiveTab] = useState<"events" | "centers" | "preparedness">("events");

  const eventIcon = (type: string) => {
    switch (type) {
      case "Typhoon": return <Wind className="h-5 w-5 text-blue-500" />;
      case "Flood": return <Waves className="h-5 w-5 text-cyan-500" />;
      case "Fire": return <Flame className="h-5 w-5 text-red-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    }
  };

  const totalEvacuees = mockEvents.filter((e) => e.status === "monitoring").reduce((sum, e) => sum + e.evacuees, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disaster / DRRM"
        description="Disaster Risk Reduction and Management"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Operations" }, { label: "Disaster/DRRM" }]}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><Download className="h-4 w-4" /> Export Report</button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}><Plus className="h-4 w-4" /> Log Event</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Events This Year" value={mockEvents.length} icon={<AlertTriangle className="h-5 w-5" />} />
        <StatCard label="Active Monitoring" value={mockEvents.filter((e) => e.status === "monitoring").length} icon={<ShieldAlert className="h-5 w-5" />} />
        <StatCard label="Current Evacuees" value={totalEvacuees} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Evac Centers" value={mockCenters.length} icon={<MapPin className="h-5 w-5" />} />
      </div>

      {totalEvacuees > 0 && (
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Active Situation: {totalEvacuees} evacuees currently sheltered</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">BDRRMC is on standby. Relief goods distribution ongoing.</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border w-fit">
        {(["events", "centers", "preparedness"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize",
              activeTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {tab === "centers" ? "Evacuation Centers" : tab}
          </button>
        ))}
      </div>

      {activeTab === "events" && (
        <div className="space-y-3">
          {mockEvents.map((e) => (
            <div key={e.id} className={cn("p-5 rounded-xl border bg-card", e.status === "monitoring" && "border-amber-300 dark:border-amber-700")}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted/50 shrink-0">{eventIcon(e.event_type)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-foreground">{e.event_name}</h3>
                    <StatusBadge status={e.status === "monitoring" ? "active" : e.status} />
                    <Badge variant={e.severity === "high" ? "danger" : e.severity === "medium" ? "warning" : "muted"}>{e.severity} severity</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{e.notes}</p>
                  <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {e.date}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.affected_puroks.join(", ")}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {e.affected_families} families / {e.evacuees} evacuees</span>
                    {e.relief_distributed && <span className="flex items-center gap-1"><Package className="h-3 w-3" /> Relief distributed</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "centers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {mockCenters.map((c) => {
            const occupancyPct = Math.round((c.current_occupancy / c.capacity) * 100);
            return (
              <div key={c.id} className="p-5 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">{c.name}</h3>
                  <Badge variant={c.status === "in_use" ? "warning" : "success"}>{c.status === "in_use" ? "In Use" : "Available"}</Badge>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3"><MapPin className="h-3 w-3" /> {c.location}</p>
                <div className="mb-2">
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                    <span>{c.current_occupancy} / {c.capacity} capacity</span>
                    <span>{occupancyPct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${occupancyPct}%`,
                      background: occupancyPct > 75 ? "#ef4444" : occupancyPct > 50 ? "#f59e0b" : "var(--accent-primary)"
                    }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "preparedness" && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-border bg-card">
            <h3 className="text-sm font-semibold text-foreground mb-3">BDRRMC Readiness Checklist</h3>
            <div className="space-y-2">
              {[
                { label: "Evacuation plan updated", done: true },
                { label: "Emergency contact list current", done: true },
                { label: "Relief goods stockpile adequate", done: true },
                { label: "Evacuation centers inspected", done: false },
                { label: "BDRRMC members trained (2026)", done: false },
                { label: "Early warning system functional", done: true },
                { label: "Community drill conducted (annual)", done: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={cn("w-5 h-5 rounded flex items-center justify-center text-white text-xs",
                    item.done ? "bg-emerald-500" : "bg-muted border border-border")}>
                    {item.done && "✓"}
                  </div>
                  <span className={cn("text-sm", item.done ? "text-foreground" : "text-muted-foreground")}>{item.label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">4 of 7 items complete (57%)</p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card">
            <h3 className="text-sm font-semibold text-foreground mb-3">Emergency Contacts</h3>
            <div className="space-y-2">
              {[
                { name: "Barangay Captain", contact: "0917-000-1111" },
                { name: "BDRRMC Chief", contact: "0918-000-2222" },
                { name: "PNP Station 7", contact: "(047) 222-3333" },
                { name: "BFP Olongapo", contact: "(047) 222-4444" },
                { name: "CDRRMO Olongapo", contact: "(047) 222-5555" },
              ].map((c, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{c.name}</span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {c.contact}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
