"use client";

import { useState, useEffect } from "react";
import {
  Sparkles, Zap, Bug, Shield, Wrench, Loader2, AlertTriangle,
  ArrowUp, Tag, Clock, RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { MabiniButton } from "@/components/ui/mabini-button";
import { api } from "@/lib/api";
import type { PlatformUpdate } from "@/lib/types";

// ── Type config ──────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  feature:     { icon: Sparkles, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-900/30", label: "New Feature" },
  improvement: { icon: ArrowUp,  color: "text-blue-600 dark:text-blue-400",   bg: "bg-blue-100 dark:bg-blue-900/30",   label: "Improvement" },
  bugfix:      { icon: Bug,      color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30", label: "Bug Fix" },
  security:    { icon: Shield,   color: "text-red-600 dark:text-red-400",     bg: "bg-red-100 dark:bg-red-900/30",     label: "Security" },
  maintenance: { icon: Wrench,   color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800/50", label: "Maintenance" },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.maintenance;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return formatDate(dateStr);
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function UpdatesPage() {
  const [updates, setUpdates] = useState<PlatformUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  const fetchUpdates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.platformUpdates.list();
      setUpdates(res.updates || []);
    } catch {
      setError("Hindi ma-load ang updates. I-refresh ang page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUpdates(); }, []);

  const filtered = filter ? updates.filter((u) => u.type === filter) : updates;

  // Group by date
  const grouped: Record<string, PlatformUpdate[]> = {};
  for (const u of filtered) {
    const key = formatDate(u.published_at);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(u);
  }

  const types = ["feature", "improvement", "bugfix", "security", "maintenance"];

  return (
    <div className="space-y-6 p-4 lg:p-6 max-w-4xl mx-auto">
      <PageHeader
        title="What's New"
        description="Mga bagong features, fixes, at improvements sa kapitan.ph"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Updates" }]}
      />

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter(null)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors min-h-[36px] ${
            !filter
              ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
              : "border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          All
        </button>
        {types.map((t) => {
          const cfg = getTypeConfig(t);
          const count = updates.filter((u) => u.type === t).length;
          if (count === 0) return null;
          return (
            <button
              key={t}
              onClick={() => setFilter(filter === t ? null : t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors min-h-[36px] ${
                filter === t
                  ? `border-current ${cfg.color} ${cfg.bg}`
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <cfg.icon className="h-3 w-3" />
              {cfg.label}
              <span className="text-[10px] opacity-60">{count}</span>
            </button>
          );
        })}
        <button
          onClick={fetchUpdates}
          className="ml-auto flex items-center gap-1 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors min-h-[36px]"
          title="Refresh"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Content */}
      {loading && updates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading updates...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <button onClick={fetchUpdates} className="text-xs font-semibold text-accent-primary hover:underline">
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Sparkles className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">
            {filter ? "Walang updates sa category na ito" : "Wala pang updates"}
          </p>
          <p className="text-xs text-muted-foreground/60">
            Mag-check ulit mamaya para sa mga bagong features at improvements.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <Clock className="h-3 w-3" />
                  {date}
                </div>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Update cards */}
              <div className="space-y-3">
                {items.map((u) => {
                  const cfg = getTypeConfig(u.type);
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={u.id}
                      className="group relative flex gap-4 p-4 rounded-2xl border border-border bg-card hover:bg-muted/30 transition-colors"
                    >
                      {/* Type icon */}
                      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bg}`}>
                        <Icon className={`h-5 w-5 ${cfg.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold text-foreground">{u.title}</h3>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
                                {cfg.label}
                              </span>
                              {u.is_breaking && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                  Breaking
                                </span>
                              )}
                              {u.version && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                                  <Tag className="h-2.5 w-2.5" />
                                  {u.version}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                            {timeAgo(u.published_at)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                          {u.description}
                        </p>
                        {(u.category || u.author) && (
                          <div className="flex items-center gap-3 mt-2">
                            {u.category && (
                              <span className="text-[10px] font-medium text-muted-foreground/60 bg-muted px-2 py-0.5 rounded">
                                {u.category}
                              </span>
                            )}
                            {u.author && (
                              <span className="text-[10px] text-muted-foreground/50">
                                by {u.author}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <MabiniButton pageContext="You are on the What's New / Platform Updates page. This page shows the latest features, improvements, bug fixes, security patches, and maintenance updates for kapitan.ph. Updates are published by the PrimeX team." />
    </div>
  );
}
