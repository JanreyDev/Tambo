"use client";

import { useState } from "react";
import {
  Users,
  FileText,
  Home,
  AlertTriangle,
  ArrowRight,
  MessageSquare,
  FileCheck2,
  Bot,
  Phone,
  UserPlus,
  Gavel,
  Receipt,
  Rocket,
  Database,
  LogIn,
  LayoutDashboard,
  PanelLeft,
  Palette,
  Flag,
  Bell,
  ShieldCheck,
  Link2,
  MapPin,
  Calendar,
  HardDrive,
  Send,
  Mic,
  TrendingUp,
  Activity,
  Clock,
  Monitor,
  Smartphone,
  Globe,
  ChevronRight,
  Wifi,
  Server,
  Zap,
  Eye,
  Download,
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

function BarChartWidget({ data, labels, color }: { data: number[]; labels: string[]; color: string }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-1.5 h-[100px]">
      {data.map((v, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div
            className="w-full rounded-t-sm min-h-[4px] transition-all duration-500"
            style={{
              height: `${(v / max) * 80}px`,
              background: `linear-gradient(to top, ${color}, ${color}90)`,
              opacity: 0.7 + (v / max) * 0.3,
            }}
          />
          <span className="text-[9px] text-muted-foreground">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ value, max, color, size = 80 }: { value: number; max: number; color: string; size?: number }) {
  const pct = (value / max) * 100;
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/50" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={c} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-1000"
      />
    </svg>
  );
}

// ── Widget Card Shell ─────────────────────────────────────────────

function Widget({ children, className = "", glow }: { children: React.ReactNode; className?: string; glow?: string }) {
  return (
    <div className={`relative bg-card border border-border rounded-xl overflow-hidden ${className}`}>
      {glow && (
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ background: `radial-gradient(ellipse at top right, ${glow}, transparent 70%)` }}
        />
      )}
      {children}
    </div>
  );
}

