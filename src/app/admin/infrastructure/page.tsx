"use client";

import {
  Server,
  HardDrive,
  Database,
  Globe,
  Shield,
  Activity,
  Cpu,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Wifi,
  ChevronRight,
  MapPin,
  Lock,
} from "lucide-react";

type ServerStatus = "Healthy" | "Warning" | "Critical" | "Offline";

interface ServerInfo {
  name: string;
  ip: string;
  purpose: string;
  spec: string;
  status: ServerStatus;
  cpu: number;
  ram: number;
  disk: number;
  uptime: string;
  cost: string;
  region: string;
  backups: boolean;
  firewall: string;
}

const statusConfig: Record<ServerStatus, { icon: React.ElementType; color: string }> = {
  Healthy: { icon: CheckCircle2, color: "#22c55e" },
  Warning: { icon: AlertTriangle, color: "#f59e0b" },
  Critical: { icon: AlertTriangle, color: "#ef4444" },
  Offline: { icon: XCircle, color: "#94a3b8" },
};

const servers: ServerInfo[] = [
  { name: "PrimeXV4", ip: "128.199.172.45", purpose: "BCMP V4 Production", spec: "2vCPU / 8GB RAM", status: "Warning", cpu: 13, ram: 85, disk: 65, uptime: "99.97%", cost: "$48/mo", region: "SGP1", backups: true, firewall: "web-servers" },
  { name: "v5-staging", ip: "159.89.207.105", purpose: "V5 BCMP Staging", spec: "1vCPU / 2GB RAM", status: "Healthy", cpu: 5, ram: 35, disk: 12, uptime: "100%", cost: "$12/mo", region: "SGP1", backups: false, firewall: "web-servers" },
  { name: "Staging-Server", ip: "152.42.252.6", purpose: "Legacy Staging (All)", spec: "2vCPU / 4GB RAM", status: "Healthy", cpu: 8, ram: 42, disk: 38, uptime: "99.9%", cost: "$34/mo", region: "SGP1", backups: false, firewall: "web-servers" },
  { name: "spa-call", ip: "152.42.238.242", purpose: "SPACALL Production", spec: "2vCPU / 4GB RAM", status: "Healthy", cpu: 6, ram: 38, disk: 22, uptime: "99.95%", cost: "$24/mo", region: "SGP1", backups: false, firewall: "web-servers" },
  { name: "tarlac-assets", ip: "157.245.62.50", purpose: "LGMP/Tarlac Production", spec: "2vCPU / 8GB RAM", status: "Healthy", cpu: 10, ram: 52, disk: 45, uptime: "99.9%", cost: "$63/mo", region: "SGP1", backups: false, firewall: "web-servers" },
  { name: "BarangayMo", ip: "174.138.21.22", purpose: "Barangaymo Production", spec: "1vCPU / 1GB RAM", status: "Healthy", cpu: 12, ram: 68, disk: 55, uptime: "99.8%", cost: "$6/mo", region: "SGP1", backups: false, firewall: "web-servers" },
  { name: "automation.primex", ip: "129.212.235.104", purpose: "n8n / Control Tower", spec: "1vCPU / 2GB RAM", status: "Healthy", cpu: 18, ram: 58, disk: 30, uptime: "99.9%", cost: "$12/mo", region: "SGP1", backups: true, firewall: "automation-server" },
];

const databases = [
  { name: "db-mysql-v4", engine: "MySQL 8", host: "Private", product: "BCMP V4", status: "Healthy" as ServerStatus },
  { name: "primex-staging-db", engine: "PostgreSQL 18", host: "Private", product: "V5 Staging", status: "Healthy" as ServerStatus },
  { name: "spacall-db", engine: "PostgreSQL 18", host: "Private", product: "SPACALL", status: "Healthy" as ServerStatus },
  { name: "tarlac-db", engine: "PostgreSQL 18", host: "Private", product: "LGMP/Tarlac", status: "Healthy" as ServerStatus },
];

