"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import {
  LayoutDashboard,
  Users,
  FileText,
  Scale,
  Shield,
  Building2,
  Map,
  Gavel,
  BarChart3,
  Settings,
  Bot,
  Globe,
  AlertTriangle,
  Heart,
  UserCog,
  Package,
  Receipt,
  ClipboardList,
  MapPin,
  HardDrive,
  MessageCircle,
  ChevronDown,
  HelpCircle,
  Sparkles,
  Mail,
  ShoppingBag,
} from "lucide-react";
import { useState } from "react";

interface NavItemDef {
  labelKey: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavGroupDef {
  titleKey: string;
  items: NavItemDef[];
  collapsible?: boolean;
}

const navGroupDefs: NavGroupDef[] = [
  {
    titleKey: "overview",
    items: [
      { labelKey: "dashboard", href: "/dashboard", icon: LayoutDashboard },
      { labelKey: "map", href: "/dashboard/map", icon: Map },
    ],
  },
  {
    titleKey: "records",
    items: [
      { labelKey: "residents", href: "/dashboard/residents", icon: Users },
      { labelKey: "establishments", href: "/dashboard/establishments", icon: Building2 },
      { labelKey: "lotsBuildings", href: "/dashboard/lots-buildings", icon: MapPin },
      { labelKey: "voters", href: "/dashboard/voters", icon: ClipboardList },
    ],
  },
  {
    titleKey: "judicial",
    items: [
      { labelKey: "caseRecords", href: "/dashboard/judicial/kp-cases", icon: Scale },
      { labelKey: "blotterRecords", href: "/dashboard/judicial/blotter", icon: Gavel },
      { labelKey: "vawcRecords", href: "/dashboard/vawc", icon: Shield },
    ],
  },
  {
    titleKey: "services",
    items: [
      { labelKey: "documents", href: "/dashboard/documents", icon: FileText },
      { labelKey: "requests", href: "/dashboard/requests", icon: Receipt },
      { labelKey: "reports", href: "/dashboard/reports", icon: BarChart3 },
    ],
  },
  {
    titleKey: "tools",
    items: [
      { labelKey: "mabiniAi", href: "/dashboard/ai", icon: Bot },
      { labelKey: "email", href: "/dashboard/email", icon: Mail },
      { labelKey: "marketplace", href: "/dashboard/marketplace", icon: ShoppingBag },
      { labelKey: "drive", href: "/dashboard/drive", icon: HardDrive },
      { labelKey: "publicPortal", href: "/dashboard/public-portal", icon: Globe },
      { labelKey: "supportTickets", href: "/dashboard/support", icon: MessageCircle },
    ],
  },
  {
    titleKey: "operations",
    collapsible: true,
    items: [
      { labelKey: "tanod", href: "/dashboard/tanod", icon: Shield },
      { labelKey: "finance", href: "/dashboard/finance", icon: Receipt },
      { labelKey: "inventory", href: "/dashboard/inventory", icon: Package },
      { labelKey: "disasterDrrm", href: "/dashboard/disaster", icon: AlertTriangle },
      { labelKey: "gad", href: "/dashboard/gad", icon: Heart },
      { labelKey: "hris", href: "/dashboard/hris", icon: UserCog },
    ],
  },
];

const bottomNavItems: NavItemDef[] = [
  { labelKey: "updates", href: "/dashboard/updates", icon: Sparkles },
  { labelKey: "settings", href: "/dashboard/settings", icon: Settings },
  { labelKey: "helpManual", href: "/dashboard/help", icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const barangay = user?.barangay;
  const barangayName = barangay?.name || "Loading...";
  const subscriptionLabel = barangay?.subscription_plan
    ? barangay.subscription_plan.charAt(0).toUpperCase() + barangay.subscription_plan.slice(1) + " Plan"
    : "Free Plan";

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  const toggleGroup = (titleKey: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [titleKey]: !prev[titleKey] }));
  };

  // Resolve translation key to label
  const navLabel = (key: string): string => {
    return (t.nav as Record<string, string>)[key] || key;
  };

  return (
    <aside className="hidden lg:flex flex-col w-[232px] glass-sidebar h-screen sticky top-0 shrink-0 overflow-hidden">
      {/* Barangay Identity */}
      <div className="px-3 pt-4 pb-2">
        <div className="relative rounded-xl p-3 overflow-hidden" style={{ background: "var(--accent-primary)" }}>
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 20%, white 0.5px, transparent 0.5px)", backgroundSize: "12px 12px" }} />
          <div className="relative">
            <div className="flex items-center gap-2.5">
              {barangay?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={barangay.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0 ring-2 ring-white/30" />
              ) : (
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white/20 backdrop-blur-sm">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-white truncate leading-tight">Brgy. {barangayName}</p>
                <p className="text-[11px] text-white/70 truncate leading-tight mt-0.5">{subscriptionLabel}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/15">
              <span className="text-[10px] font-semibold text-white/50 tracking-wider uppercase">kapitan.ph</span>
              <span className="flex items-center gap-1 text-[9px] font-medium text-white/40 bg-white/10 px-1.5 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                v5.0
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation — fills remaining space, scrolls when content overflows */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-2 mt-1 pb-2">
        {navGroupDefs.map((group, gi) => {
          const isCollapsed = group.collapsible && collapsedGroups[group.titleKey];
          const groupTitle = group.titleKey ? navLabel(group.titleKey) : "";

          return (
            <div key={gi} className="mb-1">
              {groupTitle && (
                <button
                  onClick={group.collapsible ? () => toggleGroup(group.titleKey) : undefined}
                  className={cn(
                    "flex items-center justify-between w-full px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground/70 tracking-widest uppercase",
                    group.collapsible && "hover:text-muted-foreground cursor-pointer transition-colors"
                  )}
                >
                  <span>{groupTitle}</span>
                  {group.collapsible && (
                    <ChevronDown className={cn("w-3 h-3 transition-transform", isCollapsed && "-rotate-90")} />
                  )}
                </button>
              )}
              {!isCollapsed && (
                <div className="space-y-px">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    const label = navLabel(item.labelKey);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] transition-all duration-150",
                          active
                            ? "font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-sidebar-hover"
                        )}
                        style={active ? { color: "var(--accent-primary)", background: "var(--accent-bg)" } : undefined}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="flex-1 truncate">{label}</span>
                        {item.badge !== undefined && (
                          <span
                            className={cn(
                              "min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-semibold px-1",
                              active
                                ? "text-white"
                                : "bg-muted text-muted-foreground"
                            )}
                            style={active ? { background: "var(--accent-primary)" } : undefined}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User profile card */}
      {user && (
        <div className="px-3 py-2.5 mx-2 mb-2 rounded-xl glass-subtle shrink-0">
          <div className="flex items-center gap-2.5">
            {user.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photo_url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: "var(--accent-primary)" }}
              >
                {(user.first_name?.[0] || "").toUpperCase()}{(user.last_name?.[0] || "").toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-foreground truncate leading-tight">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-[10px] text-muted-foreground truncate leading-tight capitalize">
                {user.roles?.[0]?.replace(/_/g, " ") || "Staff"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom — Settings & Help pinned */}
      <div className="px-2 pb-3 border-t border-border/50 pt-2 shrink-0">
        <div className="space-y-px">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const label = navLabel(item.labelKey);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] transition-all duration-150",
                  active
                    ? "font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-hover"
                )}
                style={active ? { color: "var(--accent-primary)", background: "var(--accent-bg)" } : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
