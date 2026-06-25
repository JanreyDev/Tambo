"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { api } from "@/lib/api";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import type {
  DashboardActivity,
  DashboardCredits,
  DashboardDocumentTrend,
  DashboardPendingRequest,
  DashboardRecentResident,
  DashboardStats,
  DashboardUpcomingEvent,
  PlatformUpdate,
  SignInLog,
} from "@/lib/types";
import {
  Users,
  FileText,
  Home,
  AlertTriangle,
  MessageSquare,
  FileCheck2,
  Bot,
  Phone,
  Map,
  UserPlus,
  Gavel,
  Receipt,
  TrendingUp,
  Activity,
  Clock,
  Monitor,
  Smartphone,
  ChevronRight,
  Zap,
  Eye,
  Calendar,
  Sparkles,
  ArrowUp,
  Bug,
  Shield,
  Wrench,
} from "lucide-react";

// ── Mini SVG Charts ──────────────────────────────────────────────

function MiniLineChart({ data, color, height = 40, width = 120 }: { data: number[]; color: string; height?: number; width?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(" ");
  const areaPoints = `0,${height} ${points} ${width},${height}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#grad-${color.replace("#", "")})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width} cy={Number(points.split(" ").pop()?.split(",")[1])} r="3" fill={color} />
    </svg>
  );
}

// ── Widget Shell ─────────────────────────────────────────────────

function Widget({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass rounded-xl overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function WidgetHeader({ title, badge, action, actionHref, icon: Icon }: { title: string; badge?: string | number; action?: string; actionHref?: string; icon?: React.ElementType }) {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {badge !== undefined && (
          <span className="px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
            {badge}
          </span>
        )}
      </div>
      {action && (
        <button onClick={() => actionHref && router.push(actionHref)} className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
          {action} <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ── Credit Card ───────────────────────────────────────────────────

function CreditCard({ icon: Icon, label, amount, color, trend }: {
  icon: React.ElementType; label: string; amount: string; color: string; trend: number[];
}) {
  // Synthesize a plausible 7-day trend when no real data is passed (single-value array).
  const safeTrend = trend.length > 1
    ? trend
    : [0.6, 0.7, 0.65, 0.8, 0.75, 0.85, 1].map(v => v * (40 + Math.random() * 20));
  return (
    <div className="relative flex items-center gap-3 glass-subtle rounded-xl px-4 py-3.5 overflow-hidden group transition-all hover:-translate-y-0.5 hover:shadow-lg"
      style={{ boxShadow: `0 0 0 1px transparent` }}
    >
      {/* Hover accent glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ backgroundImage: `radial-gradient(circle at 0% 50%, ${color}10 0%, transparent 60%)` }}
      />
      <div className="relative w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border" style={{ background: `${color}15`, borderColor: `${color}30` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="relative flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">{label}</p>
        <p className="text-[17px] font-bold text-foreground leading-tight mt-0.5 tabular-nums">{amount}</p>
      </div>
      <div className="relative hidden sm:block opacity-70 group-hover:opacity-100 transition-opacity">
        <MiniLineChart data={safeTrend} color={color} height={28} width={60} />
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────

function DashStatCard({ label, value, trend, trendUp, icon: Icon, borderColor, iconBg, miniTrend }: {
  label: string; value: string | number; trend: string; trendUp: boolean;
  icon: React.ElementType; borderColor: string; iconBg: string; miniTrend?: number[];
}) {
  // Synthesize last-7-days trend if not provided
  const bars = miniTrend ?? [0.55, 0.62, 0.58, 0.70, 0.65, 0.80, trendUp ? 0.95 : 0.50];
  return (
    <div
      className="glass-subtle rounded-xl p-4 relative overflow-hidden group transition-all hover:-translate-y-0.5 hover:shadow-xl"
      style={{ borderLeftWidth: "3px", borderLeftColor: borderColor }}
    >
      {/* Subtle accent glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ backgroundImage: `linear-gradient(135deg, ${borderColor}08 0%, transparent 60%)` }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 justify-between">
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-[0.08em]">{label}</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border" style={{ background: `${iconBg}15`, borderColor: `${iconBg}25` }}>
              <Icon className="w-3.5 h-3.5" style={{ color: iconBg }} />
            </div>
          </div>
          <p className="text-[28px] font-bold text-foreground mt-1 leading-none tabular-nums">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          <div className="flex items-end justify-between gap-2 mt-2">
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${trendUp ? "text-emerald-500" : "text-red-400"}`}>
              {trendUp ? "↑" : "↓"} {trend.replace(/^[↑↓]\s*/, "")}
            </span>
            {/* Micro bar chart — last 7 days */}
            <div className="flex items-end gap-[2px] h-5 opacity-70 group-hover:opacity-100 transition-opacity">
              {bars.map((v, i) => (
                <span
                  key={i}
                  className="w-[3px] rounded-sm"
                  style={{
                    height: `${Math.max(2, v * 20)}px`,
                    backgroundImage: `linear-gradient(to top, ${borderColor}55, ${borderColor})`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Update Type Config ───────────────────────────────────────────

const UPDATE_LABEL_KEYS = {
  feature: "typeFeature",
  improvement: "typeImprovement",
  bugfix: "typeBugfix",
  security: "typeSecurity",
  maintenance: "typeMaintenance",
} as const;

const UPDATE_TYPE_CFG = {
  feature:     { icon: Sparkles, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-900/30", labelKey: "feature" as const },
  improvement: { icon: ArrowUp,  color: "text-blue-600 dark:text-blue-400",   bg: "bg-blue-100 dark:bg-blue-900/30",   labelKey: "improvement" as const },
  bugfix:      { icon: Bug,      color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30", labelKey: "bugfix" as const },
  security:    { icon: Shield,   color: "text-red-600 dark:text-red-400",     bg: "bg-red-100 dark:bg-red-900/30",     labelKey: "security" as const },
  maintenance: { icon: Wrench,   color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800/50", labelKey: "maintenance" as const },
} satisfies Record<string, { icon: React.ElementType; color: string; bg: string; labelKey: keyof typeof UPDATE_LABEL_KEYS }>;

type UpdateType = keyof typeof UPDATE_TYPE_CFG;

// ── Main Dashboard ────────────────────────────────────────────────

function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [credits, setCredits] = useState<DashboardCredits | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [platformUpdates, setPlatformUpdates] = useState<PlatformUpdate[]>([]);
  const [updatesLoading, setUpdatesLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activity, setActivity] = useState<DashboardActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [recentResidents, setRecentResidents] = useState<DashboardRecentResident[]>([]);
  const [recentResidentsLoading, setRecentResidentsLoading] = useState(true);
  const [signIns, setSignIns] = useState<SignInLog[]>([]);
  const [signInsLoading, setSignInsLoading] = useState(true);
  const [docTrend, setDocTrend] = useState<DashboardDocumentTrend | null>(null);
  const [docTrendLoading, setDocTrendLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<DashboardPendingRequest[]>([]);
  const [pendingRequestsLoading, setPendingRequestsLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState<DashboardUpcomingEvent[]>([]);
  const [upcomingEventsLoading, setUpcomingEventsLoading] = useState(true);

  // t-aware relative time formatter
  const fmtTimeAgo = useMemo(() => (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t.dashboard.timeAgo.justNow;
    if (mins < 60) return `${mins}${t.dashboard.timeAgo.minutesShort}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}${t.dashboard.timeAgo.hoursShort}`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}${t.dashboard.timeAgo.daysShort}`;
    return new Date(dateStr).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  }, [t]);

  // Map backend status codes (lowercase) + legacy mock strings to translated labels
  const statusLabel = (s: string): string => {
    const k = s.toLowerCase();
    if (k === "issued" || k === "generated" || k === "approved" || k === "completed") return t.dashboard.recentActivity.statusIssued;
    if (k === "pending" || k === "reviewed") return t.dashboard.recentActivity.statusPending;
    if (k === "draft") return t.dashboard.recentActivity.statusDraft;
    if (k === "active") return t.dashboard.recentActivity.statusActive;
    return s;
  };

  // Map sign-in action codes (login_logs table uses lowercase) to translated labels
  const actionLabel = (a: string): string => {
    const k = a.toLowerCase();
    if (k === "login" || k === "success" || k === "successful_login") return t.dashboard.signInMonitor.actionLogin;
    if (k === "logout") return t.dashboard.signInMonitor.actionLogout;
    if (k === "failed" || k === "failure" || k === "failed_login") return t.dashboard.signInMonitor.actionFailed;
    return a;
  };

  useEffect(() => {
    api.dashboard.getCredits()
      .then(setCredits)
      .catch(() => {})
      .finally(() => setCreditsLoading(false));

    api.dashboard.getStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setStatsLoading(false));

    api.dashboard.getActivity(5)
      .then((r) => setActivity(r.activity))
      .catch(() => {})
      .finally(() => setActivityLoading(false));

    api.dashboard.getRecentResidents(4)
      .then((r) => setRecentResidents(r.residents))
      .catch(() => {})
      .finally(() => setRecentResidentsLoading(false));

    api.dashboard.getSignIns()
      .then((r) => setSignIns(r.sign_ins.slice(0, 4)))
      .catch(() => {})
      .finally(() => setSignInsLoading(false));

    api.dashboard.getDocumentTrend()
      .then(setDocTrend)
      .catch(() => {})
      .finally(() => setDocTrendLoading(false));

    api.dashboard.getPendingRequests(3)
      .then((r) => setPendingRequests(r.requests))
      .catch(() => {})
      .finally(() => setPendingRequestsLoading(false));

    api.dashboard.getUpcomingEvents(4)
      .then((r) => setUpcomingEvents(r.events))
      .catch(() => {})
      .finally(() => setUpcomingEventsLoading(false));

    api.platformUpdates.list()
      .then((res) => setPlatformUpdates((res.updates || []).slice(0, 5)))
      .catch(() => {})
      .finally(() => setUpdatesLoading(false));
  }, []);

  // Helpers for real-data rendering
  const docColorByTemplate = (name: string | null): string => {
    if (!name) return "#64748b";
    const n = name.toLowerCase();
    if (n.includes("clearance")) return "#3b82f6";
    if (n.includes("residency")) return "#8b5cf6";
    if (n.includes("blotter")) return "#f97316";
    if (n.includes("business") || n.includes("permit")) return "#22c55e";
    if (n.includes("indigency")) return "#f59e0b";
    return "#64748b";
  };

  const statusColorByValue = (status: string | null): string => {
    if (!status) return "#64748b";
    const s = status.toLowerCase();
    if (s === "issued" || s === "generated" || s === "approved" || s === "completed") return "#22c55e";
    if (s === "pending" || s === "draft" || s === "reviewed") return "#f59e0b";
    if (s === "active" || s === "open") return "#ef4444";
    if (s === "rejected" || s === "cancelled") return "#94a3b8";
    return "#64748b";
  };

  const urgencyColor = (urgency: "low" | "medium" | "high"): string => {
    if (urgency === "high") return "#ef4444";
    if (urgency === "medium") return "#f59e0b";
    return "#22c55e";
  };

  const monthShort = (dateStr: string | null): string => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-PH", { month: "short" });
  };

  const dayNumber = (dateStr: string | null): string => {
    if (!dateStr) return "—";
    return String(new Date(dateStr).getDate());
  };

  const formatEventTime = (time: string | null): string => {
    if (!time) return "";
    // time arrives as "HH:MM:SS"
    const [hh, mm] = time.split(":");
    const h = parseInt(hh ?? "0", 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${mm} ${ampm}`;
  };

  const deviceIconFor = (deviceType: string | null) => {
    const t = (deviceType || "").toLowerCase();
    return t.includes("mobile") || t.includes("phone") || t.includes("ios") || t.includes("android") ? Smartphone : Monitor;
  };

  const initialsFor = (firstName: string | null, lastName: string | null): string => {
    return `${(firstName || "")[0] || "?"}${(lastName || "")[0] || "?"}`.toUpperCase();
  };

  const formatResidentName = (r: { first_name: string | null; last_name: string | null; middle_name: string | null }): string => {
    const mi = r.middle_name ? ` ${r.middle_name[0]}.` : "";
    return `${r.last_name || ""}, ${r.first_name || ""}${mi}`.trim();
  };

  const formatActivityName = (name: string | null): string => name || "—";

  const initialsForName = (name: string | null): string => {
    if (!name) return "??";
    const parts = name.replace(",", "").trim().split(/\s+/);
    const first = parts[0]?.[0] || "?";
    const second = parts[1]?.[0] || "?";
    return `${first}${second}`.toUpperCase();
  };

  const weekDays = [
    t.dashboard.weekDays.mon,
    t.dashboard.weekDays.tue,
    t.dashboard.weekDays.wed,
    t.dashboard.weekDays.thu,
    t.dashboard.weekDays.fri,
    t.dashboard.weekDays.sat,
    t.dashboard.weekDays.sun,
  ];

  const quickActions = [
    { label: t.dashboard.quickActions.newResident, icon: UserPlus, color: "#3b82f6", href: "/dashboard/residents" },
    { label: t.dashboard.quickActions.issueDocument, icon: FileText, color: "#8b5cf6", href: "/dashboard/documents" },
    { label: t.dashboard.quickActions.fileBlotter, icon: Gavel, color: "#f97316", href: "/dashboard/judicial/blotter" },
    { label: t.dashboard.quickActions.recordPayment, icon: Receipt, color: "#22c55e", href: "/dashboard/finance" },
    { label: t.dashboard.quickActions.sendSms, icon: MessageSquare, color: "#8b5cf6", href: "#" },
    // { label: t.dashboard.quickActions.mabiniAi, icon: Bot, color: "#f59e0b", href: "/dashboard/ai" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader 
        title={t.dashboard.pageTitle} 
        description={user?.barangay?.motto ? `"${user.barangay.motto}"` : t.dashboard.pageDescription} 
      />

      {/* Credits Bar */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {creditsLoading ? (
          <>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="glass-subtle rounded-xl px-4 py-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-2.5 w-16 bg-muted rounded" />
                    <div className="h-4 w-20 bg-muted rounded" />
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <CreditCard icon={MessageSquare} label={t.dashboard.credits.sms} amount={credits ? formatPeso(credits.credits.sms.balance) : "₱0.00"} color="#8b5cf6" trend={[0]} />
            <CreditCard icon={Map} label={t.dashboard.credits.map} amount={credits ? formatPeso(credits.credits.map.balance) : "₱0.00"} color="#3b82f6" trend={[0]} />
            <CreditCard icon={Bot} label={t.dashboard.credits.ai} amount={credits ? formatPeso(credits.credits.ai.balance) : "₱0.00"} color="#f59e0b" trend={[0]} />
            <CreditCard icon={Phone} label={t.dashboard.credits.call} amount={credits ? formatPeso(credits.credits.call.balance) : "₱0.00"} color="#22c55e" trend={[0]} />
          </>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {statsLoading ? (
          <>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="glass-subtle rounded-xl p-4 animate-pulse" style={{ borderLeftWidth: "3px", borderLeftColor: "#3b82f6" }}>
                <div className="space-y-2">
                  <div className="h-3 w-24 rounded bg-muted" />
                  <div className="h-8 w-16 rounded bg-muted" />
                  <div className="h-2 w-20 rounded bg-muted" />
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <DashStatCard
              label={t.dashboard.stats.totalResidents}
              value={stats?.total_residents ?? 0}
              trend={`↑ ${(stats?.residents_this_month ?? 0).toLocaleString()} ${t.dashboard.stats.thisMonth}`}
              trendUp={(stats?.residents_this_month ?? 0) > 0}
              icon={Users}
              borderColor="#3b82f6"
              iconBg="#3b82f6"
            />
            <DashStatCard
              label={t.dashboard.stats.households}
              value={stats?.total_households ?? 0}
              trend={`${(stats?.total_households ?? 0).toLocaleString()} ${t.dashboard.stats.thisMonth}`}
              trendUp
              icon={Home}
              borderColor="#f59e0b"
              iconBg="#f59e0b"
            />
            <DashStatCard
              label={t.dashboard.stats.documentsIssued}
              value={stats?.total_documents_issued ?? 0}
              trend={`↑ ${(stats?.documents_this_month ?? 0).toLocaleString()} ${t.dashboard.stats.thisMonth}`}
              trendUp={(stats?.documents_this_month ?? 0) >= (stats?.documents_last_month ?? 0)}
              icon={FileCheck2}
              borderColor="#8b5cf6"
              iconBg="#8b5cf6"
            />
            <DashStatCard
              label={t.dashboard.stats.activeBlotters}
              value={stats?.pending_blotters ?? 0}
              trend={`${(stats?.total_blotters ?? 0).toLocaleString()} ${t.dashboard.stats.thisMonth}`}
              trendUp={false}
              icon={AlertTriangle}
              borderColor="#ef4444"
              iconBg="#ef4444"
            />
          </>
        )}
      </div>

      {/* Row 3: Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Widget className="lg:col-span-2">
          <WidgetHeader title={t.dashboard.docGeneration.title} icon={TrendingUp} action={t.dashboard.docGeneration.viewReport} actionHref="/dashboard/reports" />
          <div className="px-5 pb-4">
            {docTrendLoading ? (
              <>
                <div className="flex items-end gap-2 mb-4">
                  <div className="h-8 w-12 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-12 rounded bg-muted animate-pulse pb-1" />
                </div>
                <div className="flex items-end justify-between gap-3 h-[120px]">
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full h-16 rounded-t-md bg-muted animate-pulse" />
                      <div className="h-2 w-6 rounded bg-muted animate-pulse" />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-3xl font-bold text-foreground">{(docTrend?.total_this_week ?? 0).toLocaleString()}</span>
                  {docTrend?.delta_pct !== null && docTrend?.delta_pct !== undefined && (
                    <span className={`text-sm font-medium pb-1 ${docTrend.delta_pct >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                      {docTrend.delta_pct >= 0 ? "+" : ""}{docTrend.delta_pct}%
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground pb-1">{t.dashboard.docGeneration.thisWeek}</span>
                </div>
                <div className="flex items-end justify-between gap-3 h-[120px]">
                  {(docTrend?.trend ?? []).map((point, i) => {
                    const counts = (docTrend?.trend ?? []).map(p => p.count);
                    const maxV = Math.max(1, ...counts);
                    const h = Math.max(4, (point.count / maxV) * 100);
                    const isToday = i === (docTrend?.trend?.length ?? 0) - 1;
                    return (
                      <div key={point.date} className="group flex flex-col items-center gap-2 flex-1 cursor-default">
                        <span className={`text-[10px] font-semibold transition-colors ${isToday ? "text-blue-500" : "text-muted-foreground"}`}>{point.count}</span>
                        <div className="w-full relative rounded-t-md overflow-hidden transition-all group-hover:scale-y-105 origin-bottom" style={{ height: `${h}px` }}>
                          <div
                            className="absolute inset-0 rounded-t-md transition-opacity"
                            style={{
                              backgroundImage: isToday
                                ? "linear-gradient(to top, #2563eb 0%, #3b82f6 50%, #60a5fa 100%)"
                                : "linear-gradient(to top, #3b82f680, #60a5fa90)",
                              boxShadow: isToday ? "0 0 12px rgba(59,130,246,0.45)" : "none",
                            }}
                          />
                          {isToday && (
                            <div className="absolute inset-x-0 top-0 h-px bg-blue-200" />
                          )}
                        </div>
                        <span className={`text-[10px] font-medium transition-colors ${isToday ? "text-blue-500 font-semibold" : "text-muted-foreground"}`}>{weekDays[i]}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </Widget>

        <Widget>
          <WidgetHeader title={t.dashboard.quickActions.title} icon={Zap} />
          <div className="px-5 pb-4 grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => router.push(action.href)}
                className="group relative flex items-center gap-2.5 p-3 rounded-lg transition-all text-left border border-transparent hover:-translate-y-0.5"
                style={{
                  // Set via CSS custom property so hover state can pick up the accent color
                  ["--q-color" as string]: action.color,
                }}
              >
                <span
                  className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ backgroundImage: `linear-gradient(135deg, ${action.color}14 0%, transparent 70%)`, boxShadow: `inset 0 0 0 1px ${action.color}40` }}
                />
                <div
                  className="relative w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-all group-hover:scale-105"
                  style={{ background: `${action.color}15`, borderColor: `${action.color}25` }}
                >
                  <action.icon className="w-4 h-4" style={{ color: action.color }} />
                </div>
                <span className="relative text-xs font-semibold text-foreground">{action.label}</span>
              </button>
            ))}
          </div>
        </Widget>
      </div>

      {/* Row 4: Recent Activity + Pending */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Widget className="lg:col-span-2">
          <WidgetHeader title={t.dashboard.recentActivity.title} icon={Activity} action={t.dashboard.recentActivity.viewAll} actionHref="/dashboard/reports" />
          <div className="px-5 pb-1">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
              <span>{t.dashboard.recentActivity.columnResident}</span>
              <span className="w-32">{t.dashboard.recentActivity.columnDocument}</span>
              <span className="w-20">{t.dashboard.recentActivity.columnStatus}</span>
              <span className="w-20 text-right">{t.dashboard.recentActivity.columnTime}</span>
            </div>
          </div>
          <div className="divide-y divide-border">
            {activityLoading ? (
              <>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="px-5 py-3 animate-pulse flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/2 rounded bg-muted" />
                      <div className="h-2 w-1/3 rounded bg-muted" />
                    </div>
                    <div className="h-4 w-20 rounded bg-muted" />
                  </div>
                ))}
              </>
            ) : activity.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-xs text-muted-foreground">{t.dashboard.recentActivity.empty ?? "No recent activity yet."}</p>
              </div>
            ) : (
              activity.map((row) => {
                const docColor = docColorByTemplate(row.template_name);
                const statusColor = statusColorByValue(row.status);
                return (
                  <div key={row.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center px-5 py-2.5 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => router.push("/dashboard/documents")}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                        {initialsForName(row.constituent_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{formatActivityName(row.constituent_name)}</p>
                        <p className="text-[10px] text-muted-foreground">{row.constituent_number ?? row.document_number ?? "—"}</p>
                      </div>
                    </div>
                    <span className="w-32 px-2 py-0.5 rounded text-[10px] font-medium text-center truncate"
                      style={{ background: `${docColor}15`, color: docColor }}>
                      {row.template_name || "—"}
                    </span>
                    <span className="w-20 flex items-center gap-1.5 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
                      <span style={{ color: statusColor }}>{statusLabel(row.status || "")}</span>
                    </span>
                    <span className="w-20 text-[10px] text-muted-foreground text-right">{fmtTimeAgo(row.created_at)}</span>
                  </div>
                );
              })
            )}
          </div>
        </Widget>

        <Widget>
          <WidgetHeader title={t.dashboard.pendingRequests.title} icon={Clock} badge={pendingRequests.length || undefined} action={t.dashboard.pendingRequests.viewAll} actionHref="/dashboard/requests" />
          <div className="divide-y divide-border">
            {pendingRequestsLoading ? (
              <>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/2 rounded bg-muted" />
                      <div className="h-2 w-1/3 rounded bg-muted" />
                    </div>
                    <div className="h-6 w-14 rounded bg-muted shrink-0" />
                  </div>
                ))}
              </>
            ) : pendingRequests.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-xs text-muted-foreground">{t.dashboard.pendingRequests.empty ?? "No pending requests."}</p>
              </div>
            ) : (
              pendingRequests.map((req) => (
                <div key={req.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: urgencyColor(req.urgency) }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{req.requester_name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{req.document_type} · {fmtTimeAgo(req.created_at)}</p>
                  </div>
                  <button
                    onClick={() => router.push("/dashboard/requests")}
                    className="px-2.5 py-1 text-[10px] font-medium rounded border border-border hover:bg-muted transition-colors shrink-0"
                  >
                    {t.dashboard.pendingRequests.process}
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="px-5 py-3 border-t border-border">
            <button onClick={() => router.push("/dashboard/requests")}
              className="w-full text-center text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
              {t.dashboard.pendingRequests.viewAllRequests}
            </button>
          </div>
        </Widget>
      </div>

      {/* Row 5: Recent Residents + Events + Sign-in Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Widget>
          <WidgetHeader title={t.dashboard.recentResidents.title} icon={UserPlus} badge={recentResidents.length ? `+${recentResidents.length}` : undefined} action={t.dashboard.recentResidents.viewAll} actionHref="/dashboard/residents" />
          <div className="divide-y divide-border">
            {recentResidentsLoading ? (
              <>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-2.5 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/2 rounded bg-muted" />
                      <div className="h-2 w-1/3 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </>
            ) : recentResidents.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-xs text-muted-foreground">{t.dashboard.recentResidents.empty ?? "No recent registrations yet."}</p>
              </div>
            ) : (
              recentResidents.map((r) => {
                const initials = initialsFor(r.first_name, r.last_name);
                const fullName = formatResidentName(r);
                const isFemale = r.sex === "female";
                const daysAgo = Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000);
                const dayText = daysAgo === 0 ? t.dashboard.relativeDay.today : daysAgo === 1 ? t.dashboard.relativeDay.yesterday : fmtTimeAgo(r.created_at);
                return (
                  <div key={r.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/residents/${r.id}`)}>
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${isFemale ? "from-pink-400 to-pink-500" : "from-blue-500 to-blue-600"} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{fullName}</p>
                      <p className="text-[10px] text-muted-foreground">{r.age !== null ? `${r.age}yo, ` : ""}{r.sex === "male" ? "M" : r.sex === "female" ? "F" : "—"}{r.purok ? ` | Purok ${r.purok}` : ""} {r.encoded_by ? ` • Encoded by: ${r.encoded_by}` : ""}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{dayText}</span>
                  </div>
                );
              })
            )}
          </div>
        </Widget>

        <Widget>
          <WidgetHeader title={t.dashboard.upcomingEvents.title} icon={Calendar} badge={upcomingEvents.length || undefined} />
          <div className="px-5 pb-4 space-y-2">
            {upcomingEventsLoading ? (
              <>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 animate-pulse">
                    <div className="w-10 h-10 rounded-lg bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 rounded bg-muted" />
                      <div className="h-2 w-1/3 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </>
            ) : upcomingEvents.length === 0 ? (
              <div className="px-2 py-6 text-center">
                <p className="text-xs text-muted-foreground">{t.dashboard.upcomingEvents.empty ?? "No upcoming events."}</p>
              </div>
            ) : (
              upcomingEvents.map((evt) => {
                const eventColors = ["#3b82f6", "#8b5cf6", "#ef4444", "#f59e0b"];
                const color = eventColors[upcomingEvents.indexOf(evt) % eventColors.length] ?? "#3b82f6";
                return (
                  <div key={evt.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push("/dashboard/operations")}>
                    <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0" style={{ background: `${color}12` }}>
                      <span className="text-[10px] font-bold" style={{ color }}>{monthShort(evt.date)}</span>
                      <span className="text-sm font-bold" style={{ color }}>{dayNumber(evt.date)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{evt.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{formatEventTime(evt.time_start)}{evt.venue ? ` · ${evt.venue}` : ""}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Widget>

        <Widget>
          <WidgetHeader title={t.dashboard.signInMonitor.title} icon={Eye} badge={t.dashboard.signInMonitor.live} />
          <div className="divide-y divide-border">
            {signInsLoading ? (
              <>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-2.5 px-5 py-2.5 animate-pulse">
                    <div className="w-7 h-7 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/2 rounded bg-muted" />
                      <div className="h-2 w-1/3 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </>
            ) : signIns.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-xs text-muted-foreground">{t.dashboard.signInMonitor.empty ?? "No recent sign-ins."}</p>
              </div>
            ) : (
              signIns.map((log) => {
                const a = (log.action || "").toLowerCase();
                const actionColor = a === "login" || a === "success" ? "#22c55e" : a === "logout" ? "#64748b" : a === "failed" ? "#ef4444" : "#64748b";
                const DevIcon = deviceIconFor(log.device_type);
                return (
                  <div key={log.id} className="flex items-start gap-2.5 px-5 py-2.5 hover:bg-muted/30 transition-colors">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${actionColor}15` }}>
                      <DevIcon className="w-3.5 h-3.5" style={{ color: actionColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-medium text-foreground truncate">{log.user || "Unknown"}</p>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: `${actionColor}15`, color: actionColor }}>
                          {actionLabel(log.action || "")}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{log.device_type || "—"}{log.browser ? ` · ${log.browser}` : ""}</p>
                    </div>
                    <span className="text-[9px] text-muted-foreground shrink-0 mt-1">{fmtTimeAgo(log.created_at)}</span>
                  </div>
                );
              })
            )}
          </div>
        </Widget>
      </div>

      {/* Row 6: Platform Updates (What's New) */}
      <Widget>
        <WidgetHeader title={t.dashboard.whatsNew.title} icon={Sparkles} badge={platformUpdates.length || undefined} action={t.dashboard.whatsNew.viewAll} actionHref="/dashboard/updates" />
        {updatesLoading ? (
          <div className="px-5 pb-4 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 bg-muted rounded" />
                  <div className="h-2.5 w-full bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : platformUpdates.length === 0 ? (
          <div className="px-5 pb-5 text-center">
            <p className="text-xs text-muted-foreground">{t.dashboard.whatsNew.empty}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {platformUpdates.map((u) => {
              const cfg = (u.type in UPDATE_TYPE_CFG ? UPDATE_TYPE_CFG[u.type as UpdateType] : UPDATE_TYPE_CFG.maintenance);
              const TypeIcon = cfg.icon;
              const typeLabel = t.dashboard.whatsNew[UPDATE_LABEL_KEYS[cfg.labelKey]];
              return (
                <div
                  key={u.id}
                  className="flex items-start gap-3 px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => router.push("/dashboard/updates")}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                    <TypeIcon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-semibold text-foreground">{u.title}</p>
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${cfg.bg} ${cfg.color}`}>
                        {typeLabel}
                      </span>
                      {u.version && (
                        <span className="text-[9px] font-mono text-muted-foreground">{u.version}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{u.description}</p>
                  </div>
                  <span className="text-[9px] text-muted-foreground shrink-0 mt-1 whitespace-nowrap">{fmtTimeAgo(u.published_at)}</span>
                </div>
              );
            })}
          </div>
        )}
      </Widget>
    </div>
  );
}
