"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  FileText, Plus, Search, Edit2, Trash2, Lock, Tag,
  Loader2, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  GripVertical, X, ToggleLeft, ToggleRight, Globe,
} from "lucide-react";
import { toast } from "sonner";
import {
  bcmpApi,
  type SystemDocumentTemplate,
  type SystemDocumentTemplatePayload,
  type SystemDocumentTemplateCustomInput,
} from "@/lib/bcmp-api";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────

const CATEGORIES = [
  "Clearance", "Residency", "Indigency", "Good Moral",
  "Business", "ID Card", "Lot / Building", "Special", "Other",
];

const CONSTITUENT_TYPES = [
  { value: "resident", label: "Resident" },
  { value: "establishment", label: "Establishment / Business" },
  { value: "lot_building", label: "Lot / Building" },
  { value: "case", label: "Case / Complaint" },
];

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "select", label: "Dropdown" },
  { value: "textarea", label: "Long Text" },
];

const MERGE_FIELDS = [
  { tag: "{{constituent_name}}", label: "Name" },
  { tag: "{{purok}}", label: "Purok" },
  { tag: "{{address}}", label: "Address" },
  { tag: "{{barangay_name}}", label: "Barangay" },
  { tag: "{{city_municipality}}", label: "City/Mun" },
  { tag: "{{province}}", label: "Province" },
  { tag: "{{document_number}}", label: "Doc No." },
  { tag: "{{issued_date}}", label: "Issued Date" },
  { tag: "{{purpose}}", label: "Purpose" },
  { tag: "{{or_number}}", label: "OR No." },
  { tag: "{{ctc_number}}", label: "CTC No." },
  { tag: "{{valid_until}}", label: "Valid Until" },
  { tag: "{{civil_status}}", label: "Civil Status" },
  { tag: "{{age}}", label: "Age" },
  { tag: "{{birthdate}}", label: "Birthdate" },
];

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  active:   { label: "Active",   color: "text-emerald-600", bg: "bg-emerald-100" },
  draft:    { label: "Draft",    color: "text-amber-600",   bg: "bg-amber-100"   },
  archived: { label: "Archived", color: "text-slate-500",   bg: "bg-slate-100"   },
};

function blank(): SystemDocumentTemplatePayload {
  return {
    name: "", category: "Clearance", constituent_type: "resident",
    title: "", salutation: "", content: "", status: "active", sort_order: 0,
    merge_fields: null, custom_inputs: [], custom_tables: null,
    approval_config: {
      left:  { label: "", position: "Barangay Secretary" },
      right: { label: "", position: "Punong Barangay" },
    },
    settings: {
      show_qr: true, show_ctc: false, show_or: false,
      show_doc_no: true, show_expiry: false, show_photo: false,
      show_thumbmark: false, expiry_months: 3,
    },
  };
}

// ─────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────

