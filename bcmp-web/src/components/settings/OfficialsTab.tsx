"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Crown, Users, Heart, FileText, Banknote, Briefcase, Plus, Edit, Trash2, X, Loader2, Search, AlertTriangle, ChevronDown } from "lucide-react";
import { cn, resolvePhotoUrl } from "@/lib/utils";
import { api } from "@/lib/api";
import { useLanguage } from "@/contexts/language-context";
import type { BarangayOfficial, ResidentSummary, ApiError } from "@/lib/types";
import type { OfficialPayload } from "@/lib/api";

const POSITION_OPTIONS: Array<{ value: string; label: string; group: string; elected: boolean; icon: React.ElementType; singleSlot: boolean }> = [
  { value: "kapitan", label: "Punong Barangay (Captain)", group: "elected", elected: true, icon: Crown, singleSlot: true },
  { value: "kagawad", label: "Sangguniang Kagawad", group: "elected", elected: true, icon: Users, singleSlot: false },
  { value: "sk_chairperson", label: "SK Chairperson", group: "elected", elected: true, icon: Heart, singleSlot: true },
  { value: "secretary", label: "Barangay Secretary", group: "appointed", elected: false, icon: FileText, singleSlot: true },
  { value: "treasurer", label: "Barangay Treasurer", group: "appointed", elected: false, icon: Banknote, singleSlot: true },
  { value: "custom", label: "Other Staff (custom)", group: "other", elected: false, icon: Briefcase, singleSlot: false },
];

const POSITION_LABEL: Record<string, string> = Object.fromEntries(POSITION_OPTIONS.map((p) => [p.value, p.label]));
const POSITION_GROUP_TITLES: Record<string, string> = {
  elected: "Elected Officials",
  appointed: "Appointed Officials",
  other: "Other Staff",
};

function residentDisplayName(r: BarangayOfficial["resident"]): string {
  if (!r) return "Unknown";
  const parts = [r.first_name, r.middle_name, r.last_name, r.extension_name].filter(Boolean);
  return parts.join(" ");
}

interface OfficialsTabProps {
  onToast: (message: string, type?: "success" | "error") => void;
}

