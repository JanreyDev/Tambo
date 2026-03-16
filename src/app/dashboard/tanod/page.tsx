// D:/dev/primex/bcmp-web/src/app/dashboard/tanod/page.tsx
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Plus,
  Search,
  Download,
  Users,
  MapPin,
  Moon,
  UserCheck,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Bot,
  Calendar,
  ClipboardList,
  FileWarning,
  Loader2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { MabiniButton } from "@/components/ui/mabini-button";
import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────

interface Tanod {
  id: string;
  barangay_id: string;
  resident_id: string;
  official_id: string | null;
  badge_number: string;
  appointment_date: string | null;
  appointed_by_id: string | null;
  beat_assignment: string | null;
  team: string | null;
  status: string;
  resident?: {
    id: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    extension_name: string | null;
  };
}

interface DutySchedule {
  id: string;
  tanod_id: string;
  scheduled_date: string;
  shift_start: string;
  shift_end: string;
  duty_type: string | null;
  area: string | null;
  notes: string | null;
  tanod?: { badge_number: string; team: string | null };
}

interface PatrolLog {
  id: string;
  tanod_id: string;
  started_at: string;
  ended_at: string | null;
  area_covered: string | null;
  km_covered: number | null;
  observations: string | null;
  tanod?: { badge_number: string };
}

interface IncidentReport {
  id: string;
  tanod_id: string;
  incident_date: string;
  incident_type: string | null;
  location: string | null;
  description: string | null;
  action_taken: string | null;
  persons_involved: string | null;
  tanod?: { badge_number: string };
}

interface TanodStats {
  total: number;
  active: number;
  inactive: number;
}

type ActiveTab = "members" | "schedules" | "patrol" | "incidents";

// ── Toast ─────────────────────────────────────────────────────────────────

interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
}

// ── Field components ───────────────────────────────────────────────────────

