"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { api } from "@/lib/api";
import type { DashboardCredits, PlatformUpdate } from "@/lib/types";
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
  return (
    <div className="relative flex items-center gap-3 glass-subtle rounded-xl px-4 py-3 overflow-hidden group hover:border-white/30 dark:hover:border-white/12 transition-colors">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
        <Icon className="w-4.5 h-4.5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-base font-bold text-foreground">{amount}</p>
      </div>
      <div className="hidden sm:block opacity-60">
        <MiniLineChart data={trend} color={color} height={28} width={60} />
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────

function DashStatCard({ label, value, trend, trendUp, icon: Icon, borderColor, iconBg }: {
  label: string; value: string | number; trend: string; trendUp: boolean;
  icon: React.ElementType; borderColor: string; iconBg: string;
}) {
  return (
    <div className="glass-subtle rounded-xl p-4 relative overflow-hidden hover:shadow-lg hover:shadow-black/5 transition-all"
      style={{ borderLeftWidth: "3px", borderLeftColor: borderColor }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-0.5">{typeof value === "number" ? value.toLocaleString() : value}</p>
          <p className={`text-[11px] mt-1 font-medium ${trendUp ? "text-emerald-500" : "text-red-400"}`}>{trend}</p>
        </div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${iconBg}15` }}>
          <Icon className="w-4.5 h-4.5" style={{ color: iconBg }} />
        </div>
      </div>
    </div>
  );
}

// ── Interfaces ──────────────────────────────────────────────────

interface ActivityRow {
  initials: string; name: string; residentId: string; document: string;
  documentColor: string; status: string; statusColor: string; time: string;
}

interface PendingRequest {
  name: string; document: string; time: string; urgency: string;
}

interface SignInEntry {
  user: string; action: string; device: string; deviceIcon: React.ElementType;
  browser: string; ip: string; time: string; actionColor: string;
}

interface RecentResident {
  initials: string; name: string; age: number; gender: string;
  purok: string; time: string;
}

// ── Update Type Config ───────────────────────────────────────────

const UPDATE_TYPE_CFG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  feature:     { icon: Sparkles, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-900/30", label: "Feature" },
  improvement: { icon: ArrowUp,  color: "text-blue-600 dark:text-blue-400",   bg: "bg-blue-100 dark:bg-blue-900/30",   label: "Improvement" },
  bugfix:      { icon: Bug,      color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30", label: "Bug Fix" },
  security:    { icon: Shield,   color: "text-red-600 dark:text-red-400",     bg: "bg-red-100 dark:bg-red-900/30",     label: "Security" },
  maintenance: { icon: Wrench,   color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800/50", label: "Maintenance" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

// ── Main Dashboard ────────────────────────────────────────────────

function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [credits, setCredits] = useState<DashboardCredits | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [platformUpdates, setPlatformUpdates] = useState<PlatformUpdate[]>([]);
  const [updatesLoading, setUpdatesLoading] = useState(true);

  useEffect(() => {
    api.dashboard.getCredits()
      .then(setCredits)
      .catch(() => {/* silently fail -- cards show skeleton */})
      .finally(() => setCreditsLoading(false));

    api.platformUpdates.list()
      .then((res) => setPlatformUpdates((res.updates || []).slice(0, 5)))
      .catch(() => {})
      .finally(() => setUpdatesLoading(false));
  }, []);

  const activities: ActivityRow[] = [
    { initials: "MM", name: "Resurreccion, Malvin M.", residentId: "RES-1381000006-0501", document: "Brgy Clearance", documentColor: "#3b82f6", status: "Generated", statusColor: "#22c55e", time: "2 hours ago" },
    { initials: "JD", name: "Cruz, Juan Dela", residentId: "RES-1381000006-0045", document: "Certificate of Residency", documentColor: "#8b5cf6", status: "Generated", statusColor: "#22c55e", time: "3 hours ago" },
    { initials: "JH", name: "Dev, Janjan H.", residentId: "RES-1381000006-0044", document: "Brgy Clearance", documentColor: "#3b82f6", status: "Pending", statusColor: "#f59e0b", time: "5 hours ago" },
    { initials: "GJ", name: "Garcia, Janrey", residentId: "BLO-020226-001", document: "Blotter Filed", documentColor: "#f97316", status: "Active", statusColor: "#ef4444", time: "1 day ago" },
    { initials: "AS", name: "Santos, Ana Marie", residentId: "RES-1381000006-0102", document: "Business Permit", documentColor: "#22c55e", status: "Generated", statusColor: "#22c55e", time: "1 day ago" },
  ];

  const pendingRequests: PendingRequest[] = [
    { name: "Valderrama, Nida", document: "Barangay Clearance", time: "2 hrs ago", urgency: "#ef4444" },
    { name: "Santos, Maria C.", document: "Certificate of Residency", time: "1 day ago", urgency: "#f59e0b" },
    { name: "Reyes, Pedro A.", document: "Business Permit", time: "3 days ago", urgency: "#22c55e" },
  ];

  const signInLogs: SignInEntry[] = [
    { user: "Jeager Manalo", action: "Login", device: "Windows 11", deviceIcon: Monitor, browser: "Chrome 131", ip: "103.214.xx.xx", time: "2 min ago", actionColor: "#22c55e" },
    { user: "Maria Santos", action: "Login", device: "iPhone 15", deviceIcon: Smartphone, browser: "Safari 18", ip: "49.145.xx.xx", time: "15 min ago", actionColor: "#22c55e" },
    { user: "Pedro Reyes", action: "Logout", device: "Android", deviceIcon: Smartphone, browser: "Chrome 131", ip: "119.93.xx.xx", time: "30 min ago", actionColor: "#64748b" },
    { user: "Ana Cruz", action: "Failed", device: "Windows 10", deviceIcon: Monitor, browser: "Edge 131", ip: "210.4.xx.xx", time: "1 hr ago", actionColor: "#ef4444" },
  ];

  const recentResidents: RecentResident[] = [
    { initials: "MM", name: "Resurreccion, Malvin M.", age: 28, gender: "M", purok: "Purok 3", time: "Today" },
    { initials: "AS", name: "Santos, Ana Marie", age: 34, gender: "F", purok: "Purok 1", time: "Today" },
    { initials: "JD", name: "Cruz, Juan Dela", age: 45, gender: "M", purok: "Purok 7", time: "Yesterday" },
    { initials: "MC", name: "Chavez, Mark L.", age: 22, gender: "M", purok: "Purok 2", time: "Yesterday" },
  ];

  const upcomingEvents = [
    { title: "Barangay Assembly", date: "Mar 15", time: "2:00 PM", color: "#3b82f6" },
    { title: "SK Council Meeting", date: "Mar 18", time: "9:00 AM", color: "#8b5cf6" },
    { title: "Blood Donation Drive", date: "Mar 22", time: "8:00 AM", color: "#ef4444" },
    { title: "DRRM Training", date: "Mar 25", time: "1:00 PM", color: "#f59e0b" },
  ];

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const docTrend = [12, 18, 15, 22, 28, 19, 24];

  const quickActions = [
    { label: "New Resident", icon: UserPlus, color: "#3b82f6", href: "/dashboard/residents" },
    { label: "Issue Document", icon: FileText, color: "#8b5cf6", href: "/dashboard/documents" },
    { label: "File Blotter", icon: Gavel, color: "#f97316", href: "/dashboard/judicial/blotter" },
    { label: "Record Payment", icon: Receipt, color: "#22c55e", href: "/dashboard/finance" },
    { label: "Send SMS", icon: MessageSquare, color: "#8b5cf6", href: "#" },
    { label: "Mabini AI", icon: Bot, color: "#f59e0b", href: "/dashboard/ai" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader title="Dashboard" description="Barangay management overview and quick actions" />

      {/* Mabini AI Insights */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl glass-subtle" style={{ borderColor: "color-mix(in srgb, var(--accent-primary) 20%, transparent)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--accent-primary)", opacity: 0.15 }}>
          <Bot className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Mabini AI Daily Briefing</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            3 document requests pending over 24 hours. 12 new residents this month (8% above average). 1 failed login attempt detected from unknown IP. 2 business permits expiring within 30 days.
          </p>
        </div>
        <button onClick={() => router.push("/dashboard/ai")} className="shrink-0 px-3 py-1.5 text-[10px] font-semibold rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--accent-primary)", color: "#fff" }}>
          Ask Mabini
        </button>
      </div>

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
            <CreditCard icon={MessageSquare} label="SMS Credits" amount={credits ? formatPeso(credits.credits.sms.balance) : "₱0.00"} color="#8b5cf6" trend={[0]} />
            <CreditCard icon={Map} label="Map Credits" amount={credits ? formatPeso(credits.credits.map.balance) : "₱0.00"} color="#3b82f6" trend={[0]} />
            <CreditCard icon={Bot} label="AI Credits" amount={credits ? formatPeso(credits.credits.ai.balance) : "₱0.00"} color="#f59e0b" trend={[0]} />
            <CreditCard icon={Phone} label="Call Credits" amount={credits ? formatPeso(credits.credits.call.balance) : "₱0.00"} color="#22c55e" trend={[0]} />
          </>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <DashStatCard label="Total Residents" value={1247} trend="↑ 12 this month" trendUp icon={Users} borderColor="#3b82f6" iconBg="#3b82f6" />
        <DashStatCard label="Households" value={389} trend="↑ 3 this month" trendUp icon={Home} borderColor="#f59e0b" iconBg="#f59e0b" />
        <DashStatCard label="Documents Issued" value={860} trend="↑ 24 this month" trendUp icon={FileCheck2} borderColor="#8b5cf6" iconBg="#8b5cf6" />
        <DashStatCard label="Active Blotters" value={3} trend="↓ 1 resolved" trendUp={false} icon={AlertTriangle} borderColor="#ef4444" iconBg="#ef4444" />
      </div>

      {/* Row 3: Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Widget className="lg:col-span-2">
          <WidgetHeader title="Document Generation" icon={TrendingUp} action="View Report" actionHref="/dashboard/reports" />
          <div className="px-5 pb-4">
            <div className="flex items-end gap-2 mb-4">
              <span className="text-3xl font-bold text-foreground">138</span>
              <span className="text-sm text-emerald-500 font-medium pb-1">+12.5%</span>
              <span className="text-xs text-muted-foreground pb-1">this week</span>
            </div>
            <div className="flex items-end justify-between gap-3 h-[120px]">
              {docTrend.map((v, i) => {
                const maxV = Math.max(...docTrend);
                const h = (v / maxV) * 100;
                return (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1">
                    <span className="text-[10px] font-semibold text-muted-foreground">{v}</span>
                    <div className="w-full relative rounded-t-md overflow-hidden" style={{ height: `${h}px` }}>
                      <div className="absolute inset-0 rounded-t-md" style={{ background: `linear-gradient(to top, #3b82f6, #60a5fa)` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">{weekDays[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Widget>

        <Widget>
          <WidgetHeader title="Quick Actions" icon={Zap} />
          <div className="px-5 pb-4 grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <button key={action.label}
                onClick={() => router.push(action.href)}
                className="flex items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors text-left border border-transparent hover:border-border"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${action.color}12` }}>
                  <action.icon className="w-4 h-4" style={{ color: action.color }} />
                </div>
                <span className="text-xs font-medium text-foreground">{action.label}</span>
              </button>
            ))}
          </div>
        </Widget>
      </div>

      {/* Row 4: Recent Activity + Pending */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Widget className="lg:col-span-2">
          <WidgetHeader title="Recent Activity" icon={Activity} action="View All" actionHref="/dashboard/reports" />
          <div className="px-5 pb-1">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
              <span>Resident</span>
              <span className="w-32">Document</span>
              <span className="w-20">Status</span>
              <span className="w-20 text-right">Time</span>
            </div>
          </div>
          <div className="divide-y divide-border">
            {activities.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center px-5 py-2.5 hover:bg-muted/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                    {row.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{row.name}</p>
                    <p className="text-[10px] text-muted-foreground">{row.residentId}</p>
                  </div>
                </div>
                <span className="w-32 px-2 py-0.5 rounded text-[10px] font-medium text-center"
                  style={{ background: `${row.documentColor}15`, color: row.documentColor }}>
                  {row.document}
                </span>
                <span className="w-20 flex items-center gap-1.5 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: row.statusColor }} />
                  <span style={{ color: row.statusColor }}>{row.status}</span>
                </span>
                <span className="w-20 text-[10px] text-muted-foreground text-right">{row.time}</span>
              </div>
            ))}
          </div>
        </Widget>

        <Widget>
          <WidgetHeader title="Pending Requests" icon={Clock} badge={pendingRequests.length} action="View All" actionHref="/dashboard/requests" />
          <div className="divide-y divide-border">
            {pendingRequests.map((req, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: req.urgency }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{req.name}</p>
                  <p className="text-[10px] text-muted-foreground">{req.document} · {req.time}</p>
                </div>
                <button
                  onClick={() => router.push("/dashboard/requests")}
                  className="px-2.5 py-1 text-[10px] font-medium rounded border border-border hover:bg-muted transition-colors shrink-0"
                >
                  Process
                </button>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-border">
            <button onClick={() => router.push("/dashboard/requests")}
              className="w-full text-center text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
              View all requests
            </button>
          </div>
        </Widget>
      </div>

      {/* Row 5: Recent Residents + Events + Sign-in Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Widget>
          <WidgetHeader title="Recent Residents" icon={UserPlus} badge={"+4"} action="View All" actionHref="/dashboard/residents" />
          <div className="divide-y divide-border">
            {recentResidents.map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-2.5 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => router.push("/dashboard/residents")}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  {r.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                  <p className="text-[10px] text-muted-foreground">{r.age}yo, {r.gender} | {r.purok}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{r.time}</span>
              </div>
            ))}
          </div>
        </Widget>

        <Widget>
          <WidgetHeader title="Upcoming Events" icon={Calendar} badge={upcomingEvents.length} />
          <div className="px-5 pb-4 space-y-2">
            {upcomingEvents.map((evt, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0" style={{ background: `${evt.color}12` }}>
                  <span className="text-[10px] font-bold" style={{ color: evt.color }}>{evt.date.split(" ")[0]}</span>
                  <span className="text-sm font-bold" style={{ color: evt.color }}>{evt.date.split(" ")[1]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{evt.title}</p>
                  <p className="text-[11px] text-muted-foreground">{evt.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Widget>

        <Widget>
          <WidgetHeader title="Sign-in Monitor" icon={Eye} badge="Live" />
          <div className="divide-y divide-border">
            {signInLogs.map((log, i) => {
              const DevIcon = log.deviceIcon;
              return (
                <div key={i} className="flex items-start gap-2.5 px-5 py-2.5 hover:bg-muted/30 transition-colors">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${log.actionColor}15` }}>
                    <DevIcon className="w-3.5 h-3.5" style={{ color: log.actionColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium text-foreground truncate">{log.user}</p>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: `${log.actionColor}15`, color: log.actionColor }}>
                        {log.action}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{log.device} · {log.browser}</p>
                  </div>
                  <span className="text-[9px] text-muted-foreground shrink-0 mt-1">{log.time}</span>
                </div>
              );
            })}
          </div>
        </Widget>
      </div>

      {/* Row 6: Platform Updates (What's New) */}
      <Widget>
        <WidgetHeader title="What's New" icon={Sparkles} badge={platformUpdates.length || undefined} action="View All" actionHref="/dashboard/updates" />
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
            <p className="text-xs text-muted-foreground">Wala pang updates. Check back soon.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {platformUpdates.map((u) => {
              const cfg = UPDATE_TYPE_CFG[u.type] || UPDATE_TYPE_CFG.maintenance;
              const TypeIcon = cfg.icon;
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
                        {cfg.label}
                      </span>
                      {u.version && (
                        <span className="text-[9px] font-mono text-muted-foreground">{u.version}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{u.description}</p>
                  </div>
                  <span className="text-[9px] text-muted-foreground shrink-0 mt-1 whitespace-nowrap">{timeAgo(u.published_at)}</span>
                </div>
              );
            })}
          </div>
        )}
      </Widget>
    </div>
  );
}
