"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MabiniInsightBanner } from "@/components/mabini-insight-banner";
import {
  Search,
  ChevronRight,
  Rocket,
  LayoutDashboard,
  Building2,
  Landmark,
  Vote,
  Users,
  MessageCircle,
  Bell,
  Server,
  Settings,
  Lightbulb,
  LifeBuoy,
  BookOpen,
  Shield,
  KeyRound,
  BarChart3,
  Megaphone,
  Wrench,
  ArrowUp,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

/* -------------------------------------------------------------------------- */
/*  Reusable Blocks                                                           */
/* -------------------------------------------------------------------------- */

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-3 mt-3">
      {steps.map((step, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="shrink-0 w-6 h-6 rounded-full bg-orange-500/10 text-orange-600 text-xs font-bold flex items-center justify-center mt-0.5">
            {i + 1}
          </span>
          <span className="text-sm text-foreground/80 leading-relaxed">{step}</span>
        </li>
      ))}
    </ol>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 mt-4 p-3 rounded-lg bg-amber-950/20 border border-amber-800/30">
      <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <p className="text-xs text-amber-400/80 leading-relaxed">{children}</p>
    </div>
  );
}

function InfoCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
    </div>
  );
}

function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-orange-600" />
        </div>
        <h2 className="text-base font-bold text-foreground">{title}</h2>
      </div>
      <div className="px-5 pb-5">{children}</div>
    </div>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-foreground mt-5 mb-1">{children}</h3>;
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-foreground/80 leading-relaxed">{children}</p>;
}

/* -------------------------------------------------------------------------- */
/*  Section Definitions                                                       */
/* -------------------------------------------------------------------------- */

