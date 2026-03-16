"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FileText,
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  ChevronLeft,
  X,
  Lock,
  Tag,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Eye,
  EyeOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type {
  DocumentTemplate,
  DocumentTemplateCustomInput,
  DocumentTemplateSettings,
  PaperSize,
} from "@/lib/types";

// ─────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────

const CATEGORIES = [
  "Clearance",
  "Residency",
  "Indigency",
  "Good Moral",
  "Business",
  "ID Card",
  "Lot / Building",
  "Special",
  "Other",
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
  active: { label: "Active", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  draft: { label: "Draft", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" },
  archived: { label: "Archived", color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800/40" },
};

// ─────────────────────────────────────────────────
// Blank template for "New"
// ─────────────────────────────────────────────────

function blankTemplate(): Partial<DocumentTemplate> {
  return {
    name: "",
    category: "Clearance",
    constituent_type: "resident",
    title: "",
    salutation: "",
    content: "",
    custom_inputs: [],
    approval_config: {
      left: { label: "", position: "Barangay Secretary" },
      right: { label: "", position: "Punong Barangay" },
    },
    settings: {
      show_qr: true,
      show_ctc: false,
      show_or: false,
      show_doc_no: true,
      show_expiry: false,
      show_photo: false,
      show_thumbmark: false,
      expiry_months: 3,
    },
    status: "active",
  };
}

// ─────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────

export default function TemplatesPage() {
  const router = useRouter();

  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [tab, setTab] = useState<"all" | "system" | "mine">("all");
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  // Editor
  const [showEditor, setShowEditor] = useState(false);
  const [editTarget, setEditTarget] = useState<DocumentTemplate | null>(null); // null = new
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<DocumentTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── load ──
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.documentTemplates.list({ search: search || undefined, per_page: 100 });
      setTemplates(res.data ?? []);
    } catch {
      showToast("Failed to load templates.", "err");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  function showToast(msg: string, type: "ok" | "err") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // ── search debounce ──
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  function handleSearchInput(v: string) {
    setSearchInput(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(v), 400);
  }

  // ── filtered list ──
  const filtered = templates.filter((t) => {
    if (tab === "system") return t.barangay_id === null;
    if (tab === "mine") return t.barangay_id !== null;
    return true;
  });

  const systemTemplates = filtered.filter((t) => t.barangay_id === null);
  const myTemplates = filtered.filter((t) => t.barangay_id !== null);

  // ── open editor ──
  function openNew() {
    setEditTarget(null);
    setShowEditor(true);
  }

  function openEdit(t: DocumentTemplate) {
    setEditTarget(t);
    setShowEditor(true);
  }

  // ── clone system template ──
  async function handleClone(t: DocumentTemplate) {
    try {
      const res = await api.documentTemplates.create({
        name: `${t.name} (Custom)`,
        category: t.category,
        constituent_type: t.constituent_type,
        title: t.title ?? "",
        salutation: t.salutation ?? "",
        content: t.content ?? "",
        merge_fields: t.merge_fields ?? [],
        custom_inputs: t.custom_inputs ?? [],
        approval_config: t.approval_config ?? {},
        settings: t.settings ?? {},
        status: "active",
      });
      showToast(`"${res.document_template.name}" added to My Templates.`, "ok");
      load();
    } catch {
      showToast("Failed to clone template.", "err");
    }
  }

  // ── delete ──
  async function handleDelete() {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await api.documentTemplates.delete(deleteConfirm.id);
      showToast("Template deleted.", "ok");
      setDeleteConfirm(null);
      load();
    } catch {
      showToast("Failed to delete template.", "err");
    } finally {
      setDeleting(false);
    }
  }

  // ── save callback from editor ──
  function onSaved() {
    setShowEditor(false);
    load();
    showToast(editTarget ? "Template updated." : "Template created.", "ok");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "fixed top-4 right-4 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all",
            toast.type === "ok"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          )}
        >
          {toast.type === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/documents")}
            className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <PageHeader
              title="Document Templates"
              description="Manage the certificate and clearance templates your barangay uses."
            />
          </div>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "var(--accent-primary)" }}
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </div>

        {/* Search + Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
            {(["all", "system", "mine"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize",
                  tab === t
                    ? "bg-background shadow text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "all" ? "All" : t === "system" ? "System" : "My Templates"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* System Templates */}
            {(tab === "all" || tab === "system") && systemTemplates.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-4 h-4 text-slate-500" />
                  <h2 className="text-sm font-semibold text-foreground">System Templates</h2>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {systemTemplates.length} templates · Read-only
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {systemTemplates.map((t) => (
                    <TemplateCard
                      key={t.id}
                      template={t}
                      isSystem
                      onClone={() => handleClone(t)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* My Templates */}
            {(tab === "all" || tab === "mine") && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-blue-500" />
                  <h2 className="text-sm font-semibold text-foreground">My Templates</h2>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {myTemplates.length} templates
                  </span>
                </div>
                {myTemplates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-2xl">
                    <FileText className="w-10 h-10 text-muted-foreground/40 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No custom templates yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click <strong>Customize</strong> on any system template, or create one from scratch.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {myTemplates.map((t) => (
                      <TemplateCard
                        key={t.id}
                        template={t}
                        isSystem={false}
                        onEdit={() => openEdit(t)}
                        onDelete={() => setDeleteConfirm(t)}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {filtered.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No templates found.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ EDITOR MODAL ═══ */}
      {showEditor && (
        <TemplateEditor
          template={editTarget}
          onClose={() => setShowEditor(false)}
          onSaved={onSaved}
          saving={saving}
          setSaving={setSaving}
        />
      )}

      {/* ═══ DELETE CONFIRM ═══ */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 bg-background rounded-2xl shadow-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold">Delete Template</h3>
                <p className="text-xs text-muted-foreground">This cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Delete <strong className="text-foreground">&quot;{deleteConfirm.name}&quot;</strong>? Documents already generated from this template will not be affected.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center gap-2"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete
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
  template,
  isSystem,
  onClone,
  onEdit,
  onDelete,
}: {
  template: DocumentTemplate;
  isSystem: boolean;
  onClone?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const s = STATUS_CFG[template.status] ?? STATUS_CFG.active;

  return (
    <div className="group flex flex-col bg-card border border-border rounded-xl p-4 hover:border-accent/50 transition-all hover:shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", s.color, s.bg)}>
              {s.label}
            </span>
            {isSystem && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                System
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-foreground truncate leading-snug">
            {template.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{template.category}</p>
        </div>
        <FileText className="w-8 h-8 text-muted-foreground/20 flex-shrink-0 mt-0.5" />
      </div>

      {template.title && (
        <p className="text-xs text-muted-foreground truncate mb-2 italic">
          &quot;{template.title}&quot;
        </p>
      )}

      <div className="flex flex-wrap gap-1 mb-3 mt-auto pt-2">
        {template.constituent_type && (
          <span className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-full capitalize">
            {template.constituent_type.replace("_", " ")}
          </span>
        )}
        {(template.custom_inputs?.length ?? 0) > 0 && (
          <span className="text-[10px] bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 px-1.5 py-0.5 rounded-full">
            {template.custom_inputs!.length} custom field{template.custom_inputs!.length !== 1 ? "s" : ""}
          </span>
        )}
        {template.settings?.show_ctc && (
          <span className="text-[10px] bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
            CTC
          </span>
        )}
      </div>

      <div className="flex gap-1.5 border-t border-border/60 pt-3">
        {isSystem ? (
          <button
            onClick={onClone}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:bg-muted/50 text-foreground transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            Customize
          </button>
        ) : (
          <>
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:bg-muted/50 text-foreground transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={onDelete}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Template Editor Modal
// ─────────────────────────────────────────────────

function TemplateEditor({
  template,
  onClose,
  onSaved,
  saving,
  setSaving,
}: {
  template: DocumentTemplate | null;
  onClose: () => void;
  onSaved: () => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
}) {
  const isNew = template === null;
  const initial = isNew ? blankTemplate() : { ...template };

  const [name, setName] = useState(initial.name ?? "");
  const [title, setTitle] = useState(initial.title ?? "");
  const [category, setCategory] = useState(initial.category ?? "Clearance");
  const [constituentType, setConstituentType] = useState(
    initial.constituent_type ?? "resident"
  );
  const [salutation, setSalutation] = useState(initial.salutation ?? "");
  const [content, setContent] = useState(initial.content ?? "");
  const [status, setStatus] = useState<"active" | "draft" | "archived">(
    (initial.status as "active" | "draft" | "archived") ?? "active"
  );

  // Approval config
  const [approvalLeft, setApprovalLeft] = useState({
    label: initial.approval_config?.left?.label ?? "",
    position: initial.approval_config?.left?.position ?? "Barangay Secretary",
  });
  const [approvalRight, setApprovalRight] = useState({
    label: initial.approval_config?.right?.label ?? "",
    position: initial.approval_config?.right?.position ?? "Punong Barangay",
  });

  // Settings toggles
  const [settings, setSettings] = useState<DocumentTemplateSettings>({
    show_qr: initial.settings?.show_qr ?? true,
    show_ctc: initial.settings?.show_ctc ?? false,
    show_or: initial.settings?.show_or ?? false,
    show_doc_no: initial.settings?.show_doc_no ?? true,
    show_expiry: initial.settings?.show_expiry ?? false,
    show_photo: initial.settings?.show_photo ?? false,
    show_thumbmark: initial.settings?.show_thumbmark ?? false,
    expiry_months: initial.settings?.expiry_months ?? 3,
    paper_size: initial.settings?.paper_size ?? "short_bond",
  });

  function toggleSetting(key: keyof DocumentTemplateSettings) {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // Custom inputs
  const [customInputs, setCustomInputs] = useState<DocumentTemplateCustomInput[]>(
    initial.custom_inputs ?? []
  );

  function addInput() {
    setCustomInputs((prev) => [
      ...prev,
      { name: `field_${Date.now()}`, type: "text", label: "New Field", required: false },
    ]);
  }

  function removeInput(index: number) {
    setCustomInputs((prev) => prev.filter((_, i) => i !== index));
  }

  function updateInput(index: number, patch: Partial<DocumentTemplateCustomInput>) {
    setCustomInputs((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  // Content textarea ref for inserting merge fields
  const contentRef = useRef<HTMLTextAreaElement>(null);

  function insertMergeField(tag: string) {
    const el = contentRef.current;
    if (!el) {
      setContent((c) => c + tag);
      return;
    }
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    const updated = content.slice(0, start) + tag + content.slice(end);
    setContent(updated);
    setTimeout(() => {
      el.focus();
      const pos = start + tag.length;
      el.setSelectionRange(pos, pos);
    }, 0);
  }

  // Section collapse state
  const [sections, setSections] = useState({
    content: true,
    customInputs: false,
    approval: false,
    settings: false,
  });

  function toggleSection(s: keyof typeof sections) {
    setSections((prev) => ({ ...prev, [s]: !prev[s] }));
  }

  // ── Save ──
  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        title: title.trim() || null,
        category,
        constituent_type: constituentType,
        salutation: salutation.trim() || null,
        content: content.trim() || null,
        custom_inputs: customInputs.length > 0 ? customInputs : null,
        approval_config:
          approvalLeft.label || approvalRight.label
            ? {
                ...(approvalLeft.label ? { left: approvalLeft } : {}),
                ...(approvalRight.label ? { right: approvalRight } : {}),
              }
            : null,
        settings,
        status,
      };

      if (isNew) {
        await api.documentTemplates.create(payload);
      } else {
        await api.documentTemplates.update(template!.id, payload);
      }
      onSaved();
    } catch {
      // silently fail — parent shows toast on save, errors will surface in console
    } finally {
      setSaving(false);
    }
  }

  // Validate
  const canSave = name.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/50 backdrop-blur-sm">
      {/* Overlay close */}
      <div className="flex-1 hidden md:block" onClick={onClose} />

      {/* Drawer */}
      <div className="w-full md:w-[680px] bg-background flex flex-col h-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-background z-10">
          <div>
            <h2 className="text-base font-bold">{isNew ? "New Template" : "Edit Template"}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isNew ? "Create a custom document template for your barangay." : `Editing: ${template?.name}`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* ── Basic Info ── */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Basic Info</h3>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Barangay Clearance"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Certificate / Document Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. CERTIFICATE OF RESIDENCY"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Appears as the large title on the printed certificate.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Constituent Type</label>
                  <select
                    value={constituentType}
                    onChange={(e) => setConstituentType(e.target.value as "resident" | "establishment" | "lot_building" | "case")}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {CONSTITUENT_TYPES.map((ct) => (
                      <option key={ct.value} value={ct.value}>{ct.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Status</label>
                <div className="flex gap-2">
                  {(["active", "draft", "archived"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-semibold border transition-all capitalize",
                        status === s
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border hover:bg-muted/50 text-muted-foreground"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Content ── */}
          <div className="border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection("content")}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-muted/30 transition-colors"
            >
              <span>Certificate Content</span>
              {sections.content ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {sections.content && (
              <div className="px-4 pb-4 space-y-3 border-t border-border">
                <div className="mt-3">
                  <label className="block text-xs font-medium mb-1">Salutation</label>
                  <input
                    value={salutation}
                    onChange={(e) => setSalutation(e.target.value)}
                    placeholder="e.g. TO WHOM IT MAY CONCERN:"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium">Body Text</label>
                    <span className="text-[10px] text-muted-foreground">Click a tag to insert</span>
                  </div>
                  {/* Merge field chips */}
                  <div className="flex flex-wrap gap-1 mb-2 p-2 bg-muted/30 rounded-lg border border-border">
                    {MERGE_FIELDS.map((f) => (
                      <button
                        key={f.tag}
                        type="button"
                        onClick={() => insertMergeField(f.tag)}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        title={f.tag}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    ref={contentRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    placeholder="This is to certify that {{constituent_name}}, a bonafide resident of..."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-y font-mono leading-relaxed"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Use <code className="bg-muted px-1 rounded">{"{{tag}}"}</code> placeholders. They will be replaced with actual values when generating.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Custom Fields ── */}
          <div className="border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection("customInputs")}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-muted/30 transition-colors"
            >
              <span>
                Custom Fields
                {customInputs.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({customInputs.length})
                  </span>
                )}
              </span>
              {sections.customInputs ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {sections.customInputs && (
              <div className="px-4 pb-4 space-y-2 border-t border-border">
                <p className="text-xs text-muted-foreground mt-3 mb-2">
                  Extra fields shown in the Generate Wizard. Use their names as <code className="bg-muted px-1 rounded">{"{{field_name}}"}</code> in the content above.
                </p>
                {customInputs.map((input, i) => (
                  <CustomInputRow
                    key={i}
                    input={input}
                    index={i}
                    onChange={(patch) => updateInput(i, patch)}
                    onRemove={() => removeInput(i)}
                  />
                ))}
                <button
                  onClick={addInput}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-accent transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Custom Field
                </button>
              </div>
            )}
          </div>

          {/* ── Signatories ── */}
          <div className="border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection("approval")}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-muted/30 transition-colors"
            >
              <span>Signatories</span>
              {sections.approval ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {sections.approval && (
              <div className="px-4 pb-4 border-t border-border">
                <p className="text-xs text-muted-foreground mt-3 mb-3">
                  Default signatory names shown on the certificate. Leave blank to fill in when generating.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Left (Attested by)</p>
                    <input
                      value={approvalLeft.label}
                      onChange={(e) => setApprovalLeft((p) => ({ ...p, label: e.target.value }))}
                      placeholder="Full name (optional)"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <input
                      value={approvalLeft.position}
                      onChange={(e) => setApprovalLeft((p) => ({ ...p, position: e.target.value }))}
                      placeholder="Position"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Right (Approved by)</p>
                    <input
                      value={approvalRight.label}
                      onChange={(e) => setApprovalRight((p) => ({ ...p, label: e.target.value }))}
                      placeholder="Full name (optional)"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <input
                      value={approvalRight.position}
                      onChange={(e) => setApprovalRight((p) => ({ ...p, position: e.target.value }))}
                      placeholder="Position"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Settings Toggles ── */}
          <div className="border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection("settings")}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-muted/30 transition-colors"
            >
              <span>PDF Options</span>
              {sections.settings ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {sections.settings && (
              <div className="px-4 pb-4 border-t border-border mt-0">
                <div className="space-y-1 mt-3">
                  {[
                    { key: "show_qr" as const, label: "QR Verification Code", desc: "Print QR code in footer for document verification" },
                    { key: "show_doc_no" as const, label: "Control Number", desc: "Show control/document number below the title" },
                    { key: "show_or" as const, label: "OR Number & Amount", desc: "Wizard will ask for Official Receipt info" },
                    { key: "show_ctc" as const, label: "CTC (Community Tax Certificate)", desc: "Wizard will ask for cedula number, date, and place" },
                    { key: "show_photo" as const, label: "Resident Photo", desc: "Print a 1x1 photo box on the certificate" },
                    { key: "show_thumbmark" as const, label: "Right Thumbmark Box", desc: "Print a thumbmark box on the certificate" },
                    { key: "show_expiry" as const, label: "Validity / Expiry", desc: "Auto-compute and print valid-until date" },
                  ].map(({ key, label, desc }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between py-2.5 border-b border-border/60 last:border-0"
                    >
                      <div>
                        <p className="text-xs font-medium">{label}</p>
                        <p className="text-[10px] text-muted-foreground">{desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSetting(key)}
                        className="flex-shrink-0 ml-4"
                      >
                        {settings[key] ? (
                          <ToggleRight className="w-6 h-6 text-accent" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-muted-foreground/50" />
                        )}
                      </button>
                    </div>
                  ))}
                  {/* Paper Size Selector */}
                  <div className="pt-3 pb-1">
                    <p className="text-xs font-semibold text-foreground mb-2">Paper Size</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { value: "short_bond", label: "Short Bond", sub: "8.5\" × 11\"  (Letter)", badge: "Most Common" },
                          { value: "long_bond",  label: "Long Bond",  sub: "8.5\" × 13\"  (Legal)",  badge: "Gov Forms" },
                          { value: "a4",         label: "A4",         sub: "8.27\" × 11.7\" (ISO)",  badge: "International" },
                        ] as { value: PaperSize; label: string; sub: string; badge: string }[]
                      ).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSettings((p) => ({ ...p, paper_size: opt.value }))}
                          className={cn(
                            "flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all",
                            settings.paper_size === opt.value
                              ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/5"
                              : "border-border hover:bg-muted/30"
                          )}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={cn(
                              "text-xs font-bold",
                              settings.paper_size === opt.value ? "text-[var(--accent-primary)]" : "text-foreground"
                            )}>
                              {opt.label}
                            </span>
                            {settings.paper_size === opt.value && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shrink-0" />
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground leading-tight">{opt.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {settings.show_expiry && (
                    <div className="pt-2 flex items-center gap-3">
                      <label className="text-xs font-medium whitespace-nowrap">Validity (months)</label>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={settings.expiry_months ?? 3}
                        onChange={(e) =>
                          setSettings((p) => ({ ...p, expiry_months: parseInt(e.target.value) || 3 }))
                        }
                        className="w-20 px-3 py-1.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-background">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "var(--accent-primary)" }}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isNew ? "Create Template" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Custom Input Row
// ─────────────────────────────────────────────────

function CustomInputRow({
  input,
  index,
  onChange,
  onRemove,
}: {
  input: DocumentTemplateCustomInput;
  index: number;
  onChange: (patch: Partial<DocumentTemplateCustomInput>) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/20">
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 cursor-grab" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{input.label || `Field ${index + 1}`}</p>
          <p className="text-[10px] text-muted-foreground font-mono">{input.name} · {input.type}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 rounded hover:bg-muted/50 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onRemove}
            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="p-3 grid grid-cols-2 gap-2 border-t border-border">
          <div>
            <label className="block text-[10px] font-medium mb-1">Field Key (no spaces)</label>
            <input
              value={input.name}
              onChange={(e) => onChange({ name: e.target.value.replace(/\s+/g, "_").toLowerCase() })}
              className="w-full px-2 py-1.5 rounded border border-border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium mb-1">Label (shown to user)</label>
            <input
              value={input.label}
              onChange={(e) => onChange({ label: e.target.value })}
              className="w-full px-2 py-1.5 rounded border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium mb-1">Input Type</label>
            <select
              value={input.type}
              onChange={(e) => onChange({ type: e.target.value as DocumentTemplateCustomInput["type"] })}
              className="w-full px-2 py-1.5 rounded border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {FIELD_TYPES.map((ft) => (
                <option key={ft.value} value={ft.value}>{ft.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 pt-4">
            <input
              type="checkbox"
              id={`req-${index}`}
              checked={input.required}
              onChange={(e) => onChange({ required: e.target.checked })}
              className="w-3.5 h-3.5 accent-accent"
            />
            <label htmlFor={`req-${index}`} className="text-xs font-medium cursor-pointer">
              Required field
            </label>
          </div>
          {input.type === "select" && (
            <div className="col-span-2">
              <label className="block text-[10px] font-medium mb-1">Options (comma-separated)</label>
              <input
                value={(input.options ?? []).join(", ")}
                onChange={(e) =>
                  onChange({
                    options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
                placeholder="Option 1, Option 2, Option 3"
                className="w-full px-2 py-1.5 rounded border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
