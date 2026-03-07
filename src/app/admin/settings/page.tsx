"use client";

import { useState } from "react";
import {
  Globe,
  Bell,
  Shield,
  Database,
  Mail,
  MessageSquare,
  Server,
  Key,
  Eye,
  RefreshCw,
  FileText,
} from "lucide-react";
import { useTheme } from "next-themes";

type SettingsTab = "general" | "security" | "notifications" | "integrations" | "maintenance";

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("general");
  const { theme, setTheme } = useTheme();

  const tabs: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
    { key: "general", label: "General", icon: Globe },
    { key: "security", label: "Security", icon: Shield },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "integrations", label: "Integrations", icon: Key },
    { key: "maintenance", label: "Maintenance", icon: Server },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure platform-wide settings and preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Tab Sidebar */}
        <div className="w-[200px] shrink-0 space-y-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                  tab === t.key
                    ? "font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          {tab === "general" && (
            <>
              {/* Platform Info */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Platform Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Platform Name", value: "kapitan.ph" },
                    { label: "Version", value: "v5.0.0-alpha" },
                    { label: "Company", value: "PrimeX Ventures Inc." },
                    { label: "Environment", value: "Staging" },
                  ].map((item) => (
                    <div key={item.label}>
                      <label className="text-xs text-muted-foreground font-medium">{item.label}</label>
                      <input
                        type="text"
                        defaultValue={item.value}
                        className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-input-border bg-input-bg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Appearance */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Appearance</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">Admin Panel Theme</label>
                    <div className="flex items-center gap-2 mt-2">
                      {(["light", "dark", "system"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTheme(t)}
                          className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                            theme === t ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-600" : "border-border text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Default Tenant Settings */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Default Tenant Settings</h3>
                <div className="space-y-3">
                  {[
                    { label: "Default trial period", value: "14 days" },
                    { label: "Max users (Standard plan)", value: "10" },
                    { label: "Max users (Professional plan)", value: "15" },
                    { label: "Default timezone", value: "Asia/Manila (UTC+8)" },
                    { label: "Default language", value: "Filipino / English" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-medium text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === "security" && (
            <>
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Authentication</h3>
                <div className="space-y-3">
                  {[
                    { label: "Enforce 2FA for all admin users", enabled: false },
                    { label: "Enforce 2FA for barangay users", enabled: false },
                    { label: "Session timeout (minutes)", value: "60" },
                    { label: "Maximum login attempts before lockout", value: "5" },
                    { label: "Password minimum length", value: "8" },
                    { label: "Require password change every 90 days", enabled: true },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      {"enabled" in item ? (
                        <div className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${item.enabled ? "bg-blue-600" : "bg-muted-foreground/30"}`}>
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${item.enabled ? "left-5.5 translate-x-0" : "left-0.5"}`} />
                        </div>
                      ) : (
                        <input type="text" defaultValue={item.value} className="w-20 px-2 py-1 text-sm text-right rounded border border-input-border bg-input-bg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Data Privacy (RA 10173)</h3>
                <div className="space-y-3">
                  {[
                    { label: "Display privacy notice on registration", enabled: true },
                    { label: "Enable data export request for residents", enabled: true },
                    { label: "Enable data deletion request for residents", enabled: true },
                    { label: "Data retention period", value: "5 years" },
                    { label: "Audit log retention", value: "2 years" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      {"enabled" in item ? (
                        <div className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${item.enabled ? "bg-blue-600" : "bg-muted-foreground/30"}`}>
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${item.enabled ? "left-5.5 translate-x-0" : "left-0.5"}`} />
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-foreground">{item.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === "notifications" && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { label: "New barangay registration", desc: "When a new barangay signs up or is added", email: true, telegram: true },
                  { label: "Subscription expiring", desc: "7 days before a subscription expires", email: true, telegram: true },
                  { label: "Payment received", desc: "When a payment is recorded", email: true, telegram: false },
                  { label: "Support ticket created", desc: "When a barangay opens a support ticket", email: false, telegram: true },
                  { label: "System alerts", desc: "Server health, errors, downtime", email: true, telegram: true },
                  { label: "Weekly summary", desc: "Revenue, usage, and growth metrics", email: true, telegram: false },
                ].map((n) => (
                  <div key={n.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{n.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                        <div className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${n.email ? "bg-blue-600" : "bg-muted-foreground/30"}`}>
                          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${n.email ? "left-4.5 translate-x-0" : "left-0.5"}`} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                        <div className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${n.telegram ? "bg-blue-600" : "bg-muted-foreground/30"}`}>
                          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${n.telegram ? "left-4.5 translate-x-0" : "left-0.5"}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "integrations" && (
            <div className="space-y-4">
              {[
                { name: "Telegram Bot", desc: "System alerts and notifications via Telegram", status: "Connected", icon: MessageSquare, color: "#0088cc" },
                { name: "SMS Provider (TXTBOX)", desc: "Bulk SMS messaging for barangay communications", status: "Connected", icon: Mail, color: "#22c55e" },
                { name: "Anthropic AI", desc: "AI assistant powered by Claude", status: "Connected", icon: Key, color: "#d97706" },
                { name: "DigitalOcean", desc: "Cloud hosting and storage", status: "Connected", icon: Server, color: "#0080ff" },
                { name: "Cloudflare", desc: "DNS, SSL, and security", status: "Connected", icon: Shield, color: "#f38020" },
                { name: "GitLab CI/CD", desc: "Continuous integration and deployment", status: "Pending Verification", icon: Database, color: "#fc6d26" },
              ].map((i) => (
                <div key={i.name} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${i.color}12` }}>
                    <i.icon className="w-5 h-5" style={{ color: i.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{i.name}</p>
                    <p className="text-xs text-muted-foreground">{i.desc}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                    i.status === "Connected"
                      ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
                  }`}>
                    {i.status}
                  </span>
                  <button className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors">
                    Configure
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === "maintenance" && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">System Maintenance</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Clear Application Cache", desc: "Remove cached views, routes, and config", icon: RefreshCw, color: "#3b82f6" },
                    { label: "Backup Database", desc: "Create a full database backup now", icon: Database, color: "#22c55e" },
                    { label: "Export All Data", desc: "Export platform data as CSV/JSON", icon: FileText, color: "#8b5cf6" },
                    { label: "View System Logs", desc: "Access server and application logs", icon: Eye, color: "#f59e0b" },
                  ].map((action) => (
                    <button key={action.label} className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${action.color}12` }}>
                        <action.icon className="w-4.5 h-4.5" style={{ color: action.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{action.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">System Information</h3>
                <div className="space-y-2">
                  {[
                    { label: "Platform Version", value: "v5.0.0-alpha" },
                    { label: "Laravel Version", value: "12.x" },
                    { label: "Next.js Version", value: "16.x" },
                    { label: "PostgreSQL Version", value: "16.13" },
                    { label: "Node.js Version", value: "24.14.0" },
                    { label: "PHP Version", value: "8.4.18" },
                    { label: "Server OS", value: "Ubuntu 24.04 LTS" },
                    { label: "Region", value: "SGP1 (Singapore)" },
                    { label: "Last Backup", value: "Never (configure backups)" },
                    { label: "Uptime", value: "99.97% (30 days)" },
                  ].map((info) => (
                    <div key={info.label} className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-muted-foreground">{info.label}</span>
                      <span className="text-sm font-medium text-foreground">{info.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
