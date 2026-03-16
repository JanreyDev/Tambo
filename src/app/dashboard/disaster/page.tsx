"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Plus,
  Download,
  MapPin,
  Users,
  ShieldAlert,
  Flame,
  Waves,
  Wind,
  Mountain,
  Zap,
  MoreHorizontal,
  Edit,
  Trash2,
  Bot,
  CloudRain,
  Calendar,
  Search,
  ChevronDown,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { MabiniButton } from "@/components/ui/mabini-button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type HazardType = "flood" | "fire" | "landslide" | "earthquake" | "typhoon" | "other";
type RiskLevel  = "low" | "medium" | "high" | "critical";

interface HazardPin {
  id: string;
  name: string;
  hazard_type: HazardType;
  risk_level: RiskLevel;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  affected_population: number | null;
  notes: string | null;
}

type DisasterType  = "flood" | "fire" | "landslide" | "typhoon" | "other";
type EvacStatus    = "active" | "resolved" | "cancelled";

interface Evacuation {
  id: string;
  evacuation_name: string;
  disaster_type: DisasterType;
  started_at: string | null;
  ended_at: string | null;
  status: EvacStatus;
  evacuation_center: string | null;
  evacuation_center_address: string | null;
  total_families: number;
  total_individuals: number;
  notes: string | null;
}

interface EvacFamily {
  id: string;
  [key: string]: unknown;
}

type ActiveTab = "hazard-map" | "evacuations" | "families";

// ─── Form helpers ─────────────────────────────────────────────────────────────

