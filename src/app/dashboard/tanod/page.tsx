"use client";

import { useState } from "react";
import {
  Shield,
  Plus,
  Search,
  Download,
  Users,
  MapPin,
  Moon,
  Sun,
  Phone,
  UserCheck,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
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
  { id: "5", name: "Antonio Reyes", position: "Tanod", contact: "0921-999-0000", purok_assignment: "Sampaguita", status: "inactive", shift: "\u2014", joined_date: "2022-01-15" },
  { id: "6", name: "Carlos Bautista", position: "Tanod", contact: "0922-111-3333", purok_assignment: "Rosal", status: "active", shift: "Night", joined_date: "2024-03-01" },
];

const mockSchedules: PatrolSchedule[] = [
  { id: "1", date: "2026-03-07", shift: "Night (10PM-6AM)", area: "Purok Sampaguita & Rosal", team: ["Mario Santos", "Carlos Bautista"], status: "ongoing", incidents_reported: 0 },
  { id: "2", date: "2026-03-07", shift: "Day (6AM-2PM)", area: "Purok Dahlia & Ilang-Ilang", team: ["Ricardo Garcia", "Fernando Cruz"], status: "completed", incidents_reported: 1 },
  { id: "3", date: "2026-03-06", shift: "Night (10PM-6AM)", area: "All Puroks", team: ["Jose Mendoza", "Carlos Bautista", "Mario Santos"], status: "completed", incidents_reported: 0 },
  { id: "4", date: "2026-03-08", shift: "Night (10PM-6AM)", area: "Purok Dahlia & Ilang-Ilang", team: ["Jose Mendoza", "Fernando Cruz"], status: "scheduled", incidents_reported: 0 },
];

const memberFormTabs = ["Personal", "Service"];

