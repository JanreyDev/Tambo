"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  MoreHorizontal,
  Edit,
  Trash2,
  Bot,
  CloudRain,
  X,
  CheckCircle2,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
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

const formTabs = ["Event", "Impact", "Response"];

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

export default function DisasterPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"events" | "centers" | "preparedness">("events");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [formTab, setFormTab] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<DisasterEvent | null>(null);
  const [toasts, setToasts] = useState<{id: string; type: "success"|"error"|"warning"|"info"; title: string; message?: string}[]>([]);

  const addToast = useCallback((type: "success"|"error"|"warning"|"info", title: string, message?: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleFieldChange = (name: string, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.event_type) errors.event_type = "Event type is required";
    if (!form.event_name?.trim()) errors.event_name = "Event name is required";
    if (!form.date_started) errors.date_started = "Date is required";
    if (!form.severity) errors.severity = "Severity is required";
    if (!form.status) errors.status = "Status is required";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      // Jump to the tab containing the first error
      const eventTabFields = ["event_type", "event_name", "date_started", "severity"];
      const responseTabFields = ["status"];
      const errorKeys = Object.keys(errors);
      if (errorKeys.some((k) => eventTabFields.includes(k))) setFormTab(0);
      else if (errorKeys.some((k) => responseTabFields.includes(k))) setFormTab(2);
      return false;
    }
    return true;
  };

  const eventIcon = (type: string) => {
    switch (type) {
      case "Typhoon": return <Wind className="h-5 w-5 text-blue-500" />;
      case "Flood": return <Waves className="h-5 w-5 text-cyan-500" />;
      case "Fire": return <Flame className="h-5 w-5 text-red-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    }
  };

  const totalEvacuees = mockEvents.filter((e) => e.status === "monitoring").reduce((sum, e) => sum + e.evacuees, 0);

  const openCreate = () => {
    setForm({});
    setFormErrors({});
    setFormTab(0);
    setShowCreate(true);
  };

  const openEdit = (e: DisasterEvent) => {
    setForm({
      event_type: e.event_type,
      event_name: e.event_name,
      date_started: e.date,
      severity: e.severity === "high" ? "Level 3 - Major" : e.severity === "medium" ? "Level 2 - Moderate" : "Level 1 - Minor",
      affected_families: String(e.affected_families),
      affected_individuals: "",
      evacuated: String(e.evacuees),
      evacuation_center: e.evacuation_center,
      status: e.status === "monitoring" ? "Monitoring" : e.status === "resolved" ? "Resolved" : "Active",
      remarks: e.notes,
    });
    setFormErrors({});
    setFormTab(0);
    setShowEdit(true);
    setActionMenu(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disaster / DRRM"
        description="Disaster Risk Reduction and Management"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Operations" }, { label: "Disaster/DRRM" }]}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => addToast("info", "Export started", "Disaster report is being generated.")} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><Download className="h-4 w-4" /> Export Report</button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}><Plus className="h-4 w-4" /> Log Event</button>
          </div>
        }
      />

      {/* Mabini AI Insight */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-accent-primary/20 bg-accent-bg/30">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--accent-primary)", opacity: 0.15 }}>
          <Bot className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Mabini AI Disaster Readiness</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            BDRRMC readiness at 57% (4/7 tasks complete). Typhoon season approaching — verify evacuation center capacity. 1 event still in active monitoring status.
          </p>
        </div>
        <button onClick={() => router.push("/dashboard/ai")} className="shrink-0 px-3 py-1.5 text-[10px] font-semibold rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--accent-primary)", color: "#fff" }}>
          Ask Mabini
        </button>
      </div>

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

      <div className="flex items-center gap-1 p-1 rounded-lg glass-subtle w-fit">
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
          {mockEvents.length === 0 ? (
            <div className="p-12 rounded-xl glass flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <CloudRain className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground text-center">No disaster incidents recorded</p>
                  <p className="text-xs text-muted-foreground mt-1 text-center">Record incidents and manage evacuations when disasters occur in the barangay.</p>
                </div>
                <button onClick={() => openCreate()} className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
                  + Record Incident
                </button>
              </div>
            </div>
          ) : mockEvents.map((e) => (
            <div key={e.id} className={cn("p-5 rounded-xl border glass", e.status === "monitoring" && "border-amber-300 dark:border-amber-700")}>
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
                <div className="relative" onClick={(ev) => ev.stopPropagation()}>
                  <button onClick={() => setActionMenu(actionMenu === e.id ? null : e.id)} className="p-1.5 rounded hover:bg-muted"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></button>
                  {actionMenu === e.id && (
                    <div className="absolute right-0 top-8 z-20 w-44 glass rounded-lg shadow-lg py-1">
                      <button onClick={() => openEdit(e)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Edit className="h-3.5 w-3.5" /> Edit</button>
                      <button onClick={() => { setSelectedEvent(e); setShowDelete(true); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-muted flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                    </div>
                  )}
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
              <div key={c.id} className="p-5 rounded-xl glass">
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
          <div className="p-5 rounded-xl glass">
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
                    {item.done && "\u2713"}
                  </div>
                  <span className={cn("text-sm", item.done ? "text-foreground" : "text-muted-foreground")}>{item.label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">4 of 7 items complete (57%)</p>
          </div>

          <div className="p-5 rounded-xl glass">
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

      {/* Create/Edit Disaster Event Form Modal */}
      <Modal open={showCreate || showEdit} onClose={() => { setShowCreate(false); setShowEdit(false); }} title={showEdit ? "Edit Disaster Event" : "Log Disaster Event"} size="lg"
        footer={<>
          <ModalButton variant="secondary" onClick={() => { setShowCreate(false); setShowEdit(false); }}>Cancel</ModalButton>
          {formTab > 0 && <ModalButton variant="secondary" onClick={() => setFormTab((t) => t - 1)}>Previous</ModalButton>}
          {formTab < formTabs.length - 1 ? <ModalButton variant="primary" onClick={() => setFormTab((t) => t + 1)}>Next</ModalButton> : <ModalButton variant="primary" onClick={() => { if (validateForm()) { addToast("success", showEdit ? "Event updated" : "Event recorded", showEdit ? `"${form.event_name}" has been updated.` : `"${form.event_name}" has been logged.`); setShowCreate(false); setShowEdit(false); } }}>{showEdit ? "Update" : "Save"}</ModalButton>}
        </>}>
        <div className="flex border-b border-border mb-6">
          {formTabs.map((tab, i) => (
            <button key={tab} onClick={() => setFormTab(i)} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors", formTab === i ? "border-accent-primary text-accent-text" : "border-transparent text-muted-foreground hover:text-foreground")}>{tab}</button>
          ))}
        </div>
        {formTab === 0 && (
          <div className="grid grid-cols-2 gap-4">
            <FormSelect label="Event Type" name="event_type" value={form.event_type || ""} options={["", "Typhoon", "Flood", "Earthquake", "Fire", "Landslide", "Volcanic Activity", "Drought", "Epidemic", "Others"]} required error={formErrors.event_type} onChange={handleFieldChange} />
            <FormInput label="Event Name" name="event_name" value={form.event_name || ""} placeholder="e.g. Typhoon Aghon" required error={formErrors.event_name} onChange={handleFieldChange} />
            <FormInput label="Date Started" name="date_started" value={form.date_started || ""} type="date" required error={formErrors.date_started} onChange={handleFieldChange} />
            <FormInput label="Date Ended" name="date_ended" value={form.date_ended || ""} type="date" onChange={handleFieldChange} />
            <FormSelect label="Severity" name="severity" value={form.severity || ""} options={["", "Level 1 - Minor", "Level 2 - Moderate", "Level 3 - Major", "Level 4 - Catastrophic"]} required error={formErrors.severity} onChange={handleFieldChange} />
          </div>
        )}
        {formTab === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormInput label="Affected Families" name="affected_families" value={form.affected_families || ""} placeholder="e.g. 45" type="number" onChange={handleFieldChange} />
              <p className="text-[10px] text-muted-foreground mt-1">Count each household as one family. Include displaced and partially affected.</p>
            </div>
            <FormInput label="Affected Individuals" name="affected_individuals" value={form.affected_individuals || ""} placeholder="e.g. 180" type="number" onChange={handleFieldChange} />
            <FormInput label="Casualties" name="casualties" value={form.casualties || ""} placeholder="0" type="number" onChange={handleFieldChange} />
            <FormInput label="Injured" name="injured" value={form.injured || ""} placeholder="0" type="number" onChange={handleFieldChange} />
            <FormInput label="Evacuated" name="evacuated" value={form.evacuated || ""} placeholder="e.g. 180" type="number" onChange={handleFieldChange} />
            <FormInput label="Houses Damaged" name="houses_damaged" value={form.houses_damaged || ""} placeholder="0" type="number" onChange={handleFieldChange} />
            <FormInput label="Houses Destroyed" name="houses_destroyed" value={form.houses_destroyed || ""} placeholder="0" type="number" onChange={handleFieldChange} />
            <FormInput label="Estimated Cost" name="estimated_cost" value={form.estimated_cost || ""} placeholder="e.g. 500000" type="number" onChange={handleFieldChange} />
          </div>
        )}
        {formTab === 2 && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormInput label="Evacuation Center" name="evacuation_center" value={form.evacuation_center || ""} placeholder="e.g. Barangay Covered Court" onChange={handleFieldChange} />
              <p className="text-[10px] text-muted-foreground mt-1">Designated BDRRMC evacuation centers: schools, covered courts, barangay hall.</p>
            </div>
            <FormInput label="Relief Distributed" name="relief_distributed" value={form.relief_distributed || ""} placeholder="e.g. Food packs, water" onChange={handleFieldChange} />
            <FormInput label="Responding Agencies" name="responding_agencies" value={form.responding_agencies || ""} placeholder="e.g. BFP, PNP, CDRRMO" onChange={handleFieldChange} />
            <FormSelect label="Status" name="status" value={form.status || ""} options={["", "Active", "Monitoring", "Resolved", "Post-Recovery"]} required error={formErrors.status} onChange={handleFieldChange} />
            <FormTextarea label="Remarks" name="remarks" value={form.remarks || ""} placeholder="Additional notes about the event..." onChange={handleFieldChange} />
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={showDelete} onClose={() => { setShowDelete(false); setSelectedEvent(null); }} title="Confirm Delete" description="This action cannot be undone." size="sm"
        footer={<><ModalButton variant="secondary" onClick={() => { setShowDelete(false); setSelectedEvent(null); }}>Cancel</ModalButton><ModalButton variant="danger" onClick={() => { addToast("success", "Event deleted", `"${selectedEvent?.event_name}" has been removed.`); setShowDelete(false); setSelectedEvent(null); }}>Delete</ModalButton></>}>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <span className="font-semibold text-foreground">{selectedEvent?.event_name}</span> ({selectedEvent?.event_type})? This disaster event record will be permanently removed.
        </p>
      </Modal>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
          {toasts.map((toast) => (
            <div key={toast.id} className={cn(
              "flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg animate-in slide-in-from-right-5 fade-in duration-300",
              toast.type === "success" && "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800",
              toast.type === "error" && "bg-red-50 dark:bg-red-950/80 border-red-200 dark:border-red-800",
              toast.type === "warning" && "bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800",
              toast.type === "info" && "bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800",
            )}>
              <div className="shrink-0 mt-0.5">
                {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                {toast.type === "error" && <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />}
                {toast.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                {toast.type === "info" && <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-semibold",
                  toast.type === "success" && "text-emerald-800 dark:text-emerald-200",
                  toast.type === "error" && "text-red-800 dark:text-red-200",
                  toast.type === "warning" && "text-amber-800 dark:text-amber-200",
                  toast.type === "info" && "text-blue-800 dark:text-blue-200",
                )}>{toast.title}</p>
                {toast.message && <p className={cn("text-xs mt-0.5",
                  toast.type === "success" && "text-emerald-700 dark:text-emerald-300",
                  toast.type === "error" && "text-red-700 dark:text-red-300",
                  toast.type === "warning" && "text-amber-700 dark:text-amber-300",
                  toast.type === "info" && "text-blue-700 dark:text-blue-300",
                )}>{toast.message}</p>}
              </div>
              <button onClick={() => dismissToast(toast.id)} className="shrink-0 p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
