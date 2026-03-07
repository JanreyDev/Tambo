"use client";

import { useState } from "react";
import {
  Bell,
  Rocket,
  Bug,
  Wrench,
  Shield,
  Zap,
  Search,
  Filter,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  GitBranch,
  Tag,
  User,
  Calendar,
  ArrowUpRight,
  Eye,
  Code2,
  Server,
  Globe,
  Palette,
  Link2,
  Flag,
  HardDrive,
  MessageCircle,
  LayoutDashboard,
  Users,
  FileText,
  Map,
  Bot,
  BarChart3,
  Database,
} from "lucide-react";

type UpdateType = "Feature" | "Bugfix" | "Enhancement" | "Milestone" | "Security" | "Infrastructure";
type UpdateStatus = "Completed" | "In Progress" | "Planned";

interface PlatformUpdate {
  id: string;
  title: string;
  description: string;
  type: UpdateType;
  status: UpdateStatus;
  version: string;
  date: string;
  author: string;
  module?: string;
  commit?: string;
  impact?: string;
}

const typeConfig: Record<UpdateType, { icon: React.ElementType; color: string }> = {
  Feature: { icon: Rocket, color: "#3b82f6" },
  Bugfix: { icon: Bug, color: "#ef4444" },
  Enhancement: { icon: Wrench, color: "#8b5cf6" },
  Milestone: { icon: Zap, color: "#22c55e" },
  Security: { icon: Shield, color: "#f59e0b" },
  Infrastructure: { icon: Server, color: "#06b6d4" },
};

const statusConfig: Record<UpdateStatus, { color: string; bg: string }> = {
  Completed: { color: "#22c55e", bg: "#22c55e15" },
  "In Progress": { color: "#f59e0b", bg: "#f59e0b15" },
  Planned: { color: "#64748b", bg: "#64748b15" },
};

