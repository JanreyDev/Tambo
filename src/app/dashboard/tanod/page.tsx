"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  Bot,
  Calendar,
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

function FormInput({ label, name, value, placeholder, required, type, error, onChange }: { label: string; name: string; value: string; placeholder?: string; required?: boolean; type?: string; error?: string; onChange: (name: string, value: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type || "text"} value={value} onChange={(e) => onChange(name, e.target.value)} placeholder={placeholder} className={cn("w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2", error ? "border-red-500 focus:ring-red-300" : "border-border focus:ring-accent-ring")} />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormSelect({ label, name, value, options, required, error, onChange }: { label: string; name: string; value: string; options: string[]; required?: boolean; error?: string; onChange: (name: string, value: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select value={value} onChange={(e) => onChange(name, e.target.value)} className={cn("w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2", error ? "border-red-500 focus:ring-red-300" : "border-border focus:ring-accent-ring")}>
        {options.map((o) => <option key={o} value={o}>{o || "\u2014 Select \u2014"}</option>)}
      </select>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormTextarea({ label, name, value, placeholder, rows, required, error, onChange }: { label: string; name: string; value: string; placeholder?: string; rows?: number; required?: boolean; error?: string; onChange: (name: string, value: string) => void }) {
  return (
    <div className="col-span-2">
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <textarea value={value} onChange={(e) => onChange(name, e.target.value)} placeholder={placeholder} rows={rows || 3} className={cn("w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 resize-none", error ? "border-red-500 focus:ring-red-300" : "border-border focus:ring-accent-ring")} />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default function TanodPage() {
  const router = useRouter();
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

  // Form validation state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [scheduleFormErrors, setScheduleFormErrors] = useState<Record<string, string>>({});

  // Delete tracking state (to show names in confirmation)
  const [deleteMember, setDeleteMember] = useState<TanodMember | null>(null);
  const [deleteSchedule, setDeleteSchedule] = useState<PatrolSchedule | null>(null);

  // Toast notification state
  const [toasts, setToasts] = useState<{id: string; type: "success"|"error"|"warning"|"info"; title: string; message?: string}[]>([]);
  const addToast = useCallback((type: "success"|"error"|"warning"|"info", title: string, message?: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

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
    setFormErrors({});
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
    setFormErrors({});
    setShowEdit(true);
    setActionMenu(null);
  };

  const openScheduleCreate = () => {
    setScheduleForm({});
    setScheduleFormErrors({});
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
    setScheduleFormErrors({});
    setShowScheduleEdit(true);
    setScheduleActionMenu(null);
  };

  const handleFieldChange = (name: string, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    setFormErrors((e) => { const next = { ...e }; delete next[name]; return next; });
  };
  const handleScheduleFieldChange = (name: string, value: string) => {
    setScheduleForm((f) => ({ ...f, [name]: value }));
    setScheduleFormErrors((e) => { const next = { ...e }; delete next[name]; return next; });
  };

  const validateMemberForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.full_name?.trim()) errors.full_name = "Full name is required";
    if (!form.contact_number?.trim()) errors.contact_number = "Contact number is required";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) { setFormTab(0); }
    return Object.keys(errors).length === 0;
  };

  const validateScheduleForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!scheduleForm.patrol_date?.trim()) errors.patrol_date = "Patrol date is required";
    if (!scheduleForm.shift?.trim()) errors.shift = "Shift is required";
    if (!scheduleForm.area?.trim()) errors.area = "Area/purok is required";
    if (!scheduleForm.members?.trim()) errors.members = "At least one assigned tanod is required";
    setScheduleFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleMemberSave = () => {
    if (!validateMemberForm()) return;
    if (showEdit) {
      addToast("success", "Member Updated", "Tanod member record has been updated successfully.");
    } else {
      addToast("success", "Member Added", "New tanod member has been registered successfully.");
    }
    setShowCreate(false);
    setShowEdit(false);
  };

  const handleScheduleSave = () => {
    if (!validateScheduleForm()) return;
    if (showScheduleEdit) {
      addToast("success", "Schedule Updated", "Patrol schedule has been updated successfully.");
    } else {
      addToast("success", "Patrol Scheduled", "New patrol schedule has been created successfully.");
    }
    setShowSchedule(false);
    setShowScheduleEdit(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Barangay Tanod"
        description="Manage tanod members and patrol schedules"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Operations" }, { label: "Tanod" }]}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => addToast("info", "Export Started", "Tanod records are being exported...")} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><Download className="h-4 w-4" /> Export</button>
            {activeTab === "members" ? (
              <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors shadow-sm" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}><Plus className="h-4 w-4" /> Add Member</button>
            ) : (
              <button onClick={openScheduleCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors shadow-sm" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}><Plus className="h-4 w-4" /> Schedule Patrol</button>
            )}
          </div>
        }
      />

      {/* Mabini AI Insight */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-accent-primary/20 bg-accent-bg/30">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--accent-primary)", opacity: 0.15 }}>
          <Bot className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Mabini AI Tanod Operations</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            3 tanod members on duty tonight. Purok 5 had the most incidents last week — consider increasing patrol coverage. 1 member&apos;s ID is expiring within 30 days.
          </p>
        </div>
        <button onClick={() => router.push("/dashboard/ai")} className="shrink-0 px-3 py-1.5 text-[10px] font-semibold rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--accent-primary)", color: "#fff" }}>
          Ask Mabini
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Members" value={mockMembers.length} icon={<Shield className="h-5 w-5" />} />
        <StatCard label="Active" value={activeMembers} icon={<UserCheck className="h-5 w-5" />} />
        <StatCard label="On Duty Tonight" value={onDutyTonight.reduce((sum, s) => sum + s.team.length, 0)} icon={<Moon className="h-5 w-5" />} />
        <StatCard label="Incidents This Week" value={mockSchedules.reduce((sum, s) => sum + s.incidents_reported, 0)} icon={<Shield className="h-5 w-5" />} />
      </div>

      <div className="flex items-center gap-1 p-1 rounded-lg glass-subtle w-fit">
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
          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring" />
      </div>

      {activeTab === "members" && (
        <div className="rounded-xl glass overflow-hidden">
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
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Shield className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground text-center">No tanod records found</p>
                        <p className="text-xs text-muted-foreground mt-1 text-center">Register barangay tanod members to manage patrol schedules and duty rosters.</p>
                      </div>
                      <button onClick={() => openCreate()} className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
                        + Add Tanod Member
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredMembers.map((m) => (
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
                        <div className="absolute right-0 top-8 z-20 w-44 glass rounded-lg shadow-lg py-1">
                          <button onClick={() => { setViewMember(m); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Eye className="h-3.5 w-3.5" /> View</button>
                          <button onClick={() => openEdit(m)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Edit className="h-3.5 w-3.5" /> Edit</button>
                          <button onClick={() => { setDeleteMember(m); setShowDelete(true); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-muted flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
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
          {filteredSchedules.length === 0 && (
            <div className="rounded-xl glass px-4 py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground text-center">No patrol schedules found</p>
                  <p className="text-xs text-muted-foreground mt-1 text-center">Create patrol schedules to assign tanod members to shifts and coverage areas.</p>
                </div>
                <button onClick={() => openScheduleCreate()} className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
                  + Schedule Patrol
                </button>
              </div>
            </div>
          )}
          {filteredSchedules.map((s) => (
            <div key={s.id} className={cn("p-4 rounded-xl border glass", s.status === "ongoing" && "border-accent-primary/50 bg-accent-bg/30")}>
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
                      <div className="absolute right-0 top-8 z-20 w-44 glass rounded-lg shadow-lg py-1">
                        <button onClick={() => openScheduleEdit(s)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Edit className="h-3.5 w-3.5" /> Edit</button>
                        <button onClick={() => { setDeleteSchedule(s); setShowScheduleDelete(true); setScheduleActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-muted flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
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
          {formTab < memberFormTabs.length - 1 ? <ModalButton variant="primary" onClick={() => setFormTab((t) => t + 1)}>Next</ModalButton> : <ModalButton variant="primary" onClick={handleMemberSave}>{showEdit ? "Update" : "Save"}</ModalButton>}
        </>}>
        <div className="flex border-b border-border mb-6">
          {memberFormTabs.map((tab, i) => (
            <button key={tab} onClick={() => setFormTab(i)} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors", formTab === i ? "border-accent-primary text-accent-text" : "border-transparent text-muted-foreground hover:text-foreground")}>{tab}</button>
          ))}
        </div>
        {formTab === 0 && (
          <div className="grid grid-cols-2 gap-4">
            <FormInput onChange={handleFieldChange} label="Full Name" name="full_name" value={form.full_name || ""} placeholder="e.g. Ricardo Garcia" required error={formErrors.full_name} />
            <FormInput onChange={handleFieldChange} label="Contact Number" name="contact_number" value={form.contact_number || ""} placeholder="e.g. 0917-000-0000" required error={formErrors.contact_number} />
            <FormInput onChange={handleFieldChange} label="Address" name="address" value={form.address || ""} placeholder="e.g. 123 Main St." />
            <FormSelect onChange={handleFieldChange} label="Purok" name="purok" value={form.purok || ""} options={["", "Sampaguita", "Rosal", "Ilang-Ilang", "Dahlia", "Sunflower", "Orchid", "Jasmine"]} />
            <FormInput onChange={handleFieldChange} label="Date of Birth" name="date_of_birth" value={form.date_of_birth || ""} type="date" />
            <FormSelect onChange={handleFieldChange} label="Sex" name="sex" value={form.sex || ""} options={["", "Male", "Female"]} />
          </div>
        )}
        {formTab === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <FormSelect onChange={handleFieldChange} label="Position" name="position" value={form.position || ""} options={["", "Chief Tanod", "Deputy Chief", "Tanod Member"]} />
            <FormInput onChange={handleFieldChange} label="Date Appointed" name="date_appointed" value={form.date_appointed || ""} type="date" />
            <FormSelect onChange={handleFieldChange} label="Status" name="status" value={form.status || ""} options={["", "Active", "Inactive", "On Leave"]} />
            <div>
              <FormInput onChange={handleFieldChange} label="Training Completed" name="training_completed" value={form.training_completed || ""} placeholder="e.g. Basic Tanod Training" />
              <p className="text-[10px] text-muted-foreground mt-1">Include DILG-accredited trainings and certifications.</p>
            </div>
            <div>
              <FormInput onChange={handleFieldChange} label="ID Number" name="id_number" value={form.id_number || ""} placeholder="e.g. TNO-2026-001" />
              <p className="text-[10px] text-muted-foreground mt-1">Assigned by the Barangay Peace and Order Committee.</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Schedule Patrol Form Modal */}
      <Modal open={showSchedule || showScheduleEdit} onClose={() => { setShowSchedule(false); setShowScheduleEdit(false); }} title={showScheduleEdit ? "Edit Patrol Schedule" : "Schedule Patrol"} size="lg"
        footer={<>
          <ModalButton variant="secondary" onClick={() => { setShowSchedule(false); setShowScheduleEdit(false); }}>Cancel</ModalButton>
          <ModalButton variant="primary" onClick={handleScheduleSave}>{showScheduleEdit ? "Update" : "Save"}</ModalButton>
        </>}>
        <div className="grid grid-cols-2 gap-4">
          <FormInput onChange={handleScheduleFieldChange} label="Patrol Date" name="patrol_date" value={scheduleForm.patrol_date || ""} type="date" required error={scheduleFormErrors.patrol_date} />
          <div>
            <FormSelect onChange={handleScheduleFieldChange} label="Shift" name="shift" value={scheduleForm.shift || ""} options={["", "Day Shift (6AM-6PM)", "Night Shift (6PM-6AM)"]} required error={scheduleFormErrors.shift} />
            <p className="text-[10px] text-muted-foreground mt-1">Standard shifts: 6PM-12MN, 12MN-6AM. Adjust based on barangay needs.</p>
          </div>
          <FormInput onChange={handleScheduleFieldChange} label="Area" name="area" value={scheduleForm.area || ""} placeholder="e.g. Purok Sampaguita & Rosal" required error={scheduleFormErrors.area} />
          <FormInput onChange={handleScheduleFieldChange} label="Team Leader" name="team_leader" value={scheduleForm.team_leader || ""} placeholder="e.g. Ricardo Garcia" />
          <FormTextarea onChange={handleScheduleFieldChange} label="Members" name="members" value={scheduleForm.members || ""} placeholder="Enter names, one per line" rows={4} required error={scheduleFormErrors.members} />
          <FormTextarea onChange={handleScheduleFieldChange} label="Notes" name="notes" value={scheduleForm.notes || ""} placeholder="Additional notes..." rows={4} />
        </div>
      </Modal>

      {/* Delete Member Confirmation */}
      <Modal open={showDelete} onClose={() => { setShowDelete(false); setDeleteMember(null); }} title="Confirm Delete" description="This action cannot be undone." size="sm"
        footer={<><ModalButton variant="secondary" onClick={() => { setShowDelete(false); setDeleteMember(null); }}>Cancel</ModalButton><ModalButton variant="danger" onClick={() => { addToast("success", "Member Deleted", `${deleteMember?.name} has been removed from the tanod roster.`); setShowDelete(false); setDeleteMember(null); }}>Delete</ModalButton></>}>
        <p className="text-sm text-muted-foreground">Are you sure you want to delete <strong>{deleteMember?.name}</strong> ({deleteMember?.position}) from the tanod roster? This action cannot be undone.</p>
      </Modal>

      {/* Delete Schedule Confirmation */}
      <Modal open={showScheduleDelete} onClose={() => { setShowScheduleDelete(false); setDeleteSchedule(null); }} title="Confirm Delete" description="This action cannot be undone." size="sm"
        footer={<><ModalButton variant="secondary" onClick={() => { setShowScheduleDelete(false); setDeleteSchedule(null); }}>Cancel</ModalButton><ModalButton variant="danger" onClick={() => { addToast("success", "Schedule Deleted", `Patrol schedule for ${deleteSchedule?.area} has been removed.`); setShowScheduleDelete(false); setDeleteSchedule(null); }}>Delete</ModalButton></>}>
        <p className="text-sm text-muted-foreground">Are you sure you want to delete the patrol schedule for <strong>{deleteSchedule?.area}</strong> on <strong>{deleteSchedule?.date}</strong> ({deleteSchedule?.shift})? This action cannot be undone.</p>
      </Modal>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          {toasts.map((toast) => (
            <div key={toast.id} onClick={() => dismissToast(toast.id)} className={cn(
              "px-4 py-3 rounded-xl shadow-lg border cursor-pointer min-w-[300px] max-w-[400px] animate-in slide-in-from-right-5",
              toast.type === "success" && "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800",
              toast.type === "error" && "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800",
              toast.type === "warning" && "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800",
              toast.type === "info" && "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800",
            )}>
              <p className={cn("text-sm font-semibold",
                toast.type === "success" && "text-emerald-800 dark:text-emerald-200",
                toast.type === "error" && "text-red-800 dark:text-red-200",
                toast.type === "warning" && "text-amber-800 dark:text-amber-200",
                toast.type === "info" && "text-blue-800 dark:text-blue-200",
              )}>{toast.title}</p>
              {toast.message && <p className={cn("text-xs mt-0.5",
                toast.type === "success" && "text-emerald-600 dark:text-emerald-400",
                toast.type === "error" && "text-red-600 dark:text-red-400",
                toast.type === "warning" && "text-amber-600 dark:text-amber-400",
                toast.type === "info" && "text-blue-600 dark:text-blue-400",
              )}>{toast.message}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
