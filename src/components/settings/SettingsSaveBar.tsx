"use client";

import { Save, Undo2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

interface SettingsSaveBarProps {
  isDirty: boolean;
  changedCount: number;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

/**
 * Sticky bottom save bar — appears only when the active settings tab has unsaved changes.
 * Linear / Stripe pattern: shows changed-field count + Save + Discard, anchored to bottom of viewport.
 */
export function SettingsSaveBar({ isDirty, changedCount, saving, onSave, onDiscard }: SettingsSaveBarProps) {
  const { t } = useLanguage();
  const label = `${changedCount} ${changedCount === 1 ? t.settings.common.unsavedSingular : t.settings.common.unsavedPlural}`;
  return (
    <div
      className={cn(
        "fixed left-0 right-0 bottom-0 z-40 pointer-events-none transition-transform duration-200 ease-out",
        isDirty ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="max-w-[1600px] mx-auto px-6 md:px-8 pb-4">
        <div className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl glass-popover shadow-2xl">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-2 h-2 rounded-full shrink-0 animate-pulse"
              style={{ background: "var(--accent-primary)" }}
            />
            <p className="text-[13px] font-medium text-foreground truncate">{label}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onDiscard}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-lg border border-border hover:bg-muted transition-colors text-foreground disabled:opacity-50"
            >
              <Undo2 className="w-3.5 h-3.5" /> {t.settings.common.discard}
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-semibold rounded-lg text-white transition-colors disabled:opacity-60"
              style={{ background: "var(--accent-primary)" }}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {t.settings.common.saveChanges}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
