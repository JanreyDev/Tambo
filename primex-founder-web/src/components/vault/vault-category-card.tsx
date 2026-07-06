"use client";

import type { VaultCategory } from "@/lib/vault-types";

interface VaultCategoryCardProps {
  category: VaultCategory;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
}

export function VaultCategoryCard({
  category,
  icon: Icon,
  color,
  onClick,
}: VaultCategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className="group flex items-start gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-left transition-all hover:border-amber-800/40 hover:shadow-lg hover:shadow-amber-900/5"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
        style={{ background: `${color}15` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-0.5">
          {category.label}
        </h3>
        <p className="text-[11px] text-[var(--muted-foreground)] line-clamp-2">
          {category.description}
        </p>
        <p className="mt-2 text-[10px] font-medium text-amber-400">
          {category.entry_count} {category.entry_count === 1 ? "entry" : "entries"}
        </p>
      </div>
    </button>
  );
}
