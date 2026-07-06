"use client";

import { LogOut, Shield } from "lucide-react";

interface VaultHeaderProps {
  onLogout: () => void;
}

export function VaultHeader({ onLogout }: VaultHeaderProps) {
  return (
    <header className="border-b border-[var(--border)] px-6 py-4">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
            <Shield className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[var(--foreground)]">
              Family Vault
            </h1>
            <p className="text-[10px] text-[var(--muted-foreground)]">
              PrimeX Ventures Inc.
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted-foreground)] transition-colors hover:border-red-800/50 hover:bg-red-950/20 hover:text-red-400"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </button>
      </div>
    </header>
  );
}
