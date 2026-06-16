"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Users, Home, GraduationCap, Calendar, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import type { DashboardStats } from "@/lib/types";

// Population overview cards for the Residents list view.
// A single <StatCard> shell enforces one radius + depth scale across all four
// cards — uniformity by construction, not by convention.

const ACCENT = {
  indigo: {
    tile: "from-indigo-100 to-indigo-50 ring-indigo-200/50 dark:from-indigo-900/50 dark:to-indigo-950/30 dark:ring-indigo-800/40",
    icon: "text-indigo-600 dark:text-indigo-400",
    tint: "from-indigo-500/[0.05]",
    strip: "via-indigo-500/60",
  },
  orange: {
    tile: "from-orange-100 to-orange-50 ring-orange-200/50 dark:from-orange-900/50 dark:to-orange-950/30 dark:ring-orange-800/40",
    icon: "text-orange-600 dark:text-orange-400",
    tint: "from-orange-500/[0.05]",
    strip: "via-orange-500/60",
  },
  sky: {
    tile: "from-sky-100 to-sky-50 ring-sky-200/50 dark:from-sky-900/50 dark:to-sky-950/30 dark:ring-sky-800/40",
    icon: "text-sky-600 dark:text-sky-400",
    tint: "from-sky-500/[0.05]",
    strip: "via-sky-500/60",
  },
  emerald: {
    tile: "from-emerald-100 to-emerald-50 ring-emerald-200/50 dark:from-emerald-900/50 dark:to-emerald-950/30 dark:ring-emerald-800/40",
    icon: "text-emerald-600 dark:text-emerald-400",
    tint: "from-emerald-500/[0.05]",
    strip: "via-emerald-500/60",
  },
} as const;

interface StatCardProps {
  accent: keyof typeof ACCENT;
  icon: LucideIcon;
  label: string;
  value: number;
  loading: boolean;
  badge?: ReactNode;
  children: ReactNode;
}

function StatCard({ accent, icon: Icon, label, value, loading, badge, children }: StatCardProps) {
  const a = ACCENT[accent];
  return (
    <div className="group relative flex flex-col gap-4 overflow-hidden rounded-xl glass p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      {/* permanent top inset highlight — login-grade layered depth */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/[0.06] dark:bg-white/[0.10]" />
      {/* accent strip — fades in on hover */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          a.strip,
        )}
      />
      {/* accent tint wash */}
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent to-transparent", a.tint)} />

      <div className="relative flex items-center justify-between">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ring-1", a.tile)}>
          <Icon className={cn("h-[18px] w-[18px]", a.icon)} />
        </div>
        {badge}
      </div>

      <div className="relative">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
        {loading ? (
          <div className="h-[34px] w-24 animate-pulse rounded-md bg-muted" />
        ) : (
          <p className="text-[34px] font-bold leading-none tracking-tight tabular-nums text-foreground">{value.toLocaleString()}</p>
        )}
      </div>

      <div className="relative mt-auto">{children}</div>
    </div>
  );
}

function TrendBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100/80 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
      <TrendingUp className="h-2.5 w-2.5" />+{count}
    </span>
  );
}

interface ResidentStatCardsProps {
  residentStats: DashboardStats | null;
  statsLoading: boolean;
  listTotal: number;
}

export function ResidentStatCards({ residentStats, statsLoading, listTotal }: ResidentStatCardsProps) {
  const { t } = useLanguage();
  const o = t.residents.overview;

  if (listTotal === 0) {
    return (
      <div className="rounded-xl glass p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-muted/50">
            <Users className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="mb-1 text-lg font-semibold text-foreground">{o.noResidentsYet}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{o.registerFirstResident}</p>
        </div>
      </div>
    );
  }

  const loading = statsLoading && !residentStats;
  const totalPopulation = residentStats?.total_residents ?? listTotal;
  const maleCount = residentStats?.gender_distribution?.male ?? residentStats?.gender_distribution?.Male ?? 0;
  const femaleCount = residentStats?.gender_distribution?.female ?? residentStats?.gender_distribution?.Female ?? 0;
  const householdCount = residentStats?.total_households ?? 0;
  const skAgeCount = residentStats?.age_groups?.["15-30"] ?? 0; // Katipunan ng Kabataan (RA 10742)
  const residentsThisMonth = residentStats?.residents_this_month ?? 0;

  const malePct = totalPopulation > 0 ? (maleCount / totalPopulation) * 100 : 50;
  const skPct = totalPopulation > 0 ? Math.min(100, (skAgeCount / totalPopulation) * 100) : 0;
  const skShare = totalPopulation > 0 ? Math.round((skAgeCount / totalPopulation) * 100) : 0;
  const avgHousehold = householdCount > 0 ? totalPopulation / householdCount : 0;
  // Gauge scaled to 8 — a sensible ceiling for PH household size (national avg ~4.1).
  const avgGaugePct = Math.min(100, (avgHousehold / 8) * 100);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        accent="indigo"
        icon={Users}
        label={o.totalPopulation}
        value={totalPopulation}
        loading={loading}
        badge={residentsThisMonth > 0 && !loading ? <TrendBadge count={residentsThisMonth} /> : undefined}
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]" />
              <span className="font-semibold tabular-nums text-foreground">{maleCount}</span>
              <span className="lowercase text-muted-foreground">{o.male}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-pink-500 shadow-[0_0_6px_rgba(236,72,153,0.5)]" />
              <span className="font-semibold tabular-nums text-foreground">{femaleCount}</span>
              <span className="lowercase text-muted-foreground">{o.female}</span>
            </span>
          </div>
          <div className="flex h-1.5 overflow-hidden rounded-full bg-muted/60">
            <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500" style={{ width: `${malePct}%` }} />
            <div className="h-full flex-1 bg-gradient-to-r from-pink-400 to-pink-500" />
          </div>
        </div>
      </StatCard>

      <StatCard accent="orange" icon={Home} label={o.households} value={householdCount} loading={loading}>
        <div className="space-y-1.5">
          <p className="text-[11px] text-muted-foreground">
            {avgHousehold > 0 ? (
              <>
                <span className="font-semibold tabular-nums text-foreground">{avgHousehold.toFixed(1)}</span> {o.perHousehold}
              </>
            ) : (
              " "
            )}
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted/60">
            <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-500" style={{ width: `${avgGaugePct}%` }} />
          </div>
        </div>
      </StatCard>

      <StatCard
        accent="sky"
        icon={GraduationCap}
        label={o.skAge}
        value={skAgeCount}
        loading={loading}
        badge={
          <span className="inline-flex items-center rounded-full bg-sky-100/80 px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:bg-sky-900/40 dark:text-sky-400">
            15–30
          </span>
        }
      >
        <div className="space-y-1.5">
          <p className="text-[11px] text-muted-foreground">
            <span className="font-semibold tabular-nums text-foreground">{skShare}%</span> {o.ofPopulation}
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted/60">
            <div className="h-full bg-gradient-to-r from-sky-400 to-sky-500 transition-all duration-500" style={{ width: `${skPct}%` }} />
          </div>
        </div>
      </StatCard>

      <StatCard accent="emerald" icon={Calendar} label={o.newThisMonth} value={residentsThisMonth} loading={loading}>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <TrendingUp className="h-3 w-3 text-emerald-500" />
          <span>{o.registeredThisMonth}</span>
        </div>
      </StatCard>
    </div>
  );
}