const updates: PlatformUpdate[] = [
  // Today
  { id: "UPD-018", title: "PrimeX Admin Panel Frontend", description: "Complete superadmin dashboard with barangay tenant management, subscriptions, billing, platform updates, analytics, and system settings. Separate interface from barangay account.", type: "Milestone", status: "In Progress", version: "v5.0.0-alpha.4", date: "2026-03-07", author: "Claude", module: "Admin", impact: "Admin users can now manage all barangays from one dashboard" },
  { id: "UPD-017", title: "Frontend Polish — Accent Theming & Mobile Nav", description: "Sidebar uses accent CSS variables instead of hardcoded blue. Header now has mobile menu, date display, user dropdown with sign-out. Login badge changed to conditional STAGING indicator. Badge colors fixed for inactive items.", type: "Enhancement", status: "Completed", version: "v5.0.0-alpha.3", date: "2026-03-07", author: "Claude", module: "Layout", commit: "c33336c" },
  { id: "UPD-016", title: "GitLab CI/CD Pipeline + Staging Deploy", description: "Full CI/CD pipeline with lint, build, deploy stages. Manual deploy script created. Self-hosted GitLab Runner installed on staging server. Self-signed SSL configured for Cloudflare full mode.", type: "Infrastructure", status: "Completed", version: "v5.0.0-alpha.3", date: "2026-03-07", author: "Claude", module: "DevOps", commit: "6578605" },
  { id: "UPD-015", title: "V5 Staging Server Provisioned", description: "New DigitalOcean droplet (v5-staging, 159.89.207.105) with Node 24, PM2, Nginx, PostgreSQL 16, Redis, PHP 8.4. Cloudflare DNS configured for staging-bcmp.primex.ventures and staging-api-bcmp.primex.ventures.", type: "Infrastructure", status: "Completed", version: "v5.0.0-alpha.3", date: "2026-03-07", author: "Claude", module: "Infrastructure" },
  // Yesterday
  { id: "UPD-014", title: "22 Module Pages — Complete Frontend Scaffold", description: "All 22 barangay module pages built: Residents, Establishments, Lots & Buildings, Voters, KP Cases, Blotter, VAWC, Documents, Requests, Reports, AI Assistant, Drive, Public Portal, Support Tickets, Tanod, Finance, Inventory, Disaster/DRRM, GAD, HRIS, Map (Leaflet), Settings.", type: "Milestone", status: "Completed", version: "v5.0.0-alpha.2", date: "2026-03-06", author: "Claude", module: "All Modules", commit: "e55c278" },
  { id: "UPD-013", title: "Blockchain Verification Layer Design", description: "First blockchain-integrated barangay system. Document hashes stored on-chain for tamper-proof verification via QR code. Designed for certificates, clearances, and official documents.", type: "Feature", status: "Completed", version: "v5.0.0-alpha.2", date: "2026-03-06", author: "Claude", module: "Documents" },
  { id: "UPD-012", title: "Sign-in Monitor", description: "All login/logout events logged with device info, IP address, browser, and OS for security monitoring. Dashboard widget shows live sign-in activity.", type: "Feature", status: "Completed", version: "v5.0.0-alpha.2", date: "2026-03-06", author: "Claude", module: "Security" },
  { id: "UPD-011", title: "Resident Flag System", description: "Grey flag: cross-barangay duplicate detection. Red flag: midnight auto-match against active case records (blotter, VAWC). Flags visible in resident list and profile.", type: "Feature", status: "Completed", version: "v5.0.0-alpha.2", date: "2026-03-06", author: "Claude", module: "Residents" },
  { id: "UPD-010", title: "Light & Dark Mode + 8 Accent Colors", description: "Full theme system with next-themes. 8 accent colors (blue, emerald, violet, rose, amber, cyan, orange, indigo) saved per user in localStorage. All components use CSS variables for accent theming.", type: "Feature", status: "Completed", version: "v5.0.0-alpha.2", date: "2026-03-06", author: "Claude", module: "Settings" },
  { id: "UPD-009", title: "Dashboard with 15+ Widgets", description: "Futuristic dashboard with: stat cards, credit cards, document trend chart, upcoming events, map preview, recent residents, document statistics, weather (Windy), traffic (Google Maps), AI chat, SMS messaging, storage usage, call system, activity table, sign-in monitor, pending requests, quick actions, platform updates.", type: "Feature", status: "Completed", version: "v5.0.0-alpha.1", date: "2026-03-06", author: "Claude", module: "Dashboard", commit: "029d648" },
  { id: "UPD-008", title: "Drive Module (Cloud Storage)", description: "Barangay cloud file storage with folder tree, file upload, grid/list view, storage usage tracking, file preview, and search. Like Google Drive but per-barangay.", type: "Feature", status: "Completed", version: "v5.0.0-alpha.2", date: "2026-03-06", author: "Claude", module: "Drive" },
  { id: "UPD-007", title: "Support Tickets Module", description: "Chat-like support ticket interface. Barangay staff can create tickets, attach files, and communicate with PrimeX support. Real-time status updates.", type: "Feature", status: "Completed", version: "v5.0.0-alpha.2", date: "2026-03-06", author: "Claude", module: "Support" },
  { id: "UPD-006", title: "AI Assistant Module", description: "Built-in AI chat interface for data queries, navigation help, and report generation. Supports conversation history, suggested prompts, and capabilities overview.", type: "Feature", status: "Completed", version: "v5.0.0-alpha.2", date: "2026-03-06", author: "Claude", module: "AI" },
  { id: "UPD-005", title: "Map Module (Leaflet + OSM)", description: "Interactive barangay map using Leaflet with OpenStreetMap. Purok boundaries, resident pins, household markers, density heatmap layers. Drawing tools for boundary editing.", type: "Feature", status: "Completed", version: "v5.0.0-alpha.2", date: "2026-03-06", author: "Claude", module: "Map" },
  { id: "UPD-004", title: "Settings Module", description: "Barangay settings with general info, appearance (dark/light mode, accent colors), notification preferences, security settings, backup/restore, and system info display.", type: "Feature", status: "Completed", version: "v5.0.0-alpha.1", date: "2026-03-06", author: "Claude", module: "Settings" },
  { id: "UPD-003", title: "Login Page with Branding", description: "Authentication page with barangay illustration, kapitan.ph branding, username/password form. Designed for both light and dark themes.", type: "Feature", status: "Completed", version: "v5.0.0-alpha.1", date: "2026-03-06", author: "Claude", module: "Auth" },
  { id: "UPD-002", title: "Sidebar + Header Navigation", description: "Collapsible sidebar with 7 nav groups (Overview, Records, Judicial, Services, Tools, Operations, Settings). Header with search, notifications, theme toggle, user menu.", type: "Feature", status: "Completed", version: "v5.0.0-alpha.1", date: "2026-03-06", author: "Claude", module: "Layout" },
  { id: "UPD-001", title: "V5 Platform Initialized", description: "Laravel 12 + Next.js 16 monorepo. Multi-tenant PostgreSQL with RLS. 18 database migrations created. Project structure established with packages/ui, packages/api-client, packages/shared.", type: "Milestone", status: "Completed", version: "v5.0.0-alpha.1", date: "2026-03-06", author: "Claude", module: "Core", commit: "fbd8306" },
];