export function OfficialsTab({ onToast }: OfficialsTabProps) {
  const { t } = useLanguage();
  const [officials, setOfficials] = useState<BarangayOfficial[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOfficial, setEditingOfficial] = useState<BarangayOfficial | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BarangayOfficial | null>(null);

  const loadOfficials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.officials.list({ per_page: 100, sort_by: "sort_order" });
      setOfficials(res.data);
    } catch {
      onToast(t.settings.officials.toasts.loadFailed, "error");
    } finally {
      setLoading(false);
    }
  }, [onToast, t.settings.officials.toasts.loadFailed]);

  useEffect(() => { loadOfficials(); }, [loadOfficials]);

  const handleSaved = (saved: BarangayOfficial) => {
    setOfficials((prev) => {
      const idx = prev.findIndex((o) => o.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });
    setModalOpen(false);
    setEditingOfficial(null);
    onToast(editingOfficial ? "Official updated" : "Official added");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.officials.delete(deleteTarget.id);
      setOfficials((prev) => prev.filter((o) => o.id !== deleteTarget.id));
      onToast("Official removed");
    } catch (e) {
      const err = e as ApiError;
      onToast(err.message || "Failed to remove official", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  // Group officials by position group
  const grouped: Record<string, BarangayOfficial[]> = { elected: [], appointed: [], other: [] };
  for (const o of officials) {
    const opt = POSITION_OPTIONS.find((p) => p.value === o.position);
    const group = opt?.group || "other";
    grouped[group].push(o);
  }
  // Position rank derived from POSITION_OPTIONS order — Captain first, then Kagawads, then SK Chair, then Secretary, Treasurer, Custom.
  // Within same position (e.g. multiple Kagawads, multiple Custom staff), preserve sort_order then name.
  const positionRank = (pos: string): number => {
    const idx = POSITION_OPTIONS.findIndex((p) => p.value === pos);
    return idx === -1 ? 999 : idx;
  };
  for (const g of Object.keys(grouped)) {
    grouped[g].sort((a, b) => {
      const rankDiff = positionRank(a.position) - positionRank(b.position);
      if (rankDiff !== 0) return rankDiff;
      const sortDiff = a.sort_order - b.sort_order;
      if (sortDiff !== 0) return sortDiff;
      return residentDisplayName(a.resident).localeCompare(residentDisplayName(b.resident));
    });
  }

  if (loading) {
    return (
      <div className="glass rounded-xl p-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{t.settings.officials.title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t.settings.officials.description}
            </p>
          </div>
          <button
            onClick={() => { setEditingOfficial(null); setModalOpen(true); }}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg text-white transition-colors"
            style={{ background: "var(--accent-primary)" }}
          >
            <Plus className="w-4 h-4" /> {t.settings.officials.addOfficial}
          </button>
        </div>

        {officials.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-10 text-center">
            <Users className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-foreground/80">{t.settings.officials.emptyTitle}</p>
            <p className="text-[12px] text-muted-foreground mt-1 max-w-md mx-auto">
              {t.settings.officials.emptyDescription}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {(["elected", "appointed", "other"] as const).map((group) =>
              grouped[group].length === 0 ? null : (
                <div key={group}>
                  <h3 className="text-[10px] font-semibold text-muted-foreground/60 tracking-[0.18em] uppercase mb-2 px-1">
                    {t.settings.officials.groups[group]}
                  </h3>
                  <div className="space-y-1.5">
                    {grouped[group].map((o) => (
                      <OfficialRow
                        key={o.id}
                        official={o}
                        onEdit={() => { setEditingOfficial(o); setModalOpen(true); }}
                        onDelete={() => setDeleteTarget(o)}
                      />
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <OfficialModal
          official={editingOfficial}
          onClose={() => { setModalOpen(false); setEditingOfficial(null); }}
          onSaved={handleSaved}
          onError={(msg) => onToast(msg, "error")}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          name={residentDisplayName(deleteTarget.resident)}
          position={POSITION_LABEL[deleteTarget.position] || deleteTarget.position}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ── Row component ──

function OfficialRow({ official, onEdit, onDelete }: { official: BarangayOfficial; onEdit: () => void; onDelete: () => void }) {
  const opt = POSITION_OPTIONS.find((p) => p.value === official.position);
  const Icon = opt?.icon || Briefcase;
  const positionLabel = opt?.label || official.position;
  // Prefer the new committees array; fall back to legacy single committee for older records
  const committeeList: string[] = official.committees && official.committees.length > 0
    ? official.committees
    : (official.committee ? [official.committee] : []);
  const photoUrl = resolvePhotoUrl(official.resident?.photo_url ?? null);

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg glass-subtle group hover:bg-muted/40 transition-colors">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-border" />
      ) : (
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--accent-bg)", color: "var(--accent-primary)" }}>
          <Icon className="w-4 h-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-foreground truncate">
          {residentDisplayName(official.resident)}
        </p>
        <p className="text-[11px] text-muted-foreground truncate">
          {positionLabel}
          {committeeList.length > 0 && (
            <span className="ml-1.5 text-muted-foreground/60">· {committeeList.join(" · ")}</span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Edit">
          <Edit className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors" title="Remove">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Modal ──

function OfficialModal({
  official, onClose, onSaved, onError,
}: {
  official: BarangayOfficial | null;
  onClose: () => void;
  onSaved: (saved: BarangayOfficial) => void;
  onError: (msg: string) => void;
}) {
  const isEdit = !!official;

  // Resident picker state
  const [residentQuery, setResidentQuery] = useState("");
  const [residentResults, setResidentResults] = useState<ResidentSummary[]>([]);
  const [selectedResidentId, setSelectedResidentId] = useState<string>(official?.resident_id || "");
  const [selectedResidentName, setSelectedResidentName] = useState<string>(official ? residentDisplayName(official.resident) : "");
  const [resultsOpen, setResultsOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Form fields
  const [position, setPosition] = useState<string>(official?.position || "kapitan");
  const [customPosition, setCustomPosition] = useState<string>(official && !POSITION_OPTIONS.some(p => p.value === official.position) ? official.position : "");
  // Committees: array of strings. Merge new committees[] field with legacy single committee.
  const initialCommittees: string[] = official?.committees && official.committees.length > 0
    ? official.committees
    : (official?.committee ? [official.committee] : []);
  const [committees, setCommittees] = useState<string[]>(initialCommittees);
  const [committeeInput, setCommitteeInput] = useState<string>("");
  // term_start, term_end, oath_date removed 2026-05-16 — barangay-wide term lives on
  // barangays.officials_term (set in Settings → Barangay Info → Current Term).

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load residents immediately so the picker also works as a dropdown.
  // Subsequent typing filters the same endpoint from the first character.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const query = residentQuery.trim();
    let cancelled = false;

    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.residents.list({
          ...(query ? { search: query } : {}),
          per_page: 20,
          sort_by: "last_name",
          sort_dir: "asc",
        });
        if (!cancelled) setResidentResults(res.data);
      } catch {
        if (!cancelled) setResidentResults([]);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, query ? 250 : 0);

    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [residentQuery]);

  const isCustomPos = position === "custom";

  const addCommittee = () => {
    const v = committeeInput.trim();
    if (!v) return;
    if (committees.some((c) => c.toLowerCase() === v.toLowerCase())) {
      setCommitteeInput("");
      return;
    }
    setCommittees([...committees, v]);
    setCommitteeInput("");
  };

  const removeCommittee = (idx: number) => {
    setCommittees(committees.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!selectedResidentId) { setError("Please select a resident."); return; }
    if (isCustomPos && !customPosition.trim()) { setError("Please enter the custom position title."); return; }

    const finalPosition = isCustomPos ? customPosition.trim() : position;
    const opt = POSITION_OPTIONS.find((p) => p.value === position);

    // If the user typed a committee but didn't press Enter, capture it on submit
    const finalCommittees = committeeInput.trim()
      ? [...committees, committeeInput.trim()]
      : committees;

    const payload: OfficialPayload = {
      resident_id: selectedResidentId,
      position: finalPosition,
      committees: finalCommittees,
      is_elected: opt?.elected ?? false,
      status: "active",
    };

    setSubmitting(true);
    try {
      const res = isEdit
        ? await api.officials.update(official!.id, payload)
        : await api.officials.create(payload);
      onSaved(res.official);
    } catch (e) {
      const err = e as ApiError;
      const msg = err.message || "Failed to save official";
      setError(msg);
      onError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-popover rounded-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 pt-5 pb-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{isEdit ? "Edit Official" : "Add Official"}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Assign a barangay resident to an official role.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {/* Resident picker */}
          <div className="relative">
            <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Resident</label>
            {selectedResidentId && selectedResidentName ? (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass-input">
                <span className="text-sm font-medium text-foreground flex-1 truncate">{selectedResidentName}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedResidentId("");
                    setSelectedResidentName("");
                    setResidentQuery("");
                    setResultsOpen(true);
                  }}
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={residentQuery}
                    onChange={(e) => {
                      setResidentQuery(e.target.value);
                      setResultsOpen(true);
                    }}
                    onFocus={() => setResultsOpen(true)}
                    placeholder="Search residents by name..."
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 transition-colors"
                    style={{ "--tw-ring-color": "var(--accent-ring)" } as React.CSSProperties}
                  />
                  {searchLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {resultsOpen && residentResults.length > 0 && (
                  <div className="absolute z-10 mt-1 left-0 right-0 rounded-xl glass-popover max-h-60 overflow-y-auto">
                    {residentResults.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setSelectedResidentId(r.id);
                          setSelectedResidentName([r.first_name, r.middle_name, r.last_name, r.extension_name].filter(Boolean).join(" "));
                          setResultsOpen(false);
                          setResidentQuery("");
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/50 transition-colors text-[13px]"
                      >
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 text-[10px] font-bold text-muted-foreground">
                          {(r.first_name?.[0] || "?")}{(r.last_name?.[0] || "?")}
                        </div>
                        <span className="flex-1 truncate text-foreground">
                          {[r.first_name, r.middle_name, r.last_name, r.extension_name].filter(Boolean).join(" ")}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {resultsOpen && !searchLoading && residentResults.length === 0 && (
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    {residentQuery.trim()
                      ? "No matching residents found."
                      : "No residents found. Add them to the Residents page first."}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Position */}
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Position</label>
            <div className="relative">
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full pl-3 pr-9 py-2.5 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 transition-colors appearance-none"
                style={{ "--tw-ring-color": "var(--accent-ring)" } as React.CSSProperties}
              >
                {POSITION_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {isCustomPos && (
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Custom Position Title</label>
              <input
                type="text"
                value={customPosition}
                onChange={(e) => setCustomPosition(e.target.value.toUpperCase())}
                placeholder="E.G. BARANGAY HEALTH WORKER"
                className="w-full px-3 py-2.5 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 transition-colors uppercase"
                style={{ "--tw-ring-color": "var(--accent-ring)" } as React.CSSProperties}
              />
            </div>
          )}

          {/* Committees (multiple — kagawads often chair more than one) */}
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              Committees <span className="text-muted-foreground/60 normal-case tracking-normal">(optional, multiple allowed)</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5 px-2 py-2 rounded-xl glass-input focus-within:ring-2 transition-colors"
              style={{ "--tw-ring-color": "var(--accent-ring)" } as React.CSSProperties}>
              {committees.map((c, idx) => (
                <span key={`${c}-${idx}`} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md text-[12px] font-medium" style={{ background: "var(--accent-bg)", color: "var(--accent-primary)" }}>
                  {c}
                  <button
                    type="button"
                    onClick={() => removeCommittee(idx)}
                    className="w-4 h-4 rounded flex items-center justify-center hover:bg-black/10 transition-colors"
                    aria-label={`Remove ${c}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={committeeInput}
                onChange={(e) => setCommitteeInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addCommittee();
                  } else if (e.key === "Backspace" && !committeeInput && committees.length > 0) {
                    removeCommittee(committees.length - 1);
                  }
                }}
                onBlur={() => committeeInput.trim() && addCommittee()}
                placeholder={committees.length === 0 ? "E.G. PEACE AND ORDER" : "ADD ANOTHER"}
                className="flex-1 min-w-[120px] bg-transparent border-0 outline-none text-sm uppercase placeholder:text-muted-foreground/50"
              />
            </div>
            <p className="text-[10px] text-muted-foreground/60 mt-1 px-1">Press Enter or comma to add. One person can chair multiple committees.</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[12px] text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2 bg-muted/20">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors text-foreground">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors flex items-center gap-1.5"
            style={{ background: "var(--accent-primary)" }}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Add Official"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm Delete Modal ──

function ConfirmDeleteModal({ name, position, onConfirm, onCancel }: { name: string; position: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-popover rounded-2xl max-w-sm w-full overflow-hidden">
        <div className="px-6 pt-5 pb-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-red-500/10">
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-foreground">Remove Official?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Remove <strong className="text-foreground/90">{name}</strong> from <strong className="text-foreground/90">{position}</strong>?
              This will be soft-deleted and can be restored from the audit log if needed.
            </p>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2 bg-muted/20">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors text-foreground">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-red-500 hover:bg-red-600 transition-colors">
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
