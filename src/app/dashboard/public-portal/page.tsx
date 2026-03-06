"use client";

import { useState } from "react";
import {
  Globe,
  Settings,
  Eye,
  Layout,
  FileText,
  Image,
  MessageSquare,
  Bell,
  ExternalLink,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Megaphone,
  Calendar,
  Users,
  MapPin,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";

interface PortalModule {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
  category: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  published: boolean;
  published_at: string;
  category: string;
}

const portalModules: PortalModule[] = [
  { id: "1", name: "Barangay Profile", description: "Public barangay information, officials, and contact details", icon: Users, enabled: true, category: "Information" },
  { id: "2", name: "Announcements", description: "Public notices, events, and barangay news", icon: Megaphone, enabled: true, category: "Information" },
  { id: "3", name: "Officials Directory", description: "Current barangay officials and their contact information", icon: Users, enabled: true, category: "Information" },
  { id: "4", name: "Online Document Request", description: "Allow residents to request documents online", icon: FileText, enabled: true, category: "Services" },
  { id: "5", name: "Complaint / Feedback", description: "Public complaint and feedback submission form", icon: MessageSquare, enabled: true, category: "Services" },
  { id: "6", name: "Events Calendar", description: "Public calendar of barangay activities and events", icon: Calendar, enabled: false, category: "Information" },
  { id: "7", name: "Photo Gallery", description: "Barangay photo gallery for events and activities", icon: Image, enabled: false, category: "Information" },
  { id: "8", name: "Transparency Board", description: "Budget reports, financial statements, and project updates", icon: Layout, enabled: true, category: "Transparency" },
  { id: "9", name: "Barangay Map", description: "Interactive map showing purok boundaries and landmarks", icon: MapPin, enabled: false, category: "Information" },
];

const mockAnnouncements: Announcement[] = [
  { id: "1", title: "Barangay Assembly Meeting - March 2026", content: "All residents are invited to attend the quarterly barangay assembly meeting on March 15, 2026 at 2:00 PM at the Barangay Hall.", published: true, published_at: "2026-03-05 10:00", category: "Meeting" },
  { id: "2", title: "Free Medical Mission", content: "The barangay health center will conduct a free medical mission on March 20, 2026. Bring your PhilHealth ID.", published: true, published_at: "2026-03-04 14:00", category: "Health" },
  { id: "3", title: "Anti-Drug Campaign Clean-up Drive", content: "Join the community clean-up drive and anti-drug awareness campaign this Saturday, March 8.", published: true, published_at: "2026-03-03 09:00", category: "Community" },
  { id: "4", title: "Water Service Interruption Notice", content: "Water supply will be interrupted on March 10 from 8:00 AM to 5:00 PM due to pipe repairs.", published: false, published_at: "", category: "Advisory" },
];

export default function PublicPortalPage() {
  const [activeTab, setActiveTab] = useState<"modules" | "announcements" | "preview">("modules");
  const [modules, setModules] = useState(portalModules);

  const toggleModule = (id: string) => {
    setModules((prev) => prev.map((m) => m.id === id ? { ...m, enabled: !m.enabled } : m));
  };

  const enabledCount = modules.filter((m) => m.enabled).length;
  const publishedCount = mockAnnouncements.filter((a) => a.published).length;

  const tabs = [
    { id: "modules" as const, label: "Portal Modules", count: modules.length },
    { id: "announcements" as const, label: "Announcements", count: mockAnnouncements.length },
    { id: "preview" as const, label: "Preview" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Public Portal"
        description="Manage your barangay's public-facing portal (barangay.org.ph)"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Tools" }, { label: "Public Portal" }]}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><Eye className="h-4 w-4" /> View Live Portal</button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}><Settings className="h-4 w-4" /> Portal Settings</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Portal Status" value="Live" icon={<Globe className="h-5 w-5" />} />
        <StatCard label="Active Modules" value={enabledCount} icon={<Layout className="h-5 w-5" />} />
        <StatCard label="Published Notices" value={publishedCount} icon={<Megaphone className="h-5 w-5" />} />
        <StatCard label="This Month Visits" value={342} icon={<Eye className="h-5 w-5" />} trend={{ value: 12, label: "vs last month" }} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border w-fit">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors",
              activeTab === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {tab.label}{tab.count !== undefined && <span className="ml-1.5 text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{tab.count}</span>}
          </button>
        ))}
      </div>

      {activeTab === "modules" && (
        <div className="space-y-3">
          {["Information", "Services", "Transparency"].map((category) => {
            const categoryModules = modules.filter((m) => m.category === category);
            if (categoryModules.length === 0) return null;
            return (
              <div key={category}>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{category}</p>
                <div className="space-y-2">
                  {categoryModules.map((m) => {
                    const Icon = m.icon;
                    return (
                      <div key={m.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: m.enabled ? "var(--accent-bg)" : "var(--muted)" }}>
                            <Icon className="h-5 w-5" style={{ color: m.enabled ? "var(--accent-primary)" : "var(--muted-foreground)" }} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{m.name}</p>
                            <p className="text-xs text-muted-foreground">{m.description}</p>
                          </div>
                        </div>
                        <button onClick={() => toggleModule(m.id)} className="shrink-0">
                          {m.enabled
                            ? <ToggleRight className="h-7 w-7" style={{ color: "var(--accent-primary)" }} />
                            : <ToggleLeft className="h-7 w-7 text-muted-foreground" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "announcements" && (
        <div className="space-y-3">
          {mockAnnouncements.map((a) => (
            <div key={a.id} className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground">{a.title}</h3>
                    {a.published ? <Badge variant="success">Published</Badge> : <Badge variant="muted">Draft</Badge>}
                    <Badge variant="muted">{a.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{a.content}</p>
                </div>
                {a.published_at && (
                  <span className="text-[11px] text-muted-foreground shrink-0 ml-4">{a.published_at}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "preview" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-6 bg-muted/30 border-b border-border text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: "var(--accent-bg)" }}>
              <Globe className="h-8 w-8" style={{ color: "var(--accent-primary)" }} />
            </div>
            <h2 className="text-xl font-bold text-foreground">Barangay Tambo</h2>
            <p className="text-sm text-muted-foreground">Municipality of Olongapo, Zambales</p>
            <p className="text-xs text-muted-foreground mt-1">barangay-tambo.barangay.org.ph</p>
          </div>
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">This is a preview of how your barangay portal will look to the public. The live version is accessible at your assigned barangay.org.ph subdomain.</p>
            <button className="flex items-center gap-2 mx-auto px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}>
              <ExternalLink className="h-4 w-4" /> Open Full Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