function FInput({
  label, name, value, placeholder, required, type, error, onChange,
}: {
  label: string; name: string; value: string; placeholder?: string;
  required?: boolean; type?: string; error?: string;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2",
          error ? "border-red-500 focus:ring-red-300" : "border-border focus:ring-accent-ring"
        )}
      />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FSelect({
  label, name, value, options, required, error, onChange,
}: {
  label: string; name: string; value: string;
  options: { value: string; label: string }[];
  required?: boolean; error?: string;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className={cn(
          "w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2",
          error ? "border-red-500 focus:ring-red-300" : "border-border focus:ring-accent-ring"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label || "\u2014 Select \u2014"}</option>
        ))}
      </select>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FTextarea({
  label, name, value, placeholder, rows, required, error, onChange,
}: {
  label: string; name: string; value: string; placeholder?: string;
  rows?: number; required?: boolean; error?: string;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <div className="col-span-2">
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        rows={rows || 3}
        className={cn(
          "w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 resize-none",
          error ? "border-red-500 focus:ring-red-300" : "border-border focus:ring-accent-ring"
        )}
      />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ── Skeleton row ───────────────────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-border last:border-0">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-muted rounded animate-pulse" style={{ width: `${60 + (i % 3) * 20}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function tanodFullName(t: Tanod): string {
  if (!t.resident) return `Badge #${t.badge_number}`;
  const { first_name, middle_name, last_name, extension_name } = t.resident;
  return [first_name, middle_name ? `${middle_name[0]}.` : null, last_name, extension_name]
    .filter(Boolean).join(" ");
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "\u2014";
  try {
    return new Date(d.includes("T") ? d : `${d}T00:00:00`).toLocaleDateString("en-PH", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch { return d; }
}

function fmtTime(t: string | null | undefined): string {
  if (!t) return "\u2014";
  try {
    const [h, m] = t.split(":");
    const date = new Date();
    date.setHours(Number(h), Number(m));
    return date.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true });
  } catch { return t; }
}

// ── Toast renderer (shared inline) ─────────────────────────────────────────

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => onDismiss(toast.id)}
          className={cn(
            "flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border cursor-pointer min-w-[300px] max-w-[400px] animate-in slide-in-from-right-5",
            toast.type === "success" && "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800",
            toast.type === "error" && "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800",
            toast.type === "warning" && "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800",
            toast.type === "info" && "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800",
          )}
        >
          <div className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold text-white",
            toast.type === "success" && "bg-emerald-500",
            toast.type === "error" && "bg-red-500",
            toast.type === "warning" && "bg-amber-500",
            toast.type === "info" && "bg-blue-500",
          )}>
            {toast.type === "success" ? "\u2713" : toast.type === "error" ? "\u2715" : toast.type === "warning" ? "!" : "i"}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-sm font-semibold",
              toast.type === "success" && "text-emerald-800 dark:text-emerald-200",
              toast.type === "error" && "text-red-800 dark:text-red-200",
              toast.type === "warning" && "text-amber-800 dark:text-amber-200",
              toast.type === "info" && "text-blue-800 dark:text-blue-200",
            )}>{toast.title}</p>
            {toast.message && (
              <p className={cn(
                "text-xs mt-0.5",
                toast.type === "success" && "text-emerald-600 dark:text-emerald-400",
                toast.type === "error" && "text-red-600 dark:text-red-400",
                toast.type === "warning" && "text-amber-600 dark:text-amber-400",
                toast.type === "info" && "text-blue-600 dark:text-blue-400",
              )}>{toast.message}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function TanodPage() {
  const router = useRouter();

  // ── Data state ─────────────────────────────────────────────────────────
  const [tanods, setTanods] = useState<Tanod[]>([]);
  const [schedules, setSchedules] = useState<DutySchedule[]>([]);
  const [patrols, setPatrols] = useState<PatrolLog[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [stats, setStats] = useState<TanodStats>({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  // ── Filters ─────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Tabs ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>("members");

  // ── Action menus ─────────────────────────────────────────────────────────
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  // ── Modals: Tanod member ─────────────────────────────────────────────────
  const [viewTanod, setViewTanod] = useState<Tanod | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Tanod | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSaving, setFormSaving] = useState(false);

  // ── Modals: Duty schedule ────────────────────────────────────────────────
  const [showScheduleCreate, setShowScheduleCreate] = useState(false);
  const [showScheduleDelete, setShowScheduleDelete] = useState(false);
  const [deleteScheduleTarget, setDeleteScheduleTarget] = useState<DutySchedule | null>(null);
  const [scheduleForm, setScheduleForm] = useState<Record<string, string>>({});
  const [scheduleFormErrors, setScheduleFormErrors] = useState<Record<string, string>>({});
  const [scheduleSaving, setScheduleSaving] = useState(false);

  // ── Modals: Patrol log ───────────────────────────────────────────────────
  const [showPatrolCreate, setShowPatrolCreate] = useState(false);
  const [patrolForm, setPatrolForm] = useState<Record<string, string>>({});
  const [patrolFormErrors, setPatrolFormErrors] = useState<Record<string, string>>({});
  const [patrolSaving, setPatrolSaving] = useState(false);

  // ── Modals: Incident report ──────────────────────────────────────────────
  const [showIncidentCreate, setShowIncidentCreate] = useState(false);
  const [incidentForm, setIncidentForm] = useState<Record<string, string>>({});
  const [incidentFormErrors, setIncidentFormErrors] = useState<Record<string, string>>({});
  const [incidentSaving, setIncidentSaving] = useState(false);

  // ── Toasts ───────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((type: Toast["type"], title: string, message?: string) => {
    const id = crypto.randomUUID();
    setToasts((p) => [...p, { id, type, title, message }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);
  const dismissToast = useCallback((id: string) => {
    setToasts((p) => p.filter((t) => t.id !== id));
  }, []);

  // ── Fetch: tanod list ─────────────────────────────────────────────────────

  const fetchTanods = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (statusFilter) query.set("status", statusFilter);
      if (teamFilter) query.set("team", teamFilter);
      const qs = query.toString();
      const res = await api.get<{ data: Tanod[]; total: number; active: number; inactive: number }>(
        `/tanods${qs ? `?${qs}` : ""}`
      );
      setTanods(res.data ?? []);
      setStats({
        total: res.total ?? res.data?.length ?? 0,
        active: res.active ?? res.data?.filter((t: Tanod) => t.status === "active").length ?? 0,
        inactive: res.inactive ?? res.data?.filter((t: Tanod) => t.status !== "active").length ?? 0,
      });
    } catch {
      addToast("error", "Failed to load tanod members");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, teamFilter, addToast]);

  const fetchSchedules = useCallback(async () => {
    setTabLoading(true);
    try {
      const res = await api.get<{ data: DutySchedule[] }>("/tanod-duty-schedules");
      setSchedules(res.data ?? []);
    } catch {
      addToast("error", "Failed to load duty schedules");
    } finally {
      setTabLoading(false);
    }
  }, [addToast]);

  const fetchPatrols = useCallback(async () => {
    setTabLoading(true);
    try {
      const res = await api.get<{ data: PatrolLog[] }>("/tanod-patrol-logs");
      setPatrols(res.data ?? []);
    } catch {
      addToast("error", "Failed to load patrol logs");
    } finally {
      setTabLoading(false);
    }
  }, [addToast]);

  const fetchIncidents = useCallback(async () => {
    setTabLoading(true);
    try {
      const res = await api.get<{ data: IncidentReport[] }>("/tanod-incident-reports");
      setIncidents(res.data ?? []);
    } catch {
      addToast("error", "Failed to load incident reports");
    } finally {
      setTabLoading(false);
    }
  }, [addToast]);

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchTanods();
    }, 400);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [fetchTanods]);

  useEffect(() => {
    if (activeTab === "schedules") fetchSchedules();
    else if (activeTab === "patrol") fetchPatrols();
    else if (activeTab === "incidents") fetchIncidents();
  }, [activeTab, fetchSchedules, fetchPatrols, fetchIncidents]);

  // Close action menu on outside click
  useEffect(() => {
    if (!actionMenu) return;
    const fn = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-action-menu]")) setActionMenu(null);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [actionMenu]);

  // ── Form helpers ──────────────────────────────────────────────────────────

  const handleFieldChange = (name: string, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    setFormErrors((e) => { const n = { ...e }; delete n[name]; return n; });
  };

  const handleScheduleFieldChange = (name: string, value: string) => {
    setScheduleForm((f) => ({ ...f, [name]: value }));
    setScheduleFormErrors((e) => { const n = { ...e }; delete n[name]; return n; });
  };

  const handlePatrolFieldChange = (name: string, value: string) => {
    setPatrolForm((f) => ({ ...f, [name]: value }));
    setPatrolFormErrors((e) => { const n = { ...e }; delete n[name]; return n; });
  };

  const handleIncidentFieldChange = (name: string, value: string) => {
    setIncidentForm((f) => ({ ...f, [name]: value }));
    setIncidentFormErrors((e) => { const n = { ...e }; delete n[name]; return n; });
  };

  // ── Tanod member CRUD ─────────────────────────────────────────────────────

  const openCreate = () => {
    setForm({ status: "active" });
    setFormErrors({});
    setShowCreate(true);
  };

  const openEdit = (t: Tanod) => {
    setForm({
      badge_number: t.badge_number,
      resident_id: t.resident_id,
      beat_assignment: t.beat_assignment ?? "",
      team: t.team ?? "",
      status: t.status,
      appointment_date: t.appointment_date ?? "",
    });
    setFormErrors({});
    setShowEdit(true);
    setActionMenu(null);
    setViewTanod(null);
  };

  const validateTanodForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.badge_number?.trim()) errors.badge_number = "Badge number is required";
    if (!form.resident_id?.trim()) errors.resident_id = "Resident ID is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTanodSave = async () => {
    if (!validateTanodForm()) return;
    setFormSaving(true);
    try {
      const payload = {
        badge_number: form.badge_number,
        resident_id: form.resident_id,
        beat_assignment: form.beat_assignment || null,
        team: form.team || null,
        status: form.status || "active",
        appointment_date: form.appointment_date || null,
      };
      if (showEdit && viewTanod) {
        await api.put(`/tanods/${viewTanod.id}`, payload);
        addToast("success", "Member Updated", "Tanod member record has been updated.");
      } else {
        await api.post("/tanods", payload);
        addToast("success", "Member Added", "New tanod member has been registered.");
      }
      setShowCreate(false);
      setShowEdit(false);
      fetchTanods();
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast("error", "Save Failed", e?.message || "Could not save tanod member.");
    } finally {
      setFormSaving(false);
    }
  };

  const handleTanodDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/tanods/${deleteTarget.id}`);
      addToast("success", "Member Removed", `${tanodFullName(deleteTarget)} has been removed from the roster.`);
      setShowDelete(false);
      setDeleteTarget(null);
      fetchTanods();
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast("error", "Delete Failed", e?.message || "Could not remove tanod member.");
    }
  };

  // ── Duty schedule CRUD ────────────────────────────────────────────────────

  const openScheduleCreate = () => {
    setScheduleForm({});
    setScheduleFormErrors({});
    setShowScheduleCreate(true);
  };

  const validateScheduleForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!scheduleForm.tanod_id?.trim()) errors.tanod_id = "Tanod is required";
    if (!scheduleForm.scheduled_date?.trim()) errors.scheduled_date = "Date is required";
    if (!scheduleForm.shift_start?.trim()) errors.shift_start = "Shift start is required";
    if (!scheduleForm.shift_end?.trim()) errors.shift_end = "Shift end is required";
    setScheduleFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleScheduleSave = async () => {
    if (!validateScheduleForm()) return;
    setScheduleSaving(true);
    try {
      await api.post("/tanod-duty-schedules", {
        tanod_id: scheduleForm.tanod_id,
        scheduled_date: scheduleForm.scheduled_date,
        shift_start: scheduleForm.shift_start,
        shift_end: scheduleForm.shift_end,
        duty_type: scheduleForm.duty_type || null,
        area: scheduleForm.area || null,
        notes: scheduleForm.notes || null,
      });
      addToast("success", "Schedule Created", "Duty schedule has been created.");
      setShowScheduleCreate(false);
      fetchSchedules();
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast("error", "Save Failed", e?.message || "Could not create duty schedule.");
    } finally {
      setScheduleSaving(false);
    }
  };

  const handleScheduleDelete = async () => {
    if (!deleteScheduleTarget) return;
    try {
      await api.delete(`/tanod-duty-schedules/${deleteScheduleTarget.id}`);
      addToast("success", "Schedule Deleted", "Duty schedule has been removed.");
      setShowScheduleDelete(false);
      setDeleteScheduleTarget(null);
      fetchSchedules();
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast("error", "Delete Failed", e?.message || "Could not delete schedule.");
    }
  };

  // ── Patrol log CRUD ───────────────────────────────────────────────────────

  const openPatrolCreate = () => {
    setPatrolForm({});
    setPatrolFormErrors({});
    setShowPatrolCreate(true);
  };

  const validatePatrolForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!patrolForm.tanod_id?.trim()) errors.tanod_id = "Tanod is required";
    if (!patrolForm.started_at?.trim()) errors.started_at = "Start time is required";
    setPatrolFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePatrolSave = async () => {
    if (!validatePatrolForm()) return;
    setPatrolSaving(true);
    try {
      await api.post("/tanod-patrol-logs", {
        tanod_id: patrolForm.tanod_id,
        started_at: patrolForm.started_at,
        ended_at: patrolForm.ended_at || null,
        area_covered: patrolForm.area_covered || null,
        km_covered: patrolForm.km_covered ? parseFloat(patrolForm.km_covered) : null,
        observations: patrolForm.observations || null,
      });
      addToast("success", "Patrol Logged", "Patrol log has been recorded.");
      setShowPatrolCreate(false);
      fetchPatrols();
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast("error", "Save Failed", e?.message || "Could not save patrol log.");
    } finally {
      setPatrolSaving(false);
    }
  };

  // ── Incident report CRUD ──────────────────────────────────────────────────

  const openIncidentCreate = () => {
    setIncidentForm({});
    setIncidentFormErrors({});
    setShowIncidentCreate(true);
  };

  const validateIncidentForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!incidentForm.tanod_id?.trim()) errors.tanod_id = "Tanod is required";
    if (!incidentForm.incident_date?.trim()) errors.incident_date = "Incident date is required";
    if (!incidentForm.description?.trim()) errors.description = "Description is required";
    setIncidentFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleIncidentSave = async () => {
    if (!validateIncidentForm()) return;
    setIncidentSaving(true);
    try {
      await api.post("/tanod-incident-reports", {
        tanod_id: incidentForm.tanod_id,
        incident_date: incidentForm.incident_date,
        incident_type: incidentForm.incident_type || null,
        location: incidentForm.location || null,
        description: incidentForm.description,
        action_taken: incidentForm.action_taken || null,
        persons_involved: incidentForm.persons_involved || null,
      });
      addToast("success", "Incident Reported", "Incident report has been filed.");
      setShowIncidentCreate(false);
      fetchIncidents();
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast("error", "Save Failed", e?.message || "Could not file incident report.");
    } finally {
      setIncidentSaving(false);
    }
  };

  // ── Tanod options for select dropdowns ────────────────────────────────────
  const tanodOptions = [
    { value: "", label: "\u2014 Select Tanod \u2014" },
    ...tanods.map((t) => ({ value: t.id, label: `${t.badge_number}${t.resident ? ` \u2014 ${tanodFullName(t)}` : ""}` })),
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Barangay Tanod"
        description="Manage tanod members, duty schedules, patrol logs, and incident reports"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Operations" },
          { label: "Tanod" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => addToast("info", "Export Started", "Tanod records are being exported...")}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <Download className="h-4 w-4" /> Export
            </button>
            {activeTab === "members" && (
              <button
                onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors shadow-sm"
                style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
              >
                <Plus className="h-4 w-4" /> Add Member
              </button>
            )}
            {activeTab === "schedules" && (
              <button
                onClick={openScheduleCreate}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors shadow-sm"
                style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
              >
                <Plus className="h-4 w-4" /> Add Schedule
              </button>
            )}
            {activeTab === "patrol" && (
              <button
                onClick={openPatrolCreate}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors shadow-sm"
                style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
              >
                <Plus className="h-4 w-4" /> Log Patrol
              </button>
            )}
            {activeTab === "incidents" && (
              <button
                onClick={openIncidentCreate}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors shadow-sm"
                style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
              >
                <Plus className="h-4 w-4" /> File Report
              </button>
            )}
          </div>
        }
      />

      {/* Mabini AI insight */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-accent-primary/20 bg-accent-bg/30">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-accent-bg">
          <Bot className="w-4 h-4 text-accent-text" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Mabini AI \u2014 Tanod Operations</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            {stats.active} active tanod members on record. Ask Mabini for patrol coverage analysis, incident trend reports, or duty schedule recommendations.
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/ai")}
          className="shrink-0 px-3 py-1.5 text-[10px] font-semibold rounded-lg transition-colors hover:opacity-80"
          style={{ background: "var(--accent-primary)", color: "#fff" }}
        >
          Ask Mabini
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Members" value={stats.total} icon={<Shield className="h-5 w-5" />} />
        <StatCard label="Active" value={stats.active} icon={<UserCheck className="h-5 w-5" />} />
        <StatCard label="Inactive / Suspended" value={stats.inactive} icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg glass-subtle w-fit">
        {(
          [
            { key: "members", label: "Members", icon: <Users className="h-3.5 w-3.5" /> },
            { key: "schedules", label: "Duty Schedules", icon: <Calendar className="h-3.5 w-3.5" /> },
            { key: "patrol", label: "Patrol Logs", icon: <ClipboardList className="h-3.5 w-3.5" /> },
            { key: "incidents", label: "Incident Reports", icon: <FileWarning className="h-3.5 w-3.5" /> },
          ] as { key: ActiveTab; label: string; icon: React.ReactNode }[]
        ).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors",
              activeTab === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── Members tab ───────────────────────────────────────────────────── */}
      {activeTab === "members" && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by badge, team, assignment..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
            <input
              type="text"
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              placeholder="Filter by team..."
              className="px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring w-40"
            />
          </div>

          <div className="rounded-xl glass overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Badge #</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Team</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Beat Assignment</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Appointed</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="w-10 px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
                ) : tanods.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <Shield className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground text-center">No tanod members found</p>
                          <p className="text-xs text-muted-foreground mt-1 text-center">
                            Register barangay tanod members to manage patrol schedules and duty rosters.
                          </p>
                        </div>
                        <button
                          onClick={openCreate}
                          className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white"
                          style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
                        >
                          + Add Tanod Member
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : tanods.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setViewTanod(t)}
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono font-semibold text-foreground">{t.badge_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{tanodFullName(t)}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{t.team || "\u2014"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {t.beat_assignment
                        ? <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {t.beat_assignment}</span>
                        : "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{fmtDate(t.appointment_date)}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-2 py-3">
                      <div className="relative" data-action-menu onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActionMenu(actionMenu === t.id ? null : t.id)}
                          className="p-1.5 rounded hover:bg-muted"
                        >
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </button>
                        {actionMenu === t.id && (
                          <div className="absolute right-0 top-8 z-20 w-44 bg-white dark:bg-slate-800 border border-border rounded-lg shadow-lg py-1">
                            <button
                              onClick={() => { setViewTanod(t); setActionMenu(null); }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                            >
                              <Eye className="h-3.5 w-3.5" /> View
                            </button>
                            <button
                              onClick={() => { openEdit(t); }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                            >
                              <Edit className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => { setDeleteTarget(t); setShowDelete(true); setActionMenu(null); }}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-muted flex items-center gap-2"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Duty Schedules tab ─────────────────────────────────────────────── */}
      {activeTab === "schedules" && (
        <div className="rounded-xl glass overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tanod Badge</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Shift</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Duty Type</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Area</th>
                <th className="w-10 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {tabLoading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground text-center">No duty schedules found</p>
                        <p className="text-xs text-muted-foreground mt-1 text-center">Create duty schedules to assign tanod members to shifts.</p>
                      </div>
                      <button
                        onClick={openScheduleCreate}
                        className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white"
                        style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
                      >
                        + Add Schedule
                      </button>
                    </div>
                  </td>
                </tr>
              ) : schedules.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono font-semibold">{s.tanod?.badge_number || s.tanod_id.slice(0, 8)}</span>
                    {s.tanod?.team && <p className="text-[11px] text-muted-foreground">{s.tanod.team}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm">{fmtDate(s.scheduled_date)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {fmtTime(s.shift_start)} \u2013 {fmtTime(s.shift_end)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {s.duty_type
                      ? <Badge variant="info">{s.duty_type}</Badge>
                      : <span className="text-sm text-muted-foreground">\u2014</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {s.area
                      ? <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{s.area}</span>
                      : "\u2014"}
                  </td>
                  <td className="px-2 py-3">
                    <button
                      onClick={() => { setDeleteScheduleTarget(s); setShowScheduleDelete(true); }}
                      className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Patrol Logs tab ────────────────────────────────────────────────── */}
      {activeTab === "patrol" && (
        <div className="rounded-xl glass overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tanod</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Started</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Ended</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Area Covered</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">KM</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Observations</th>
              </tr>
            </thead>
            <tbody>
              {tabLoading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              ) : patrols.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <ClipboardList className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground text-center">No patrol logs found</p>
                        <p className="text-xs text-muted-foreground mt-1 text-center">Log patrol activities to track tanod coverage and observations.</p>
                      </div>
                      <button
                        onClick={openPatrolCreate}
                        className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white"
                        style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
                      >
                        + Log Patrol
                      </button>
                    </div>
                  </td>
                </tr>
              ) : patrols.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono font-semibold">{p.tanod?.badge_number || p.tanod_id.slice(0, 8)}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{fmtDate(p.started_at)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{fmtDate(p.ended_at)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {p.area_covered
                      ? <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{p.area_covered}</span>
                      : "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {p.km_covered != null ? `${p.km_covered} km` : "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                    {p.observations || "\u2014"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Incident Reports tab ───────────────────────────────────────────── */}
      {activeTab === "incidents" && (
        <div className="rounded-xl glass overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tanod</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Location</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Action Taken</th>
              </tr>
            </thead>
            <tbody>
              {tabLoading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <FileWarning className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground text-center">No incident reports filed</p>
                        <p className="text-xs text-muted-foreground mt-1 text-center">File incident reports to document situations encountered during patrol.</p>
                      </div>
                      <button
                        onClick={openIncidentCreate}
                        className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white"
                        style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
                      >
                        + File Report
                      </button>
                    </div>
                  </td>
                </tr>
              ) : incidents.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono font-semibold">{r.tanod?.badge_number || r.tanod_id.slice(0, 8)}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{fmtDate(r.incident_date)}</td>
                  <td className="px-4 py-3">
                    {r.incident_type
                      ? <Badge variant="warning">{r.incident_type}</Badge>
                      : <span className="text-sm text-muted-foreground">\u2014</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {r.location
                      ? <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{r.location}</span>
                      : "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">{r.description || "\u2014"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">{r.action_taken || "\u2014"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── View Tanod Modal ──────────────────────────────────────────────── */}
      <Modal
        open={!!viewTanod}
        onClose={() => setViewTanod(null)}
        title={viewTanod ? tanodFullName(viewTanod) : ""}
        description={viewTanod ? `Badge: ${viewTanod.badge_number}` : ""}
        size="md"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setViewTanod(null)}>Close</ModalButton>
            <ModalButton variant="primary" onClick={() => { if (viewTanod) openEdit(viewTanod); }}>Edit Member</ModalButton>
          </>
        }
      >
        {viewTanod && (
          <div className="space-y-4">
            <StatusBadge status={viewTanod.status} />
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Badge Number</p>
                <p className="text-sm font-mono font-semibold">{viewTanod.badge_number}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Team</p>
                <p className="text-sm">{viewTanod.team || "\u2014"}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Beat Assignment</p>
                <p className="text-sm">{viewTanod.beat_assignment || "\u2014"}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Appointment Date</p>
                <p className="text-sm">{fmtDate(viewTanod.appointment_date)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Official ID</p>
                <p className="text-sm font-mono">{viewTanod.official_id || "\u2014"}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Create / Edit Tanod Modal ─────────────────────────────────────── */}
      <Modal
        open={showCreate || showEdit}
        onClose={() => { setShowCreate(false); setShowEdit(false); }}
        title={showEdit ? "Edit Tanod Member" : "Add Tanod Member"}
        size="lg"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { setShowCreate(false); setShowEdit(false); }}>
              Cancel
            </ModalButton>
            <ModalButton variant="primary" disabled={formSaving} onClick={handleTanodSave}>
              {formSaving ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Saving...</> : showEdit ? "Update" : "Save"}
            </ModalButton>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FInput
            label="Badge Number" name="badge_number" value={form.badge_number || ""}
            placeholder="e.g. TNO-001" required error={formErrors.badge_number}
            onChange={handleFieldChange}
          />
          <FInput
            label="Resident ID (UUID)" name="resident_id" value={form.resident_id || ""}
            placeholder="Resident UUID from resident record" required error={formErrors.resident_id}
            onChange={handleFieldChange}
          />
          <FInput
            label="Beat Assignment" name="beat_assignment" value={form.beat_assignment || ""}
            placeholder="e.g. Purok 3, Main Road" onChange={handleFieldChange}
          />
          <FInput
            label="Team" name="team" value={form.team || ""}
            placeholder="e.g. Alpha Team" onChange={handleFieldChange}
          />
          <FInput
            label="Appointment Date" name="appointment_date" value={form.appointment_date || ""}
            type="date" onChange={handleFieldChange}
          />
          <FSelect
            label="Status" name="status" value={form.status || "active"}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "suspended", label: "Suspended" },
            ]}
            onChange={handleFieldChange}
          />
        </div>
      </Modal>

      {/* ── Delete Tanod Confirmation ─────────────────────────────────────── */}
      <Modal
        open={showDelete}
        onClose={() => { setShowDelete(false); setDeleteTarget(null); }}
        title="Remove Tanod Member"
        description="This action cannot be undone."
        size="sm"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { setShowDelete(false); setDeleteTarget(null); }}>Cancel</ModalButton>
            <ModalButton variant="danger" onClick={handleTanodDelete}>Remove</ModalButton>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to remove <strong>{deleteTarget ? tanodFullName(deleteTarget) : ""}</strong> (Badge: {deleteTarget?.badge_number}) from the tanod roster?
        </p>
      </Modal>

      {/* ── Create Duty Schedule Modal ────────────────────────────────────── */}
      <Modal
        open={showScheduleCreate}
        onClose={() => setShowScheduleCreate(false)}
        title="Add Duty Schedule"
        size="lg"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setShowScheduleCreate(false)}>Cancel</ModalButton>
            <ModalButton variant="primary" disabled={scheduleSaving} onClick={handleScheduleSave}>
              {scheduleSaving ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Saving...</> : "Save Schedule"}
            </ModalButton>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FSelect
            label="Tanod Member" name="tanod_id" value={scheduleForm.tanod_id || ""}
            options={tanodOptions} required error={scheduleFormErrors.tanod_id}
            onChange={handleScheduleFieldChange}
          />
          <FInput
            label="Scheduled Date" name="scheduled_date" value={scheduleForm.scheduled_date || ""}
            type="date" required error={scheduleFormErrors.scheduled_date}
            onChange={handleScheduleFieldChange}
          />
          <FInput
            label="Shift Start" name="shift_start" value={scheduleForm.shift_start || ""}
            type="time" required error={scheduleFormErrors.shift_start}
            onChange={handleScheduleFieldChange}
          />
          <FInput
            label="Shift End" name="shift_end" value={scheduleForm.shift_end || ""}
            type="time" required error={scheduleFormErrors.shift_end}
            onChange={handleScheduleFieldChange}
          />
          <FInput
            label="Duty Type" name="duty_type" value={scheduleForm.duty_type || ""}
            placeholder="e.g. Regular Patrol, Special Event"
            onChange={handleScheduleFieldChange}
          />
          <FInput
            label="Area" name="area" value={scheduleForm.area || ""}
            placeholder="e.g. Purok 1, Main Gate"
            onChange={handleScheduleFieldChange}
          />
          <FTextarea
            label="Notes" name="notes" value={scheduleForm.notes || ""}
            placeholder="Additional instructions..."
            onChange={handleScheduleFieldChange}
          />
        </div>
      </Modal>

      {/* ── Delete Schedule Confirmation ──────────────────────────────────── */}
      <Modal
        open={showScheduleDelete}
        onClose={() => { setShowScheduleDelete(false); setDeleteScheduleTarget(null); }}
        title="Delete Duty Schedule"
        description="This action cannot be undone."
        size="sm"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { setShowScheduleDelete(false); setDeleteScheduleTarget(null); }}>Cancel</ModalButton>
            <ModalButton variant="danger" onClick={handleScheduleDelete}>Delete</ModalButton>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete the duty schedule on <strong>{fmtDate(deleteScheduleTarget?.scheduled_date)}</strong>?
        </p>
      </Modal>

      {/* ── Create Patrol Log Modal ───────────────────────────────────────── */}
      <Modal
        open={showPatrolCreate}
        onClose={() => setShowPatrolCreate(false)}
        title="Log Patrol"
        size="lg"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setShowPatrolCreate(false)}>Cancel</ModalButton>
            <ModalButton variant="primary" disabled={patrolSaving} onClick={handlePatrolSave}>
              {patrolSaving ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Saving...</> : "Save Log"}
            </ModalButton>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FSelect
            label="Tanod Member" name="tanod_id" value={patrolForm.tanod_id || ""}
            options={tanodOptions} required error={patrolFormErrors.tanod_id}
            onChange={handlePatrolFieldChange}
          />
          <FInput
            label="Area Covered" name="area_covered" value={patrolForm.area_covered || ""}
            placeholder="e.g. Purok 1 to 3" onChange={handlePatrolFieldChange}
          />
          <FInput
            label="Started At" name="started_at" value={patrolForm.started_at || ""}
            type="datetime-local" required error={patrolFormErrors.started_at}
            onChange={handlePatrolFieldChange}
          />
          <FInput
            label="Ended At" name="ended_at" value={patrolForm.ended_at || ""}
            type="datetime-local" onChange={handlePatrolFieldChange}
          />
          <FInput
            label="Distance Covered (km)" name="km_covered" value={patrolForm.km_covered || ""}
            type="number" placeholder="e.g. 2.5" onChange={handlePatrolFieldChange}
          />
          <FTextarea
            label="Observations" name="observations" value={patrolForm.observations || ""}
            placeholder="Note any incidents, suspicious activity, or general observations..."
            onChange={handlePatrolFieldChange}
          />
        </div>
      </Modal>

      {/* ── Create Incident Report Modal ──────────────────────────────────── */}
      <Modal
        open={showIncidentCreate}
        onClose={() => setShowIncidentCreate(false)}
        title="File Incident Report"
        size="lg"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setShowIncidentCreate(false)}>Cancel</ModalButton>
            <ModalButton variant="primary" disabled={incidentSaving} onClick={handleIncidentSave}>
              {incidentSaving ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Saving...</> : "File Report"}
            </ModalButton>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FSelect
            label="Reporting Tanod" name="tanod_id" value={incidentForm.tanod_id || ""}
            options={tanodOptions} required error={incidentFormErrors.tanod_id}
            onChange={handleIncidentFieldChange}
          />
          <FInput
            label="Incident Date" name="incident_date" value={incidentForm.incident_date || ""}
            type="date" required error={incidentFormErrors.incident_date}
            onChange={handleIncidentFieldChange}
          />
          <FInput
            label="Incident Type" name="incident_type" value={incidentForm.incident_type || ""}
            placeholder="e.g. Theft, Disturbance, Accident"
            onChange={handleIncidentFieldChange}
          />
          <FInput
            label="Location" name="location" value={incidentForm.location || ""}
            placeholder="e.g. Purok 2, near the chapel"
            onChange={handleIncidentFieldChange}
          />
          <FTextarea
            label="Description" name="description" value={incidentForm.description || ""}
            placeholder="Detailed description of what happened..." required error={incidentFormErrors.description}
            onChange={handleIncidentFieldChange}
          />
          <FTextarea
            label="Action Taken" name="action_taken" value={incidentForm.action_taken || ""}
            placeholder="What action was taken by the tanod?"
            onChange={handleIncidentFieldChange}
          />
          <FTextarea
            label="Persons Involved" name="persons_involved" value={incidentForm.persons_involved || ""}
            placeholder="Names or descriptions of persons involved..."
            onChange={handleIncidentFieldChange}
          />
        </div>
      </Modal>

      {/* ── Toasts ────────────────────────────────────────────────────────── */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <MabiniButton pageContext="You are on the Tanod (Barangay Police) page. This page manages tanod personnel, duty schedules, patrol logs, and incident reports." />
    </div>
  );
}
