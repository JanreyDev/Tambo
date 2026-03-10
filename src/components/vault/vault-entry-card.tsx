"use client";

import { FileText } from "lucide-react";
import type { VaultEntry } from "@/lib/vault-types";

interface VaultEntryCardProps {
  entry: VaultEntry;
}

export function VaultEntryCard({ entry }: VaultEntryCardProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
          <FileText className="h-4 w-4 text-amber-400" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
            {entry.title}
          </h3>
          <div className="text-xs leading-relaxed text-[var(--muted-foreground)] whitespace-pre-wrap">
            {entry.content}
          </div>
          {entry.metadata && Object.keys(entry.metadata).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(entry.metadata).map(([key, value]) => (
                <span
                  key={key}
                  className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400"
                >
                  {key}: {String(value)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
