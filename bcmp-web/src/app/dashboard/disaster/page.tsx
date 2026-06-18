"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, Plus, MapPin, Users, ShieldAlert, Flame, Waves, Wind,
  Calendar, MoreHorizontal, Edit, Trash2, Bot, CloudRain, X, CheckCircle2,
  Info, RefreshCw, Navigation, Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { MabiniButton } from "@/components/ui/mabini-button";
import { api } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────

interface HazardPin {
  id: string;
  name: string | null;
  hazard_type: string;
  description: string | null;
  latitude: string;
  longitude: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "active" | "resolved" | "monitoring";
}

interface Evacuation {
  id: string;
  evacuation_name: string;
  cause_type: string;
  start_date: string;
  end_date: string | null;
  evacuation_center: string;
  evacuee_count: number;
  family_count: number;
  status: "active" | "closed" | "standby";
  remarks: string | null;
}

interface EvacuationFamily {
  id: string;
  head_name: string;
  member_count: number;
  special_needs: string | null;
  relief_received: string[] | null;
}

interface PaginatedHazardPins { data: HazardPin[]; total: number; }
interface PaginatedEvacuations { data: Evacuation[]; total: number; }

type ToastType = "success" | "error" | "info";
type Tab = "events" | "hazard" | "families";

// ── Helpers ────────────────────────────────────────────────────────────────────

