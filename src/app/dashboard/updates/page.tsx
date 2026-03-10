"use client";

import { ChevronRight, Zap } from "lucide-react";
import { MabiniInsightBanner } from "@/components/mabini-insight-banner";

const updates = [
  { title: "Comprehensive Platform Audit", type: "Milestone", version: "v1.0.0-alpha.2", date: "Mar 7, 2026", author: "Claude", status: "Completed", description: "Full audit of Claude's Desk (17+ files), GitLab, DigitalOcean, and Cloudflare. All documentation updated to reflect PrimeX Founder as centralized command center.", color: "#ea580c" },
  { title: "Documentation Consistency Fix", type: "Update", version: "v1.0.0-alpha.2", date: "Mar 7, 2026", author: "Claude", status: "Completed", description: "Updated 15+ files across Claude's Desk: architecture specs, build progress, design decisions, infrastructure maps, goals, priorities, and product READMEs to reflect admin separation.", color: "#22c55e" },
  { title: "PrimeX CI/CD Pipeline", type: "Infrastructure", version: "v1.0.0-alpha.1", date: "Mar 7, 2026", author: "Claude", status: "Completed", description: "3-stage GitLab CI pipeline (lint, build, deploy) for primex-founder-web. Auto-deploys to founder.primex.ventures on push to main.", color: "#f59e0b" },
  { title: "Admin Separation", type: "Milestone", version: "v1.0.0-alpha.1", date: "Mar 7, 2026", author: "Claude", status: "Completed", description: "Admin panel (11 routes) removed from bcmp-web. kapitan.ph is now barangay-staff-only (25 routes). All admin functions live in founder.primex.ventures.", color: "#ea580c" },
  { title: "PrimeX Command Center", type: "Milestone", version: "v1.0.0-alpha.1", date: "Mar 7, 2026", author: "Claude", status: "Completed", description: "Centralized admin dashboard for all PrimeX products launched. Replaces per-product admin panels.", color: "#ea580c" },
  { title: "Barangay Frontend Polish", type: "Update", version: "v5.0.0-alpha.3", date: "Mar 7, 2026", author: "Claude", status: "Completed", description: "Final polish on kapitan.ph barangay interface. Admin panel moved to founder.primex.ventures.", color: "#3b82f6" },
  { title: "Security Hardening", type: "Security", version: "v5.0.0-alpha.3", date: "Mar 7, 2026", author: "Claude", status: "Completed", description: "GitLab, DigitalOcean, and Cloudflare security hardening across all infrastructure.", color: "#ef4444" },
  { title: "CI/CD Pipeline", type: "Infrastructure", version: "v5.0.0-alpha.2", date: "Mar 7, 2026", author: "Claude", status: "Completed", description: "Automated lint, build, and deploy pipeline for bcmp-web via GitLab CI.", color: "#22c55e" },
  { title: "Blockchain Verification Layer", type: "Feature", version: "v5.0.0-alpha.2", date: "Mar 6, 2026", author: "Claude", status: "Completed", description: "Document hashing and audit trail verification using blockchain anchoring.", color: "#3b82f6" },
  { title: "Sign-in Monitor", type: "Feature", version: "v5.0.0-alpha.2", date: "Mar 6, 2026", author: "Claude", status: "Completed", description: "Real-time security intelligence panel showing browser, OS, IP, encryption status on login.", color: "#3b82f6" },
  { title: "22 Module Pages Scaffold", type: "Milestone", version: "v5.0.0-alpha.1", date: "Mar 6, 2026", author: "Claude", status: "Completed", description: "All 22 BCMP module pages scaffolded with navigation, layouts, and initial UI.", color: "#ea580c" },
  { title: "V5 Platform Initialized", type: "Milestone", version: "v5.0.0-alpha.1", date: "Mar 6, 2026", author: "Claude", status: "Completed", description: "Fresh Next.js 16 + Laravel 12 project structure established. PostgreSQL + Redis via Docker Compose.", color: "#ea580c" },
];

const typeColors: Record<string, string> = {
  Feature: "#3b82f6",
  Milestone: "#ea580c",
  Update: "#22c55e",
  Security: "#ef4444",
  Infrastructure: "#f59e0b",
  Bugfix: "#ec4899",
};

export default function UpdatesPage() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span>System</span><ChevronRight className="w-3 h-3" /><span className="text-foreground font-medium">Updates</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Platform Updates</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Development changelog across all products</p>
      </div>

      <MabiniInsightBanner message="12 platform updates deployed this quarter. Next milestone: BCMP V5 staging deployment with full API integration." />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: "Total Updates", value: updates.length },
          { label: "Features", value: updates.filter((u) => u.type === "Feature").length },
          { label: "Milestones", value: updates.filter((u) => u.type === "Milestone").length },
          { label: "Security", value: updates.filter((u) => u.type === "Security").length },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
            <p className="text-xl font-bold text-foreground mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {updates.map((u, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 hover:shadow-lg hover:shadow-black/5 transition-all">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${typeColors[u.type] || "#94a3b8"}15` }}>
                <Zap className="w-4 h-4" style={{ color: typeColors[u.type] || "#94a3b8" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-foreground">{u.title}</h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                    style={{ background: `${typeColors[u.type]}15`, color: typeColors[u.type] }}>
                    {u.type}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">{u.version}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{u.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-muted-foreground">by {u.author}</span>
                  <span className="text-[10px] text-muted-foreground">{u.date}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
