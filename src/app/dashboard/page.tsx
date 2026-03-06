"use client";

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
} from "lucide-react";

// Credit card at top
function CreditCard({
  icon: Icon,
  label,
  amount,
  color,
}: {
  icon: React.ElementType;
  label: string;
  amount: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}15` }}
      >
        <Icon className="w-4.5 h-4.5" style={{ color }} />
      </div>
      <div>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-base font-bold text-foreground">{amount}</p>
      </div>
    </div>
  );
}

// Stat card with colored left border
function StatCard({
  label,
  value,
  trend,
  icon: Icon,
  borderColor,
  iconBg,
}: {
  label: string;
  value: string | number;
  trend: string;
  icon: React.ElementType;
  borderColor: string;
  iconBg: string;
}) {
  return (
    <div
      className="bg-card border border-border rounded-xl p-5 relative overflow-hidden"
      style={{ borderLeftWidth: "3px", borderLeftColor: borderColor }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{typeof value === "number" ? value.toLocaleString() : value}</p>
          <p className="text-xs text-emerald-500 mt-2">{trend}</p>
        </div>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${iconBg}15` }}
        >
          <Icon className="w-5 h-5" style={{ color: iconBg }} />
        </div>
      </div>
    </div>
  );
}

// Activity row
interface ActivityRow {
  initials: string;
  name: string;
  residentId: string;
  document: string;
  documentColor: string;
  status: string;
  statusColor: string;
  time: string;
}

// Pending request
interface PendingRequest {
  name: string;
  document: string;
  time: string;
  urgency: string;
}