export default function BcmpTemplatesPage() {
  const [templates, setTemplates] = useState<SystemDocumentTemplate[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const [showEditor, setShowEditor]   = useState(false);
  const [editTarget, setEditTarget]   = useState<SystemDocumentTemplate | null>(null);
  const [saving, setSaving]           = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<SystemDocumentTemplate | null>(null);
  const [deleting, setDeleting]       = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bcmpApi.documentTemplates.list({
        search: search || undefined,
        category: filterCategory || undefined,
        per_page: 200,
      });
      setTemplates(res.data ?? []);
    } catch {
      toast.error("Failed to load templates.");
    } finally {
      setLoading(false);
    }
  }, [search, filterCategory]);

  useEffect(() => { load(); }, [load]);

  function handleSearchInput(v: string) {
    setSearchInput(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(v), 400);
  }

  function openNew() {
    setEditTarget(null);
    setShowEditor(true);
  }

  function openEdit(t: SystemDocumentTemplate) {
    setEditTarget(t);
    setShowEditor(true);
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await bcmpApi.documentTemplates.delete(confirmDelete.id);
      toast.success("Template deleted.");
      setConfirmDelete(null);
      load();
    } catch {
      toast.error("Failed to delete template.");
    } finally {
      setDeleting(false);
    }
  }

  // Group by category
  const categories = [...new Set(templates.map(t => t.category))].sort();
  const grouped = categories.reduce<Record<string, SystemDocumentTemplate[]>>((acc, cat) => {
    acc[cat] = templates.filter(t => t.category === cat);
    return acc;
  }, {});

  const stats = {
    total:    templates.length,
    active:   templates.filter(t => t.status === "active").length,
    draft:    templates.filter(t => t.status === "draft").length,
    archived: templates.filter(t => t.status === "archived").length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Document Templates
            <span className="text-sm font-normal text-muted-foreground ml-1">— System Master List</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Templates with <code className="text-xs bg-muted px-1 rounded">barangay_id = null</code> automatically appear for all {stats.total > 0 ? templates.filter(t => t.status === "active").length : "—"} active templates across every barangay tenant.
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 shrink-0"
          style={{ background: "var(--accent-primary, #ea580c)" }}
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total",    value: stats.total,    color: "text-foreground" },
          { label: "Active",   value: stats.active,   color: "text-emerald-600" },
          { label: "Draft",    value: stats.draft,    color: "text-amber-600" },
          { label: "Archived", value: stats.archived, color: "text-slate-500" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={cn("text-2xl font-bold mt-0.5", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Propagation notice */}
      <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
        <Globe className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" />
        <div>
          <span className="font-semibold">Auto-propagation:</span>{" "}
          Any template you add or activate here is instantly available to all barangay tenants — no restart, no sync job.
          Barangays can customize their own copy without affecting the system original.
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchInput}
            onChange={e => handleSearchInput(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Template list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-2xl">
          <FileText className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No templates yet. Create the first one.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <section key={cat}>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{cat}</h2>
                <span className="text-xs text-muted-foreground/60">({items.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {items.map(t => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    onEdit={() => openEdit(t)}
                    onDelete={() => setConfirmDelete(t)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Editor */}
      {showEditor && (
        <TemplateEditor
          template={editTarget}
          saving={saving}
          setSaving={setSaving}
          onClose={() => setShowEditor(false)}
          onSaved={() => {
            setShowEditor(false);
            load();
            toast.success(editTarget ? "Template updated." : "Template created and live for all barangays.");
          }}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 bg-background rounded-2xl shadow-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold">Delete System Template</h3>
                <p className="text-xs text-muted-foreground">This removes it from ALL barangays.</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Delete <strong className="text-foreground">&quot;{confirmDelete.name}&quot;</strong>?
              Barangays that customized their own copy will not be affected — only the system original is deleted.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-lg text-sm hover:bg-muted/50 transition-colors">Cancel</button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center gap-2"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete System Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────
// Template Card
// ─────────────────────────────────────────────────

function TemplateCard({
  template, onEdit, onDelete,
}: {
  template: SystemDocumentTemplate;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const s = STATUS_CFG[template.status] ?? STATUS_CFG.active ?? { label: "Active", color: "text-emerald-600", bg: "bg-emerald-100" };

  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-orange-300/50 transition-all group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", s.color, s.bg)}>
              {s.label}
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> System
            </span>
          </div>
          <p className="text-sm font-semibold truncate">{template.name}</p>
          {template.title && (
            <p className="text-[11px] text-muted-foreground truncate italic mt-0.5">&quot;{template.title}&quot;</p>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground whitespace-nowrap mt-1 font-mono">#{template.sort_order}</p>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full capitalize">
          {template.constituent_type?.replace("_", " ")}
        </span>
        {(template.custom_inputs?.length ?? 0) > 0 && (
          <span className="text-[10px] bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded-full">
            {template.custom_inputs!.length} fields
          </span>
        )}
        {template.settings?.show_ctc && (
          <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full">CTC</span>
        )}
        {template.settings?.show_expiry && (
          <span className="text-[10px] bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded-full">
            Valid {template.settings.expiry_months}mo
          </span>
        )}
      </div>

      <div className="flex gap-1.5 border-t border-border/60 pt-3">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:bg-muted/50 transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" /> Edit
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1.5 rounded-lg text-xs border border-red-200 hover:bg-red-50 text-red-600 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Template Editor (right-side drawer)
// ─────────────────────────────────────────────────

function TemplateEditor({
  template, saving, setSaving, onClose, onSaved,
}: {
  template: SystemDocumentTemplate | null;
  saving: boolean;
  setSaving: (v: boolean) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = template === null;
  const init  = isNew ? blank() : { ...template } as SystemDocumentTemplatePayload;

  const [name, setName]             = useState(init.name ?? "");
  const [title, setTitle]           = useState(init.title ?? "");
  const [category, setCategory]     = useState(init.category ?? "Clearance");
  const [cType, setCType]           = useState(init.constituent_type ?? "resident");
  const [salutation, setSalutation] = useState(init.salutation ?? "");
  const [content, setContent]       = useState(init.content ?? "");
  const [status, setStatus]         = useState<"active"|"draft"|"archived">(
    (init.status as "active"|"draft"|"archived") ?? "active"
  );
  const [sortOrder, setSortOrder]   = useState(init.sort_order ?? 0);

  const [approvalLeft, setApprovalLeft]   = useState({
    label:    init.approval_config?.left?.label    ?? "",
    position: init.approval_config?.left?.position ?? "Barangay Secretary",
  });
  const [approvalRight, setApprovalRight] = useState({
    label:    init.approval_config?.right?.label    ?? "",
    position: init.approval_config?.right?.position ?? "Punong Barangay",
  });

  const [settings, setSettings] = useState({
    show_qr:        init.settings?.show_qr        ?? true,
    show_ctc:       init.settings?.show_ctc       ?? false,
    show_or:        init.settings?.show_or        ?? false,
    show_doc_no:    init.settings?.show_doc_no    ?? true,
    show_expiry:    init.settings?.show_expiry    ?? false,
    show_photo:     init.settings?.show_photo     ?? false,
    show_thumbmark: init.settings?.show_thumbmark ?? false,
    expiry_months:  init.settings?.expiry_months  ?? 3,
  });

  const [customInputs, setCustomInputs] = useState<SystemDocumentTemplateCustomInput[]>(
    init.custom_inputs ?? []
  );

  const [sections, setSections] = useState({
    content: true, customInputs: false, approval: false, settings: false,
  });

  const contentRef = useRef<HTMLTextAreaElement>(null);

  function insertTag(tag: string) {
    const el = contentRef.current;
    if (!el) { setContent(c => c + tag); return; }
    const s = el.selectionStart ?? content.length;
    const e = el.selectionEnd   ?? content.length;
    const updated = content.slice(0, s) + tag + content.slice(e);
    setContent(updated);
    setTimeout(() => { el.focus(); const p = s + tag.length; el.setSelectionRange(p, p); }, 0);
  }

  function toggleSetting(k: keyof typeof settings) {
    setSettings(prev => ({ ...prev, [k]: !prev[k] }));
  }

  function addInput() {
    setCustomInputs(prev => [
      ...prev,
      { name: `field_${Date.now()}`, type: "text", label: "New Field", required: false },
    ]);
  }

  async function handleSave() {
    if (!name.trim()) { toast.error("Template name is required."); return; }
    setSaving(true);
    try {
      const payload: Partial<SystemDocumentTemplatePayload> = {
        name: name.trim(),
        title: title.trim() || null,
        category,
        constituent_type: cType as SystemDocumentTemplatePayload["constituent_type"],
        salutation: salutation.trim() || null,
        content: content.trim() || null,
        custom_inputs: customInputs.length > 0 ? customInputs : null,
        approval_config: (approvalLeft.label || approvalRight.label) ? {
          ...(approvalLeft.label  ? { left: approvalLeft  } : {}),
          ...(approvalRight.label ? { right: approvalRight } : {}),
        } : null,
        settings,
        status,
        sort_order: sortOrder,
      };

      if (isNew) {
        await bcmpApi.documentTemplates.create(payload as SystemDocumentTemplatePayload);
      } else {
        await bcmpApi.documentTemplates.update(template!.id, payload);
      }
      onSaved();
    } catch {
      toast.error("Failed to save template.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/50 backdrop-blur-sm">
      <div className="hidden md:block flex-1" onClick={onClose} />
      <div className="w-full md:w-[700px] bg-background flex flex-col h-full shadow-2xl overflow-hidden border-l border-border">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background sticky top-0 z-10">
          <div>
            <h2 className="text-base font-bold">{isNew ? "New System Template" : `Edit: ${template?.name}`}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isNew
                ? "Will be instantly available to all barangay tenants once saved as Active."
                : "Changes are live for all barangays immediately after saving."}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Basic info */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Basic Info</h3>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Template Name <span className="text-red-500">*</span></label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Barangay Clearance"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Certificate Title (printed on PDF)</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. CERTIFICATE OF RESIDENCY"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Constituent Type</label>
                  <select value={cType} onChange={e => setCType(e.target.value as typeof cType)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30">
                    {CONSTITUENT_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Status</label>
                  <div className="flex gap-2">
                    {(["active", "draft", "archived"] as const).map(s => (
                      <button key={s} type="button" onClick={() => setStatus(s)}
                        className={cn("flex-1 py-2 rounded-lg text-xs font-semibold border transition-all capitalize",
                          status === s ? "border-orange-500 bg-orange-500/10 text-orange-600" : "border-border hover:bg-muted/50 text-muted-foreground")}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Sort Order</label>
                  <input type="number" min={0} value={sortOrder} onChange={e => setSortOrder(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30" />
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <CollapsibleSection title="Certificate Content" open={sections.content} onToggle={() => setSections(p => ({ ...p, content: !p.content }))}>
            <div className="space-y-3 pt-3">
              <div>
                <label className="block text-xs font-medium mb-1">Salutation</label>
                <input value={salutation} onChange={e => setSalutation(e.target.value)} placeholder="TO WHOM IT MAY CONCERN:"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-medium">Body Text</label>
                  <span className="text-[10px] text-muted-foreground">Click a tag to insert at cursor</span>
                </div>
                <div className="flex flex-wrap gap-1 p-2 bg-muted/30 rounded-lg border border-border mb-2">
                  {MERGE_FIELDS.map(f => (
                    <button key={f.tag} type="button" onClick={() => insertTag(f.tag)}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors" title={f.tag}>
                      {f.label}
                    </button>
                  ))}
                </div>
                <textarea ref={contentRef} value={content} onChange={e => setContent(e.target.value)} rows={9}
                  placeholder={"This is to certify that {{constituent_name}}, a bonafide resident of Barangay {{barangay_name}}..."}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 resize-y font-mono leading-relaxed" />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Use <code className="bg-muted px-1 rounded">{"{{tag}}"}</code> placeholders — replaced with actual values on generation.
                </p>
              </div>
            </div>
          </CollapsibleSection>

          {/* Custom fields */}
          <CollapsibleSection
            title={`Custom Fields${customInputs.length > 0 ? ` (${customInputs.length})` : ""}`}
            open={sections.customInputs}
            onToggle={() => setSections(p => ({ ...p, customInputs: !p.customInputs }))}
          >
            <div className="pt-3 space-y-2">
              <p className="text-xs text-muted-foreground mb-2">
                Extra fields shown when a barangay generates this document. Use their name as <code className="bg-muted px-1 rounded">{"{{field_name}}"}</code> in body text.
              </p>
              {customInputs.map((inp, i) => (
                <CustomInputRow key={i} input={inp} index={i}
                  onChange={patch => setCustomInputs(prev => prev.map((x, j) => j === i ? { ...x, ...patch } : x))}
                  onRemove={() => setCustomInputs(prev => prev.filter((_, j) => j !== i))} />
              ))}
              <button onClick={addInput}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-orange-400 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Custom Field
              </button>
            </div>
          </CollapsibleSection>

          {/* Signatories */}
          <CollapsibleSection title="Signatories" open={sections.approval} onToggle={() => setSections(p => ({ ...p, approval: !p.approval }))}>
            <div className="pt-3">
              <p className="text-xs text-muted-foreground mb-3">Default names printed on the certificate. Leave blank — barangays can fill in at generation time.</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { side: "Left (Attested by)", state: approvalLeft, setter: setApprovalLeft },
                  { side: "Right (Processed by)", state: approvalRight, setter: setApprovalRight },
                ].map(({ side, state, setter }) => (
                  <div key={side} className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">{side}</p>
                    <input value={state.label} onChange={e => setter(p => ({ ...p, label: e.target.value }))}
                      placeholder="Full name (optional)"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/30" />
                    <input value={state.position} onChange={e => setter(p => ({ ...p, position: e.target.value }))}
                      placeholder="Position"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/30" />
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleSection>

          {/* PDF options */}
          <CollapsibleSection title="PDF Options" open={sections.settings} onToggle={() => setSections(p => ({ ...p, settings: !p.settings }))}>
            <div className="pt-3 space-y-0">
              {[
                { k: "show_qr"        as const, label: "QR Verification Code",    desc: "Print QR in footer for document verification" },
                { k: "show_doc_no"    as const, label: "Control Number",           desc: "Show document/control number below title" },
                { k: "show_or"        as const, label: "OR Number & Amount",       desc: "Wizard asks for Official Receipt info" },
                { k: "show_ctc"       as const, label: "CTC (Cedula)",             desc: "Wizard asks for Community Tax Certificate details" },
                { k: "show_photo"     as const, label: "Photo Box",                desc: "Print a 1x1 photo space on the certificate" },
                { k: "show_thumbmark" as const, label: "Thumbmark Box",            desc: "Print a right thumbmark box on the certificate" },
                { k: "show_expiry"    as const, label: "Validity / Expiry Date",   desc: "Auto-compute and print valid-until date" },
              ].map(({ k, label, desc }) => (
                <div key={k} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-xs font-medium">{label}</p>
                    <p className="text-[10px] text-muted-foreground">{desc}</p>
                  </div>
                  <button type="button" onClick={() => toggleSetting(k)} className="ml-4 shrink-0">
                    {settings[k]
                      ? <ToggleRight className="w-6 h-6 text-orange-500" />
                      : <ToggleLeft  className="w-6 h-6 text-muted-foreground/40" />}
                  </button>
                </div>
              ))}
              {settings.show_expiry && (
                <div className="pt-2 flex items-center gap-3">
                  <label className="text-xs font-medium whitespace-nowrap">Validity (months)</label>
                  <input type="number" min={1} max={60} value={settings.expiry_months}
                    onChange={e => setSettings(p => ({ ...p, expiry_months: parseInt(e.target.value) || 3 }))}
                    className="w-20 px-3 py-1.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/30" />
                </div>
              )}
            </div>
          </CollapsibleSection>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-background">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm hover:bg-muted/50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !name.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "var(--accent-primary, #ea580c)" }}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isNew ? "Create & Publish to All Barangays" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Collapsible section wrapper
// ─────────────────────────────────────────────────

function CollapsibleSection({ title, open, onToggle, children }: {
  title: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-muted/30 transition-colors">
        <span>{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-border">{children}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────
// Custom input row
// ─────────────────────────────────────────────────

function CustomInputRow({ input, index, onChange, onRemove }: {
  input: SystemDocumentTemplateCustomInput;
  index: number;
  onChange: (patch: Partial<SystemDocumentTemplateCustomInput>) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/20">
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 cursor-grab shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{input.label || `Field ${index + 1}`}</p>
          <p className="text-[10px] text-muted-foreground font-mono">{input.name} · {input.type}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setExpanded(v => !v)} className="p-1 rounded hover:bg-muted/50 transition-colors">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onRemove} className="p-1 rounded hover:bg-red-50 text-red-500 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="p-3 grid grid-cols-2 gap-2 border-t border-border">
          <div>
            <label className="block text-[10px] font-medium mb-1">Field Key</label>
            <input value={input.name} onChange={e => onChange({ name: e.target.value.replace(/\s+/g, "_").toLowerCase() })}
              className="w-full px-2 py-1.5 rounded border border-border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-orange-500/20" />
          </div>
          <div>
            <label className="block text-[10px] font-medium mb-1">Label</label>
            <input value={input.label} onChange={e => onChange({ label: e.target.value })}
              className="w-full px-2 py-1.5 rounded border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/20" />
          </div>
          <div>
            <label className="block text-[10px] font-medium mb-1">Type</label>
            <select value={input.type} onChange={e => onChange({ type: e.target.value as SystemDocumentTemplateCustomInput["type"] })}
              className="w-full px-2 py-1.5 rounded border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/20">
              {FIELD_TYPES.map(ft => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 pt-4">
            <input type="checkbox" id={`req-${index}`} checked={input.required} onChange={e => onChange({ required: e.target.checked })} className="w-3.5 h-3.5" />
            <label htmlFor={`req-${index}`} className="text-xs font-medium cursor-pointer">Required</label>
          </div>
          {input.type === "select" && (
            <div className="col-span-2">
              <label className="block text-[10px] font-medium mb-1">Options (comma-separated)</label>
              <input value={(input.options ?? []).join(", ")}
                onChange={e => onChange({ options: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                placeholder="Option 1, Option 2, Option 3"
                className="w-full px-2 py-1.5 rounded border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/20" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
