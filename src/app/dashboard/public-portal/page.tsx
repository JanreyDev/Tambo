"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  Settings,
  Eye,
  Layout,
  FileText,
  Image,
  MessageSquare,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Megaphone,
  Calendar,
  Users,
  MapPin,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Send,
  X,
  Bot,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
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

const categoryOptions = ["Meeting", "Health", "Community", "Advisory", "Event", "Notice", "Emergency"];

function FormInput({ label, value, name, placeholder, required, onChange }: { label: string; value: string; name: string; placeholder?: string; required?: boolean; onChange: (name: string, value: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type="text" value={value} onChange={(e) => onChange(name, e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2" style={{ "--tw-ring-color": "var(--accent-ring)" } as React.CSSProperties} />
    </div>
  );
}

function FormSelect({ label, value, name, options, required, onChange }: { label: string; value: string; name: string; options: string[]; required?: boolean; onChange: (name: string, value: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select value={value} onChange={(e) => onChange(name, e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2" style={{ "--tw-ring-color": "var(--accent-ring)" } as React.CSSProperties}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function PublicPortalPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"modules" | "announcements" | "preview">("modules");
  const [modules, setModules] = useState(portalModules);

  // Announcement form
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [showEditAnnouncement, setShowEditAnnouncement] = useState(false);
  const [showDeleteAnnouncement, setShowDeleteAnnouncement] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [formTab, setFormTab] = useState(0);
  const [announcementForm, setAnnouncementForm] = useState({ title: "", content: "", category: "Notice", published: false });
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ title?: string; content?: string; category?: string }>({});

  // Toast notifications
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "error" }[]>([]);
  const addToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // View announcement
  const [showViewAnnouncement, setShowViewAnnouncement] = useState(false);
  const [viewTarget, setViewTarget] = useState<Announcement | null>(null);

  const toggleModule = (id: string) => {
    setModules((prev) => {
      const updated = prev.map((m) => m.id === id ? { ...m, enabled: !m.enabled } : m);
      const target = updated.find((m) => m.id === id);
      if (target) addToast(`${target.name} ${target.enabled ? "enabled" : "disabled"}`, "success");
      return updated;
    });
  };

  const enabledCount = modules.filter((m) => m.enabled).length;
  const publishedCount = mockAnnouncements.filter((a) => a.published).length;

  const tabs = [
    { id: "modules" as const, label: "Portal Modules", count: modules.length },
    { id: "announcements" as const, label: "Announcements", count: mockAnnouncements.length },
    { id: "preview" as const, label: "Preview" },
  ];

  const formTabs = ["Content", "Publishing"];

  const openCreate = () => {
    setAnnouncementForm({ title: "", content: "", category: "Notice", published: false });
    setFormTab(0);
    setFormErrors({});
    setShowCreateAnnouncement(true);
  };

  const openEdit = (a: Announcement) => {
    setAnnouncementForm({ title: a.title, content: a.content, category: a.category, published: a.published });
    setFormTab(0);
    setFormErrors({});
    setActionMenu(null);
    setShowEditAnnouncement(true);
  };

  const validateAnnouncementForm = (): boolean => {
    const errors: { title?: string; content?: string; category?: string } = {};
    if (!announcementForm.title.trim()) errors.title = "Title is required";
    if (!announcementForm.content.trim()) errors.content = "Content is required";
    else if (announcementForm.content.trim().length < 20) errors.content = "Content must be at least 20 characters";
    if (!announcementForm.category) errors.category = "Category is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openDelete = (a: Announcement) => {
    setDeleteTarget(a);
    setActionMenu(null);
    setShowDeleteAnnouncement(true);
  };

  const openView = (a: Announcement) => {
    setViewTarget(a);
    setActionMenu(null);
    setShowViewAnnouncement(true);
  };

  const closeForm = () => {
    setShowCreateAnnouncement(false);
    setShowEditAnnouncement(false);
  };

  const handleAnnouncementFieldChange = (name: string, value: string) => {
    setAnnouncementForm((f) => ({ ...f, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

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

      {/* Mabini AI Insight */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-accent-primary/20 bg-accent-bg/30">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--accent-primary)", opacity: 0.15 }}>
          <Bot className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Mabini AI Portal Insights</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            Portal traffic up 15% this week. 2 announcements are still in draft — consider publishing. Events Calendar module has lowest engagement; Gallery has the highest.
          </p>
        </div>
        <button onClick={() => router.push("/dashboard/ai")} className="shrink-0 px-3 py-1.5 text-[10px] font-semibold rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--accent-primary)", color: "#fff" }}>
          Ask Mabini
        </button>
      </div>

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
                      <div key={m.id} className="flex items-center justify-between p-4 rounded-xl glass">
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
          <div className="flex justify-end">
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
              <Plus className="h-4 w-4" /> New Announcement
            </button>
          </div>
          {mockAnnouncements.map((a) => (
            <div key={a.id} className="p-4 rounded-xl glass">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground">{a.title}</h3>
                    {a.published ? <Badge variant="success">Published</Badge> : <Badge variant="muted">Draft</Badge>}
                    <Badge variant="muted">{a.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{a.content}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  {a.published_at && (
                    <span className="text-[11px] text-muted-foreground">{a.published_at}</span>
                  )}
                  <div className="relative">
                    <button onClick={() => setActionMenu(actionMenu === a.id ? null : a.id)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </button>
                    {actionMenu === a.id && (
                      <div className="absolute right-0 top-full mt-1 w-44 glass rounded-lg shadow-lg z-20 py-1">
                        <button onClick={() => openView(a)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left">
                          <Eye className="h-4 w-4 text-muted-foreground" /> View Details
                        </button>
                        <button onClick={() => openEdit(a)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left">
                          <Edit className="h-4 w-4 text-muted-foreground" /> Edit
                        </button>
                        {!a.published && (
                          <button onClick={() => { setActionMenu(null); addToast("Announcement published", "success"); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left">
                            <Send className="h-4 w-4 text-muted-foreground" /> Publish
                          </button>
                        )}
                        {a.published && (
                          <button onClick={() => { setActionMenu(null); addToast("Announcement unpublished", "success"); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left">
                            <X className="h-4 w-4 text-muted-foreground" /> Unpublish
                          </button>
                        )}
                        <div className="border-t border-border my-1" />
                        <button onClick={() => openDelete(a)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left text-red-500">
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "preview" && (
        <div className="rounded-xl glass overflow-hidden">
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

      {/* Create/Edit Announcement Modal */}
        <Modal open={showCreateAnnouncement || showEditAnnouncement} title={showEditAnnouncement ? "Edit Announcement" : "New Announcement"} onClose={closeForm} size="lg"
          footer={<>
            <ModalButton variant="secondary" onClick={closeForm}>Cancel</ModalButton>
            {formTab > 0 && <ModalButton variant="secondary" onClick={() => setFormTab(t => t - 1)}>Previous</ModalButton>}
            {formTab < formTabs.length - 1
              ? <ModalButton variant="primary" onClick={() => { if (validateAnnouncementForm()) setFormTab(t => t + 1); }}>Next</ModalButton>
              : <ModalButton variant="primary" onClick={() => { if (validateAnnouncementForm()) { closeForm(); addToast(showEditAnnouncement ? "Announcement updated successfully" : announcementForm.published ? "Announcement published" : "Announcement saved as draft", "success"); } }}>{showEditAnnouncement ? "Update" : announcementForm.published ? "Publish" : "Save as Draft"}</ModalButton>}
          </>}>
          {/* Tabs */}
          <div className="flex border-b border-border mb-6">
            {formTabs.map((tab, i) => (
              <button key={tab} onClick={() => setFormTab(i)}
                className={cn("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                  formTab === i ? "border-accent-primary text-accent-text" : "border-transparent text-muted-foreground hover:text-foreground")}>
                {tab}
              </button>
            ))}
          </div>

          {formTab === 0 && (
            <div className="space-y-4">
              <div>
                <FormInput label="Title" name="title" value={announcementForm.title} placeholder="e.g., Barangay Assembly Meeting" required onChange={handleAnnouncementFieldChange} />
                {formErrors.title && <p className="text-[11px] text-red-500 mt-1">{formErrors.title}</p>}
              </div>
              <div>
                <FormSelect label="Category" name="category" value={announcementForm.category} options={categoryOptions} required onChange={handleAnnouncementFieldChange} />
                {formErrors.category && <p className="text-[11px] text-red-500 mt-1">{formErrors.category}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Content <span className="text-red-500 ml-0.5">*</span></label>
                <textarea value={announcementForm.content}
                  onChange={(e) => { setAnnouncementForm((f) => ({ ...f, content: e.target.value })); setFormErrors((prev) => ({ ...prev, content: undefined })); }}
                  placeholder="Write the announcement content here..."
                  rows={6}
                  className={cn("w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 resize-none", formErrors.content ? "border-red-500" : "border-border")}
                  style={{ "--tw-ring-color": "var(--accent-ring)" } as React.CSSProperties} />
                {formErrors.content
                  ? <p className="text-[11px] text-red-500 mt-1">{formErrors.content}</p>
                  : <p className="text-[11px] text-muted-foreground mt-1">{announcementForm.content.length} characters</p>}
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">This will be visible to all residents on your barangay&apos;s public portal.</p>
              </div>
            </div>
          )}

          {formTab === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg glass-subtle">
                <div>
                  <p className="text-sm font-medium text-foreground">Publish Immediately</p>
                  <p className="text-[11px] text-muted-foreground">Make this announcement visible on the public portal right away</p>
                </div>
                <button onClick={() => setAnnouncementForm((f) => ({ ...f, published: !f.published }))} className="shrink-0">
                  {announcementForm.published
                    ? <div className="w-10 h-6 rounded-full flex items-center justify-end px-0.5" style={{ background: "var(--accent-primary)" }}>
                        <div className="w-5 h-5 rounded-full bg-white" />
                      </div>
                    : <div className="w-10 h-6 rounded-full bg-muted flex items-center px-0.5">
                        <div className="w-5 h-5 rounded-full bg-white shadow" />
                      </div>
                  }
                </button>
              </div>

              {/* Preview */}
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Preview</p>
                <div className="p-4 rounded-lg glass-subtle">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-semibold text-foreground">{announcementForm.title || "Untitled Announcement"}</h4>
                    {announcementForm.published ? <Badge variant="success">Published</Badge> : <Badge variant="muted">Draft</Badge>}
                    <Badge variant="muted">{announcementForm.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{announcementForm.content || "No content yet..."}</p>
                </div>
              </div>

              {!announcementForm.published && (
                <div className="p-3 rounded-lg glass-subtle">
                  <p className="text-xs text-muted-foreground">
                    This announcement will be saved as a draft. You can publish it later from the announcements list using the action menu.
                  </p>
                </div>
              )}
            </div>
          )}
        </Modal>

      {/* View Announcement Modal */}
      {viewTarget && (
        <Modal open={showViewAnnouncement} title="Announcement Details" onClose={() => setShowViewAnnouncement(false)} size="md"
          footer={<>
            <ModalButton variant="secondary" onClick={() => setShowViewAnnouncement(false)}>Close</ModalButton>
            <ModalButton variant="primary" onClick={() => { setShowViewAnnouncement(false); openEdit(viewTarget); }}>Edit</ModalButton>
          </>}>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">{viewTarget.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              {viewTarget.published ? <Badge variant="success">Published</Badge> : <Badge variant="muted">Draft</Badge>}
              <Badge variant="muted">{viewTarget.category}</Badge>
              {viewTarget.published_at && <span className="text-[11px] text-muted-foreground">{viewTarget.published_at}</span>}
            </div>
            <div className="p-4 rounded-lg glass-subtle">
              <p className="text-sm text-foreground whitespace-pre-wrap">{viewTarget.content}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal open={showDeleteAnnouncement} title="Delete Announcement" onClose={() => setShowDeleteAnnouncement(false)} size="sm"
          footer={<>
            <ModalButton variant="secondary" onClick={() => setShowDeleteAnnouncement(false)}>Cancel</ModalButton>
            <ModalButton variant="danger" onClick={() => { setShowDeleteAnnouncement(false); addToast("Announcement deleted", "success"); }}>Delete</ModalButton>
          </>}>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">&ldquo;{deleteTarget.title}&rdquo;</span>? This action cannot be undone.
            </p>
            <div className="p-3 rounded-lg glass-subtle">
              <p className="text-sm font-medium text-foreground">{deleteTarget.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{deleteTarget.category}</p>
            </div>
            {deleteTarget.published && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-red-600 font-medium">
                  This announcement is currently published and visible on the public portal. Deleting it will immediately remove it from public view.
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          {toasts.map((toast) => (
            <div key={toast.id}
              className={cn("flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white animate-in slide-in-from-right-5 fade-in duration-300",
                toast.type === "success" ? "bg-emerald-600" : "bg-red-600")}>
              <span>{toast.message}</span>
              <button onClick={() => dismissToast(toast.id)} className="ml-1 hover:opacity-80">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
