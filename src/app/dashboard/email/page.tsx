"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { MabiniButton } from "@/components/ui/mabini-button";
import {
  Mail, Inbox, Send, FileEdit, Star, Trash2, Archive,
  Search, Plus, Paperclip, MoreHorizontal, Clock,
  ChevronRight, Users, Shield, Globe,
} from "lucide-react";

// ── Coming Soon Feature Cards ────────────────────────────────────────

const FEATURES = [
  {
    icon: Mail,
    title: "Official Barangay Email",
    description: "Every barangay gets a professional email address like tambo@barangay.org.ph. Send and receive emails from Gmail, Yahoo, Outlook, and any email provider.",
    color: "#3b82f6",
  },
  {
    icon: Inbox,
    title: "Full Inbox Management",
    description: "Inbox, Sent, Drafts, Starred, Archive, Trash -- complete email experience built right into kapitan.ph. No need for separate email apps.",
    color: "#8b5cf6",
  },
  {
    icon: Users,
    title: "Staff Email Accounts",
    description: "Create email accounts for your barangay staff: secretary@tambo.barangay.org.ph, treasurer@tambo.barangay.org.ph. Each staff member gets their own mailbox.",
    color: "#f59e0b",
  },
  {
    icon: Paperclip,
    title: "Attachments & Documents",
    description: "Send and receive files up to 25MB. Attach generated barangay documents directly from the Documents module -- clearances, certificates, permits.",
    color: "#22c55e",
  },
  {
    icon: Shield,
    title: "Secure & Government-Grade",
    description: "End-to-end encryption. RA 10173 compliant. All emails stored in PrimeX infrastructure -- no Google or Yahoo reading your barangay data.",
    color: "#ef4444",
  },
  {
    icon: Globe,
    title: "Works With Everyone",
    description: "Send to and receive from any email address in the world. Your barangay email works just like Gmail but with your official @barangay.org.ph domain.",
    color: "#06b6d4",
  },
];

// ── Mock Email Preview ───────────────────────────────────────────────

const MOCK_EMAILS = [
  { from: "DILG Region III", subject: "RE: Compliance Report Submission Deadline", time: "2:30 PM", unread: true, preview: "Good day! Please be reminded that the deadline for..." },
  { from: "PrimeX Support", subject: "Welcome to Sulat - Your Barangay Email", time: "11:45 AM", unread: true, preview: "Congratulations! Your barangay email tambo@barangay.org.ph is now active..." },
  { from: "Municipal Hall", subject: "Budget Allocation for Q2 2026", time: "9:15 AM", unread: false, preview: "Attached is the approved budget allocation for your barangay..." },
  { from: "Barangay Mabini", subject: "Inter-Barangay Sports Festival", time: "Yesterday", unread: false, preview: "We are inviting your barangay to participate in the upcoming..." },
  { from: "DOH Region III", subject: "Dengue Prevention Campaign Materials", time: "Yesterday", unread: false, preview: "Please distribute the attached IEC materials to all puroks..." },
];

export default function EmailPage() {
  const [selectedFolder] = useState("inbox");

  const folders = [
    { key: "inbox", label: "Inbox", icon: Inbox, count: 2, color: "#3b82f6" },
    { key: "starred", label: "Starred", icon: Star, count: 0 },
    { key: "sent", label: "Sent", icon: Send, count: 0 },
    { key: "drafts", label: "Drafts", icon: FileEdit, count: 0 },
    { key: "archive", label: "Archive", icon: Archive, count: 0 },
    { key: "trash", label: "Trash", icon: Trash2, count: 0 },
  ];

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Email"
        description="Official barangay email system powered by barangay.org.ph"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Email" }]}
      />

      {/* Coming Soon Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-200 dark:border-blue-800/50 bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-blue-950/30 dark:via-background dark:to-violet-950/20 p-6 lg:p-8">
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider">
          Coming Soon
        </div>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <Mail className="w-7 h-7 text-blue-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              yourbarangay@barangay.org.ph
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
              Every barangay on kapitan.ph will get a free, professional email address using the <strong>barangay.org.ph</strong> domain. Communicate officially with DILG, other barangays, LGUs, and anyone with a real email address -- right from your dashboard.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Under Development
              </div>
              <span className="text-xs text-muted-foreground">Target: Q2 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview: What It Will Look Like */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
        {/* Sidebar preview */}
        <div className="glass rounded-xl p-3 space-y-1">
          <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-white mb-3 min-h-[44px]" style={{ background: "var(--accent-primary)" }}>
            <Plus className="w-4 h-4" />
            Compose
          </button>
          {folders.map((f) => {
            const Icon = f.icon;
            const active = f.key === selectedFolder;
            return (
              <div
                key={f.key}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                  active ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-medium" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{f.label}</span>
                {f.count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground"}`}>
                    {f.count}
                  </span>
                )}
              </div>
            );
          })}
          <div className="border-t border-border my-2" />
          <div className="px-3 py-2">
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider mb-1">Your Address</p>
            <p className="text-xs font-mono text-foreground">tambo@barangay.org.ph</p>
          </div>
        </div>

        {/* Email list preview */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <div className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                Search emails...
              </div>
            </div>
            <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-border opacity-80">
            {MOCK_EMAILS.map((email, i) => (
              <div key={i} className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer ${email.unread ? "bg-blue-50/50 dark:bg-blue-950/10" : ""}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold text-white ${email.unread ? "bg-blue-500" : "bg-slate-400"}`}>
                  {email.from.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate ${email.unread ? "font-bold text-foreground" : "font-medium text-foreground/80"}`}>
                      {email.from}
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {email.time}
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 ${email.unread ? "font-semibold text-foreground/90" : "text-muted-foreground"}`}>
                    {email.subject}
                  </p>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5 truncate">
                    {email.preview}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0 mt-3" />
              </div>
            ))}
          </div>
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Feature Cards */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3">What Barangay Email Will Include</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="glass rounded-xl p-4 hover:shadow-lg hover:shadow-black/5 transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${f.color}12` }}>
                  <Icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h4 className="text-sm font-bold text-foreground">{f.title}</h4>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{f.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      <MabiniButton pageContext="You are on the Barangay Email page. This feature is coming soon. It will provide official @barangay.org.ph email addresses for barangay staff. Each barangay gets their own email domain. They can send and receive from Gmail, Yahoo, and any external email provider." />
    </div>
  );
}