export default function DashboardPage() {
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const activities: ActivityRow[] = [
    {
      initials: "MM",
      name: "Resurreccion, Malvin M.",
      residentId: "RES-1381000006-0501",
      document: "Brgy Clearance",
      documentColor: "#3b82f6",
      status: "Generated",
      statusColor: "#22c55e",
      time: "1 week ago",
    },
    {
      initials: "JD",
      name: "Cruz, Juan Dela",
      residentId: "RES-1381000006-0045",
      document: "Brgy Clearance",
      documentColor: "#3b82f6",
      status: "Generated",
      statusColor: "#22c55e",
      time: "1 week ago",
    },
    {
      initials: "JH",
      name: "Dev, Janjan H.",
      residentId: "RES-1381000006-0044",
      document: "Brgy Clearance",
      documentColor: "#3b82f6",
      status: "Generated",
      statusColor: "#22c55e",
      time: "1 week ago",
    },
    {
      initials: "GJ",
      name: "Garcia, Janrey",
      residentId: "BLO-020226-001",
      document: "Blotter Filed",
      documentColor: "#f97316",
      status: "Pending",
      statusColor: "#f59e0b",
      time: "1 month ago",
    },
  ];

  const platformUpdates = [
    {
      icon: "Link2",
      title: "Blockchain Verification Layer",
      description: "First blockchain-integrated barangay system. Document hashes stored on-chain for tamper-proof certificate verification via QR code.",
      type: "Feature",
      typeColor: "#3b82f6",
      version: "v5.0.0-alpha.2",
      time: "Today",
      author: "Claude",
    },
    {
      icon: "ShieldCheck",
      title: "Sign-in Monitor",
      description: "All login/logout events logged with device info, IP address, browser, OS, and approximate location for security monitoring.",
      type: "Feature",
      typeColor: "#3b82f6",
      version: "v5.0.0-alpha.2",
      time: "Today",
      author: "Claude",
    },
    {
      icon: "Bell",
      title: "Platform Updates Feed",
      description: "Every development change is now logged and displayed here. Users always know what's new in the system.",
      type: "Feature",
      typeColor: "#3b82f6",
      version: "v5.0.0-alpha.2",
      time: "Today",
      author: "Claude",
    },
    {
      icon: "Flag",
      title: "Resident Flag System — Grey & Red Flags",
      description: "Grey flag: cross-barangay detection count. Red flag: midnight auto-match against active cases. Tellers see warnings instantly.",
      type: "Feature",
      typeColor: "#3b82f6",
      version: "v5.0.0-alpha.2",
      time: "Today",
      author: "Claude",
    },
    {
      icon: "Palette",
      title: "Light & Dark Mode with Accent Colors",
      description: "Full theme system with 8 customizable accent colors. Settings saved per user.",
      type: "Feature",
      typeColor: "#3b82f6",
      version: "v5.0.0-alpha.2",
      time: "Today",
      author: "Claude",
    },
    {
      icon: "Database",
      title: "Full Database Schema — 19 Migration Files",
      description: "Complete schema covering all modules: residents, judicial, VAWC (encrypted), finance, inventory, tanod, disaster, GAD, HRIS, public portal, AI, and blockchain. 60+ tables.",
      type: "Feature",
      typeColor: "#3b82f6",
      version: "v5.0.0-alpha.1",
      time: "Yesterday",
      author: "Claude",
    },
    {
      icon: "Rocket",
      title: "V5 BCMP Platform Initialized",
      description: "Complete platform rebuild. Laravel 12 API + Next.js 16. Multi-tenant PostgreSQL with Row Level Security.",
      type: "Feature",
      typeColor: "#3b82f6",
      version: "v5.0.0-alpha.1",
      time: "Yesterday",
      author: "Claude",
    },
  ];

  const pendingRequests: PendingRequest[] = [
    { name: "Valderrama, Nida", document: "Barangay Clearance", time: "2 hrs ago", urgency: "#ef4444" },
    { name: "Santos, Maria C.", document: "Certificate of Residency", time: "1 day ago", urgency: "#f59e0b" },
    { name: "Reyes, Pedro A.", document: "Business Permit", time: "3 days ago", urgency: "#22c55e" },
  ];

  return (
    <div className="space-y-5">
      {/* V5 Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {dateStr} — Welcome back, Kapitan
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded">
            V5 MOCKUP — NOT LIVE
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted transition-colors">
            <BarChart className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Credits Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <CreditCard icon={MessageSquare} label="SMS Credits" amount="₱700.00" color="#8b5cf6" />
        <CreditCard icon={FileText} label="Document Credits" amount="₱678.00" color="#3b82f6" />
        <CreditCard icon={Bot} label="AI Credits" amount="₱691.68" color="#f59e0b" />
        <CreditCard icon={Phone} label="Call Credits" amount="₱700.00" color="#22c55e" />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Residents"
          value={17}
          trend="↑ 0 this month"
          icon={Users}
          borderColor="#3b82f6"
          iconBg="#3b82f6"
        />
        <StatCard
          label="Households"
          value={5}
          trend="↑ 0 this month"
          icon={Home}
          borderColor="#f59e0b"
          iconBg="#f59e0b"
        />
        <StatCard
          label="Documents Issued"
          value={860}
          trend="↑ 0 this month"
          icon={FileCheck2}
          borderColor="#8b5cf6"
          iconBg="#8b5cf6"
        />
        <StatCard
          label="Active Blotters"
          value={3}
          trend="↑ 1 this month"
          icon={AlertTriangle}
          borderColor="#ef4444"
          iconBg="#ef4444"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Activity — 2 cols */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View all →
            </button>
          </div>
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
            <span>Resident</span>
            <span className="w-32">Document</span>
            <span className="w-28">Status</span>
            <span className="w-24 text-right">Time</span>
          </div>
          {/* Table Rows */}
          <div className="divide-y divide-border">
            {activities.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold text-muted-foreground shrink-0">
                    {row.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{row.name}</p>
                    <p className="text-[11px] text-muted-foreground">{row.residentId}</p>
                  </div>
                </div>
                <span
                  className="w-32 px-2.5 py-1 rounded-md text-xs font-medium text-center"
                  style={{ background: `${row.documentColor}15`, color: row.documentColor }}
                >
                  {row.document}
                </span>
                <span className="w-28 flex items-center gap-1.5 text-xs">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: row.statusColor }}
                  />
                  <span style={{ color: row.statusColor }}>{row.status}</span>
                </span>
                <span className="w-24 text-xs text-muted-foreground text-right">{row.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Pending Requests */}
          <div className="bg-card border border-border rounded-xl">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="text-base font-semibold text-foreground">Pending Requests</h2>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                View all →
              </button>
            </div>
            <div className="divide-y divide-border">
              {pendingRequests.map((req, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: req.urgency }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{req.name}</p>
                    <p className="text-[11px] text-muted-foreground">{req.document} — {req.time}</p>
                  </div>
                  <button className="px-3 py-1 text-xs font-medium rounded-md border border-border hover:bg-muted transition-colors shrink-0">
                    Process
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-base font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: "New Resident", desc: "Register a new resident", icon: UserPlus },
                { label: "Issue Document", desc: "Generate certificate/clearance", icon: FileText },
                { label: "File Blotter", desc: "Record an incident", icon: Gavel },
                { label: "Record Payment", desc: "Log a payment transaction", icon: Receipt },
              ].map((action) => (
                <button
                  key={action.label}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted transition-colors group text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/30 transition-colors">
                    <action.icon className="w-4.5 h-4.5 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{action.label}</p>
                    <p className="text-[11px] text-muted-foreground">{action.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Platform Updates — What's New */}
      <div className="bg-card border border-border rounded-xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">Platform Updates</h2>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[11px] font-semibold">
              {platformUpdates.length} new
            </span>
          </div>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
            View all →
          </button>
        </div>
        <div className="divide-y divide-border">
          {platformUpdates.map((update, i) => {
            const IconComp = updateIcons[update.icon] || Bell;
            return (
              <div key={i} className="flex items-start gap-3.5 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `${update.typeColor}15` }}
                >
                  <IconComp className="w-4 h-4" style={{ color: update.typeColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-foreground">{update.title}</p>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
                      style={{ background: `${update.typeColor}15`, color: update.typeColor }}
                    >
                      {update.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{update.description}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[11px] text-muted-foreground/70">{update.version}</span>
                    <span className="text-[11px] text-muted-foreground/50">·</span>
                    <span className="text-[11px] text-muted-foreground/70">{update.time}</span>
                    <span className="text-[11px] text-muted-foreground/50">·</span>
                    <span className="text-[11px] text-muted-foreground/70">by {update.author}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Icon map for platform updates
const updateIcons: Record<string, React.ElementType> = {
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
};

// Missing icon component
function BarChart({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}