function buildSections(): Section[] {
  return [
    /* ---- Getting Started ---- */
    {
      id: "getting-started",
      title: "Getting Started",
      icon: Rocket,
      content: (
        <>
          <Paragraph>
            founder.primex.ventures is the centralized command center for all PrimeX Ventures products.
            It gives the founder a single dashboard to manage BCMP (kapitan.ph), LGMP (tarlac.ph),
            and PDMP campaigns across the Philippines, plus the Family Vault for family documentation.
          </Paragraph>

          <SubHeading>Who has access?</SubHeading>
          <Paragraph>
            Only the PrimeX founder (Jeager). Barangay clerks and LGU users log in to their respective
            product portals (kapitan.ph, tarlac.ph). They never see this dashboard.
          </Paragraph>

          <SubHeading>Logging in</SubHeading>
          <StepList
            steps={[
              "Navigate to founder.primex.ventures.",
              "Enter your passphrase on the login screen.",
              "You will land on the monitoring dashboard.",
            ]}
          />

          <Callout>
            The passphrase is set in the server environment. Contact the system administrator if you
            need it changed.
          </Callout>
        </>
      ),
    },

    /* ---- Command Center ---- */
    {
      id: "command-center",
      title: "Command Center",
      icon: LayoutDashboard,
      content: (
        <>
          <Paragraph>
            The Command Center is the main landing page after login. It provides a real-time
            overview of every product, revenue metrics, server health, and recent activity
            across the entire PrimeX ecosystem.
          </Paragraph>

          <SubHeading>Key widgets</SubHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <InfoCard title="Quick Stats" description="Live counts for total products, tenants, departments, monthly revenue, and active users." />
            <InfoCard title="Product Cards" description="BCMP, LGMP, and PDMP cards showing barangay count, user count, and MRR. Click any card to drill into that product." />
            <InfoCard title="Combined Revenue" description="Breakdown of revenue contribution per product with percentage bars." />
            <InfoCard title="Recent Activity" description="Chronological feed of registrations, renewals, tickets, and deployments." />
            <InfoCard title="Infrastructure" description="Live CPU and RAM metrics for key servers. Click 'Details' to open the full Infrastructure page." />
            <InfoCard title="Mabini AI Insight" description="AI-generated summary of key metrics and action items that need your attention." />
          </div>

          <Callout>
            The Command Center refreshes automatically. Pull-to-refresh or hard-reload (Ctrl+Shift+R)
            if data appears stale.
          </Callout>
        </>
      ),
    },

    /* ---- BCMP Management ---- */
    {
      id: "bcmp-management",
      title: "BCMP Management",
      icon: Building2,
      content: (
        <>
          <Paragraph>
            BCMP (Barangay Comprehensive Management Platform) is the core product hosted on
            kapitan.ph. This section lets you manage barangay tenants, subscriptions, and
            view analytics across all onboarded barangays.
          </Paragraph>

          <SubHeading>Barangay Tenants</SubHeading>
          <Paragraph>
            Each barangay is a tenant in the multi-tenant system. From this page you can:
          </Paragraph>
          <StepList
            steps={[
              "View all onboarded barangays with their status (Active, Suspended, Pending).",
              "Click a tenant to view details: barangay name, municipality, province, number of users, subscription status, and last activity date.",
              "Onboard a new barangay by clicking the 'Add Tenant' button and filling in the required fields.",
              "Suspend or reactivate a tenant if needed (e.g., non-payment or contract expiry).",
            ]}
          />

          <SubHeading>Subscriptions</SubHeading>
          <Paragraph>
            Track subscription plans, renewal dates, and payment status per barangay. Filter by
            status (active, expiring soon, expired) to prioritize follow-ups.
          </Paragraph>

          <SubHeading>Analytics</SubHeading>
          <Paragraph>
            Cross-barangay analytics including resident registration rates, active user counts,
            certificate issuance volume, and module usage heatmaps. Use these insights to identify
            upsell opportunities and low-engagement tenants.
          </Paragraph>

          <Callout>
            BCMP data is isolated per tenant. This dashboard shows aggregate
            analytics, but individual barangay data is only accessible to that barangay&apos;s
            authorized users on kapitan.ph.
          </Callout>
        </>
      ),
    },

    /* ---- LGMP Management ---- */
    {
      id: "lgmp-management",
      title: "LGMP Management",
      icon: Landmark,
      content: (
        <>
          <Paragraph>
            LGMP (Local Government Management Platform) powers provincial government operations.
            Currently deployed for Tarlac Province under Governor Christian Yap.
          </Paragraph>

          <SubHeading>Managing departments</SubHeading>
          <StepList
            steps={[
              "Navigate to the LGMP section via the sidebar.",
              "View all onboarded departments (PGO, PPDO, PSOC, and incoming departments).",
              "Click a department to see its user count, active tasks, and activity summary.",
              "Onboard a new department by clicking 'Add Department' and providing the department name, abbreviation, and designated administrator.",
              "Monitor cross-department coordination and task completion rates from the overview.",
            ]}
          />

          <Callout>
            LGMP is designed to be province-agnostic. The Tarlac deployment serves as the
            template for future provincial clients. Keep documentation and processes
            replicable.
          </Callout>
        </>
      ),
    },

    /* ---- PDMP Management ---- */
    {
      id: "pdmp-management",
      title: "PDMP Management",
      icon: Vote,
      content: (
        <>
          <Paragraph>
            PDMP (Political Data Management Platform) is the campaign intelligence product.
            It handles voter profiling, campaign CRM, survey analytics, and ground operations.
            PDMP is currently in the planning stage.
          </Paragraph>

          <SubHeading>What will be available here</SubHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <InfoCard title="Campaign Management" description="Create and manage political campaigns per client. Each campaign is fully isolated." />
            <InfoCard title="Voter Profiling" description="Import, segment, and analyze voter data with precinct-level granularity." />
            <InfoCard title="Survey Analytics" description="Build questionnaires, deploy surveys, and track sentiment over time." />
            <InfoCard title="SMS Outreach" description="Manage voter contact campaigns with per-client SMS credit pools." />
          </div>

          <div className="flex items-start gap-2.5 mt-4 p-3 rounded-lg bg-red-950/20 border border-red-800/30">
            <Shield className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-400/80 leading-relaxed">
              PDMP runs on completely separate infrastructure from BCMP and LGMP. No shared
              servers, databases, or credentials. This is a legal and compliance requirement
              (RA 10173).
            </p>
          </div>
        </>
      ),
    },

    /* ---- Admin Users ---- */
    {
      id: "admin-users",
      title: "Admin Users",
      icon: Users,
      content: (
        <>
          <Paragraph>
            Manage the admin accounts that have access to this platform. These are PrimeX
            internal staff only. Barangay and LGU users are managed within their respective
            product tenants.
          </Paragraph>

          <SubHeading>User management tasks</SubHeading>
          <StepList
            steps={[
              "View all admin users with their role, last login date, and 2FA status.",
              "Create a new admin by clicking 'Add User' and assigning a role (Super Admin, Product Admin, Support Agent, Viewer).",
              "Edit user roles or deactivate accounts for team members who no longer need access.",
              "Force a password reset if a user's credentials may have been compromised.",
              "Review the activity log for any user to see their recent actions in the system.",
            ]}
          />

          <SubHeading>Role hierarchy</SubHeading>
          <div className="space-y-2 mt-2">
            {[
              { role: "Super Admin", desc: "Full access to all products, settings, and user management." },
              { role: "Product Admin", desc: "Full access to assigned product(s), read-only on others." },
              { role: "Support Agent", desc: "Access to support tickets and read-only tenant data." },
              { role: "Viewer", desc: "Read-only access to dashboards and analytics. No edit capabilities." },
            ].map((r) => (
              <div key={r.role} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/30">
                <KeyRound className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-foreground">{r.role}</p>
                  <p className="text-[11px] text-muted-foreground">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ),
    },

    /* ---- Support Tickets ---- */
    {
      id: "support-tickets",
      title: "Support Tickets",
      icon: MessageCircle,
      content: (
        <>
          <Paragraph>
            Centralized support queue for issues reported by barangay users, LGU staff, and
            internal team members across all products.
          </Paragraph>

          <SubHeading>Handling a support ticket</SubHeading>
          <StepList
            steps={[
              "Open the Support page from the sidebar. Tickets are sorted by priority (urgent first).",
              "Click a ticket to see the full description, screenshots, affected product, and reporter details.",
              "Assign the ticket to yourself or another admin using the assignee dropdown.",
              "Update the status as you work: Open, In Progress, Waiting on User, Resolved, Closed.",
              "Add internal notes (visible to admins only) or a public reply (visible to the reporter).",
              "Once resolved, mark the ticket as Closed. The reporter receives a notification.",
            ]}
          />

          <Callout>
            High-priority tickets (server down, data loss, security incidents) trigger Telegram
            alerts automatically. Respond to these within 15 minutes during business hours.
          </Callout>
        </>
      ),
    },

    /* ---- Platform Updates ---- */
    {
      id: "platform-updates",
      title: "Platform Updates",
      icon: Bell,
      content: (
        <>
          <Paragraph>
            Publish and manage platform announcements that appear across all PrimeX products.
            Use this for release notes, maintenance windows, and important notices.
          </Paragraph>

          <SubHeading>Publishing an update</SubHeading>
          <StepList
            steps={[
              "Navigate to Platform Updates from the sidebar.",
              "Click 'New Update' and fill in the title, description, and target audience (all products, BCMP only, LGMP only, etc.).",
              "Set the update type: Release Note, Maintenance Notice, Security Advisory, or General Announcement.",
              "Choose visibility: Published (visible immediately) or Draft (visible only to admins).",
              "Click Publish. The update appears in the notification feed of all affected products.",
            ]}
          />

          <SubHeading>Scheduling maintenance</SubHeading>
          <Paragraph>
            For planned maintenance, create the update at least 24 hours in advance. Set the
            type to &quot;Maintenance Notice&quot; and include the expected start time, duration, and
            affected services. The system will display a banner on affected product dashboards.
          </Paragraph>
        </>
      ),
    },

    /* ---- Infrastructure ---- */
    {
      id: "infrastructure",
      title: "Infrastructure",
      icon: Server,
      content: (
        <>
          <Paragraph>
            Monitor the health of all DigitalOcean droplets, managed databases, and services
            powering the PrimeX ecosystem.
          </Paragraph>

          <SubHeading>Monitored resources</SubHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <InfoCard title="Droplets" description="CPU, RAM, disk, and network metrics for PrimeXV4, primex-production, tarlac-assets, and other servers." />
            <InfoCard title="Managed Databases" description="Connection pool usage, query latency, and storage consumption for PostgreSQL and MySQL clusters." />
            <InfoCard title="CI/CD Pipelines" description="GitLab pipeline status for all repositories (bcmp-api, bcmp-web, primex-api, primex-founder-web)." />
            <InfoCard title="Domains & SSL" description="Cloudflare certificate status, HSTS compliance, and DNS record health across all 15 domains." />
          </div>

          <SubHeading>Responding to alerts</SubHeading>
          <StepList
            steps={[
              "Check the Infrastructure page for any server showing amber or red status indicators.",
              "Click the affected server to see detailed time-series metrics (CPU, RAM, disk I/O).",
              "If a server is critically overloaded, coordinate with Ryan Calvelo for immediate action (he has SSH access).",
              "For database alerts, check active connections and long-running queries. Kill hung queries if needed.",
              "Document the incident in a ClickUp task under the OPERATIONS space.",
            ]}
          />

          <Callout>
            The PrimeXV4 droplet runs at 85% average RAM. This is normal and cannot be
            downsized. If RAM consistently exceeds 95%, that is an actionable alert.
          </Callout>
        </>
      ),
    },

    /* ---- Settings ---- */
    {
      id: "settings",
      title: "Settings",
      icon: Settings,
      content: (
        <>
          <Paragraph>
            Platform-wide configuration that applies across all products managed by this dashboard.
          </Paragraph>

          <SubHeading>Settings tabs</SubHeading>
          <div className="space-y-2 mt-2">
            {[
              { tab: "General", icon: Settings, desc: "Platform name, version, managed product list." },
              { tab: "Security", icon: Shield, desc: "2FA enforcement, session timeout, login lockout, RA 10173 compliance mode, audit logging." },
              { tab: "Notifications", icon: Bell, desc: "Configure which events trigger email and Telegram alerts." },
              { tab: "Integrations", icon: Wrench, desc: "Connection status for Telegram Bot, TXTBOX, Anthropic AI, DigitalOcean, Cloudflare, and GitLab CI/CD." },
              { tab: "Maintenance", icon: Wrench, desc: "Clear cache, run backups, export data, view logs, and check system versions." },
            ].map((t) => (
              <div key={t.tab} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/30">
                <t.icon className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-foreground">{t.tab}</p>
                  <p className="text-[11px] text-muted-foreground">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Callout>
            Changes to Security settings (especially 2FA enforcement and session timeout)
            affect all admin users immediately. Coordinate with the team before making changes.
          </Callout>
        </>
      ),
    },

    /* ---- Tips & Tricks ---- */
    {
      id: "tips-tricks",
      title: "Tips & Tricks",
      icon: Lightbulb,
      content: (
        <>
          <Paragraph>
            Practical advice for getting the most out of the PrimeX Founder dashboard.
          </Paragraph>

          <div className="space-y-3 mt-3">
            {[
              {
                title: "Use keyboard shortcuts",
                desc: "Press Ctrl+K (Cmd+K on Mac) to open the global search. Type a barangay name, department, or ticket number to jump directly to it.",
              },
              {
                title: "Check Mabini AI insights daily",
                desc: "The AI insight banner on the Command Center highlights metrics that need attention. It analyzes trends across all products and surfaces the most important action items.",
              },
              {
                title: "Monitor expiring subscriptions weekly",
                desc: "Navigate to BCMP > Subscriptions and filter by 'Expiring Soon'. Reach out to barangays at least 30 days before renewal to prevent churn.",
              },
              {
                title: "Review audit logs after team changes",
                desc: "After adding or removing admin users, check Settings > Security to ensure audit logging captured all changes. This is required for RA 10173 compliance.",
              },
              {
                title: "Use the Infrastructure page proactively",
                desc: "Don't wait for alerts. Check server metrics at least once per day, especially the PrimeXV4 droplet (production BCMP) and tarlac-assets (production LGMP).",
              },
              {
                title: "Coordinate PDMP discussions offline",
                desc: "PDMP data is highly sensitive (voter profiling, campaign intelligence). Never discuss specific voter data or campaign strategies in support tickets or public channels.",
              },
            ].map((tip) => (
              <div key={tip.title} className="p-3 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-sm font-semibold text-foreground">{tip.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tip.desc}</p>
              </div>
            ))}
          </div>
        </>
      ),
    },

    /* ---- Need More Help ---- */
    {
      id: "need-more-help",
      title: "Need More Help?",
      icon: LifeBuoy,
      content: (
        <>
          <Paragraph>
            If this guide does not answer your question, here are additional resources and
            contact channels.
          </Paragraph>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {[
              {
                title: "Contact the Founder",
                desc: "For account issues, permission changes, or urgent platform problems, contact Jeager directly via Telegram.",
                icon: MessageCircle,
              },
              {
                title: "ClickUp Knowledge Base",
                desc: "SOPs, process documents, and team guides are maintained in ClickUp Docs under each product's space.",
                icon: BookOpen,
              },
              {
                title: "Report a Bug",
                desc: "Create a support ticket from the Support page. Include screenshots, steps to reproduce, and the affected product/page.",
                icon: Megaphone,
              },
              {
                title: "Request a Feature",
                desc: "Feature requests go through ClickUp. Create a task in the relevant product space (BCMP, LGMP, PDMP) with the BACKLOG status.",
                icon: BarChart3,
              },
            ].map((resource) => (
              <div key={resource.title} className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <resource.icon className="w-4 h-4 text-orange-600" />
                  <p className="text-sm font-semibold text-foreground">{resource.title}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{resource.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-800/30">
            <p className="text-sm font-semibold text-foreground">System built and maintained by PrimeX Ventures Inc.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Copyright 2015-2026 All Rights Reserved. Powered by Next.js, Laravel, PostgreSQL, and DigitalOcean.
            </p>
          </div>
        </>
      ),
    },
  ];
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                            */
/* -------------------------------------------------------------------------- */

export default function HelpPage() {
  const sections = useMemo(() => buildSections(), []);
  const [activeId, setActiveId] = useState(sections[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  /* Scroll spy: update active section on scroll */
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    function onScroll() {
      if (!container) return;
      setShowBackToTop(container.scrollTop > 400);

      const headings = container.querySelectorAll<HTMLElement>("[data-section-id]");
      let current = sections[0].id;
      for (const heading of headings) {
        if (heading.offsetTop - container.scrollTop <= 120) {
          current = heading.dataset.sectionId ?? current;
        }
      }
      setActiveId(current);
    }

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [sections]);

  /* Filter sections by search */
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections.filter(
      (s) => s.title.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    );
  }, [sections, searchQuery]);

  /* Scroll to section on click */
  function scrollToSection(id: string) {
    setActiveId(id);
    const el = contentRef.current?.querySelector(`[data-section-id="${id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function scrollToTop() {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="p-6 space-y-4">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span>System</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">Help &amp; Manual</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Help &amp; Manual</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Everything you need to know about using the PrimeX Founder dashboard
        </p>
      </div>

      <MabiniInsightBanner message="This guide covers all modules in the PrimeX Founder dashboard. Use the search bar or table of contents to jump to a specific topic." />

      {/* Two-column layout */}
      <div className="flex gap-6 items-start">
        {/* Sidebar / Table of Contents */}
        <aside className="hidden xl:block w-[260px] shrink-0 sticky top-[88px]">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-muted/50 border-none text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-orange-500/40"
                />
              </div>
            </div>

            {/* Section list */}
            <nav className="p-2 max-h-[calc(100vh-280px)] overflow-y-auto">
              <div className="space-y-0.5">
                {filteredSections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeId === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors",
                        isActive
                          ? "bg-orange-500/10 text-orange-600 font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-xs truncate">{section.title}</span>
                    </button>
                  );
                })}
              </div>

              {filteredSections.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No matching topics found.
                </p>
              )}
            </nav>
          </div>
        </aside>

        {/* Content area */}
        <div
          ref={contentRef}
          className="flex-1 min-w-0 space-y-6 max-h-[calc(100vh-240px)] overflow-y-auto pr-1 scroll-smooth"
        >
          {filteredSections.map((section) => (
            <div key={section.id} data-section-id={section.id}>
              <SectionCard icon={section.icon} title={section.title}>
                {section.content}
              </SectionCard>
            </div>
          ))}

          {filteredSections.length === 0 && (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <Search className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">No results found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try a different search term or clear the search bar to see all topics.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Back to top button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-10 h-10 rounded-full bg-orange-600 text-white shadow-lg shadow-orange-600/20 flex items-center justify-center hover:bg-orange-700 transition-colors z-50"
          aria-label="Back to top"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
