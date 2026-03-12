"use client";

import { toast } from "sonner";
import { ChevronRight, Server, Database, Globe, Shield } from "lucide-react";
import { MabiniInsightBanner } from "@/components/mabini-insight-banner";

const droplets = [
  { name: "PrimeXV4", ip: "128.199.172.45", purpose: "BCMP V4 Production", cpu: 13, ram: 85, disk: 42, status: "Healthy", backups: true, product: "BCMP" },
  { name: "primex-production", ip: "152.42.223.52", purpose: "PrimeX Production (5 apps)", cpu: 12, ram: 55, disk: 28, status: "Healthy", backups: true, product: "All" },
  { name: "Staging-Server", ip: "152.42.252.6", purpose: "Legacy Staging", cpu: 3, ram: 35, disk: 28, status: "Healthy", backups: false, product: "Legacy" },
  { name: "spa-call", ip: "152.42.238.242", purpose: "SPACALL Production", cpu: 4, ram: 45, disk: 22, status: "Healthy", backups: false, product: "SPACALL" },
  { name: "tarlac-assets", ip: "157.245.62.50", purpose: "LGMP/Tarlac Production", cpu: 8, ram: 55, disk: 35, status: "Healthy", backups: false, product: "LGMP" },
  { name: "BarangayMo", ip: "174.138.21.22", purpose: "Barangaymo Production", cpu: 2, ram: 38, disk: 15, status: "Healthy", backups: false, product: "Barangaymo" },
  { name: "automation.primex", ip: "129.212.235.104", purpose: "n8n/Control Tower", cpu: 6, ram: 52, disk: 20, status: "Healthy", backups: true, product: "Ops" },
];

const databases = [
  { name: "db-mysql-v4", engine: "MySQL 8", purpose: "BCMP V4", product: "BCMP" },
  { name: "primex-stagin-db", engine: "PostgreSQL 18", purpose: "Staging", product: "Staging" },
  { name: "spacall-db", engine: "PostgreSQL 18", purpose: "SPACALL", product: "SPACALL" },
  { name: "tarlac-db", engine: "PostgreSQL 18", purpose: "LGMP Tarlac", product: "LGMP" },
];

const domains = [
  { domain: "kapitan.ph", ssl: "Full", status: "Active", product: "BCMP" },
  { domain: "tarlac.ph", ssl: "Full", status: "Active", product: "LGMP" },
  { domain: "primex.ventures", ssl: "Full", status: "Active", product: "Corporate" },
  { domain: "spacall.ph", ssl: "Full", status: "Active", product: "SPACALL" },
  { domain: "barangaymo.com", ssl: "Full", status: "Active", product: "Barangaymo" },
  { domain: "primex.ventures", ssl: "Full", status: "Active", product: "Corporate" },
  { domain: "kabataan.ph", ssl: "Full", status: "Active", product: "BCMP" },
];

export default function InfrastructurePage() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span>System</span><ChevronRight className="w-3 h-3" /><span className="text-foreground font-medium">Infrastructure</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Infrastructure</h1>
        <p className="text-sm text-muted-foreground mt-0.5">DigitalOcean droplets, databases, and Cloudflare domains</p>
      </div>

      <MabiniInsightBanner message="PrimeXV4 RAM averaging 85% — approaching capacity. Monitor closely and plan scaling before onboarding more BCMP barangays." />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: "Droplets", value: "7", icon: Server, color: "#3b82f6" },
          { label: "Databases", value: "4", icon: Database, color: "#22c55e" },
          { label: "Domains", value: "15", icon: Globe, color: "#ea580c" },
          { label: "Monthly Cost", value: "$310", icon: Shield, color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
            </div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Droplets */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 pt-4 pb-2 flex items-center gap-2">
          <Server className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Droplets</h3>
        </div>
        <div className="divide-y divide-border">
          {droplets.map((d) => (
            <div key={d.name} className="px-5 py-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium text-foreground">{d.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{d.ip}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{d.product}</span>
                  {d.backups && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600">Backup</span>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "CPU", value: d.cpu },
                  { label: "RAM", value: d.ram },
                  { label: "Disk", value: d.disk },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-muted-foreground">{m.label}</span>
                      <span className="font-medium text-foreground">{m.value}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: `${m.value}%`,
                        background: m.value > 80 ? "#ef4444" : m.value > 60 ? "#f59e0b" : "#3b82f6",
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Databases + Domains */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 pt-4 pb-2 flex items-center gap-2">
            <Database className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Databases</h3>
          </div>
          <div className="divide-y divide-border">
            {databases.map((d) => (
              <div key={d.name} className="flex items-center gap-3 px-5 py-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">{d.name}</p>
                  <p className="text-[10px] text-muted-foreground">{d.engine}</p>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{d.product}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 pt-4 pb-2 flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Domains</h3>
          </div>
          <div className="divide-y divide-border">
            {domains.map((d) => (
              <div key={d.domain} className="flex items-center gap-3 px-5 py-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">{d.domain}</p>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600">SSL {d.ssl}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{d.product}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