function FormInput({ label, name, value, placeholder, required, type, error, onChange }: {
  label: string; name: string; value: string; placeholder?: string; required?: boolean;
  type?: string; error?: string; onChange: (n: string, v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type || "text"} value={value} onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        className={cn("w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring", error ? "border-red-500" : "border-border")} />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormSelect({ label, name, value, options, required, error, onChange }: {
  label: string; name: string; value: string;
  options: { value: string; label: string }[]; required?: boolean;
  error?: string; onChange: (n: string, v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select value={value} onChange={(e) => onChange(name, e.target.value)}
        className={cn("w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring", error ? "border-red-500" : "border-border")}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormTextarea({ label, name, value, placeholder, onChange }: {
  label: string; name: string; value: string; placeholder?: string;
  onChange: (n: string, v: string) => void;
}) {
  return (
    <div className="col-span-2">
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>
      <textarea value={value} onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder} rows={3}
        className="w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none" />
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    low: { label: "Low", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400" },
    medium: { label: "Medium", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400" },
    high: { label: "High", cls: "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400" },
    critical: { label: "Critical", cls: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400" },
  };
  const s = map[severity] ?? { label: severity, cls: "bg-muted text-muted-foreground" };
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold", s.cls)}>{s.label}</span>;
}

const HAZARD_TYPES = ["", "Flood-prone", "Landslide", "Earthquake", "Fire", "Storm surge", "Volcanic", "Drought", "Disease outbreak", "Others"];
const CAUSE_TYPES = ["", "Typhoon", "Flood", "Earthquake", "Fire", "Landslide", "Volcanic Activity", "Drought", "Epidemic", "Others"];
const EVAC_FORM_TABS = ["Event", "Impact", "Response"];

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function DisasterPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("events");

  // ── Evacuations state ──
  const [evacuations, setEvacuations] = useState<Evacuation[]>([]);
  const [evacLoading, setEvacLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreateEvac, setShowCreateEvac] = useState(false);
  const [showEditEvac, setShowEditEvac] = useState(false);
  const [showDeleteEvac, setShowDeleteEvac] = useState(false);
  const [evacFormTab, setEvacFormTab] = useState(0);
  const [evacForm, setEvacForm] = useState<Record<string, string>>({});
  const [evacFormErrors, setEvacFormErrors] = useState<Record<string, string>>({});
  const [evacFormLoading, setEvacFormLoading] = useState(false);
  const [selectedEvac, setSelectedEvac] = useState<Evacuation | null>(null);
  const [evacActionMenu, setEvacActionMenu] = useState<string | null>(null);

  // ── Hazard pins state ──
  const [pins, setPins] = useState<HazardPin[]>([]);
  const [pinsLoading, setPinsLoading] = useState(false);
  const [pinsSearch, setPinsSearch] = useState("");
  const [pinTypeFilter, setPinTypeFilter] = useState("");
  const [pinSeverityFilter, setPinSeverityFilter] = useState("");
  const [showCreatePin, setShowCreatePin] = useState(false);
  const [showEditPin, setShowEditPin] = useState(false);
  const [showDeletePin, setShowDeletePin] = useState(false);
  const [pinForm, setPinForm] = useState<Record<string, string>>({});
  const [pinFormErrors, setPinFormErrors] = useState<Record<string, string>>({});
  const [pinFormLoading, setPinFormLoading] = useState(false);
  const [selectedPin, setSelectedPin] = useState<HazardPin | null>(null);
  const [pinActionMenu, setPinActionMenu] = useState<string | null>(null);

  // ── Families state ──
  const [familiesEvacId, setFamiliesEvacId] = useState("");
  const [families, setFamilies] = useState<EvacuationFamily[]>([]);
  const [familiesLoading, setFamiliesLoading] = useState(false);

  // ── Toasts ──
  const [toasts, setToasts] = useState<{ id: string; type: ToastType; title: string; message?: string }[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  // ── Fetch evacuations ──
  const fetchEvacuations = useCallback(async () => {
    setEvacLoading(true);
    try {
      const params = new URLSearchParams({ per_page: "50", sort_by: "start_date", sort_dir: "desc" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await api.get<PaginatedEvacuations>(`/evacuations?${params}`);
      setEvacuations((res as PaginatedEvacuations).data ?? []);
    } catch {
      addToast("error", "Failed to load events");
    } finally {
      setEvacLoading(false);
    }
  }, [statusFilter, addToast]);

  // ── Fetch hazard pins ──
  const fetchPins = useCallback(async () => {
    setPinsLoading(true);
    try {
      const params = new URLSearchParams({ per_page: "100" });
      if (pinsSearch) params.set("search", pinsSearch);
      if (pinTypeFilter) params.set("hazard_type", pinTypeFilter);
      if (pinSeverityFilter) params.set("severity", pinSeverityFilter);
      const res = await api.get<PaginatedHazardPins>(`/hazard-pins?${params}`);
      setPins((res as PaginatedHazardPins).data ?? []);
    } catch {
      addToast("error", "Failed to load hazard sites");
    } finally {
      setPinsLoading(false);
    }
  }, [pinsSearch, pinTypeFilter, pinSeverityFilter, addToast]);

  // ── Fetch families for selected evacuation ──
  const fetchFamilies = useCallback(async (evacId: string) => {
    if (!evacId) { setFamilies([]); return; }
    setFamiliesLoading(true);
    try {
      const res = await api.get<{ evacuation: Evacuation; families: EvacuationFamily[] }>(`/evacuations/${evacId}`);
      setFamilies((res as { families: EvacuationFamily[] }).families ?? []);
    } catch {
      addToast("error", "Failed to load families");
    } finally {
      setFamiliesLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchEvacuations(); }, [fetchEvacuations]);
  useEffect(() => {
    if (activeTab === "hazard" && pins.length === 0) fetchPins();
  }, [activeTab, fetchPins, pins.length]);

  // ── Evac form handlers ──
  const handleEvacField = (name: string, value: string) => {
    setEvacForm((f) => ({ ...f, [name]: value }));
    setEvacFormErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
  };
  const validateEvacForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!evacForm.cause_type) errors.cause_type = "Required";
    if (!evacForm.evacuation_name?.trim()) errors.evacuation_name = "Required";
    if (!evacForm.start_date) errors.start_date = "Required";
    if (!evacForm.evacuation_center?.trim()) errors.evacuation_center = "Required";
    if (!evacForm.status) errors.status = "Required";
    setEvacFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      if (["cause_type", "evacuation_name", "start_date"].some((k) => errors[k])) setEvacFormTab(0);
      else setEvacFormTab(2);
      return false;
    }
    return true;
  };
  const openCreateEvac = () => { setEvacForm({ status: "active" }); setEvacFormErrors({}); setEvacFormTab(0); setShowCreateEvac(true); };
  const openEditEvac = (e: Evacuation) => {
    setEvacForm({
      evacuation_name: e.evacuation_name, cause_type: e.cause_type,
      start_date: e.start_date, end_date: e.end_date ?? "",
      evacuation_center: e.evacuation_center,
      evacuee_count: String(e.evacuee_count), family_count: String(e.family_count),
      status: e.status, remarks: e.remarks ?? "",
    });
    setEvacFormErrors({}); setEvacFormTab(0); setSelectedEvac(e); setShowEditEvac(true); setEvacActionMenu(null);
  };
  const handleEvacSubmit = async () => {
    if (!validateEvacForm()) return;
    setEvacFormLoading(true);
    try {
      const payload = {
        evacuation_name: evacForm.evacuation_name, cause_type: evacForm.cause_type,
        start_date: evacForm.start_date, end_date: evacForm.end_date || null,
        evacuation_center: evacForm.evacuation_center,
        evacuee_count: evacForm.evacuee_count ? parseInt(evacForm.evacuee_count, 10) : null,
        family_count: evacForm.family_count ? parseInt(evacForm.family_count, 10) : null,
        status: evacForm.status, remarks: evacForm.remarks || null,
      };
      if (showEditEvac && selectedEvac) {
        await api.put(`/evacuations/${selectedEvac.id}`, payload);
        addToast("success", "Event updated", `"${evacForm.evacuation_name}" has been updated.`);
      } else {
        await api.post("/evacuations", payload);
        addToast("success", "Event logged", `"${evacForm.evacuation_name}" has been recorded.`);
      }
      setShowCreateEvac(false); setShowEditEvac(false); setSelectedEvac(null);
      fetchEvacuations();
    } catch {
      addToast("error", "Save failed", "Please check your inputs and try again.");
    } finally {
      setEvacFormLoading(false);
    }
  };
  const handleEvacDelete = async () => {
    if (!selectedEvac) return;
    setEvacFormLoading(true);
    try {
      await api.delete(`/evacuations/${selectedEvac.id}`);
      addToast("success", "Event deleted");
      setShowDeleteEvac(false); setSelectedEvac(null);
      fetchEvacuations();
    } catch {
      addToast("error", "Delete failed");
    } finally {
      setEvacFormLoading(false);
    }
  };

  // ── Hazard pin form handlers ──
  const handlePinField = (name: string, value: string) => {
    setPinForm((f) => ({ ...f, [name]: value }));
    setPinFormErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
  };
  const validatePinForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!pinForm.hazard_type) errors.hazard_type = "Required";
    if (!pinForm.latitude) errors.latitude = "Required";
    if (!pinForm.longitude) errors.longitude = "Required";
    setPinFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const openCreatePin = () => { setPinForm({ severity: "medium", status: "active" }); setPinFormErrors({}); setShowCreatePin(true); };
  const openEditPin = (p: HazardPin) => {
    setPinForm({
      hazard_type: p.hazard_type, name: p.name ?? "",
      description: p.description ?? "",
      latitude: p.latitude, longitude: p.longitude,
      severity: p.severity, status: p.status,
    });
    setPinFormErrors({}); setSelectedPin(p); setShowEditPin(true); setPinActionMenu(null);
  };
  const handlePinSubmit = async () => {
    if (!validatePinForm()) return;
    setPinFormLoading(true);
    try {
      const payload = {
        hazard_type: pinForm.hazard_type, name: pinForm.name || null,
        description: pinForm.description || null,
        latitude: parseFloat(pinForm.latitude || "0"), longitude: parseFloat(pinForm.longitude || "0"),
        severity: pinForm.severity || null, status: pinForm.status || null,
      };
      if (showEditPin && selectedPin) {
        await api.put(`/hazard-pins/${selectedPin.id}`, payload);
        addToast("success", "Hazard site updated");
      } else {
        await api.post("/hazard-pins", payload);
        addToast("success", "Hazard site added");
      }
      setShowCreatePin(false); setShowEditPin(false); setSelectedPin(null);
      fetchPins();
    } catch {
      addToast("error", "Save failed");
    } finally {
      setPinFormLoading(false);
    }
  };
  const handlePinDelete = async () => {
    if (!selectedPin) return;
    setPinFormLoading(true);
    try {
      await api.delete(`/hazard-pins/${selectedPin.id}`);
      addToast("success", "Hazard site removed");
      setShowDeletePin(false); setSelectedPin(null);
      fetchPins();
    } catch {
      addToast("error", "Delete failed");
    } finally {
      setPinFormLoading(false);
    }
  };

  // ── Derived stats ──
  const activeEvacuations = evacuations.filter((e) => e.status === "active");
  const totalEvacuees = activeEvacuations.reduce((s, e) => s + (e.evacuee_count ?? 0), 0);
  const highRiskPins = pins.filter((p) => p.severity === "high" || p.severity === "critical");
  const statusLabel = (s: string) => ({ active: "active", closed: "inactive", standby: "pending" }[s] ?? s);

  const eventIcon = (cause: string) => {
    const lc = cause.toLowerCase();
    if (lc.includes("typhoon") || lc.includes("bagyo")) return <Wind className="h-5 w-5 text-blue-500" />;
    if (lc.includes("flood") || lc.includes("baha")) return <Waves className="h-5 w-5 text-cyan-500" />;
    if (lc.includes("fire") || lc.includes("sunog")) return <Flame className="h-5 w-5 text-red-500" />;
    return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  };

  return (
    <div className="space-y-6" onClick={() => { setEvacActionMenu(null); setPinActionMenu(null); }}>
      <PageHeader
        title="Disaster / DRRM"
        description="Disaster Risk Reduction and Management"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Operations" }, { label: "Disaster/DRRM" }]}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => { fetchEvacuations(); if (activeTab === "hazard") fetchPins(); }}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            {activeTab === "events" && (
              <button onClick={openCreateEvac} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
                <Plus className="h-4 w-4" /> Log Event
              </button>
            )}
            {activeTab === "hazard" && (
              <button onClick={openCreatePin} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
                <Plus className="h-4 w-4" /> Add Hazard Site
              </button>
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
          <p className="text-xs font-semibold text-foreground">Mabini AI Disaster Readiness</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            {activeEvacuations.length > 0
              ? `${activeEvacuations.length} active event(s) with ${totalEvacuees} evacuees currently sheltered. BDRRMC monitoring ongoing.`
              : `No active evacuations. ${pins.length > 0 ? `${highRiskPins.length} high/critical hazard sites on record.` : "Maintain readiness — verify evacuation center capacity before typhoon season."}`}
          </p>
        </div>
        <button onClick={() => router.push("/dashboard/ai")} className="shrink-0 px-3 py-1.5 text-[10px] font-semibold rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--accent-primary)", color: "#fff" }}>
          Ask Mabini
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Hazard Sites" value={pinsLoading || pins.length === 0 && activeTab !== "hazard" ? "—" : pins.length} icon={<MapPin className="h-5 w-5" />} />
        <StatCard label="High / Critical Risk" value={pinsLoading || pins.length === 0 && activeTab !== "hazard" ? "—" : highRiskPins.length} icon={<ShieldAlert className="h-5 w-5" />} />
        <StatCard label="Active Evacuations" value={evacLoading ? "—" : activeEvacuations.length} icon={<AlertTriangle className="h-5 w-5" />} />
        <StatCard label="Total Evacuees" value={evacLoading ? "—" : totalEvacuees} icon={<Users className="h-5 w-5" />} />
      </div>

      {/* Active Situation Banner */}
      {totalEvacuees > 0 && (
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Active Situation: {totalEvacuees} evacuees currently sheltered</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">BDRRMC is on standby. Relief goods distribution ongoing.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-lg glass-subtle">
          {([
            { id: "events", label: "Evacuation Events" },
            { id: "hazard", label: "Hazard Map" },
            { id: "families", label: "Families" },
          ] as { id: Tab; label: string }[]).map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors",
                activeTab === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {tab.label}
            </button>
          ))}
        </div>
        {activeTab === "events" && (
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="standby">Standby</option>
            <option value="closed">Closed</option>
          </select>
        )}
        {activeTab === "hazard" && (
          <>
            <input value={pinsSearch} onChange={(e) => setPinsSearch(e.target.value)} placeholder="Search hazard sites..."
              className="px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring w-56" />
            <select value={pinTypeFilter} onChange={(e) => setPinTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring">
              <option value="">All Types</option>
              {HAZARD_TYPES.filter(Boolean).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={pinSeverityFilter} onChange={(e) => setPinSeverityFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring">
              <option value="">All Severity</option>
              {["low", "medium", "high", "critical"].map((s) => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <button onClick={fetchPins} className="px-3 py-2 text-sm rounded-xl border border-border hover:bg-muted transition-colors flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Search
            </button>
          </>
        )}
      </div>

      {/* ── Evacuation Events Tab ── */}
      {activeTab === "events" && (
        <div className="space-y-3">
          {evacLoading ? (
            <div className="p-12 rounded-xl glass flex items-center justify-center">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading events...</span>
              </div>
            </div>
          ) : evacuations.length === 0 ? (
            <div className="p-12 rounded-xl glass flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <CloudRain className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">No disaster events recorded</p>
                  <p className="text-xs text-muted-foreground mt-1">Record incidents and manage evacuations when disasters occur.</p>
                </div>
                <button onClick={openCreateEvac} className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
                  + Log First Event
                </button>
              </div>
            </div>
          ) : evacuations.map((e) => (
            <div key={e.id} className={cn("p-5 rounded-xl border glass", e.status === "active" && "border-amber-300 dark:border-amber-700")}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted/50 shrink-0">{eventIcon(e.cause_type)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-foreground">{e.evacuation_name}</h3>
                    <StatusBadge status={statusLabel(e.status)} />
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{e.cause_type}{e.remarks ? ` — ${e.remarks}` : ""}</p>
                  <div className="flex items-center gap-4 text-[12px] text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {e.start_date}{e.end_date ? ` – ${e.end_date}` : ""}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.evacuation_center}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {e.family_count} families / {e.evacuee_count} evacuees</span>
                  </div>
                </div>
                <div className="relative" onClick={(ev) => ev.stopPropagation()}>
                  <button onClick={() => setEvacActionMenu(evacActionMenu === e.id ? null : e.id)} className="p-1.5 rounded hover:bg-muted">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </button>
                  {evacActionMenu === e.id && (
                    <div className="absolute right-0 top-8 z-20 w-44 glass rounded-lg shadow-lg py-1">
                      <button onClick={() => openEditEvac(e)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Edit className="h-3.5 w-3.5" /> Edit</button>
                      <button onClick={() => { setActiveTab("families"); setFamiliesEvacId(e.id); fetchFamilies(e.id); setEvacActionMenu(null); }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Users className="h-3.5 w-3.5" /> View Families</button>
                      <button onClick={() => { setSelectedEvac(e); setShowDeleteEvac(true); setEvacActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-muted flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Hazard Map Tab ── */}
      {activeTab === "hazard" && (
        <div className="rounded-xl glass overflow-hidden">
          {pinsLoading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading hazard sites...</span>
              </div>
            </div>
          ) : pins.length === 0 ? (
            <div className="p-12 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Navigation className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">No hazard sites recorded</p>
                  <p className="text-xs text-muted-foreground mt-1">Pin flood-prone areas, landslide zones, and other risks on the map.</p>
                </div>
                <button onClick={openCreatePin} className="px-4 py-2 text-xs font-semibold rounded-lg text-white" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
                  + Add First Hazard Site
                </button>
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  {["Name / Type", "Severity", "Status", "Coordinates", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pins.map((pin) => (
                  <tr key={pin.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-foreground">{pin.name || pin.hazard_type}</p>
                      <p className="text-[11px] text-muted-foreground">{pin.hazard_type}</p>
                    </td>
                    <td className="px-4 py-3"><SeverityBadge severity={pin.severity} /></td>
                    <td className="px-4 py-3"><StatusBadge status={pin.status === "active" ? "active" : pin.status === "resolved" ? "inactive" : "pending"} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{pin.latitude}, {pin.longitude}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block" onClick={(ev) => ev.stopPropagation()}>
                        <button onClick={() => setPinActionMenu(pinActionMenu === pin.id ? null : pin.id)} className="p-1.5 rounded hover:bg-muted">
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </button>
                        {pinActionMenu === pin.id && (
                          <div className="absolute right-0 top-8 z-20 w-36 glass rounded-lg shadow-lg py-1">
                            <button onClick={() => openEditPin(pin)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Edit className="h-3.5 w-3.5" /> Edit</button>
                            <button onClick={() => { setSelectedPin(pin); setShowDeletePin(true); setPinActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-muted flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Families Tab ── */}
      {activeTab === "families" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-foreground whitespace-nowrap">Select Evacuation:</label>
            <select value={familiesEvacId}
              onChange={(e) => { setFamiliesEvacId(e.target.value); fetchFamilies(e.target.value); }}
              className="flex-1 max-w-sm px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring">
              <option value="">— Select an evacuation event —</option>
              {evacuations.map((e) => <option key={e.id} value={e.id}>{e.evacuation_name} ({e.start_date})</option>)}
            </select>
          </div>
          {!familiesEvacId ? (
            <div className="p-12 rounded-xl glass flex items-center justify-center">
              <div className="text-center">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Select an evacuation event above to view families</p>
              </div>
            </div>
          ) : familiesLoading ? (
            <div className="p-12 rounded-xl glass flex items-center justify-center">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading families...</span>
              </div>
            </div>
          ) : families.length === 0 ? (
            <div className="p-12 rounded-xl glass flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">No family records for this event</p>
                <p className="text-xs text-muted-foreground mt-1">Family intake records will appear here once logged.</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl glass overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr>
                    {["Family Head", "Members", "Special Needs", "Relief Received"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {families.map((fam) => (
                    <tr key={fam.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{fam.head_name}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{fam.member_count}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{fam.special_needs || "—"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {fam.relief_received && fam.relief_received.length > 0
                          ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">{fam.relief_received.length} item(s)</span>
                          : "None"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{families.length} families · {families.reduce((s, f) => s + f.member_count, 0)} total members</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Evacuation CRUD Modals ── */}
      <Modal open={showCreateEvac || showEditEvac} onClose={() => { setShowCreateEvac(false); setShowEditEvac(false); setSelectedEvac(null); }}
        title={showEditEvac ? "Edit Evacuation Event" : "Log Evacuation Event"} size="lg"
        footer={<>
          <ModalButton variant="secondary" onClick={() => { setShowCreateEvac(false); setShowEditEvac(false); setSelectedEvac(null); }}>Cancel</ModalButton>
          {evacFormTab > 0 && <ModalButton variant="secondary" onClick={() => setEvacFormTab((t) => t - 1)}>Previous</ModalButton>}
          {evacFormTab < EVAC_FORM_TABS.length - 1
            ? <ModalButton variant="primary" onClick={() => setEvacFormTab((t) => t + 1)}>Next</ModalButton>
            : <ModalButton variant="primary" onClick={handleEvacSubmit} disabled={evacFormLoading}>{evacFormLoading ? "Saving..." : showEditEvac ? "Update" : "Save"}</ModalButton>}
        </>}>
        <div className="flex border-b border-border mb-6">
          {EVAC_FORM_TABS.map((tab, i) => (
            <button key={tab} onClick={() => setEvacFormTab(i)}
              className={cn("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors", evacFormTab === i ? "border-accent-primary text-accent-text" : "border-transparent text-muted-foreground hover:text-foreground")}>
              {tab}
            </button>
          ))}
        </div>
        {evacFormTab === 0 && (
          <div className="grid grid-cols-2 gap-4">
            <FormSelect label="Cause Type" name="cause_type" value={evacForm.cause_type || ""}
              options={CAUSE_TYPES.map((c) => ({ value: c, label: c || "— Select —" }))}
              required error={evacFormErrors.cause_type} onChange={handleEvacField} />
            <FormInput label="Event Name" name="evacuation_name" value={evacForm.evacuation_name || ""} placeholder="e.g. Typhoon Aghon" required error={evacFormErrors.evacuation_name} onChange={handleEvacField} />
            <FormInput label="Start Date" name="start_date" value={evacForm.start_date || ""} type="date" required error={evacFormErrors.start_date} onChange={handleEvacField} />
            <FormInput label="End Date" name="end_date" value={evacForm.end_date || ""} type="date" onChange={handleEvacField} />
          </div>
        )}
        {evacFormTab === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Families Affected" name="family_count" value={evacForm.family_count || ""} placeholder="e.g. 45" type="number" onChange={handleEvacField} />
            <FormInput label="Evacuees" name="evacuee_count" value={evacForm.evacuee_count || ""} placeholder="e.g. 180" type="number" onChange={handleEvacField} />
          </div>
        )}
        {evacFormTab === 2 && (
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Evacuation Center" name="evacuation_center" value={evacForm.evacuation_center || ""} placeholder="e.g. Barangay Covered Court" required error={evacFormErrors.evacuation_center} onChange={handleEvacField} />
            <FormSelect label="Status" name="status" value={evacForm.status || ""}
              options={[{ value: "", label: "— Select —" }, { value: "active", label: "Active" }, { value: "standby", label: "Standby" }, { value: "closed", label: "Closed" }]}
              required error={evacFormErrors.status} onChange={handleEvacField} />
            <FormTextarea label="Remarks" name="remarks" value={evacForm.remarks || ""} placeholder="Additional notes..." onChange={handleEvacField} />
          </div>
        )}
      </Modal>

      <Modal open={showDeleteEvac} onClose={() => { setShowDeleteEvac(false); setSelectedEvac(null); }} title="Confirm Delete" size="sm"
        footer={<>
          <ModalButton variant="secondary" onClick={() => { setShowDeleteEvac(false); setSelectedEvac(null); }}>Cancel</ModalButton>
          <ModalButton variant="danger" onClick={handleEvacDelete} disabled={evacFormLoading}>{evacFormLoading ? "Deleting..." : "Delete"}</ModalButton>
        </>}>
        <p className="text-sm text-muted-foreground">Delete <span className="font-semibold text-foreground">{selectedEvac?.evacuation_name}</span>? This cannot be undone.</p>
      </Modal>

      {/* ── Hazard Pin CRUD Modals ── */}
      <Modal open={showCreatePin || showEditPin} onClose={() => { setShowCreatePin(false); setShowEditPin(false); setSelectedPin(null); }}
        title={showEditPin ? "Edit Hazard Site" : "Add Hazard Site"} size="md"
        footer={<>
          <ModalButton variant="secondary" onClick={() => { setShowCreatePin(false); setShowEditPin(false); setSelectedPin(null); }}>Cancel</ModalButton>
          <ModalButton variant="primary" onClick={handlePinSubmit} disabled={pinFormLoading}>{pinFormLoading ? "Saving..." : "Save"}</ModalButton>
        </>}>
        <div className="grid grid-cols-2 gap-4">
          <FormSelect label="Hazard Type" name="hazard_type" value={pinForm.hazard_type || ""}
            options={HAZARD_TYPES.map((t) => ({ value: t, label: t || "— Select —" }))}
            required error={pinFormErrors.hazard_type} onChange={handlePinField} />
          <FormInput label="Name / Label" name="name" value={pinForm.name || ""} placeholder="e.g. Estero ng Tambo" onChange={handlePinField} />
          <FormInput label="Latitude" name="latitude" value={pinForm.latitude || ""} placeholder="e.g. 14.4793" type="number" required error={pinFormErrors.latitude} onChange={handlePinField} />
          <FormInput label="Longitude" name="longitude" value={pinForm.longitude || ""} placeholder="e.g. 121.0198" type="number" required error={pinFormErrors.longitude} onChange={handlePinField} />
          <FormSelect label="Severity" name="severity" value={pinForm.severity || "medium"}
            options={[
              { value: "low", label: "Low" }, { value: "medium", label: "Medium" },
              { value: "high", label: "High" }, { value: "critical", label: "Critical" },
            ]} onChange={handlePinField} />
          <FormSelect label="Status" name="status" value={pinForm.status || "active"}
            options={[
              { value: "active", label: "Active" }, { value: "monitoring", label: "Monitoring" },
              { value: "resolved", label: "Resolved" },
            ]} onChange={handlePinField} />
          <FormTextarea label="Description" name="description" value={pinForm.description || ""} placeholder="Describe the hazard and area affected..." onChange={handlePinField} />
        </div>
      </Modal>

      <Modal open={showDeletePin} onClose={() => { setShowDeletePin(false); setSelectedPin(null); }} title="Confirm Delete" size="sm"
        footer={<>
          <ModalButton variant="secondary" onClick={() => { setShowDeletePin(false); setSelectedPin(null); }}>Cancel</ModalButton>
          <ModalButton variant="danger" onClick={handlePinDelete} disabled={pinFormLoading}>{pinFormLoading ? "Deleting..." : "Delete"}</ModalButton>
        </>}>
        <p className="text-sm text-muted-foreground">Remove <span className="font-semibold text-foreground">{selectedPin?.name || selectedPin?.hazard_type}</span> from the hazard map? This cannot be undone.</p>
      </Modal>

      {/* Toasts */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
          {toasts.map((toast) => (
            <div key={toast.id} className={cn("flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg animate-in slide-in-from-right-5 fade-in duration-300",
              toast.type === "success" && "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800",
              toast.type === "error" && "bg-red-50 dark:bg-red-950/80 border-red-200 dark:border-red-800",
              toast.type === "info" && "bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800",
            )}>
              <div className="shrink-0 mt-0.5">
                {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                {toast.type === "error" && <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />}
                {toast.type === "info" && <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-semibold",
                  toast.type === "success" && "text-emerald-800 dark:text-emerald-200",
                  toast.type === "error" && "text-red-800 dark:text-red-200",
                  toast.type === "info" && "text-blue-800 dark:text-blue-200",
                )}>{toast.title}</p>
                {toast.message && <p className={cn("text-xs mt-0.5",
                  toast.type === "success" && "text-emerald-700 dark:text-emerald-300",
                  toast.type === "error" && "text-red-700 dark:text-red-300",
                )}>{toast.message}</p>}
              </div>
              <button onClick={() => setToasts((p) => p.filter((t) => t.id !== toast.id))} className="shrink-0 p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}

      <MabiniButton pageContext="You are on the Disaster Risk Reduction Management (DRRM) page. This page manages evacuation events, hazard sites, evacuation family records, and emergency preparedness tracking." />
    </div>
  );
}
