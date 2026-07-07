"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText, Plus, Edit2, Trash2, X, Loader2, AlertTriangle, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { DocumentTemplate } from "@/lib/types";

const CATEGORIES = [
  { value: "clearance",    label: "Clearance" },
  { value: "residency",    label: "Residency" },
  { value: "indigency",    label: "Indigency" },
  { value: "good_moral",   label: "Good Moral" },
  { value: "business",     label: "Business" },
  { value: "id_card",      label: "ID Card" },
  { value: "lot_building", label: "Lot / Building" },
  { value: "cedula",       label: "Cedula" },
  { value: "special",      label: "Special" },
  { value: "other",        label: "Other" },
];

const CONSTITUENT_TYPES = [
  { value: "resident",      label: "Resident" },
  { value: "establishment", label: "Establishment" },
  { value: "lot_building",  label: "Lot & Building" },
];

const SECTIONS: Array<{ id: "resident" | "establishment" | "lot_building"; label: string; sub: string }> = [
  { id: "resident",      label: "Resident",       sub: "Issued to a person" },
  { id: "establishment", label: "Establishment",  sub: "Issued to a business" },
  { id: "lot_building",  label: "Lot & Building", sub: "Issued for a property" },
];

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  active:    { label: "Active",   className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  published: { label: "Active",   className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  draft:     { label: "Draft",    className: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  archived:  { label: "Archived", className: "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30" },
};

interface Props {
  onToast: (message: string, type?: "success" | "error") => void;
  structureLabel?: string;
  colorThemeLabel?: string;
  designPatternLabel?: string;
  paperSizeLabel?: string;
  fontLabel?: string;
}

type ConstituentType = "resident" | "establishment" | "lot_building";

export function CertificateTypesList({
  onToast,
  structureLabel,
  colorThemeLabel,
  designPatternLabel,
  paperSizeLabel,
  fontLabel,
}: Props) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentTemplate | null>(null);
  const [editing, setEditing] = useState<DocumentTemplate | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<ConstituentType>("resident");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.documentTemplates.list({ per_page: 200 });
      setTemplates(res.data);
    } catch {
      onToast("Failed to load certificate types", "error");
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => { load(); }, [load]);

  const ownedTemplates = templates.filter((t) => t.barangay_id !== null);
  const systemTemplates = templates.filter((t) => t.barangay_id === null);
  const ownedNamesLower = new Set(ownedTemplates.map((t) => t.name.toLowerCase()));

  const ownedByType = (type: ConstituentType) =>
    ownedTemplates.filter((t) => ((t.constituent_type as ConstituentType) ?? "resident") === type);

  const systemByType = (type: ConstituentType) =>
    systemTemplates
      .filter((t) => ((t.constituent_type as ConstituentType) ?? "resident") === type);

  const handleClone = async (sys: DocumentTemplate) => {
    setCloning(sys.id);
    try {
      const res = await api.documentTemplates.clone(sys.id);
      setTemplates((prev) => [...prev, res.document_template]);
      onToast(`"${res.document_template.name}" added`);
    } catch {
      onToast(`Failed to add "${sys.name}"`, "error");
    } finally {
      setCloning(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.documentTemplates.delete(deleteTarget.id);
      setTemplates((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      onToast(`"${deleteTarget.name}" deleted`);
    } catch {
      onToast("Failed to delete certificate", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSaved = (saved: DocumentTemplate) => {
    setTemplates((prev) => {
      const idx = prev.findIndex((t) => t.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });
    setModalOpen(false);
    setEditing(null);
    onToast(editing ? "Certificate updated" : "Certificate added");
  };

  const openAddModal = (type: ConstituentType) => {
    setEditing(null);
    setDefaultType(type);
    setModalOpen(true);
  };

  const openEditModal = (tpl: DocumentTemplate) => {
    setEditing(tpl);
    setModalOpen(true);
  };

  const ctxLabel = [structureLabel, paperSizeLabel, fontLabel, colorThemeLabel, designPatternLabel]
    .filter(Boolean).join(" · ");

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Certificate Types</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              The list of certificates this barangay can issue. Each one inherits the global design from Stage 1 & 2.
            </p>
          </div>
        </div>
        {ctxLabel && (
          <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-500/[0.06] border border-blue-500/20 text-[11px] text-blue-700 dark:text-blue-300">
            <Sparkles className="h-3 w-3" />
            <span className="font-medium">Applied design:</span>
            <span className="text-muted-foreground">{ctxLabel}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {SECTIONS.map((section) => {
            const owned = ownedByType(section.id);
            const suggestions = systemByType(section.id);
            return (
              <SectionBlock
                key={section.id}
                label={section.label}
                sub={section.sub}
                owned={owned}
                suggestions={suggestions}
                cloningId={cloning}
                onClone={handleClone}
                onEdit={openEditModal}
                onDelete={(t) => setDeleteTarget(t)}
                onAddCustom={() => openAddModal(section.id)}
              />
            );
          })}
        </div>
      )}

      {modalOpen && (
        <QuickEditModal
          template={editing}
          defaultType={defaultType}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSaved={handleSaved}
          onToast={onToast}
        />
      )}

      {deleteTarget && (
        <ConfirmDelete
          template={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

interface SectionProps {
  label: string;
  sub: string;
  owned: DocumentTemplate[];
  suggestions: DocumentTemplate[];
  cloningId: string | null;
  onClone: (sys: DocumentTemplate) => void;
  onEdit: (tpl: DocumentTemplate) => void;
  onDelete: (tpl: DocumentTemplate) => void;
  onAddCustom: () => void;
}

function SectionBlock({ label, sub, owned, suggestions, cloningId, onClone, onEdit, onDelete, onAddCustom }: SectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <p className="text-[11px] font-bold tracking-[0.18em] uppercase px-2 py-0.5 rounded text-blue-700 dark:text-blue-300 bg-blue-500/10 border border-blue-500/30">
          {label}
        </p>
        <span className="text-[11px] text-muted-foreground">{sub}</span>
        <div className="flex-1 h-px bg-border/40" />
        <span className="text-[10px] font-semibold text-muted-foreground">{owned.length} added</span>
        <button
          type="button"
          onClick={onAddCustom}
          className="text-[10px] font-semibold text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 inline-flex items-center gap-1"
          title="Create a custom certificate from scratch"
        >
          <Plus className="h-3 w-3" /> Custom
        </button>
      </div>

      {owned.length > 0 && (
        <div className="space-y-2 mb-3">
          {owned.map((tpl) => {
            const status = STATUS_STYLES[tpl.status] ?? STATUS_STYLES.active!;
            return (
              <div
                key={tpl.id}
                className="group relative flex items-center gap-3 px-4 py-3 rounded-lg border border-border/40 bg-background/40 hover:border-blue-500/40 hover:bg-blue-500/[0.03] transition-all"
              >
                <span
                  className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "linear-gradient(180deg, rgba(59,130,246,0.7) 0%, rgba(139,92,246,0.3) 100%)" }}
                />
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-blue-500/10 border border-blue-500/20">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground truncate">{tpl.name}</p>
                    <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-md border", status.className)}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {tpl.category}
                    {tpl.settings?.show_expiry && tpl.settings?.expiry_months ? ` · Valid ${tpl.settings.expiry_months} mo` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onEdit(tpl)}
                    className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    title="Quick edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(tpl)}
                    className="p-2 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {suggestions.length > 0 && (
        <>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-2 px-1">
            {owned.length > 0 ? "More from standards" : "Add from standards"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {suggestions.map((sys) => {
              const isBusy = cloningId === sys.id;
              return (
                <button
                  key={sys.id}
                  type="button"
                  onClick={() => onClone(sys)}
                  disabled={isBusy}
                  className="group flex items-center justify-between gap-3 p-3 rounded-lg border border-border/50 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all text-left disabled:opacity-60 disabled:cursor-wait"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{sys.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{sys.category}</p>
                  </div>
                  {isBusy ? (
                    <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-300 animate-spin shrink-0" />
                  ) : (
                    <Plus className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-300 shrink-0 transition-colors" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {owned.length === 0 && suggestions.length === 0 && (
        <div className="rounded-lg border border-dashed border-border/40 p-4 text-center">
          <p className="text-xs text-muted-foreground">No {label.toLowerCase()} certificates yet.</p>
        </div>
      )}
    </div>
  );
}

interface QuickEditProps {
  template: DocumentTemplate | null;
  defaultType: ConstituentType;
  onClose: () => void;
  onSaved: (saved: DocumentTemplate) => void;
  onToast: (msg: string, type?: "success" | "error") => void;
}

function QuickEditModal({ template, defaultType, onClose, onSaved, onToast }: QuickEditProps) {
  const isEdit = template !== null;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: template?.name ?? "",
    title: template?.title ?? "",
    salutation: template?.salutation ?? "TO WHOM IT MAY CONCERN:",
    category: template?.category ?? "clearance",
    constituent_type: (template?.constituent_type as ConstituentType) ?? defaultType,
    status: template?.status ?? "active",
    show_qr: template?.settings?.show_qr ?? true,
    show_doc_no: template?.settings?.show_doc_no ?? true,
    show_expiry: template?.settings?.show_expiry ?? false,
    expiry_months: template?.settings?.expiry_months ?? 6,
  });

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      onToast("Name is required", "error");
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<DocumentTemplate> = {
        name: form.name.trim(),
        title: form.title.trim() || null,
        salutation: form.salutation.trim() || null,
        category: form.category,
        constituent_type: form.constituent_type,
        status: form.status,
        settings: {
          show_qr: form.show_qr,
          show_doc_no: form.show_doc_no,
          show_expiry: form.show_expiry,
          expiry_months: form.show_expiry ? form.expiry_months : undefined,
        },
      };

      const res = isEdit
        ? await api.documentTemplates.update(template!.id, payload)
        : await api.documentTemplates.create(payload);
      onSaved(res.document_template);
    } catch {
      onToast(isEdit ? "Failed to update" : "Failed to add", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border/60 bg-card shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <h3 className="text-base font-semibold text-foreground">
            {isEdit ? "Edit certificate" : "Add certificate"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted/60 transition-colors" type="button">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <Field label="Name" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="e.g. Barangay Clearance"
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background/40 text-sm focus:outline-none focus:border-blue-500/60"
            />
          </Field>
          <Field label="Document title (printed)">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="e.g. BARANGAY CLEARANCE"
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background/40 text-sm focus:outline-none focus:border-blue-500/60"
            />
          </Field>
          <Field label="Salutation">
            <input
              type="text"
              value={form.salutation}
              onChange={(e) => setField("salutation", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background/40 text-sm focus:outline-none focus:border-blue-500/60"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background/40 text-sm focus:outline-none focus:border-blue-500/60"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Issued to">
              <select
                value={form.constituent_type}
                onChange={(e) => setField("constituent_type", e.target.value as ConstituentType)}
                disabled={isEdit}
                className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background/40 text-sm focus:outline-none focus:border-blue-500/60 disabled:opacity-60"
              >
                {CONSTITUENT_TYPES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => setField("status", e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background/40 text-sm focus:outline-none focus:border-blue-500/60"
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </Field>

          <div className="rounded-lg border border-border/40 bg-background/30 p-3 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Print options</p>
            <Toggle checked={form.show_qr}     onChange={(v) => setField("show_qr", v)}     label="Show QR code (verification)" />
            <Toggle checked={form.show_doc_no} onChange={(v) => setField("show_doc_no", v)} label="Show document number" />
            <Toggle checked={form.show_expiry} onChange={(v) => setField("show_expiry", v)} label="Has expiry date" />
            {form.show_expiry && (
              <div className="flex items-center gap-2 pl-6 pt-1">
                <span className="text-xs text-muted-foreground">Valid for</span>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={form.expiry_months}
                  onChange={(e) => setField("expiry_months", Math.max(1, Math.min(120, Number(e.target.value) || 1)))}
                  className="w-16 px-2 py-1 rounded-md border border-border/50 bg-background/40 text-xs text-center"
                />
                <span className="text-xs text-muted-foreground">months</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 disabled:opacity-60 transition-all"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Add certificate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-foreground/80">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border/60 text-blue-600 focus:ring-blue-500/40"
      />
      <span className="text-xs text-foreground/80">{label}</span>
    </label>
  );
}

function ConfirmDelete({ template, onCancel, onConfirm }: {
  template: DocumentTemplate;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card shadow-2xl p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-500/10 border border-red-500/20 shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-300" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Delete certificate?</h3>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">{template.name}</span> will be removed
              from this barangay's certificate list. Already-issued documents will not be affected.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
