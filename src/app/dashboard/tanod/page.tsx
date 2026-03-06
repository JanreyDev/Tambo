"use client";

import { useState } from "react";
import {
  Shield,
  Plus,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Clock,
  Calendar,
  Users,
  MapPin,
  Moon,
  Sun,
  Phone,
  UserCheck,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

interface TanodMember {
  id: string;
  name: string;
  position: string;
  contact: string;
  purok_assignment: string;
  status: string;
  shift: string;
  joined_date: string;
}

interface PatrolSchedule {
  id: string;
  date: string;
  shift: string;
  area: string;
  team: string[];
  status: string;
  incidents_reported: number;
}

const mockMembers: TanodMember[] = [
  { id: "1", name: "Ricardo Garcia", position: "Tanod Chief", contact: "0917-111-2222", purok_assignment: "All Puroks", status: "active", shift: "Day", joined_date: "2022-01-15" },
  { id: "2", name: "Mario Santos", position: "Deputy Chief", contact: "0918-333-4444", purok_assignment: "Sampaguita / Rosal", status: "active", shift: "Night", joined_date: "2022-01-15" },
  { id: "3", name: "Jose Mendoza", position: "Tanod", contact: "0919-555-6666", purok_assignment: "Dahlia", status: "active", shift: "Night", joined_date: "2022-06-01" },
  { id: "4", name: "Fernando Cruz", position: "Tanod", contact: "0920-777-8888", purok_assignment: "Ilang-Ilang", status: "active", shift: "Day", joined_date: "2023-01-10" },
  { id: "5", name: "Antonio Reyes", position: "Tanod", contact: "0921-999-0000", purok_assignment: "Sampaguita", status: "inactive", shift: "—", joined_date: "2022-01-15" },
  { id: "6", name: "Carlos Bautista", position: "Tanod", contact: "0922-111-3333", purok_assignment: "Rosal", status: "active", shift: "Night", joined_date: "2024-03-01" },
];

const mockSchedules: PatrolSchedule[] = [
  { id: "1", date: "2026-03-07", shift: "Night (10PM-6AM)", area: "Purok Sampaguita & Rosal", team: ["Mario Santos", "Carlos Bautista"], status: "ongoing", incidents_reported: 0 },
  { id: "2", date: "2026-03-07", shift: "Day (6AM-2PM)", area: "Purok Dahlia & Ilang-Ilang", team: ["Ricardo Garcia", "Fernando Cruz"], status: "completed", incidents_reported: 1 },
  { id: "3", date: "2026-03-06", shift: "Night (10PM-6AM)", area: "All Puroks", team: ["Jose Mendoza", "Carlos Bautista", "Mario Santos"], status: "completed", incidents_reported: 0 },
  { id: "4", date: "2026-03-08", shift: "Night (10PM-6AM)", area: "Purok Dahlia & Ilang-Ilang", team: ["Jose Mendoza", "Fernando Cruz"], status: "scheduled", incidents_reported: 0 },
];

export default function TanodPage() {
  const [activeTab, setActiveTab] = useState<"members" | "schedule">("members");
  const [search, setSearch] = useState("");
  const [viewMember, setViewMember] = useState<TanodMember | null>(null);

  const activeMembers = mockMembers.filter((m) => m.status === "active").length;
  const onDutyTonight = mockSchedules.filter((s) => s.date === "2026-03-07" && s.shift.includes("Night") && s.status === "ongoing");

  const filteredMembers = mockMembers.filter((m) => {
    if (search) {
      const q = search.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.position.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredSchedules = mockSchedules.filter((s) => {
    if (search) return s.area.toLowerCase().includes(search.toLowerCase()) || s.team.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Barangay Tanod"
        description="Manage tanod members and patrol schedules"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Operations" }, { label: "Tanod" }]}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><Download className="h-4 w-4" /> Export</button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}><Plus className="h-4 w-4" /> Add Member</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Members" value={mockMembers.length} icon={<Shield className="h-5 w-5" />} />
        <StatCard label="Active" value={activeMembers} icon={<UserCheck className="h-5 w-5" />} />
        <StatCard label="On Duty Tonight" value={onDutyTonight.reduce((sum, s) => sum + s.team.length, 0)} icon={<Moon className="h-5 w-5" />} />
        <StatCard label="Incidents This Week" value={mockSchedules.reduce((sum, s) => sum + s.incidents_reported, 0)} icon={<Shield className="h-5 w-5" />} />
      </div>

      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border w-fit">
        <button onClick={() => setActiveTab("members")}
          className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors",
            activeTab === "members" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          Members ({mockMembers.length})
        </button>
        <button onClick={() => setActiveTab("schedule")}
          className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors",
            activeTab === "schedule" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          Patrol Schedule ({mockSchedules.length})
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={activeTab === "members" ? "Search members..." : "Search schedules..."}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring" />
      </div>

      {activeTab === "members" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Position</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Assignment</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Shift</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((m) => (
                <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setViewMember(m)}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{m.name}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {m.contact}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">{m.position}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{m.purok_assignment}</td>
                  <td className="px-4 py-3">
                    {m.shift !== "—" && (
                      <span className="inline-flex items-center gap-1 text-xs">
                        {m.shift === "Night" ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />} {m.shift}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "schedule" && (
        <div className="space-y-3">
          {filteredSchedules.map((s) => (
            <div key={s.id} className={cn("p-4 rounded-xl border bg-card", s.status === "ongoing" && "border-accent-primary/50 bg-accent-bg/30")}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-foreground">{s.date}</span>
                    <StatusBadge status={s.status === "ongoing" ? "active" : s.status === "completed" ? "completed" : "pending"} />
                    <Badge variant="muted">{s.shift}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {s.area}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Users className="h-3 w-3" /> {s.team.join(", ")}</p>
                </div>
                {s.incidents_reported > 0 && <Badge variant="danger">{s.incidents_reported} incident{s.incidents_reported > 1 ? "s" : ""}</Badge>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Member Modal */}
      <Modal open={!!viewMember} onClose={() => setViewMember(null)} title={viewMember?.name || ""} description={viewMember?.position || ""} size="md"
        footer={<><ModalButton variant="secondary" onClick={() => setViewMember(null)}>Close</ModalButton><ModalButton variant="primary">Edit Member</ModalButton></>}>
        {viewMember && (
          <div className="space-y-4">
            <StatusBadge status={viewMember.status} />
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div><p className="text-[11px] text-muted-foreground uppercase">Contact</p><p className="text-sm">{viewMember.contact}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Assignment</p><p className="text-sm">{viewMember.purok_assignment}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Shift</p><p className="text-sm">{viewMember.shift}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Joined</p><p className="text-sm">{viewMember.joined_date}</p></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