function FormInput({
  label, name, value, placeholder, required, type, error, onChange, className,
}: {
  label: string; name: string; value: string; placeholder?: string;
  required?: boolean; type?: string; error?: string;
  onChange: (name: string, value: string) => void; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring",
          error ? "border-red-500" : "border-border"
        )}
      />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormSelect({
  label, name, value, options, required, error, onChange, className,
}: {
  label: string; name: string; value: string;
  options: { value: string; label: string }[];
  required?: boolean; error?: string;
  onChange: (name: string, value: string) => void; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className={cn(
          "w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring",
          error ? "border-red-500" : "border-border"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormTextarea({
  label, name, value, placeholder, rows, required, onChange, className,
}: {
  label: string; name: string; value: string; placeholder?: string;
  rows?: number; required?: boolean;
  onChange: (name: string, value: string) => void; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        rows={rows || 3}
        className="w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none"
      />
    </div>
  );
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

const hazardTypeStyles: Record<string, string> = {
  flood:      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  fire:       "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  landslide:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  earthquake: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  typhoon:    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  other:      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
};

function HazardTypeBadge({ type }: { type: string }) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap capitalize", hazardTypeStyles[type] ?? hazardTypeStyles.other)}>
      {type}
    </span>
  );
}

function RiskBadge({ level }: { level: string }) {
  const map: Record<string, "success" | "warning" | "danger"> = {
    low:      "success",
    medium:   "warning",
    high:     "danger",
    critical: "danger",
  };
  return <Badge variant={map[level] ?? "muted"} className={level === "critical" ? "ring-1 ring-red-400" : ""}>{level}</Badge>;
}

function EvacStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "success" | "warning" | "muted" | "danger" }> = {
    active:    { label: "Active",    variant: "warning" },
    resolved:  { label: "Resolved", variant: "success" },
    cancelled: { label: "Cancelled",variant: "muted"   },
  };
  const s = map[status] ?? { label: status, variant: "muted" as const };
  return <Badge variant={s.variant} dot>{s.label}</Badge>;
}

function HazardIcon({ type, className }: { type: string; className?: string }) {
  const cls = cn("h-5 w-5", className);
  switch (type) {
    case "flood":      return <Waves     className={cn(cls, "text-blue-500")}   />;
    case "fire":       return <Flame     className={cn(cls, "text-red-500")}    />;
    case "landslide":  return <Mountain  className={cn(cls, "text-amber-500")}  />;
    case "earthquake": return <Zap       className={cn(cls, "text-orange-500")} />;
    case "typhoon":    return <Wind      className={cn(cls, "text-violet-500")} />;
    default:           return <AlertTriangle className={cn(cls, "text-slate-500")} />;
  }
}

// ─── Toast ────────────────────────────────────────────────────────────────────

type Toast = { id: string; type: "success" | "error" | "warning" | "info"; title: string; message?: string };

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2" style={{ maxWidth: 360 }}>
      {toasts.map((t) => (
        <div key={t.id} className={cn(
          "flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm animate-in slide-in-from-right-5 fade-in duration-300",
          t.type === "success" && "bg-green-50 dark:bg-green-950/80 border-green-200 dark:border-green-800",
          t.type === "error"   && "bg-red-50 dark:bg-red-950/80 border-red-200 dark:border-red-800",
          t.type === "warning" && "bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800",
          t.type === "info"    && "bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800",
        )}>
          <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold text-white",
            t.type === "success" && "bg-green-500",
            t.type === "error"   && "bg-red-500",
            t.type === "warning" && "bg-amber-500",
            t.type === "info"    && "bg-blue-500",
          )}>
            {t.type === "success" ? "\u2713" : t.type === "error" ? "\u2715" : t.type === "warning" ? "!" : "i"}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-semibold",
              t.type === "success" && "text-green-800 dark:text-green-200",
              t.type === "error"   && "text-red-800 dark:text-red-200",
              t.type === "warning" && "text-amber-800 dark:text-amber-200",
              t.type === "info"    && "text-blue-800 dark:text-blue-200",
            )}>{t.title}</p>
            {t.message && <p className={cn("text-xs mt-0.5",
              t.type === "success" && "text-green-600 dark:text-green-300",
              t.type === "error"   && "text-red-600 dark:text-red-300",
              t.type === "warning" && "text-amber-600 dark:text-amber-300",
              t.type === "info"    && "text-blue-600 dark:text-blue-300",
            )}>{t.message}</p>}
          </div>
          <button onClick={() => onDismiss(t.id)} className="shrink-0 p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <span className="text-xs text-muted-foreground">&times;</span>
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DisasterPage() {
  const router = useRouter();

  // Data
  const [hazardPins, setHazardPins]       = useState<HazardPin[]>([]);
  const [evacuations, setEvacuations]     = useState<Evacuation[]>([]);
  const [families, setFamilies]           = useState<EvacFamily[]>([]);
  const [loading, setLoading]             = useState(true);
  const [familiesLoading, setFamiliesLoading] = useState(false);

  // UI
  const [activeTab, setActiveTab]         = useState<ActiveTab>("hazard-map");
  const [hazardTypeFilter, setHazardTypeFilter] = useState("");
  const [hazardSearch, setHazardSearch]   = useState("");
  const [selectedEvacId, setSelectedEvacId] = useState<string>("");

  // Hazard pin modals
  const [showHazardCreate, setShowHazardCreate] = useState(false);
  const [showHazardEdit, setShowHazardEdit]     = useState(false);
  const [showHazardDelete, setShowHazardDelete] = useState(false);
  const [editingHazard, setEditingHazard]       = useState<HazardPin | null>(null);
  const [deleteHazard, setDeleteHazard]         = useState<HazardPin | null>(null);
  const [hazardForm, setHazardForm]             = useState<Record<string, string>>({});
  const [hazardFormErrors, setHazardFormErrors] = useState<Record<string, string>>({});
  const [hazardSubmitting, setHazardSubmitting] = useState(false);

  // Evacuation modals
  const [showEvacCreate, setShowEvacCreate] = useState(false);
  const [showEvacEdit, setShowEvacEdit]     = useState(false);
  const [showEvacDelete, setShowEvacDelete] = useState(false);
  const [editingEvac, setEditingEvac]       = useState<Evacuation | null>(null);
  const [deleteEvac, setDeleteEvac]         = useState<Evacuation | null>(null);
  const [evacForm, setEvacForm]             = useState<Record<string, string>>({});
  const [evacFormErrors, setEvacFormErrors] = useState<Record<string, string>>({});
  const [evacSubmitting, setEvacSubmitting] = useState(false);

  // Action menus
  const [hazardMenu, setHazardMenu]         = useState<string | null>(null);
  const [evacMenu, setEvacMenu]             = useState<string | null>(null);

  // Toasts
  const [toasts, setToasts]               = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast["type"], title: string, message?: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [hazardRes, evacRes] = await Promise.allSettled([
        api.get<{ data: HazardPin[] }>("/hazard-pins"),
        api.get<{ data: Evacuation[] }>("/evacuations"),
      ]);

      if (hazardRes.status === "fulfilled") {
        const r = hazardRes.value as { data?: HazardPin[] } | HazardPin[];
        setHazardPins(Array.isArray(r) ? r : (r as { data?: HazardPin[] }).data ?? []);
      }
      if (evacRes.status === "fulfilled") {
        const r = evacRes.value as { data?: Evacuation[] } | Evacuation[];
        setEvacuations(Array.isArray(r) ? r : (r as { data?: Evacuation[] }).data ?? []);
      }
    } catch {
      addToast("error", "Failed to load disaster data");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Close menus on outside click
  useEffect(() => {
    const handler = () => { setHazardMenu(null); setEvacMenu(null); };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // Fetch families when an evacuation is selected
  const fetchFamilies = useCallback(async (evacId: string) => {
    if (!evacId) { setFamilies([]); return; }
    setFamiliesLoading(true);
    try {
      const res = await api.get<{ data?: EvacFamily[]; families?: EvacFamily[] }>(`/evacuations/${evacId}`);
      const f = (res as { data?: EvacFamily[]; families?: EvacFamily[] }).families
             ?? (res as { data?: EvacFamily[] }).data
             ?? [];
      setFamilies(Array.isArray(f) ? f : []);
    } catch {
      addToast("error", "Failed to load families for this evacuation.");
      setFamilies([]);
    } finally {
      setFamiliesLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (activeTab === "families" && selectedEvacId) {
      fetchFamilies(selectedEvacId);
    }
  }, [activeTab, selectedEvacId, fetchFamilies]);

  // ── Derived stats ──────────────────────────────────────────────────────────

  const totalHazardSites    = hazardPins.length;
  const highCriticalCount   = hazardPins.filter((h) => h.risk_level === "high" || h.risk_level === "critical").length;
  const activeEvacCount     = evacuations.filter((e) => e.status === "active").length;
  const totalEvacuees       = evacuations.filter((e) => e.status === "active").reduce((sum, e) => sum + (e.total_individuals ?? 0), 0);

  // ── Hazard pin filtering ───────────────────────────────────────────────────

  const filteredHazards = hazardPins.filter((h) => {
    if (hazardTypeFilter && h.hazard_type !== hazardTypeFilter) return false;
    if (hazardSearch && !h.name.toLowerCase().includes(hazardSearch.toLowerCase())) return false;
    return true;
  });

  // ── Hazard form ────────────────────────────────────────────────────────────

  const handleHazardField = (name: string, value: string) => {
    setHazardForm((f) => ({ ...f, [name]: value }));
    setHazardFormErrors((e) => { const n = { ...e }; delete n[name]; return n; });
  };

  const validateHazardForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!hazardForm.name?.trim())    errors.name      = "Name is required";
    if (!hazardForm.hazard_type)     errors.hazard_type = "Hazard type is required";
    if (!hazardForm.risk_level)      errors.risk_level  = "Risk level is required";
    setHazardFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openHazardCreate = () => {
    setHazardForm({ hazard_type: "flood", risk_level: "medium" });
    setHazardFormErrors({});
    setShowHazardCreate(true);
  };

  const openHazardEdit = (h: HazardPin) => {
    setEditingHazard(h);
    setHazardForm({
      name:                h.name,
      hazard_type:         h.hazard_type,
      risk_level:          h.risk_level,
      latitude:            h.latitude != null ? String(h.latitude) : "",
      longitude:           h.longitude != null ? String(h.longitude) : "",
      description:         h.description ?? "",
      affected_population: h.affected_population != null ? String(h.affected_population) : "",
      notes:               h.notes ?? "",
    });
    setHazardFormErrors({});
    setHazardMenu(null);
    setShowHazardEdit(true);
  };

  const buildHazardPayload = () => ({
    name:                hazardForm.name.trim(),
    hazard_type:         hazardForm.hazard_type,
    risk_level:          hazardForm.risk_level,
    latitude:            hazardForm.latitude ? parseFloat(hazardForm.latitude) : undefined,
    longitude:           hazardForm.longitude ? parseFloat(hazardForm.longitude) : undefined,
    description:         hazardForm.description || undefined,
    affected_population: hazardForm.affected_population ? parseInt(hazardForm.affected_population, 10) : undefined,
    notes:               hazardForm.notes || undefined,
  });

  const submitHazardCreate = async () => {
    if (!validateHazardForm()) return;
    setHazardSubmitting(true);
    try {
      await api.post("/hazard-pins", buildHazardPayload());
      addToast("success", "Hazard Site Added", `${hazardForm.name} has been added to the hazard map.`);
      setShowHazardCreate(false);
      fetchAll();
    } catch (err: unknown) {
      addToast("error", "Failed to add hazard site", (err as { message?: string })?.message);
    } finally {
      setHazardSubmitting(false);
    }
  };

  const submitHazardEdit = async () => {
    if (!editingHazard || !validateHazardForm()) return;
    setHazardSubmitting(true);
    try {
      await api.put(`/hazard-pins/${editingHazard.id}`, buildHazardPayload());
      addToast("success", "Hazard Site Updated", `${hazardForm.name} has been updated.`);
      setShowHazardEdit(false);
      setEditingHazard(null);
      fetchAll();
    } catch (err: unknown) {
      addToast("error", "Failed to update hazard site", (err as { message?: string })?.message);
    } finally {
      setHazardSubmitting(false);
    }
  };

  const submitHazardDelete = async () => {
    if (!deleteHazard) return;
    try {
      await api.delete(`/hazard-pins/${deleteHazard.id}`);
      setHazardPins((prev) => prev.filter((h) => h.id !== deleteHazard.id));
      addToast("success", "Hazard Site Removed", `${deleteHazard.name} has been deleted.`);
      setShowHazardDelete(false);
      setDeleteHazard(null);
    } catch (err: unknown) {
      addToast("error", "Failed to delete hazard site", (err as { message?: string })?.message);
    }
  };

  // ── Evacuation form ────────────────────────────────────────────────────────

  const handleEvacField = (name: string, value: string) => {
    setEvacForm((f) => ({ ...f, [name]: value }));
    setEvacFormErrors((e) => { const n = { ...e }; delete n[name]; return n; });
  };

  const validateEvacForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!evacForm.evacuation_name?.trim()) errors.evacuation_name = "Evacuation name is required";
    if (!evacForm.disaster_type)           errors.disaster_type   = "Disaster type is required";
    if (!evacForm.status)                  errors.status          = "Status is required";
    setEvacFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openEvacCreate = () => {
    setEvacForm({
      disaster_type:   "flood",
      status:          "active",
      total_families:  "0",
      total_individuals:"0",
      started_at:      new Date().toISOString().slice(0, 16),
    });
    setEvacFormErrors({});
    setShowEvacCreate(true);
  };

  const openEvacEdit = (evac: Evacuation) => {
    setEditingEvac(evac);
    setEvacForm({
      evacuation_name:           evac.evacuation_name,
      disaster_type:             evac.disaster_type,
      started_at:                evac.started_at ? evac.started_at.slice(0, 16) : "",
      ended_at:                  evac.ended_at   ? evac.ended_at.slice(0, 16)   : "",
      status:                    evac.status,
      evacuation_center:         evac.evacuation_center ?? "",
      evacuation_center_address: evac.evacuation_center_address ?? "",
      total_families:            String(evac.total_families),
      total_individuals:         String(evac.total_individuals),
      notes:                     evac.notes ?? "",
    });
    setEvacFormErrors({});
    setEvacMenu(null);
    setShowEvacEdit(true);
  };

  const buildEvacPayload = () => ({
    evacuation_name:           evacForm.evacuation_name.trim(),
    disaster_type:             evacForm.disaster_type,
    started_at:                evacForm.started_at || undefined,
    ended_at:                  evacForm.ended_at   || undefined,
    status:                    evacForm.status,
    evacuation_center:         evacForm.evacuation_center || undefined,
    evacuation_center_address: evacForm.evacuation_center_address || undefined,
    total_families:            evacForm.total_families  ? parseInt(evacForm.total_families, 10)  : 0,
    total_individuals:         evacForm.total_individuals ? parseInt(evacForm.total_individuals, 10) : 0,
    notes:                     evacForm.notes || undefined,
  });

  const submitEvacCreate = async () => {
    if (!validateEvacForm()) return;
    setEvacSubmitting(true);
    try {
      await api.post("/evacuations", buildEvacPayload());
      addToast("success", "Evacuation Event Created", `${evacForm.evacuation_name} has been logged.`);
      setShowEvacCreate(false);
      fetchAll();
    } catch (err: unknown) {
      addToast("error", "Failed to create evacuation event", (err as { message?: string })?.message);
    } finally {
      setEvacSubmitting(false);
    }
  };

  const submitEvacEdit = async () => {
    if (!editingEvac || !validateEvacForm()) return;
    setEvacSubmitting(true);
    try {
      await api.put(`/evacuations/${editingEvac.id}`, buildEvacPayload());
      addToast("success", "Evacuation Updated", `${evacForm.evacuation_name} has been updated.`);
      setShowEvacEdit(false);
      setEditingEvac(null);
      fetchAll();
    } catch (err: unknown) {
      addToast("error", "Failed to update evacuation", (err as { message?: string })?.message);
    } finally {
      setEvacSubmitting(false);
    }
  };

  const submitEvacDelete = async () => {
    if (!deleteEvac) return;
    try {
      await api.delete(`/evacuations/${deleteEvac.id}`);
      setEvacuations((prev) => prev.filter((e) => e.id !== deleteEvac.id));
      addToast("success", "Evacuation Deleted", `${deleteEvac.evacuation_name} has been removed.`);
      setShowEvacDelete(false);
      setDeleteEvac(null);
    } catch (err: unknown) {
      addToast("error", "Failed to delete evacuation", (err as { message?: string })?.message);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Disaster / DRRM"
        description="Disaster Risk Reduction and Management — hazard mapping, evacuations, and family tracking"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Operations" },
          { label: "Disaster/DRRM" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => addToast("info", "Export started", "Disaster report is being generated.")}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <Download className="h-4 w-4" /> Export Report
            </button>
          </div>
        }
      />

      {/* Mabini AI Banner */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-accent-primary/20 bg-accent-bg/30">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-accent-bg">
          <Bot className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Mabini AI Disaster Readiness</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            Ask Mabini to assess barangay DRRM readiness, identify high-risk zones, or get evacuation recommendations based on current hazard data.
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/ai")}
          className="shrink-0 px-3 py-1.5 text-[10px] font-semibold rounded-lg hover:opacity-80 transition-opacity"
          style={{ background: "var(--accent-primary)", color: "#fff" }}
        >
          Ask Mabini
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Hazard Sites"
          value={loading ? "—" : totalHazardSites}
          icon={<MapPin className="h-5 w-5" />}
        />
        <StatCard
          label="High / Critical Risk"
          value={loading ? "—" : highCriticalCount}
          icon={<ShieldAlert className="h-5 w-5" />}
        />
        <StatCard
          label="Active Evacuations"
          value={loading ? "—" : activeEvacCount}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <StatCard
          label="Total Evacuees"
          value={loading ? "—" : totalEvacuees}
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      {/* Active situation banner */}
      {!loading && activeEvacCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              Active Situation: {totalEvacuees} evacuee{totalEvacuees !== 1 ? "s" : ""} currently sheltered across {activeEvacCount} evacuation event{activeEvacCount !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              BDRRMC should remain on standby. Ensure relief goods distribution is ongoing.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg glass-subtle w-fit">
        {(["hazard-map", "evacuations", "families"] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              activeTab === tab
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "hazard-map" ? "Hazard Map" : tab === "evacuations" ? "Evacuation Events" : "Families"}
          </button>
        ))}
      </div>

      {/* ── Hazard Map Tab ── */}
      {activeTab === "hazard-map" && (
        <div className="space-y-4">
          {/* Map coming-soon notice */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
            <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <span className="font-semibold">Interactive map coming soon.</span>{" "}
              Hazard pins will be visualized on a real-time map of the barangay. For now, manage hazard sites in the table below.
            </p>
          </div>

          {/* Filters + Add button */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={hazardSearch}
                onChange={(e) => setHazardSearch(e.target.value)}
                placeholder="Search hazard sites..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring"
              />
            </div>
            <select
              value={hazardTypeFilter}
              onChange={(e) => setHazardTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring"
            >
              <option value="">All Types</option>
              <option value="flood">Flood</option>
              <option value="fire">Fire</option>
              <option value="landslide">Landslide</option>
              <option value="earthquake">Earthquake</option>
              <option value="typhoon">Typhoon</option>
              <option value="other">Other</option>
            </select>
            <button
              onClick={openHazardCreate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors ml-auto"
              style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
            >
              <Plus className="h-4 w-4" /> Add Hazard Site
            </button>
          </div>

          {/* Table */}
          <div className="rounded-xl glass overflow-hidden">
            {loading ? (
              <div className="p-12 flex justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Hazard Site</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Risk Level</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Affected Population</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Coordinates</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
                    <th className="w-10 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredHazards.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-foreground">No hazard sites mapped</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Mark flood zones, fire-prone areas, and other hazard sites to help with disaster preparedness.
                            </p>
                          </div>
                          <button
                            onClick={openHazardCreate}
                            className="px-4 py-2 text-xs font-semibold rounded-lg text-white"
                            style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
                          >
                            + Add Hazard Site
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredHazards.map((h) => (
                      <tr
                        key={h.id}
                        className={cn(
                          "border-b border-border last:border-0 hover:bg-muted/30 transition-colors",
                          (h.risk_level === "high" || h.risk_level === "critical") && "bg-red-50/30 dark:bg-red-950/10"
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                              h.hazard_type === "flood"      && "bg-blue-100 dark:bg-blue-900/30",
                              h.hazard_type === "fire"       && "bg-red-100 dark:bg-red-900/30",
                              h.hazard_type === "landslide"  && "bg-amber-100 dark:bg-amber-900/30",
                              h.hazard_type === "earthquake" && "bg-orange-100 dark:bg-orange-900/30",
                              h.hazard_type === "typhoon"    && "bg-violet-100 dark:bg-violet-900/30",
                              h.hazard_type === "other"      && "bg-slate-100 dark:bg-slate-800",
                            )}>
                              <HazardIcon type={h.hazard_type} className="h-4 w-4" />
                            </div>
                            <p className="text-sm font-medium text-foreground">{h.name}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3"><HazardTypeBadge type={h.hazard_type} /></td>
                        <td className="px-4 py-3"><RiskBadge level={h.risk_level} /></td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {h.affected_population != null ? h.affected_population.toLocaleString() : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                          {h.latitude != null && h.longitude != null
                            ? `${Number(h.latitude).toFixed(5)}, ${Number(h.longitude).toFixed(5)}`
                            : "—"
                          }
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                          {h.description ?? "—"}
                        </td>
                        <td className="px-2 py-3">
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => { e.stopPropagation(); setHazardMenu(hazardMenu === h.id ? null : h.id); }}
                              className="p-1.5 rounded hover:bg-muted"
                            >
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </button>
                            {hazardMenu === h.id && (
                              <div className="absolute right-0 top-8 z-20 w-44 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-border py-1">
                                <button onClick={() => openHazardEdit(h)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2">
                                  <Edit className="h-3.5 w-3.5" /> Edit
                                </button>
                                <button onClick={() => { setDeleteHazard(h); setShowHazardDelete(true); setHazardMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-muted flex items-center gap-2">
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Evacuations Tab ── */}
      {activeTab === "evacuations" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={openEvacCreate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors"
              style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
            >
              <Plus className="h-4 w-4" /> Log Evacuation
            </button>
          </div>

          <div className="rounded-xl glass overflow-hidden">
            {loading ? (
              <div className="p-12 flex justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Event</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Disaster Type</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Started</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Families</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Individuals</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Evacuation Center</th>
                    <th className="w-10 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {evacuations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-16">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <CloudRain className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-foreground">No evacuation events recorded</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Log disaster incidents and track evacuees when emergencies occur.
                            </p>
                          </div>
                          <button
                            onClick={openEvacCreate}
                            className="px-4 py-2 text-xs font-semibold rounded-lg text-white"
                            style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
                          >
                            + Log Evacuation
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    evacuations.map((evac) => (
                      <tr
                        key={evac.id}
                        className={cn(
                          "border-b border-border last:border-0 hover:bg-muted/30 transition-colors",
                          evac.status === "active" && "bg-amber-50/40 dark:bg-amber-950/10"
                        )}
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-foreground">{evac.evacuation_name}</p>
                        </td>
                        <td className="px-4 py-3"><HazardTypeBadge type={evac.disaster_type} /></td>
                        <td className="px-4 py-3"><EvacStatusBadge status={evac.status} /></td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {evac.started_at ? new Date(evac.started_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground font-medium">{evac.total_families.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-foreground font-medium">{evac.total_individuals.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{evac.evacuation_center ?? "—"}</td>
                        <td className="px-2 py-3">
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => { e.stopPropagation(); setEvacMenu(evacMenu === evac.id ? null : evac.id); }}
                              className="p-1.5 rounded hover:bg-muted"
                            >
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </button>
                            {evacMenu === evac.id && (
                              <div className="absolute right-0 top-8 z-20 w-44 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-border py-1">
                                <button onClick={() => openEvacEdit(evac)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2">
                                  <Edit className="h-3.5 w-3.5" /> Edit
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedEvacId(evac.id);
                                    setActiveTab("families");
                                    setEvacMenu(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                                >
                                  <Users className="h-3.5 w-3.5" /> View Families
                                </button>
                                <button onClick={() => { setDeleteEvac(evac); setShowEvacDelete(true); setEvacMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-muted flex items-center gap-2">
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Families Tab ── */}
      {activeTab === "families" && (
        <div className="space-y-4">
          {/* Evacuation selector */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={selectedEvacId}
                onChange={(e) => setSelectedEvacId(e.target.value)}
                className="pl-3 pr-8 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring appearance-none min-w-[280px]"
              >
                <option value="">— Select an Evacuation Event —</option>
                {evacuations.map((e) => (
                  <option key={e.id} value={e.id}>{e.evacuation_name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {!selectedEvacId ? (
            <div className="p-16 rounded-xl glass flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Select an evacuation event to view families</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose an evacuation event from the dropdown above to see the list of affected families and evacuees.
                </p>
              </div>
              {evacuations.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No evacuation events on record yet.</p>
              )}
            </div>
          ) : familiesLoading ? (
            <div className="p-12 rounded-xl glass flex justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
            </div>
          ) : families.length === 0 ? (
            <div className="p-16 rounded-xl glass flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">No families recorded for this evacuation</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Family records will appear here once they are added to this evacuation event.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl glass overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {Object.keys(families[0] ?? {}).filter((k) => k !== "id").slice(0, 6).map((key) => (
                      <th key={key} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {key.replace(/_/g, " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {families.map((family) => (
                    <tr key={family.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      {Object.keys(families[0] ?? {}).filter((k) => k !== "id").slice(0, 6).map((key) => (
                        <td key={key} className="px-4 py-3 text-sm text-muted-foreground">
                          {String(family[key] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Add Hazard Site Modal ── */}
      <Modal
        open={showHazardCreate}
        onClose={() => setShowHazardCreate(false)}
        title="Add Hazard Site"
        size="lg"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setShowHazardCreate(false)}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={submitHazardCreate} disabled={hazardSubmitting}>
              {hazardSubmitting ? "Saving…" : "Add Hazard Site"}
            </ModalButton>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            className="col-span-2"
            onChange={handleHazardField}
            label="Site Name"
            name="name"
            value={hazardForm.name ?? ""}
            placeholder="e.g. Purok 3 Flood Zone"
            required
            error={hazardFormErrors.name}
          />
          <FormSelect
            onChange={handleHazardField}
            label="Hazard Type"
            name="hazard_type"
            value={hazardForm.hazard_type ?? "flood"}
            options={[
              { value: "flood",      label: "Flood" },
              { value: "fire",       label: "Fire" },
              { value: "landslide",  label: "Landslide" },
              { value: "earthquake", label: "Earthquake" },
              { value: "typhoon",    label: "Typhoon" },
              { value: "other",      label: "Other" },
            ]}
            required
            error={hazardFormErrors.hazard_type}
          />
          <FormSelect
            onChange={handleHazardField}
            label="Risk Level"
            name="risk_level"
            value={hazardForm.risk_level ?? "medium"}
            options={[
              { value: "low",      label: "Low" },
              { value: "medium",   label: "Medium" },
              { value: "high",     label: "High" },
              { value: "critical", label: "Critical" },
            ]}
            required
            error={hazardFormErrors.risk_level}
          />
          <FormInput
            onChange={handleHazardField}
            label="Latitude"
            name="latitude"
            value={hazardForm.latitude ?? ""}
            placeholder="e.g. 14.5995"
            type="number"
          />
          <FormInput
            onChange={handleHazardField}
            label="Longitude"
            name="longitude"
            value={hazardForm.longitude ?? ""}
            placeholder="e.g. 120.9842"
            type="number"
          />
          <FormInput
            onChange={handleHazardField}
            label="Estimated Affected Population"
            name="affected_population"
            value={hazardForm.affected_population ?? ""}
            placeholder="e.g. 250"
            type="number"
          />
          <FormTextarea
            className="col-span-2"
            onChange={handleHazardField}
            label="Description"
            name="description"
            value={hazardForm.description ?? ""}
            placeholder="Describe the hazard, its causes, and impact on the community"
          />
          <FormTextarea
            className="col-span-2"
            onChange={handleHazardField}
            label="Notes"
            name="notes"
            value={hazardForm.notes ?? ""}
            placeholder="Additional notes or mitigation measures in place"
            rows={2}
          />
        </div>
      </Modal>

      {/* ── Edit Hazard Site Modal ── */}
      <Modal
        open={showHazardEdit}
        onClose={() => { setShowHazardEdit(false); setEditingHazard(null); }}
        title="Edit Hazard Site"
        size="lg"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { setShowHazardEdit(false); setEditingHazard(null); }}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={submitHazardEdit} disabled={hazardSubmitting}>
              {hazardSubmitting ? "Saving…" : "Update Hazard Site"}
            </ModalButton>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            className="col-span-2"
            onChange={handleHazardField}
            label="Site Name"
            name="name"
            value={hazardForm.name ?? ""}
            required
            error={hazardFormErrors.name}
          />
          <FormSelect
            onChange={handleHazardField}
            label="Hazard Type"
            name="hazard_type"
            value={hazardForm.hazard_type ?? "flood"}
            options={[
              { value: "flood",      label: "Flood" },
              { value: "fire",       label: "Fire" },
              { value: "landslide",  label: "Landslide" },
              { value: "earthquake", label: "Earthquake" },
              { value: "typhoon",    label: "Typhoon" },
              { value: "other",      label: "Other" },
            ]}
            required
            error={hazardFormErrors.hazard_type}
          />
          <FormSelect
            onChange={handleHazardField}
            label="Risk Level"
            name="risk_level"
            value={hazardForm.risk_level ?? "medium"}
            options={[
              { value: "low",      label: "Low" },
              { value: "medium",   label: "Medium" },
              { value: "high",     label: "High" },
              { value: "critical", label: "Critical" },
            ]}
            required
            error={hazardFormErrors.risk_level}
          />
          <FormInput
            onChange={handleHazardField}
            label="Latitude"
            name="latitude"
            value={hazardForm.latitude ?? ""}
            type="number"
          />
          <FormInput
            onChange={handleHazardField}
            label="Longitude"
            name="longitude"
            value={hazardForm.longitude ?? ""}
            type="number"
          />
          <FormInput
            onChange={handleHazardField}
            label="Estimated Affected Population"
            name="affected_population"
            value={hazardForm.affected_population ?? ""}
            type="number"
          />
          <FormTextarea
            className="col-span-2"
            onChange={handleHazardField}
            label="Description"
            name="description"
            value={hazardForm.description ?? ""}
          />
          <FormTextarea
            className="col-span-2"
            onChange={handleHazardField}
            label="Notes"
            name="notes"
            value={hazardForm.notes ?? ""}
            rows={2}
          />
        </div>
      </Modal>

      {/* ── Delete Hazard Modal ── */}
      <Modal
        open={showHazardDelete}
        onClose={() => { setShowHazardDelete(false); setDeleteHazard(null); }}
        title="Remove Hazard Site"
        description="This action cannot be undone."
        size="sm"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { setShowHazardDelete(false); setDeleteHazard(null); }}>Cancel</ModalButton>
            <ModalButton variant="danger" onClick={submitHazardDelete}>Remove</ModalButton>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to remove{" "}
          <span className="font-semibold text-foreground">{deleteHazard?.name}</span>{" "}
          from the hazard map?
        </p>
      </Modal>

      {/* ── Create Evacuation Modal ── */}
      <Modal
        open={showEvacCreate}
        onClose={() => setShowEvacCreate(false)}
        title="Log Evacuation Event"
        size="lg"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setShowEvacCreate(false)}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={submitEvacCreate} disabled={evacSubmitting}>
              {evacSubmitting ? "Saving…" : "Log Event"}
            </ModalButton>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            className="col-span-2"
            onChange={handleEvacField}
            label="Evacuation Name"
            name="evacuation_name"
            value={evacForm.evacuation_name ?? ""}
            placeholder="e.g. Typhoon Aghon Evacuation — March 2026"
            required
            error={evacFormErrors.evacuation_name}
          />
          <FormSelect
            onChange={handleEvacField}
            label="Disaster Type"
            name="disaster_type"
            value={evacForm.disaster_type ?? "flood"}
            options={[
              { value: "flood",     label: "Flood" },
              { value: "fire",      label: "Fire" },
              { value: "landslide", label: "Landslide" },
              { value: "typhoon",   label: "Typhoon" },
              { value: "other",     label: "Other" },
            ]}
            required
            error={evacFormErrors.disaster_type}
          />
          <FormSelect
            onChange={handleEvacField}
            label="Status"
            name="status"
            value={evacForm.status ?? "active"}
            options={[
              { value: "active",    label: "Active" },
              { value: "resolved",  label: "Resolved" },
              { value: "cancelled", label: "Cancelled" },
            ]}
            required
            error={evacFormErrors.status}
          />
          <FormInput
            onChange={handleEvacField}
            label="Started At"
            name="started_at"
            value={evacForm.started_at ?? ""}
            type="datetime-local"
          />
          <FormInput
            onChange={handleEvacField}
            label="Ended At"
            name="ended_at"
            value={evacForm.ended_at ?? ""}
            type="datetime-local"
          />
          <FormInput
            onChange={handleEvacField}
            label="Evacuation Center"
            name="evacuation_center"
            value={evacForm.evacuation_center ?? ""}
            placeholder="e.g. Barangay Covered Court"
          />
          <FormInput
            onChange={handleEvacField}
            label="Center Address"
            name="evacuation_center_address"
            value={evacForm.evacuation_center_address ?? ""}
            placeholder="e.g. Main Road, Purok Dahlia"
          />
          <FormInput
            onChange={handleEvacField}
            label="Total Families"
            name="total_families"
            value={evacForm.total_families ?? "0"}
            type="number"
            placeholder="0"
          />
          <FormInput
            onChange={handleEvacField}
            label="Total Individuals"
            name="total_individuals"
            value={evacForm.total_individuals ?? "0"}
            type="number"
            placeholder="0"
          />
          <FormTextarea
            className="col-span-2"
            onChange={handleEvacField}
            label="Notes"
            name="notes"
            value={evacForm.notes ?? ""}
            placeholder="Situation overview, relief status, response actions taken"
          />
        </div>
      </Modal>

      {/* ── Edit Evacuation Modal ── */}
      <Modal
        open={showEvacEdit}
        onClose={() => { setShowEvacEdit(false); setEditingEvac(null); }}
        title="Edit Evacuation Event"
        size="lg"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { setShowEvacEdit(false); setEditingEvac(null); }}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={submitEvacEdit} disabled={evacSubmitting}>
              {evacSubmitting ? "Saving…" : "Update Event"}
            </ModalButton>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            className="col-span-2"
            onChange={handleEvacField}
            label="Evacuation Name"
            name="evacuation_name"
            value={evacForm.evacuation_name ?? ""}
            required
            error={evacFormErrors.evacuation_name}
          />
          <FormSelect
            onChange={handleEvacField}
            label="Disaster Type"
            name="disaster_type"
            value={evacForm.disaster_type ?? "flood"}
            options={[
              { value: "flood",     label: "Flood" },
              { value: "fire",      label: "Fire" },
              { value: "landslide", label: "Landslide" },
              { value: "typhoon",   label: "Typhoon" },
              { value: "other",     label: "Other" },
            ]}
            required
            error={evacFormErrors.disaster_type}
          />
          <FormSelect
            onChange={handleEvacField}
            label="Status"
            name="status"
            value={evacForm.status ?? "active"}
            options={[
              { value: "active",    label: "Active" },
              { value: "resolved",  label: "Resolved" },
              { value: "cancelled", label: "Cancelled" },
            ]}
            required
            error={evacFormErrors.status}
          />
          <FormInput
            onChange={handleEvacField}
            label="Started At"
            name="started_at"
            value={evacForm.started_at ?? ""}
            type="datetime-local"
          />
          <FormInput
            onChange={handleEvacField}
            label="Ended At"
            name="ended_at"
            value={evacForm.ended_at ?? ""}
            type="datetime-local"
          />
          <FormInput
            onChange={handleEvacField}
            label="Evacuation Center"
            name="evacuation_center"
            value={evacForm.evacuation_center ?? ""}
          />
          <FormInput
            onChange={handleEvacField}
            label="Center Address"
            name="evacuation_center_address"
            value={evacForm.evacuation_center_address ?? ""}
          />
          <FormInput
            onChange={handleEvacField}
            label="Total Families"
            name="total_families"
            value={evacForm.total_families ?? "0"}
            type="number"
          />
          <FormInput
            onChange={handleEvacField}
            label="Total Individuals"
            name="total_individuals"
            value={evacForm.total_individuals ?? "0"}
            type="number"
          />
          <FormTextarea
            className="col-span-2"
            onChange={handleEvacField}
            label="Notes"
            name="notes"
            value={evacForm.notes ?? ""}
          />
        </div>
      </Modal>

      {/* ── Delete Evacuation Modal ── */}
      <Modal
        open={showEvacDelete}
        onClose={() => { setShowEvacDelete(false); setDeleteEvac(null); }}
        title="Delete Evacuation Event"
        description="This action cannot be undone."
        size="sm"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { setShowEvacDelete(false); setDeleteEvac(null); }}>Cancel</ModalButton>
            <ModalButton variant="danger" onClick={submitEvacDelete}>Delete</ModalButton>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-foreground">{deleteEvac?.evacuation_name}</span>?
          All family records linked to this event may also be affected.
        </p>
      </Modal>

      {/* Toast stack */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <MabiniButton pageContext="You are on the Disaster/DRRM page. This page manages hazard sites, evacuation events, and affected families. You can ask about barangay risk zones, active evacuations, total evacuees, or DRRM readiness status." />
    </div>
  );
}