export default function TanodPage() {
  const [activeTab, setActiveTab] = useState<"members" | "schedule">("members");
  const [search, setSearch] = useState("");
  const [viewMember, setViewMember] = useState<TanodMember | null>(null);

  // Member form state
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [formTab, setFormTab] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({});
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  // Patrol schedule form state
  const [showSchedule, setShowSchedule] = useState(false);
  const [showScheduleEdit, setShowScheduleEdit] = useState(false);
  const [showScheduleDelete, setShowScheduleDelete] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<Record<string, string>>({});
  const [scheduleActionMenu, setScheduleActionMenu] = useState<string | null>(null);

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

  const openCreate = () => {
    setForm({});
    setFormTab(0);
    setShowCreate(true);
  };

  const openEdit = (m: TanodMember) => {
    setForm({
      full_name: m.name,
      contact_number: m.contact,
      purok: m.purok_assignment,
      position: m.position,
      date_appointed: m.joined_date,
      status: m.status === "active" ? "Active" : "Inactive",
    });
    setFormTab(0);
    setShowEdit(true);
    setActionMenu(null);
  };

  const openScheduleCreate = () => {
    setScheduleForm({});
    setShowSchedule(true);
  };

  const openScheduleEdit = (s: PatrolSchedule) => {
    setScheduleForm({
      patrol_date: s.date,
      shift: s.shift,
      area: s.area,
      members: s.team.join("\n"),
      team_leader: s.team[0] || "",
    });
    setShowScheduleEdit(true);
    setScheduleActionMenu(null);
  };

  const Input = ({ label, name, value, placeholder, required, type }: { label: string; name: string; value: string; placeholder?: string; required?: boolean; type?: string }) => (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type || "text"} value={value} onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))} placeholder={placeholder} className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring" />
    </div>
  );

  const Select = ({ label, name, value, options, required }: { label: string; name: string; value: string; options: string[]; required?: boolean }) => (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select value={value} onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
        {options.map((o) => <option key={o} value={o}>{o || "\u2014 Select \u2014"}</option>)}
      </select>
    </div>
  );

  const Textarea = ({ label, name, value, placeholder, rows, required }: { label: string; name: string; value: string; placeholder?: string; rows?: number; required?: boolean }) => (
    <div className="col-span-2">
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <textarea value={value} onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))} placeholder={placeholder} rows={rows || 3} className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none" />
    </div>
  );

  // Schedule form helpers (use scheduleForm state)
  const ScheduleInput = ({ label, name, value, placeholder, required, type }: { label: string; name: string; value: string; placeholder?: string; required?: boolean; type?: string }) => (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type || "text"} value={value} onChange={(e) => setScheduleForm((f) => ({ ...f, [name]: e.target.value }))} placeholder={placeholder} className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring" />
    </div>
  );

  const ScheduleSelect = ({ label, name, value, options, required }: { label: string; name: string; value: string; options: string[]; required?: boolean }) => (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select value={value} onChange={(e) => setScheduleForm((f) => ({ ...f, [name]: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
        {options.map((o) => <option key={o} value={o}>{o || "\u2014 Select \u2014"}</option>)}
      </select>
    </div>
  );

  const ScheduleTextarea = ({ label, name, value, placeholder, rows, required }: { label: string; name: string; value: string; placeholder?: string; rows?: number; required?: boolean }) => (
    <div className="col-span-2">
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <textarea value={value} onChange={(e) => setScheduleForm((f) => ({ ...f, [name]: e.target.value }))} placeholder={placeholder} rows={rows || 3} className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none" />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Barangay Tanod"
        description="Manage tanod members and patrol schedules"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Operations" }, { label: "Tanod" }]}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><Download className="h-4 w-4" /> Export</button>
            {activeTab === "members" ? (
              <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}><Plus className="h-4 w-4" /> Add Member</button>
            ) : (
              <button onClick={openScheduleCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}><Plus className="h-4 w-4" /> Schedule Patrol</button>
            )}
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
                <th className="w-10 px-2 py-3"></th>
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
                    {m.shift !== "\u2014" && (
                      <span className="inline-flex items-center gap-1 text-xs">
                        {m.shift === "Night" ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />} {m.shift}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                  <td className="px-2 py-3">
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setActionMenu(actionMenu === m.id ? null : m.id)} className="p-1.5 rounded hover:bg-muted"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></button>
                      {actionMenu === m.id && (
                        <div className="absolute right-0 top-8 z-20 w-44 bg-card border border-border rounded-lg shadow-lg py-1">
                          <button onClick={() => { setViewMember(m); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Eye className="h-3.5 w-3.5" /> View</button>
                          <button onClick={() => openEdit(m)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Edit className="h-3.5 w-3.5" /> Edit</button>
                          <button onClick={() => { setShowDelete(true); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-muted flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                        </div>
                      )}
                    </div>
                  </td>
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
                <div className="flex items-center gap-2">
                  {s.incidents_reported > 0 && <Badge variant="danger">{s.incidents_reported} incident{s.incidents_reported > 1 ? "s" : ""}</Badge>}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setScheduleActionMenu(scheduleActionMenu === s.id ? null : s.id)} className="p-1.5 rounded hover:bg-muted"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></button>
                    {scheduleActionMenu === s.id && (
                      <div className="absolute right-0 top-8 z-20 w-44 bg-card border border-border rounded-lg shadow-lg py-1">
                        <button onClick={() => openScheduleEdit(s)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Edit className="h-3.5 w-3.5" /> Edit</button>
                        <button onClick={() => { setShowScheduleDelete(true); setScheduleActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-muted flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Member Modal */}
      <Modal open={!!viewMember} onClose={() => setViewMember(null)} title={viewMember?.name || ""} description={viewMember?.position || ""} size="md"
        footer={<><ModalButton variant="secondary" onClick={() => setViewMember(null)}>Close</ModalButton><ModalButton variant="primary" onClick={() => { if (viewMember) { openEdit(viewMember); setViewMember(null); } }}>Edit Member</ModalButton></>}>
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

      {/* Create/Edit Member Form Modal */}
      <Modal open={showCreate || showEdit} onClose={() => { setShowCreate(false); setShowEdit(false); }} title={showEdit ? "Edit Member" : "Add New Member"} size="lg"
        footer={<>
          <ModalButton variant="secondary" onClick={() => { setShowCreate(false); setShowEdit(false); }}>Cancel</ModalButton>
          {formTab > 0 && <ModalButton variant="secondary" onClick={() => setFormTab((t) => t - 1)}>Previous</ModalButton>}
          {formTab < memberFormTabs.length - 1 ? <ModalButton variant="primary" onClick={() => setFormTab((t) => t + 1)}>Next</ModalButton> : <ModalButton variant="primary">{showEdit ? "Update" : "Save"}</ModalButton>}
        </>}>
        <div className="flex border-b border-border mb-6">
          {memberFormTabs.map((tab, i) => (
            <button key={tab} onClick={() => setFormTab(i)} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors", formTab === i ? "border-accent-primary text-accent-text" : "border-transparent text-muted-foreground hover:text-foreground")}>{tab}</button>
          ))}
        </div>
        {formTab === 0 && (
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" name="full_name" value={form.full_name || ""} placeholder="e.g. Ricardo Garcia" required />
            <Input label="Contact Number" name="contact_number" value={form.contact_number || ""} placeholder="e.g. 0917-000-0000" required />
            <Input label="Address" name="address" value={form.address || ""} placeholder="e.g. 123 Main St." />
            <Select label="Purok" name="purok" value={form.purok || ""} options={["", "Sampaguita", "Rosal", "Ilang-Ilang", "Dahlia", "Sunflower", "Orchid", "Jasmine"]} />
            <Input label="Date of Birth" name="date_of_birth" value={form.date_of_birth || ""} type="date" />
            <Select label="Sex" name="sex" value={form.sex || ""} options={["", "Male", "Female"]} />
          </div>
        )}
        {formTab === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <Select label="Position" name="position" value={form.position || ""} options={["", "Chief Tanod", "Deputy Chief", "Tanod Member"]} />
            <Input label="Date Appointed" name="date_appointed" value={form.date_appointed || ""} type="date" />
            <Select label="Status" name="status" value={form.status || ""} options={["", "Active", "Inactive", "On Leave"]} />
            <Input label="Training Completed" name="training_completed" value={form.training_completed || ""} placeholder="e.g. Basic Tanod Training" />
            <Input label="ID Number" name="id_number" value={form.id_number || ""} placeholder="e.g. TNO-2026-001" />
          </div>
        )}
      </Modal>

      {/* Schedule Patrol Form Modal */}
      <Modal open={showSchedule || showScheduleEdit} onClose={() => { setShowSchedule(false); setShowScheduleEdit(false); }} title={showScheduleEdit ? "Edit Patrol Schedule" : "Schedule Patrol"} size="lg"
        footer={<>
          <ModalButton variant="secondary" onClick={() => { setShowSchedule(false); setShowScheduleEdit(false); }}>Cancel</ModalButton>
          <ModalButton variant="primary">{showScheduleEdit ? "Update" : "Save"}</ModalButton>
        </>}>
        <div className="grid grid-cols-2 gap-4">
          <ScheduleInput label="Patrol Date" name="patrol_date" value={scheduleForm.patrol_date || ""} type="date" required />
          <ScheduleSelect label="Shift" name="shift" value={scheduleForm.shift || ""} options={["", "Day Shift (6AM-6PM)", "Night Shift (6PM-6AM)"]} />
          <ScheduleInput label="Area" name="area" value={scheduleForm.area || ""} placeholder="e.g. Purok Sampaguita & Rosal" required />
          <ScheduleInput label="Team Leader" name="team_leader" value={scheduleForm.team_leader || ""} placeholder="e.g. Ricardo Garcia" />
          <ScheduleTextarea label="Members" name="members" value={scheduleForm.members || ""} placeholder="Enter names, one per line" rows={4} />
          <ScheduleTextarea label="Notes" name="notes" value={scheduleForm.notes || ""} placeholder="Additional notes..." rows={4} />
        </div>
      </Modal>

      {/* Delete Member Confirmation */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Confirm Delete" description="This action cannot be undone." size="sm"
        footer={<><ModalButton variant="secondary" onClick={() => setShowDelete(false)}>Cancel</ModalButton><ModalButton variant="danger" onClick={() => setShowDelete(false)}>Delete</ModalButton></>}>
        <p className="text-sm text-muted-foreground">Are you sure you want to delete this tanod member record?</p>
      </Modal>

      {/* Delete Schedule Confirmation */}
      <Modal open={showScheduleDelete} onClose={() => setShowScheduleDelete(false)} title="Confirm Delete" description="This action cannot be undone." size="sm"
        footer={<><ModalButton variant="secondary" onClick={() => setShowScheduleDelete(false)}>Cancel</ModalButton><ModalButton variant="danger" onClick={() => setShowScheduleDelete(false)}>Delete</ModalButton></>}>
        <p className="text-sm text-muted-foreground">Are you sure you want to delete this patrol schedule?</p>
      </Modal>
    </div>
  );
}