const domains = [
  { domain: "kapitan.ph", purpose: "BCMP Production", ssl: "Full", status: "Active" },
  { domain: "staging-bcmp.primex.ventures", purpose: "V5 Staging", ssl: "Full", status: "Active" },
  { domain: "tarlac.ph", purpose: "LGMP Production", ssl: "Full", status: "Active" },
  { domain: "spacall.ph", purpose: "SPACALL Production", ssl: "Full", status: "Active" },
  { domain: "kabataan.ph", purpose: "SK System", ssl: "Full", status: "Parked" },
  { domain: "primex.ventures", purpose: "Corporate + Staging", ssl: "Full", status: "Active" },
];

function MetricBar({ value, max, color }: { value: number; max: number; color?: string }) {
  const pct = (value / max) * 100;
  const barColor = color || (pct > 80 ? "#ef4444" : pct > 60 ? "#f59e0b" : "#22c55e");
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
      </div>
      <span className="text-[10px] font-semibold text-foreground w-8 text-right">{value}%</span>
    </div>
  );
}

export default function InfrastructurePage() {
  const totalCost = servers.reduce((acc, s) => acc + parseFloat(s.cost.replace("$", "").replace("/mo", "")), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Infrastructure</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Monitor servers, databases, and domains</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{servers.filter(s => s.status === "Healthy").length}/{servers.length} Healthy</span>
          </div>
          <span className="text-xs text-muted-foreground">Total: ${totalCost}/mo</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: "Droplets", value: servers.length, icon: Server, color: "#3b82f6" },
          { label: "Databases", value: databases.length, icon: Database, color: "#8b5cf6" },
          { label: "Domains", value: "15", icon: Globe, color: "#22c55e" },
          { label: "Monthly Cost", value: `$${totalCost}`, icon: HardDrive, color: "#f59e0b" },
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

      {/* Servers */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">DigitalOcean Droplets</h3>
          </div>
          <span className="text-[10px] text-muted-foreground">Region: SGP1 (Singapore) | VPC: b94531c5</span>
        </div>
        <div className="divide-y divide-border">
          {servers.map((s) => {
            const sc = statusConfig[s.status];
            const StatusIcon = sc.icon;
            return (
              <div key={s.name} className="px-5 py-3.5 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex items-center gap-2 min-w-[200px]">
                    <StatusIcon className="w-4 h-4" style={{ color: sc.color }} />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{s.ip}</p>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{s.purpose}</p>
                    <p className="text-[10px] text-muted-foreground">{s.spec} | {s.cost}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-1.5">
                      {s.backups ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <XCircle className="w-3 h-3 text-red-400" />
                      )}
                      <span className="text-[10px] text-muted-foreground">Backups</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{s.firewall}</span>
                    </div>
                    <span className="text-[10px] font-medium text-emerald-500">{s.uptime}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pl-6">
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider">CPU</span>
                    <MetricBar value={s.cpu} max={100} />
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider">RAM</span>
                    <MetricBar value={s.ram} max={100} />
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Disk</span>
                    <MetricBar value={s.disk} max={100} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Databases + Domains */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Databases */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <Database className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Managed Databases</h3>
          </div>
          <div className="divide-y divide-border">
            {databases.map((db) => {
              const sc = statusConfig[db.status];
              const StatusIcon = sc.icon;
              return (
                <div key={db.name} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                  <StatusIcon className="w-4 h-4 shrink-0" style={{ color: sc.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{db.name}</p>
                    <p className="text-[10px] text-muted-foreground">{db.engine} | {db.product}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] text-emerald-500 font-medium">{db.host}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Domains */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Cloudflare Domains</h3>
            </div>
            <span className="text-[10px] text-muted-foreground">15 total</span>
          </div>
          <div className="divide-y divide-border">
            {domains.map((d) => (
              <div key={d.domain} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{d.domain}</p>
                  <p className="text-[10px] text-muted-foreground">{d.purpose}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600">
                    SSL: {d.ssl}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                    d.status === "Active"
                      ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600"
                      : "bg-amber-100 dark:bg-amber-950/30 text-amber-600"
                  }`}>
                    {d.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