export default function PlatformUpdatesPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<UpdateType | "All">("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = updates.filter((u) => {
    const matchSearch = u.title.toLowerCase().includes(search.toLowerCase()) ||
      u.description.toLowerCase().includes(search.toLowerCase()) ||
      (u.module && u.module.toLowerCase().includes(search.toLowerCase()));
    const matchType = typeFilter === "All" || u.type === typeFilter;
    return matchSearch && matchType;
  });

  const stats = {
    total: updates.length,
    completed: updates.filter(u => u.status === "Completed").length,
    inProgress: updates.filter(u => u.status === "In Progress").length,
    features: updates.filter(u => u.type === "Feature").length,
    milestones: updates.filter(u => u.type === "Milestone").length,
  };

  // Group by date
  const grouped = filtered.reduce((acc, u) => {
    const dateLabel = u.date === new Date().toISOString().split("T")[0] ? "Today" :
      u.date === new Date(Date.now() - 86400000).toISOString().split("T")[0] ? "Yesterday" : u.date;
    if (!acc[dateLabel]) acc[dateLabel] = [];
    acc[dateLabel].push(u);
    return acc;
  }, {} as Record<string, PlatformUpdate[]>);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Platform Updates</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Development progress and changelog for kapitan.ph V5</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
            <Code2 className="w-3 h-3 text-blue-500" />
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">v5.0.0-alpha</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {[
          { label: "Total Updates", value: stats.total, color: "#3b82f6", icon: Bell },
          { label: "Completed", value: stats.completed, color: "#22c55e", icon: CheckCircle2 },
          { label: "In Progress", value: stats.inProgress, color: "#f59e0b", icon: Clock },
          { label: "Features", value: stats.features, color: "#8b5cf6", icon: Rocket },
          { label: "Milestones", value: stats.milestones, color: "#06b6d4", icon: Zap },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
              </div>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${s.color}12` }}>
                <s.icon className="w-4.5 h-4.5" style={{ color: s.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Type Filter */}
      <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search updates by title, description, or module..."
          className="flex-1 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <div className="flex items-center gap-1.5 flex-wrap">
          {(["All", "Feature", "Enhancement", "Bugfix", "Milestone", "Infrastructure", "Security"] as const).map((t) => {
            const tc = t === "All" ? { color: "#64748b" } : typeConfig[t as UpdateType];
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t === "All" ? "All" : t as UpdateType)}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-full transition-colors ${
                  typeFilter === t
                    ? "text-white"
                    : "text-muted-foreground hover:text-foreground bg-muted/50"
                }`}
                style={typeFilter === t ? { background: tc.color } : undefined}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Updates Timeline */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">{date}</h2>
              <span className="text-[10px] text-muted-foreground font-medium">{items.length} updates</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="space-y-2">
              {items.map((update) => {
                const tc = typeConfig[update.type];
                const sc = statusConfig[update.status];
                const TypeIcon = tc.icon;
                const isExpanded = expanded === update.id;
                return (
                  <div key={update.id} className="bg-card border border-border rounded-xl overflow-hidden transition-all hover:shadow-sm">
                    <button
                      onClick={() => setExpanded(isExpanded ? null : update.id)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 text-left"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${tc.color}12` }}>
                        <TypeIcon className="w-4 h-4" style={{ color: tc.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{update.title}</p>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0"
                            style={{ background: `${tc.color}15`, color: tc.color }}>
                            {update.type}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold shrink-0"
                            style={{ background: sc.bg, color: sc.color }}>
                            {update.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          {update.module && (
                            <span className="text-[10px] text-muted-foreground">{update.module}</span>
                          )}
                          <span className="text-[10px] text-muted-foreground">{update.version}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <User className="w-3 h-3" /> {update.author}
                          </span>
                          {update.commit && (
                            <span className="text-[10px] font-mono text-blue-500 flex items-center gap-1">
                              <GitBranch className="w-3 h-3" /> {update.commit}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${isExpanded ? "rotate-90" : ""}`} />
                    </button>
                    {isExpanded && (
                      <div className="px-5 pb-4 pt-0 border-t border-border">
                        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{update.description}</p>
                        {update.impact && (
                          <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30">
                            <ArrowUpRight className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-700 dark:text-blue-300">{update.impact}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
                          <span className="text-[10px] text-muted-foreground">ID: {update.id}</span>
                          <span className="text-[10px] text-muted-foreground">Date: {update.date}</span>
                          {update.commit && (
                            <span className="text-[10px] font-mono text-blue-500">Commit: {update.commit}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
