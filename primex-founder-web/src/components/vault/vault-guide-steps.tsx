"use client";

import type { VaultEntry } from "@/lib/vault-types";

interface VaultGuideStepsProps {
  entries: VaultEntry[];
}

export function VaultGuideSteps({ entries }: VaultGuideStepsProps) {
  return (
    <div className="space-y-4">
      {entries.map((entry, index) => (
        <div
          key={entry.id}
          className="flex gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
        >
          {/* Step number */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-sm font-bold text-amber-400">
            {index + 1}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">
              {entry.title}
            </h3>
            <p className="text-xs leading-relaxed text-[var(--muted-foreground)] whitespace-pre-wrap">
              {entry.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
