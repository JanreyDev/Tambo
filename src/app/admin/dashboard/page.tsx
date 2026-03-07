"use client";

import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Server,
  ChevronRight,
  Bell,
  Zap,
  MapPin,
  FileText,
} from "lucide-react";

// ── Charts ────────────────────────────────────────────────────────

function DonutChart({ value, max, color, size = 70 }: { value: number; max: number; color: string; size?: number }) {
  const pct = (value / max) * 100;
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-muted/50" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

// ── Widget Card ─────────────────────────────────────────────────

function Widget({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card border border-border rounded-xl overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function WidgetHeader({ title, icon: Icon, badge, action }: { title: string; icon?: React.ElementType; badge?: string | number; action?: string }) {
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
        <button className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
          {action} <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────

function StatCard({ label, value, trend, trendUp, icon: Icon, color, subtext }: {
  label: string; value: string | number; trend: string; trendUp: boolean;
  icon: React.ElementType; color: string; subtext?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden group hover:shadow-lg hover:shadow-black/5 transition-all">
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-[0.05]" style={{ background: color }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{typeof value === "number" ? value.toLocaleString() : value}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            {trendUp ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
            )}
            <span className={`text-[11px] font-medium ${trendUp ? "text-emerald-500" : "text-red-400"}`}>{trend}</span>
          </div>
          {subtext && <p className="text-[10px] text-muted-foreground mt-0.5">{subtext}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}12` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const tenantActivity = [
    { name: "Brgy. Tambo", location: "Paranaque, NCR", status: "Active", users: 8, docs: 342, lastActive: "2 min ago", statusColor: "#22c55e" },
    { name: "Brgy. San Jose", location: "Olongapo, Zambales", status: "Active", users: 5, docs: 218, lastActive: "15 min ago", statusColor: "#22c55e" },
    { name: "Brgy. Mabayuan", location: "Olongapo, Zambales", status: "Active", users: 4, docs: 156, lastActive: "1 hr ago", statusColor: "#22c55e" },
    { name: "Brgy. Kalaklan", location: "Olongapo, Zambales", status: "Trial", users: 2, docs: 23, lastActive: "3 hrs ago", statusColor: "#f59e0b" },
    { name: "Brgy. Pag-asa", location: "Olongapo, Zambales", status: "Expired", users: 0, docs: 89, lastActive: "2 weeks ago", statusColor: "#ef4444" },
  ];

  const recentTickets = [
    { id: "TKT-001", subject: "Cannot generate barangay clearance", barangay: "Brgy. Tambo", priority: "High", status: "Open", time: "30 min ago", priorityColor: "#ef4444" },
    { id: "TKT-002", subject: "Request for additional user accounts", barangay: "Brgy. San Jose", priority: "Medium", status: "In Progress", time: "2 hrs ago", priorityColor: "#f59e0b" },
    { id: "TKT-003", subject: "SMS credits running low", barangay: "Brgy. Mabayuan", priority: "Low", status: "Open", time: "5 hrs ago", priorityColor: "#3b82f6" },
  ];

  const platformUpdates = [
    { title: "Barangay Frontend Polish", type: "Update", version: "v5.0.0-alpha.3", time: "Just now", author: "Claude", typeColor: "#8b5cf6" },
    { title: "Blockchain Verification Layer", type: "Feature", version: "v5.0.0-alpha.2", time: "Today", author: "Claude", typeColor: "#3b82f6" },
    { title: "Sign-in Monitor", type: "Feature", version: "v5.0.0-alpha.2", time: "Today", author: "Claude", typeColor: "#3b82f6" },
    { title: "Resident Flag System", type: "Feature", version: "v5.0.0-alpha.2", time: "Today", author: "Claude", typeColor: "#3b82f6" },
    { title: "22 Module Pages Scaffold", type: "Milestone", version: "v5.0.0-alpha.1", time: "Yesterday", author: "Claude", typeColor: "#22c55e" },
    { title: "V5 Platform Initialized", type: "Milestone", version: "v5.0.0-alpha.1", time: "Yesterday", author: "Claude", typeColor: "#22c55e" },
  ];

  const monthlyRevenue = [65, 72, 78, 85, 89, 95, 102];
  const monthLabels = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

  const serverMetrics = [
    { label: "CPU", value: 13, max: 100, color: "#3b82f6", unit: "%" },
    { label: "RAM", value: 85, max: 100, color: "#f59e0b", unit: "%" },
    { label: "Disk", value: 42, max: 100, color: "#22c55e", unit: "%" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">All Systems Online</span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Total Barangays" value={52} trend="+3 this month" trendUp icon={Building2} color="#3b82f6" subtext="48 active, 3 trial, 1 expired" />
        <StatCard label="Total Users" value={247} trend="+18 this month" trendUp icon={Users} color="#8b5cf6" subtext="Across all tenants" />
        <StatCard label="Monthly Revenue" value="P102K" trend="+7.4% vs last month" trendUp icon={CreditCard} color="#22c55e" subtext="P1.02M annualized" />
        <StatCard label="Documents Issued" value="12.4K" trend="+892 this month" trendUp icon={FileText} color="#f59e0b" subtext="Across all barangays" />
      </div>

      {/* Row 2: Revenue Trend + Server Status + Region Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Trend */}
        <Widget className="lg:col-span-2">
          <WidgetHeader title="Revenue Trend" icon={TrendingUp} action="View Report" />
          <div className="px-5 pb-4">
            <div className="flex items-end gap-2 mb-4">
              <span className="text-3xl font-bold text-foreground">P102,000</span>
              <span className="text-sm text-emerald-500 font-medium pb-1">+7.4%</span>
            </div>
            <div className="flex items-end justify-between gap-4 h-[140px]">
              {monthlyRevenue.map((v, i) => {
                const maxV = Math.max(...monthlyRevenue);
                const h = (v / maxV) * 120;
                const isLast = i === monthlyRevenue.length - 1;
                return (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1">
                    <span className="text-[10px] font-semibold text-muted-foreground">P{v}K</span>
                    <div className="w-full relative rounded-t-md overflow-hidden" style={{ height: `${h}px` }}>
                      <div
                        className="absolute inset-0 rounded-t-md"
                        style={{
                          background: isLast
                            ? "linear-gradient(to top, #2563eb, #60a5fa)"
                            : "linear-gradient(to top, #64748b40, #94a3b840)"
                        }}
                      />
                    </div>
                    <span className={`text-[10px] font-medium ${isLast ? "text-blue-600 font-bold" : "text-muted-foreground"}`}>{monthLabels[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Widget>

        {/* Server Health */}
        <Widget>
          <WidgetHeader title="Server Health" icon={Server} />
          <div className="px-5 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-foreground">PrimeXV4 (Production)</span>
              </div>
              <span className="text-[10px] text-muted-foreground">128.199.172.45</span>
            </div>
            <div className="space-y-4">
              {serverMetrics.map((m) => (
                <div key={m.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">{m.label}</span>
                    <span className="text-xs font-semibold text-foreground">{m.value}{m.unit}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${m.value}%`,
                        background: m.value > 80 ? "#ef4444" : m.value > 60 ? "#f59e0b" : m.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-sm font-bold text-foreground">99.97%</p>
                  <p className="text-[9px] text-muted-foreground font-medium">Uptime (30d)</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-sm font-bold text-foreground">42ms</p>
                  <p className="text-[9px] text-muted-foreground font-medium">Avg Response</p>
                </div>
              </div>
            </div>
          </div>
        </Widget>
      </div>

      {/* Row 3: Tenant Activity + Platform Updates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Tenants */}
        <Widget className="lg:col-span-2">
          <WidgetHeader title="Barangay Tenants" icon={Building2} badge={52} action="View All" />
          <div className="px-5 pb-2">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
              <span>Barangay</span>
              <span className="w-16 text-center">Status</span>
              <span className="w-14 text-center">Users</span>
              <span className="w-14 text-center">Docs</span>
              <span className="w-24 text-right">Last Active</span>
            </div>
          </div>
          <div className="divide-y divide-border">
            {tenantActivity.map((t, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-center px-5 py-2.5 hover:bg-muted/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ background: t.status === "Active" ? "#3b82f6" : t.status === "Trial" ? "#f59e0b" : "#94a3b8" }}>
                    {t.name.split(" ")[1]?.charAt(0) || "B"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground">{t.location}</p>
                  </div>
                </div>
                <span className="w-16 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: `${t.statusColor}15`, color: t.statusColor }}>
                    {t.status}
                  </span>
                </span>
                <span className="w-14 text-center text-xs font-medium text-foreground">{t.users}</span>
                <span className="w-14 text-center text-xs font-medium text-foreground">{t.docs.toLocaleString()}</span>
                <span className="w-24 text-right text-[10px] text-muted-foreground">{t.lastActive}</span>
              </div>
            ))}
          </div>
        </Widget>

        {/* Platform Updates */}
        <Widget>
          <WidgetHeader title="Platform Updates" icon={Bell} badge={platformUpdates.length} action="View All" />
          <div className="divide-y divide-border">
            {platformUpdates.map((u, i) => (
              <div key={i} className="flex items-start gap-2.5 px-5 py-2.5 hover:bg-muted/30 transition-colors">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `${u.typeColor}15` }}>
                  <Zap className="w-3.5 h-3.5" style={{ color: u.typeColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-medium text-foreground truncate">{u.title}</p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
                      style={{ background: `${u.typeColor}15`, color: u.typeColor }}>
                      {u.type}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{u.version}</span>
                    <span className="text-[10px] text-muted-foreground">by {u.author}</span>
                  </div>
                </div>
                <span className="text-[9px] text-muted-foreground shrink-0 mt-1">{u.time}</span>
              </div>
            ))}
          </div>
        </Widget>
      </div>

      {/* Row 4: Support Tickets + Region Distribution + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Tickets */}
        <Widget className="lg:col-span-2">
          <WidgetHeader title="Recent Support Tickets" icon={Activity} badge={3} action="View All" />
          <div className="divide-y divide-border">
            {recentTickets.map((ticket, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: ticket.priorityColor }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground">{ticket.id}</span>
                    <p className="text-xs font-medium text-foreground truncate">{ticket.subject}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{ticket.barangay} | {ticket.time}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{
                    background: ticket.status === "Open" ? "#3b82f615" : "#f59e0b15",
                    color: ticket.status === "Open" ? "#3b82f6" : "#f59e0b",
                  }}>
                  {ticket.status}
                </span>
              </div>
            ))}
          </div>
        </Widget>

        {/* Region Distribution */}
        <Widget>
          <WidgetHeader title="Region Distribution" icon={MapPin} />
          <div className="px-5 pb-4">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <DonutChart value={48} max={52} color="#3b82f6" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-foreground">92%</span>
                  <span className="text-[9px] text-muted-foreground">Active</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { region: "Zambales", count: 38, pct: 73, color: "#3b82f6" },
                { region: "NCR", count: 8, pct: 15, color: "#8b5cf6" },
                { region: "Pampanga", count: 4, pct: 8, color: "#22c55e" },
                { region: "Others", count: 2, pct: 4, color: "#94a3b8" },
              ].map((r) => (
                <div key={r.region} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color }} />
                  <span className="text-[11px] text-muted-foreground flex-1">{r.region}</span>
                  <span className="text-[11px] font-semibold text-foreground">{r.count}</span>
                  <span className="text-[10px] text-muted-foreground w-8 text-right">{r.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </Widget>
      </div>
    </div>
  );
}
