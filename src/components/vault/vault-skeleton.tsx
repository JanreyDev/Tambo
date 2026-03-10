export function VaultSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-[var(--muted)]/30" />
        <div className="space-y-2">
          <div className="h-4 w-40 rounded bg-[var(--muted)]/30" />
          <div className="h-3 w-24 rounded bg-[var(--muted)]/20" />
        </div>
      </div>

      {/* Cards skeleton */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
        >
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 shrink-0 rounded-lg bg-[var(--muted)]/30" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-[var(--muted)]/30" />
              <div className="h-3 w-full rounded bg-[var(--muted)]/20" />
              <div className="h-3 w-2/3 rounded bg-[var(--muted)]/20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
