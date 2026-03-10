"use client";

import { useState } from "react";
import { ChevronRight, Settings, Shield, Bell, Plug, Wrench } from "lucide-react";
import { MabiniInsightBanner } from "@/components/mabini-insight-banner";

const tabs = [
  { id: "general", label: "General", icon: Settings },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
];

function Toggle({ on }: { on: boolean }) {
  return (
    <div className={`w-9 h-5 rounded-full transition-colors ${on ? "bg-orange-600" : "bg-muted-foreground/20"}`}>
      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${on ? "translate-x-4.5" : "translate-x-0.5"}`} />
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState("general");

  return (
    <div className="p-6 space-y-4">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span>System</span><ChevronRight className="w-3 h-3" /><span className="text-foreground font-medium">Settings</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Platform-wide configuration for all products</p>
      </div>

      <MabiniInsightBanner message="Review security settings quarterly. Consider enabling rate limiting alerts and audit log exports for compliance." />

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-card border border-border rounded-xl p-6">
        {tab === "general" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Platform Information</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Platform Name", value: "PrimeX Founder" },
                  { label: "Version", value: "v1.0.0-alpha" },
                  { label: "Company", value: "PrimeX Ventures Inc." },
                  { label: "Environment", value: "Production" },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="text-[11px] text-muted-foreground font-medium">{f.label}</label>
                    <p className="text-sm font-medium text-foreground mt-0.5">{f.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Managed Products</h3>
              <div className="space-y-2">
                {[
                  { name: "BCMP (kapitan.ph)", status: "Active", color: "#3b82f6" },
                  { name: "LGMP (tarlac.ph)", status: "Active", color: "#22c55e" },
                  { name: "PDMP", status: "Planning", color: "#f59e0b" },
                ].map((p) => (
                  <div key={p.name} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                      <span className="text-xs font-medium text-foreground">{p.name}</span>
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color: p.color }}>{p.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "security" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Security Settings</h3>
            {[
              { label: "Enforce 2FA for all admins", desc: "Require two-factor authentication", on: false },
              { label: "Session timeout", desc: "Auto-logout after 60 minutes of inactivity", on: true },
              { label: "Login attempt limit", desc: "Lock account after 5 failed attempts", on: true },
              { label: "RA 10173 compliance mode", desc: "Enable data privacy compliance features", on: true },
              { label: "Audit logging", desc: "Log all admin actions for compliance", on: true },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between py-3 border-b border-border/50">
                <div>
                  <p className="text-xs font-medium text-foreground">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                </div>
                <Toggle on={s.on} />
              </div>
            ))}
          </div>
        )}

        {tab === "notifications" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Notification Channels</h3>
            {[
              { event: "New barangay registration", email: true, telegram: true },
              { event: "Subscription expiring", email: true, telegram: true },
              { event: "Payment received", email: true, telegram: false },
              { event: "Support ticket opened", email: true, telegram: true },
              { event: "Server alert", email: true, telegram: true },
              { event: "Weekly summary", email: true, telegram: false },
            ].map((n) => (
              <div key={n.event} className="flex items-center justify-between py-3 border-b border-border/50">
                <span className="text-xs text-foreground">{n.event}</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">Email</span>
                    <Toggle on={n.email} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">Telegram</span>
                    <Toggle on={n.telegram} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "integrations" && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Connected Services</h3>
            {[
              { name: "Telegram Bot", status: "Pending", desc: "Bot token not yet configured" },
              { name: "SMS (TXTBOX)", status: "Connected", desc: "SMS credits for voter and resident notifications" },
              { name: "Anthropic AI", status: "Connected", desc: "API key configured for AI assistant features" },
              { name: "DigitalOcean", status: "Connected", desc: "Infrastructure management and monitoring" },
              { name: "Cloudflare", status: "Connected", desc: "DNS, SSL, and security management" },
              { name: "GitLab CI/CD", status: "Connected", desc: "Automated testing and deployment pipelines" },
            ].map((s) => (
              <div key={s.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <span className={`w-2 h-2 rounded-full ${s.status === "Connected" ? "bg-emerald-500" : "bg-amber-500"}`} />
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                </div>
                <span className={`text-[10px] font-semibold ${s.status === "Connected" ? "text-emerald-600" : "text-amber-600"}`}>{s.status}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "maintenance" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">System Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Clear Cache", desc: "Clear all application caches" },
                { label: "Run Backup", desc: "Trigger manual database backup" },
                { label: "Export Data", desc: "Export system data as CSV" },
                { label: "View Logs", desc: "Open structured log viewer" },
              ].map((a) => (
                <button key={a.label} className="p-4 rounded-xl border border-border text-left hover:bg-muted/30 transition-colors">
                  <p className="text-xs font-semibold text-foreground">{a.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{a.desc}</p>
                </button>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3">System Information</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Node.js", value: "v24.14.0" },
                  { label: "Next.js", value: "16.1.6" },
                  { label: "Laravel", value: "12.x" },
                  { label: "PostgreSQL", value: "17" },
                ].map((i) => (
                  <div key={i.label} className="flex justify-between py-1.5 px-3 rounded bg-muted/30">
                    <span className="text-[10px] text-muted-foreground">{i.label}</span>
                    <span className="text-[10px] font-mono font-medium text-foreground">{i.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
