"use client";

import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/language-context";
import {
  Search,
  BookOpen,
  Users,
  FileText,
  LayoutDashboard,
  Gavel,
  Receipt,
  BarChart3,
  Settings,
  UserCog,
  Lightbulb,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  LogIn,
  KeyRound,
  Bot,
  Shield,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";

interface HelpSection {
  id: string;
  icon: React.ElementType;
  titleKey: string;
  descKey: string;
  subsections: HelpSubsection[];
}

interface HelpSubsection {
  id: string;
  titleKey: string;
  type: "text" | "steps" | "tips";
  contentKey?: string;
  stepsKey?: string;
}

// Define help structure (keys map to translation strings)
const helpSections: HelpSection[] = [
  {
    id: "getting-started",
    icon: BookOpen,
    titleKey: "gettingStarted",
    descKey: "gettingStartedDesc",
    subsections: [
      { id: "what-is", titleKey: "whatIsKapitan", type: "text", contentKey: "whatIsKapitanContent" },
      { id: "login", titleKey: "howToLogin", type: "steps", stepsKey: "howToLoginSteps" },
      { id: "forgot-pw", titleKey: "forgotPassword", type: "steps", stepsKey: "forgotPasswordSteps" },
    ],
  },
  {
    id: "dashboard",
    icon: LayoutDashboard,
    titleKey: "dashboardTitle",
    descKey: "dashboardDesc",
    subsections: [
      { id: "dashboard-overview", titleKey: "dashboardTitle", type: "text", contentKey: "dashboardContent" },
    ],
  },
  {
    id: "residents",
    icon: Users,
    titleKey: "residentsTitle",
    descKey: "residentsDesc",
    subsections: [
      { id: "add-resident", titleKey: "addResident", type: "steps", stepsKey: "addResidentSteps" },
      { id: "search-resident", titleKey: "searchResident", type: "steps", stepsKey: "searchResidentSteps" },
    ],
  },
  {
    id: "documents",
    icon: FileText,
    titleKey: "documentsTitle",
    descKey: "documentsDesc",
    subsections: [
      { id: "documents-overview", titleKey: "documentsTitle", type: "text", contentKey: "documentsContent" },
      { id: "generate-doc", titleKey: "generateDocument", type: "steps", stepsKey: "generateDocumentSteps" },
    ],
  },
  {
    id: "blotter",
    icon: Gavel,
    titleKey: "blotterTitle",
    descKey: "blotterDesc",
    subsections: [
      { id: "blotter-overview", titleKey: "blotterTitle", type: "text", contentKey: "blotterContent" },
    ],
  },
  {
    id: "requests",
    icon: Receipt,
    titleKey: "requestsTitle",
    descKey: "requestsDesc",
    subsections: [
      { id: "requests-overview", titleKey: "requestsTitle", type: "text", contentKey: "requestsContent" },
    ],
  },
  {
    id: "reports",
    icon: BarChart3,
    titleKey: "reportsTitle",
    descKey: "reportsDesc",
    subsections: [
      { id: "reports-overview", titleKey: "reportsTitle", type: "text", contentKey: "reportsContent" },
    ],
  },
  {
    id: "settings",
    icon: Settings,
    titleKey: "settingsTitle",
    descKey: "settingsDesc",
    subsections: [
      { id: "settings-overview", titleKey: "settingsTitle", type: "text", contentKey: "settingsContent" },
    ],
  },
  {
    id: "account",
    icon: UserCog,
    titleKey: "accountTitle",
    descKey: "accountDesc",
    subsections: [
      { id: "account-overview", titleKey: "accountTitle", type: "text", contentKey: "accountContent" },
    ],
  },
  {
    id: "tips",
    icon: Lightbulb,
    titleKey: "tipsTitle",
    descKey: "tipsTitle",
    subsections: [],
  },
];

// Icons for specific subsections
const subsectionIcons: Record<string, React.ElementType> = {
  "what-is": HelpCircle,
  login: LogIn,
  "forgot-pw": KeyRound,
  "dashboard-overview": LayoutDashboard,
  "add-resident": Users,
  "search-resident": Search,
  "documents-overview": FileText,
  "generate-doc": FileText,
  "blotter-overview": Gavel,
  "requests-overview": Receipt,
  "reports-overview": BarChart3,
  "settings-overview": Settings,
  "account-overview": UserCog,
};

export default function HelpPage() {
  const { t, language } = useLanguage();
  const [activeSection, setActiveSection] = useState("getting-started");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "getting-started": true,
  });
  const [searchQuery, setSearchQuery] = useState("");

  const help = t.help;

  // Filter sections based on search
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return helpSections;
    const q = searchQuery.toLowerCase();
    return helpSections.filter((section) => {
      const title = (help as Record<string, unknown>)[section.titleKey] as string;
      const desc = (help as Record<string, unknown>)[section.descKey] as string;
      if (title?.toLowerCase().includes(q) || desc?.toLowerCase().includes(q)) return true;
      return section.subsections.some((sub) => {
        const subTitle = (help as Record<string, unknown>)[sub.titleKey] as string;
        const subContent = sub.contentKey ? (help as Record<string, unknown>)[sub.contentKey] as string : "";
        return subTitle?.toLowerCase().includes(q) || subContent?.toLowerCase().includes(q);
      });
    });
  }, [searchQuery, help]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const currentSection = helpSections.find((s) => s.id === activeSection);

  const renderContent = (section: HelpSection) => {
    const Icon = section.icon;
    const title = (help as Record<string, unknown>)[section.titleKey] as string;
    const desc = (help as Record<string, unknown>)[section.descKey] as string;

    return (
      <div className="space-y-6">
        {/* Section header */}
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
            style={{ background: "var(--accent-primary)" }}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
        </div>

        {/* Tips section (special) */}
        {section.id === "tips" && (
          <div className="space-y-3">
            {(["tipKeyboard", "tipTheme", "tipFullscreen", "tipAi"] as const).map((key) => (
              <div key={key} className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
                <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{(help as Record<string, unknown>)[key] as string}</p>
              </div>
            ))}

            {/* Need more help */}
            <div className="mt-6 p-5 rounded-xl glass-subtle">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-sm font-bold text-foreground">{help.needMoreHelp}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{help.needMoreHelpContent}</p>
              <p className="text-sm text-muted-foreground">{help.supportEmail}</p>
              <p className="text-sm text-muted-foreground">{help.supportTicket}</p>
            </div>
          </div>
        )}

        {/* Subsections */}
        {section.subsections.map((sub) => {
          const SubIcon = subsectionIcons[sub.id] || HelpCircle;
          const subTitle = (help as Record<string, unknown>)[sub.titleKey] as string;

          return (
            <div key={sub.id} className="rounded-xl glass overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 bg-muted/30">
                <SubIcon className="w-4.5 h-4.5 text-muted-foreground shrink-0" />
                <h3 className="text-[15px] font-semibold text-foreground">{subTitle}</h3>
              </div>
              <div className="px-5 py-4">
                {sub.type === "text" && sub.contentKey && (
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {(help as Record<string, unknown>)[sub.contentKey] as string}
                  </p>
                )}
                {sub.type === "steps" && sub.stepsKey && (
                  <ol className="space-y-3">
                    {((help as Record<string, unknown>)[sub.stepsKey] as string[]).map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span
                          className="flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold shrink-0 mt-0.5"
                          style={{ background: "var(--accent-primary)" }}
                        >
                          {i + 1}
                        </span>
                        <span className="text-sm text-foreground/80 leading-relaxed pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="-m-6">
      {/* Header */}
      <div className="px-6 pt-6 pb-0">
        <PageHeader
          title={help.title}
          description={help.subtitle}
        />
      </div>

      {/* Two-column layout */}
      <div className="flex min-h-[calc(100vh-220px)]">
        {/* Left sidebar - Table of Contents */}
        <div className="w-72 shrink-0 border-r border-border bg-muted/20 p-4 overflow-y-auto">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={help.searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-accent-ring"
            />
          </div>

          {/* Sections */}
          <nav className="space-y-0.5">
            {filteredSections.map((section) => {
              const Icon = section.icon;
              const title = (help as Record<string, unknown>)[section.titleKey] as string;
              const isActive = activeSection === section.id;
              const isExpanded = expandedSections[section.id];
              const hasSubs = section.subsections.length > 0;

              return (
                <div key={section.id}>
                  <button
                    onClick={() => {
                      setActiveSection(section.id);
                      if (hasSubs) toggleSection(section.id);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors",
                      isActive
                        ? "font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    style={
                      isActive
                        ? { color: "var(--accent-primary)", background: "var(--accent-bg)" }
                        : undefined
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left truncate">{title}</span>
                    {hasSubs && (
                      <ChevronDown
                        className={cn(
                          "w-3.5 h-3.5 shrink-0 transition-transform",
                          !isExpanded && "-rotate-90"
                        )}
                      />
                    )}
                  </button>
                  {hasSubs && isExpanded && (
                    <div className="ml-6 mt-0.5 space-y-0.5 border-l border-border/50 pl-3">
                      {section.subsections.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => setActiveSection(section.id)}
                          className="w-full text-left text-[12px] text-muted-foreground hover:text-foreground px-2 py-1.5 rounded transition-colors truncate"
                        >
                          {(help as Record<string, unknown>)[sub.titleKey] as string}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Mabini AI help */}
          <div className="mt-6 p-3 rounded-xl glass">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
              <span className="text-xs font-semibold text-foreground">Mabini AI</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {language === "fil"
                ? "May tanong ka? I-click ang Mabini AI icon sa header para magtanong."
                : "Have a question? Click the Mabini AI icon in the header to ask anything."}
            </p>
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-3xl">
            {currentSection && renderContent(currentSection)}
          </div>
        </div>
      </div>
    </div>
  );
}
