"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Plus,
  MapPin,
  Users,
  ShieldAlert,
  Flame,
  Waves,
  Wind,
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  Bot,
  CloudRain,
  X,
  CheckCircle2,
  Info,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { MabiniButton } from "@/components/ui/mabini-button";
import { api } from "@/lib/api";

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

interface PaginatedEvacuations {
  data: Evacuation[];
  total: number;
  last_page: number;
}

const formTabs = ["Event", "Impact", "Response"];

function FormInput({ label, name, value, placeholder, required, type, error, onChange }: {
  label: string; name: string; value: string; placeholder?: string; required?: boolean;
  type?: string; error?: string; onChange: (n: string, v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type || "text"} value={value} onChange={(e) => onChange(name, e.target.value)} placeholder={placeholder}
        className={cn("w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring", error ? "border-red-500" : "border-border")} />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormSelect({ label, name, value, options, required, error, onChange }: {
  label: string; name: string; value: string; options: string[]; required?: boolean;
  error?: string; onChange: (n: string, v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select value={value} onChange={(e) => onChange(name, e.target.value)}
        className={cn("w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring", error ? "border-red-500" : "border-border")}>
        {options.map((o) => <option key={o} value={o}>{o || "— Select —"}</option>)}
      </select>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormTextarea({ label, name, value, placeholder, onChange }: {
  label: string; name: string; value: string; placeholder?: string; onChange: (n: string, v: string) => void;
}) {
  return (
    <div className="col-span-2">
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>
      <textarea value={value} onChange={(e) => onChange(name, e.target.value)} placeholder={placeholder} rows={3}
        className="w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none" />
    </div>
  );
}

type ToastType = "success" | "error" | "warning" | "info";

export default function DisasterPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"events" | "preparedness">("events");
  const [evacuations, setEvacuations] = useState<Evacuation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [formTab, setFormTab] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [selectedEvac, setSelectedEvac] = useState<Evacuation | null>(null);
  const [toasts, setToasts] = useState<{ id: string; type: ToastType; title: string; message?: string }[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const fetchEvacuations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ per_page: "50", sort_by: "start_date", sort_dir: "desc" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await api.get<PaginatedEvacuations>(`/evacuations?${params}`);
      setEvacuations((res as PaginatedEvacuations).data ?? []);
    } catch {
      addToast("error", "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, addToast]);

  useEffect(() => { fetchEvacuations(); }, [fetchEvacuations]);

  const handleFieldChange = (name: string, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    setFormErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.cause_type) errors.cause_type = "Cause type is required";
    if (!form.evacuation_name?.trim()) errors.evacuation_name = "Event name is required";
    if (!form.start_date) errors.start_date = "Start date is required";
    if (!form.evacuation_center?.trim()) errors.evacuation_center = "Evacuation center is required";
    if (!form.status) errors.status = "Status is required";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      const tab0 = ["cause_type", "evacuation_name", "start_date"];
      if (Object.keys(errors).some((k) => tab0.includes(k))) setFormTab(0);
      else setFormTab(2);
      return false;
    }
    return true;
  };

  const openCreate = () => { setForm({ status: "active" }); setFormErrors({}); setFormTab(0); setShowCreate(true); };
  const openEdit = (e: Evacuation) => {
    setForm({
      evacuation_name: e.evacuation_name, cause_type: e.cause_type,
      start_date: e.start_date, end_date: e.end_date ?? "",
      evacuation_center: e.evacuation_center,
      evacuee_count: String(e.evacuee_count), family_count: String(e.family_count),
      status: e.status, remarks: e.remarks ?? "",
    });
    setFormErrors({}); setFormTab(0); setSelectedEvac(e); setShowEdit(true); setActionMenu(null);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setFormLoading(true);
    try {
      const payload = {
        evacuation_name: form.evacuation_name, cause_type: form.cause_type,
        start_date: form.start_date, end_date: form.end_date || null,
        evacuation_center: form.evacuation_center,
        evacuee_count: form.evacuee_count ? parseInt(form.evacuee_count, 10) : null,
        family_count: form.family_count ? parseInt(form.family_count, 10) : null,
        status: form.status, remarks: form.remarks || null,
      };
      if (showEdit && selectedEvac) {
        await api.put(`/evacuations/${selectedEvac.id}`, payload);
        addToast("success", "Event updated", `"${form.evacuation_name}" has been updated.`);
      } else {
        await api.post("/evacuations", payload);
        addToast("success", "Event logged", `"${form.evacuation_name}" has been recorded.`);
      }
      setShowCreate(false); setShowEdit(false); setSelectedEvac(null);
      fetchEvacuations();
    } catch {
      addToast("error", "Save failed", "Please check your inputs and try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvac) return;
    setFormLoading(true);
    try {
      await api.delete(`/evacuations/${selectedEvac.id}`);
      addToast("success", "Event deleted", `"${selectedEvac.evacuation_name}" has been removed.`);
      setShowDelete(false); setSelectedEvac(null);
      fetchEvacuations();
    } catch {
      addToast("error", "Delete failed");
    } finally {
      setFormLoading(false);
    }
  };

  const eventIcon = (cause: string) => {
    const lc = cause.toLowerCase();
    if (lc.includes("typhoon") || lc.includes("bagyo")) return <Wind className="h-5 w-5 text-blue-500" />;
    if (lc.includes("flood") || lc.includes("baha")) return <Waves className="h-5 w-5 text-cyan-500" />;
    if (lc.includes("fire") || lc.includes("sunog")) return <Flame className="h-5 w-5 text-red-500" />;
    return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  };

  const activeEvacuations = evacuations.filter((e) => e.status === "active");
  const totalEvacuees = activeEvacuations.reduce((s, e) => s + (e.evacuee_count ?? 0), 0);
  const totalFamilies = activeEvacuations.reduce((s, e) => s + (e.family_count ?? 0), 0);
  const statusLabel = (s: string) => ({ active: "active", closed: "inactive", standby: "pending" }[s] ?? s);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disaster / DRRM"
        description="Disaster Risk Reduction and Management"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Operations" }, { label: "Disaster/DRRM" }]}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={fetchEvacuations} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
              <Plus className="h-4 w-4" /> Log Event
            </button>
          </div>
        }
      />

      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-accent-primary/20 bg-accent-bg/30">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--accent-primary)", opacity: 0.15 }}>
          <Bot className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Mabini AI Disaster Readiness</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            {activeEvacuations.length > 0
              ? `${activeEvacuations.length} active event(s) with ${totalEvacuees} evacuees currently sheltered. BDRRMC monitoring ongoing.`
              : "No active disaster events. Maintain readiness — verify evacuation center capacity before typhoon season."}
          </p>
        </div>
        <button onClick={() => router.push("/dashboard/ai")} className="shrink-0 px-3 py-1.5 text-[10px] font-semibold rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--accent-primary)", color: "#fff" }}>
          Ask Mabini
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Events" value={loading ? "—" : evacuations.length} icon={<AlertTriangle className="h-5 w-5" />} />
        <StatCard label="Active" value={loading ? "—" : activeEvacuations.length} icon={<ShieldAlert className="h-5 w-5" />} />
        <StatCard label="Current Evacuees" value={loading ? "—" : totalEvacuees} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Families Affected" value={loading ? "—" : totalFamilies} icon={<MapPin className="h-5 w-5" />} />
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

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-lg glass-subtle">
          {(["events", "preparedness"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize",
                activeTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {tab === "events" ? "Evacuation Events" : "Preparedness"}
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
      </div>

      {activeTab === "events" && (
        <div className="space-y-3">
          {loading ? (
            <div className="p-12 rounded-xl glass flex items-center justify-center">
              <div className="flex items-center gap-3 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin" />
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
                <button onClick={openCreate} className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
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
                  <p className="text-xs text-muted-foreground mb-2">{e.remarks || e.cause_type}</p>
                  <div className="flex items-center gap-4 text-[12px] text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {e.start_date}{e.end_date ? ` – ${e.end_date}` : ""}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.evacuation_center}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {e.family_count} families / {e.evacuee_count} evacuees</span>
                  </div>
                </div>
                <div className="relative" onClick={(ev) => ev.stopPropagation()}>
                  <button onClick={() => setActionMenu(actionMenu === e.id ? null : e.id)} className="p-1.5 rounded hover:bg-muted">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </button>
                  {actionMenu === e.id && (
                    <div className="absolute right-0 top-8 z-20 w-44 glass rounded-lg shadow-lg py-1">
                      <button onClick={() => openEdit(e)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Edit className="h-3.5 w-3.5" /> Edit</button>
                      <button onClick={() => { setSelectedEvac(e); setShowDelete(true); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-muted flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "preparedness" && (
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
                <div className={cn("w-5 h-5 rounded flex items-center justify-center text-white text-xs", item.done ? "bg-emerald-500" : "bg-muted border border-border")}>
                  {item.done && "✓"}
                </div>
                <span className={cn("text-sm", item.done ? "text-foreground" : "text-muted-foreground")}>{item.label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">4 of 7 items complete (57%)</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={showCreate || showEdit} onClose={() => { setShowCreate(false); setShowEdit(false); setSelectedEvac(null); }}
        title={showEdit ? "Edit Evacuation Event" : "Log Evacuation Event"} size="lg"
        footer={<>
          <ModalButton variant="secondary" onClick={() => { setShowCreate(false); setShowEdit(false); setSelectedEvac(null); }}>Cancel</ModalButton>
          {formTab > 0 && <ModalButton variant="secondary" onClick={() => setFormTab((t) => t - 1)}>Previous</ModalButton>}
          {formTab < formTabs.length - 1
            ? <ModalButton variant="primary" onClick={() => setFormTab((t) => t + 1)}>Next</ModalButton>
            : <ModalButton variant="primary" onClick={handleSubmit} disabled={formLoading}>{formLoading ? "Saving..." : showEdit ? "Update" : "Save"}</ModalButton>}
        </>}>
        <div className="flex border-b border-border mb-6">
          {formTabs.map((tab, i) => (
            <button key={tab} onClick={() => setFormTab(i)}
              className={cn("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors", formTab === i ? "border-accent-primary text-accent-text" : "border-transparent text-muted-foreground hover:text-foreground")}>
              {tab}
            </button>
          ))}
        </div>
        {formTab === 0 && (
          <div className="grid grid-cols-2 gap-4">
            <FormSelect label="Cause Type" name="cause_type" value={form.cause_type || ""}
              options={["", "Typhoon", "Flood", "Earthquake", "Fire", "Landslide", "Volcanic Activity", "Drought", "Epidemic", "Others"]}
              required error={formErrors.cause_type} onChange={handleFieldChange} />
            <FormInput label="Event Name" name="evacuation_name" value={form.evacuation_name || ""} placeholder="e.g. Typhoon Aghon" required error={formErrors.evacuation_name} onChange={handleFieldChange} />
            <FormInput label="Start Date" name="start_date" value={form.start_date || ""} type="date" required error={formErrors.start_date} onChange={handleFieldChange} />
            <FormInput label="End Date" name="end_date" value={form.end_date || ""} type="date" onChange={handleFieldChange} />
          </div>
        )}
        {formTab === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Families Affected" name="family_count" value={form.family_count || ""} placeholder="e.g. 45" type="number" onChange={handleFieldChange} />
            <FormInput label="Evacuees" name="evacuee_count" value={form.evacuee_count || ""} placeholder="e.g. 180" type="number" onChange={handleFieldChange} />
          </div>
        )}
        {formTab === 2 && (
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Evacuation Center" name="evacuation_center" value={form.evacuation_center || ""} placeholder="e.g. Barangay Covered Court" required error={formErrors.evacuation_center} onChange={handleFieldChange} />
            <FormSelect label="Status" name="status" value={form.status || ""}
              options={["", "active", "standby", "closed"]} required error={formErrors.status} onChange={handleFieldChange} />
            <FormTextarea label="Remarks" name="remarks" value={form.remarks || ""} placeholder="Additional notes..." onChange={handleFieldChange} />
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal open={showDelete} onClose={() => { setShowDelete(false); setSelectedEvac(null); }} title="Confirm Delete" description="This action cannot be undone." size="sm"
        footer={<>
          <ModalButton variant="secondary" onClick={() => { setShowDelete(false); setSelectedEvac(null); }}>Cancel</ModalButton>
          <ModalButton variant="danger" onClick={handleDelete} disabled={formLoading}>{formLoading ? "Deleting..." : "Delete"}</ModalButton>
        </>}>
        <p className="text-sm text-muted-foreground">Are you sure you want to delete <span className="font-semibold text-foreground">{selectedEvac?.evacuation_name}</span>? This event record will be permanently removed.</p>
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
                  toast.type === "info" && "text-blue-700 dark:text-blue-300",
                )}>{toast.message}</p>}
              </div>
              <button onClick={() => setToasts((p) => p.filter((t) => t.id !== toast.id))} className="shrink-0 p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}

      <MabiniButton pageContext="You are on the Disaster Risk Reduction Management (DRRM) page. This page manages evacuation events, disaster response records, and emergency preparedness tracking." />
    </div>
  );
}