function WidgetHeader({ title, badge, action, icon: Icon }: { title: string; badge?: string | number; action?: string; icon?: React.ElementType }) {
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

// ── Credit Card ───────────────────────────────────────────────────

function CreditCard({ icon: Icon, label, amount, color, trend }: {
  icon: React.ElementType; label: string; amount: string; color: string; trend: number[];
}) {
  return (
    <div className="relative flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 overflow-hidden group hover:border-blue-500/30 transition-colors">
      <div className="absolute top-0 right-0 opacity-[0.03] pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${color}, transparent 60%)`, width: "100px", height: "100px" }}
      />
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

function StatCard({ label, value, trend, trendUp, icon: Icon, borderColor, iconBg }: {
  label: string; value: string | number; trend: string; trendUp: boolean;
  icon: React.ElementType; borderColor: string; iconBg: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 relative overflow-hidden group hover:shadow-lg hover:shadow-black/5 transition-all"
      style={{ borderLeftWidth: "3px", borderLeftColor: borderColor }}
    >
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-[0.04]" style={{ background: iconBg }} />
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

// ── Activity Row ──────────────────────────────────────────────────

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

// ── Main Dashboard ────────────────────────────────────────────────

export default function DashboardPage() {
  const [aiMessage, setAiMessage] = useState("");

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

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
    { user: "Juan Dela Cruz", action: "Login", device: "macOS", deviceIcon: Monitor, browser: "Safari 18", ip: "175.176.xx.xx", time: "2 hrs ago", actionColor: "#22c55e" },
  ];

  const recentResidents: RecentResident[] = [
    { initials: "MM", name: "Resurreccion, Malvin M.", age: 28, gender: "M", purok: "Purok 3", time: "Today" },
    { initials: "AS", name: "Santos, Ana Marie", age: 34, gender: "F", purok: "Purok 1", time: "Today" },
    { initials: "JD", name: "Cruz, Juan Dela", age: 45, gender: "M", purok: "Purok 7", time: "Yesterday" },
    { initials: "MC", name: "Chavez, Mark L.", age: 22, gender: "M", purok: "Purok 2", time: "Yesterday" },
    { initials: "RG", name: "Garcia, Rosa P.", age: 67, gender: "F", purok: "Purok 5", time: "2 days ago" },
  ];

  const upcomingEvents = [
    { title: "Barangay Assembly", date: "Mar 15", time: "2:00 PM", color: "#3b82f6" },
    { title: "SK Council Meeting", date: "Mar 18", time: "9:00 AM", color: "#8b5cf6" },
    { title: "Blood Donation Drive", date: "Mar 22", time: "8:00 AM", color: "#ef4444" },
    { title: "DRRM Training", date: "Mar 25", time: "1:00 PM", color: "#f59e0b" },
  ];

  const documentStats = [
    { label: "Clearance", count: 342, color: "#3b82f6" },
    { label: "Residency", count: 218, color: "#8b5cf6" },
    { label: "Indigency", count: 156, color: "#22c55e" },
    { label: "Bus. Permit", count: 89, color: "#f59e0b" },
    { label: "Blotter", count: 43, color: "#ef4444" },
    { label: "Others", count: 12, color: "#64748b" },
  ];

  const platformUpdates = [
    { icon: "Link2", title: "Blockchain Verification Layer", description: "First blockchain-integrated barangay system. Document hashes stored on-chain for tamper-proof verification via QR code.", type: "Feature", typeColor: "#3b82f6", version: "v5.0.0-alpha.2", time: "Today", author: "Claude" },
    { icon: "ShieldCheck", title: "Sign-in Monitor", description: "All login/logout events logged with device info, IP, browser, and OS for security monitoring.", type: "Feature", typeColor: "#3b82f6", version: "v5.0.0-alpha.2", time: "Today", author: "Claude" },
    { icon: "Flag", title: "Resident Flag System", description: "Grey flag: cross-barangay detection. Red flag: midnight auto-match against active cases.", type: "Feature", typeColor: "#3b82f6", version: "v5.0.0-alpha.2", time: "Today", author: "Claude" },
    { icon: "Palette", title: "Light & Dark Mode + Accent Colors", description: "Full theme system with 8 accent colors. Saved per user.", type: "Feature", typeColor: "#3b82f6", version: "v5.0.0-alpha.2", time: "Today", author: "Claude" },
    { icon: "Rocket", title: "V5 Platform Initialized", description: "Laravel 12 + Next.js 16. Multi-tenant PostgreSQL with RLS.", type: "Feature", typeColor: "#3b82f6", version: "v5.0.0-alpha.1", time: "Yesterday", author: "Claude" },
  ];

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const docTrend = [12, 18, 15, 22, 28, 19, 24]; // docs generated per day

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Live</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 bg-red-500 text-white text-[10px] font-bold rounded uppercase tracking-wider">V5 Mockup</div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Credits Bar */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <CreditCard icon={MessageSquare} label="SMS Credits" amount="₱700.00" color="#8b5cf6" trend={[650, 680, 720, 700, 690, 710, 700]} />
        <CreditCard icon={FileText} label="Document Credits" amount="₱678.00" color="#3b82f6" trend={[750, 730, 710, 695, 688, 682, 678]} />
        <CreditCard icon={Bot} label="AI Credits" amount="₱691.68" color="#f59e0b" trend={[700, 698, 696, 695, 694, 693, 691]} />
        <CreditCard icon={Phone} label="Call Credits" amount="₱700.00" color="#22c55e" trend={[700, 700, 700, 700, 700, 700, 700]} />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Total Residents" value={1247} trend="↑ 12 this month" trendUp icon={Users} borderColor="#3b82f6" iconBg="#3b82f6" />
        <StatCard label="Households" value={389} trend="↑ 3 this month" trendUp icon={Home} borderColor="#f59e0b" iconBg="#f59e0b" />
        <StatCard label="Documents Issued" value={860} trend="↑ 24 this month" trendUp icon={FileCheck2} borderColor="#8b5cf6" iconBg="#8b5cf6" />
        <StatCard label="Active Blotters" value={3} trend="↓ 1 resolved" trendUp={false} icon={AlertTriangle} borderColor="#ef4444" iconBg="#ef4444" />
      </div>

      {/* Row 3: Charts + Document Stats + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Document Generation Trend */}
        <Widget className="lg:col-span-2" glow="#3b82f6">
          <WidgetHeader title="Document Generation Trend" icon={TrendingUp} action="View Report" />
          <div className="px-5 pb-4">
            <div className="flex items-end gap-2 mb-3">
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
                      <div className="absolute inset-0 rounded-t-md bg-white/10" />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">{weekDays[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Widget>

        {/* Calendar + Upcoming Events */}
        <Widget glow="#8b5cf6">
          <WidgetHeader title="Upcoming Events" icon={Calendar} badge={upcomingEvents.length} action="View All" />
          <div className="px-5 pb-4 space-y-2.5">
            {upcomingEvents.map((evt, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer">
                <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0"
                  style={{ background: `${evt.color}12` }}
                >
                  <span className="text-[10px] font-bold" style={{ color: evt.color }}>{evt.date.split(" ")[0]}</span>
                  <span className="text-sm font-bold" style={{ color: evt.color }}>{evt.date.split(" ")[1]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{evt.title}</p>
                  <p className="text-[11px] text-muted-foreground">{evt.time}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </Widget>
      </div>

      {/* Row 4: Map Preview + Recent Residents + Document Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map Preview */}
        <Widget glow="#22c55e">
          <WidgetHeader title="Barangay Map" icon={MapPin} action="Open Map" />
          <div className="px-5 pb-4">
            <div className="relative w-full h-[180px] rounded-lg overflow-hidden bg-muted/50 border border-border">
              {/* Grid pattern */}
              <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="mapgrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#mapgrid)" />
              </svg>
              {/* Simulated map dots (puroks) */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-[140px] h-[120px]">
                  {[
                    { x: 20, y: 30, label: "P1", color: "#3b82f6" },
                    { x: 70, y: 15, label: "P2", color: "#22c55e" },
                    { x: 110, y: 40, label: "P3", color: "#f59e0b" },
                    { x: 40, y: 70, label: "P5", color: "#8b5cf6" },
                    { x: 90, y: 80, label: "P7", color: "#ef4444" },
                    { x: 60, y: 50, label: "P4", color: "#06b6d4" },
                    { x: 105, y: 95, label: "P6", color: "#ec4899" },
                  ].map((p, i) => (
                    <div key={i} className="absolute flex flex-col items-center" style={{ left: p.x, top: p.y }}>
                      <div className="w-3 h-3 rounded-full animate-pulse shadow-lg" style={{ background: p.color, boxShadow: `0 0 8px ${p.color}60` }} />
                      <span className="text-[8px] font-bold mt-0.5" style={{ color: p.color }}>{p.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Bottom bar */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-card/90 to-transparent px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-muted-foreground">7 Puroks | 389 Households</span>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                    <Wifi className="w-3 h-3" /> Online
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Widget>

        {/* Recent Residents */}
        <Widget glow="#3b82f6">
          <WidgetHeader title="Recent Residents" icon={UserPlus} badge={"+5"} action="View All" />
          <div className="divide-y divide-border">
            {recentResidents.map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-2.5 hover:bg-muted/30 transition-colors">
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

        {/* Document Statistics */}
        <Widget glow="#8b5cf6">
          <WidgetHeader title="Document Statistics" icon={FileText} action="Details" />
          <div className="px-5 pb-4">
            <div className="text-center mb-3">
              <span className="text-3xl font-bold text-foreground">860</span>
              <span className="text-sm text-muted-foreground ml-1">total issued</span>
            </div>
            <div className="space-y-2">
              {documentStats.map((doc) => {
                const pct = (doc.count / 860) * 100;
                return (
                  <div key={doc.label} className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground w-20 shrink-0 text-right">{doc.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: doc.color }} />
                    </div>
                    <span className="text-[11px] font-semibold text-foreground w-8">{doc.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Widget>
      </div>

      {/* Row 5: Weather + Traffic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weather — Windy.tv */}
        <Widget glow="#06b6d4">
          <WidgetHeader title="Weather Forecast" icon={Globe} action="Full View" />
          <div className="px-5 pb-4">
            <div className="relative w-full h-[220px] rounded-lg overflow-hidden border border-border">
              <iframe
                src="https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=default&metricTemp=default&metricWind=default&zoom=11&overlay=wind&product=ecmwf&level=surface&lat=14.4793&lon=121.0198&message=true"
                className="w-full h-full border-0"
                loading="lazy"
                title="Weather - Windy"
              />
            </div>
          </div>
        </Widget>

        {/* Traffic — Google Maps */}
        <Widget glow="#f59e0b">
          <WidgetHeader title="Traffic Overview" icon={MapPin} action="Full View" />
          <div className="px-5 pb-4">
            <div className="relative w-full h-[220px] rounded-lg overflow-hidden border border-border">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15450.2!2d121.0198!3d14.4793!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397d1a9c5e25c5d%3A0x1234567890abcdef!2sTambo%2C%20Para%C3%B1aque%2C%20Metro%20Manila!5e0!3m2!1sen!2sph!4v1709800000000!5m2!1sen!2sph&layer=traffic"
                className="w-full h-full border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                title="Traffic - Google Maps"
              />
            </div>
          </div>
        </Widget>
      </div>

      {/* Row 6: AI Chat + SMS Widget + Server Capacity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* AI Chat Widget */}
        <Widget glow="#f59e0b">
          <WidgetHeader title="AI Assistant" icon={Bot} />
          <div className="px-5 pb-4">
            <div className="space-y-2.5 mb-3 h-[130px] overflow-y-auto">
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="bg-muted rounded-lg rounded-tl-none px-3 py-2 text-xs text-foreground max-w-[85%]">
                  Good morning, Kapitan! How can I assist you today? I can help with resident queries, document generation, or data analysis.
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <div className="bg-blue-600 rounded-lg rounded-tr-none px-3 py-2 text-xs text-white max-w-[85%]">
                  How many residents registered this month?
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="bg-muted rounded-lg rounded-tl-none px-3 py-2 text-xs text-foreground max-w-[85%]">
                  <strong>12 new residents</strong> were registered this month. That&apos;s a 15% increase from last month&apos;s 10 registrations. Purok 3 has the most new registrations (4).
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                placeholder="Ask anything..."
                className="flex-1 px-3 py-2 rounded-lg border border-input-border bg-input-bg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent-ring"
              />
              <button className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </Widget>

        {/* SMS Widget */}
        <Widget glow="#8b5cf6">
          <WidgetHeader title="SMS Messaging" icon={MessageSquare} action="View All" />
          <div className="px-5 pb-4">
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: "Sent Today", value: "48", color: "#22c55e" },
                { label: "Pending", value: "5", color: "#f59e0b" },
                { label: "Failed", value: "2", color: "#ef4444" },
              ].map((s) => (
                <div key={s.label} className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[9px] text-muted-foreground font-medium">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2 mb-3">
              {[
                { to: "Purok 3 Leaders", msg: "Assembly reminder for March 15...", time: "10:30 AM", status: "Sent" },
                { to: "All Residents", msg: "Water interruption notice...", time: "9:15 AM", status: "Sent" },
                { to: "SK Officers", msg: "Meeting rescheduled to...", time: "8:00 AM", status: "Pending" },
              ].map((sms, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <MessageSquare className="w-3.5 h-3.5 text-violet-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-foreground truncate">{sms.to}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{sms.msg}</p>
                  </div>
                  <span className="text-[9px] text-muted-foreground shrink-0">{sms.time}</span>
                </div>
              ))}
            </div>
            <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors">
              <Send className="w-3 h-3" /> Send SMS Blast
            </button>
          </div>
        </Widget>

        {/* Server Capacity + Call Widget */}
        <div className="space-y-4">
          {/* Server Capacity */}
          <Widget glow="#06b6d4">
            <WidgetHeader title="Storage Usage" icon={Server} />
            <div className="px-5 pb-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <DonutChart value={2.4} max={5} color="#06b6d4" size={70} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-bold text-foreground">2.4</span>
                    <span className="text-[8px] text-muted-foreground font-medium">GB</span>
                  </div>
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Documents</span>
                    <span className="font-medium text-foreground">1.2 GB</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Photos</span>
                    <span className="font-medium text-foreground">0.8 GB</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">System</span>
                    <span className="font-medium text-foreground">0.4 GB</span>
                  </div>
                  <div className="h-px bg-border my-1" />
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Available</span>
                    <span className="font-semibold text-emerald-500">2.6 GB</span>
                  </div>
                </div>
              </div>
            </div>
          </Widget>

          {/* Calling Widget */}
          <Widget glow="#22c55e">
            <WidgetHeader title="Call System" icon={Phone} />
            <div className="px-5 pb-4">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-lg font-bold text-emerald-500">12</p>
                  <p className="text-[9px] text-muted-foreground font-medium">Today</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-lg font-bold text-foreground">1:24</p>
                  <p className="text-[9px] text-muted-foreground font-medium">Avg Duration</p>
                </div>
              </div>
              <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                <Phone className="w-3 h-3" /> Make a Call
              </button>
            </div>
          </Widget>
        </div>
      </div>

      {/* Row 6: Activity Table + Sign-in Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity — 2 cols */}
        <Widget className="lg:col-span-2" glow="#3b82f6">
          <WidgetHeader title="Recent Activity" icon={Activity} action="View All" />
          <div className="px-5 pb-2">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
              <span>Resident</span>
              <span className="w-32">Document</span>
              <span className="w-24">Status</span>
              <span className="w-20 text-right">Time</span>
            </div>
          </div>
          <div className="divide-y divide-border">
            {activities.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center px-5 py-2.5 hover:bg-muted/30 transition-colors">
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
                  style={{ background: `${row.documentColor}15`, color: row.documentColor }}
                >
                  {row.document}
                </span>
                <span className="w-24 flex items-center gap-1.5 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: row.statusColor }} />
                  <span style={{ color: row.statusColor }}>{row.status}</span>
                </span>
                <span className="w-20 text-[10px] text-muted-foreground text-right">{row.time}</span>
              </div>
            ))}
          </div>
        </Widget>

        {/* Sign-in Monitor */}
        <Widget glow="#22c55e">
          <WidgetHeader title="Sign-in Monitor" icon={Eye} badge="Live" action="View All" />
          <div className="divide-y divide-border">
            {signInLogs.map((log, i) => {
              const DevIcon = log.deviceIcon;
              return (
                <div key={i} className="flex items-start gap-2.5 px-5 py-2.5 hover:bg-muted/30 transition-colors">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${log.actionColor}15` }}
                  >
                    <DevIcon className="w-3.5 h-3.5" style={{ color: log.actionColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium text-foreground truncate">{log.user}</p>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                        style={{ background: `${log.actionColor}15`, color: log.actionColor }}
                      >
                        {log.action}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {log.device} · {log.browser} · {log.ip}
                    </p>
                  </div>
                  <span className="text-[9px] text-muted-foreground shrink-0 mt-1">{log.time}</span>
                </div>
              );
            })}
          </div>
        </Widget>
      </div>

      {/* Row 7: Pending + Quick Actions + Platform Updates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pending Requests */}
        <Widget>
          <WidgetHeader title="Pending Requests" icon={Clock} badge={pendingRequests.length} action="View All" />
          <div className="divide-y divide-border">
            {pendingRequests.map((req, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-2.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: req.urgency }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{req.name}</p>
                  <p className="text-[10px] text-muted-foreground">{req.document} · {req.time}</p>
                </div>
                <button className="px-2.5 py-1 text-[10px] font-medium rounded border border-border hover:bg-muted transition-colors shrink-0">Process</button>
              </div>
            ))}
          </div>
        </Widget>

        {/* Quick Actions */}
        <Widget>
          <WidgetHeader title="Quick Actions" icon={Zap} />
          <div className="px-5 pb-4 grid grid-cols-2 gap-2">
            {[
              { label: "New Resident", icon: UserPlus, color: "#3b82f6" },
              { label: "Issue Document", icon: FileText, color: "#8b5cf6" },
              { label: "File Blotter", icon: Gavel, color: "#f97316" },
              { label: "Record Payment", icon: Receipt, color: "#22c55e" },
              { label: "Send SMS", icon: MessageSquare, color: "#8b5cf6" },
              { label: "AI Query", icon: Bot, color: "#f59e0b" },
            ].map((action) => (
              <button key={action.label}
                className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-muted transition-colors group text-left border border-transparent hover:border-border"
              >
                <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: `${action.color}12` }}
                >
                  <action.icon className="w-3.5 h-3.5" style={{ color: action.color }} />
                </div>
                <span className="text-[11px] font-medium text-foreground">{action.label}</span>
              </button>
            ))}
          </div>
        </Widget>

        {/* Mini Platform Updates */}
        <Widget>
          <WidgetHeader title="Platform Updates" icon={Bell} badge={platformUpdates.length} action="View All" />
          <div className="divide-y divide-border">
            {platformUpdates.slice(0, 4).map((update, i) => {
              const IconComp = updateIcons[update.icon] || Bell;
              return (
                <div key={i} className="flex items-start gap-2.5 px-5 py-2.5 hover:bg-muted/30 transition-colors">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${update.typeColor}15` }}
                  >
                    <IconComp className="w-3.5 h-3.5" style={{ color: update.typeColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{update.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{update.version} · {update.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Widget>
      </div>
    </div>
  );
}

// Icon map for platform updates
const updateIcons: Record<string, React.ElementType> = {
  Rocket, Database, LogIn, LayoutDashboard, PanelLeft, Palette, Flag, Bell, ShieldCheck, Link2,
};
