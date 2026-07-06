"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, resolvePhotoUrl } from "@/lib/utils";
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
  HelpCircle,
  Sparkles,
  Mail,
  ShoppingBag,
  Landmark,
} from "lucide-react";

interface NavItemDef {
  labelKey: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  permission?: string;
}

interface NavGroupDef {
  titleKey: string;
  items: NavItemDef[];
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
      { labelKey: "residents", href: "/dashboard/residents", icon: Users, permission: "residents.view" },
      { labelKey: "establishments", href: "/dashboard/establishments", icon: Building2, permission: "establishments.view" },
      { labelKey: "lotsBuildings", href: "/dashboard/lots-buildings", icon: MapPin, permission: "lots-buildings.view" },
      { labelKey: "voters", href: "/dashboard/voters", icon: ClipboardList, permission: "residents.view" },
    ],
  },
  {
    titleKey: "judicial",
    items: [
      { labelKey: "caseRecords", href: "/dashboard/judicial/kp-cases", icon: Scale, permission: "kp-cases.view" },
      { labelKey: "blotterRecords", href: "/dashboard/judicial/blotter", icon: Gavel, permission: "blotters.view" },
      { labelKey: "vawcRecords", href: "/dashboard/vawc", icon: Shield, permission: "vawc.view" },
    ],
  },
  {
    titleKey: "services",
    items: [
      { labelKey: "documents", href: "/dashboard/documents", icon: FileText, permission: "documents.view" },
      // { labelKey: "requests", href: "/dashboard/requests", icon: Receipt },
      { labelKey: "reports", href: "/dashboard/reports", icon: BarChart3, permission: "reports.view" },
    ],
  },
  {
    titleKey: "tools",
    items: [
      // { labelKey: "mabiniAi", href: "/dashboard/ai", icon: Bot },
      { labelKey: "drive", href: "/dashboard/drive", icon: HardDrive },
      // { labelKey: "email", href: "/dashboard/email", icon: Mail },
      // { labelKey: "publicPortal", href: "/dashboard/public-portal", icon: Globe },
      // { labelKey: "marketplace", href: "/dashboard/marketplace", icon: ShoppingBag },
    ],
  },
  {
    titleKey: "operations",
    items: [
      { labelKey: "tanod", href: "/dashboard/tanod", icon: Shield, permission: "officials.view" },
      { labelKey: "finance", href: "/dashboard/finance", icon: Receipt, permission: "finance.view" },
      // { labelKey: "hris", href: "/dashboard/hris", icon: UserCog },
      // { labelKey: "inventory", href: "/dashboard/inventory", icon: Package },
      { labelKey: "disasterDrrm", href: "/dashboard/disaster", icon: AlertTriangle },
      // { labelKey: "gad", href: "/dashboard/gad", icon: Heart },
    ],
  },
];

const bottomNavItems: NavItemDef[] = [
  { labelKey: "updates", href: "/dashboard/updates", icon: Sparkles },
  // { labelKey: "supportTickets", href: "/dashboard/support", icon: MessageCircle },
  { labelKey: "staff", href: "/dashboard/settings/users", icon: Users },
  { labelKey: "settings", href: "/dashboard/settings", icon: Settings },
  { labelKey: "helpManual", href: "/dashboard/help", icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useLanguage();

  const barangay = user?.barangay;
  const barangayName = barangay?.name || "Loading...";

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  // Resolve translation key to label
  const navLabel = (key: string): string => {
    return (t.nav as Record<string, string>)[key] || key;
  };

  return (
    <aside className="hidden lg:flex flex-col w-[232px] glass-sidebar h-screen sticky top-0 shrink-0 overflow-hidden">
      {/* Barangay Identity — LGU letterhead pattern (city + barangay seals) */}
      <div className="px-4 pt-5 pb-4 flex flex-col items-center text-center">
        {/* Two official seals — city/municipality + barangay */}
        <div className="flex items-center justify-center gap-2.5">
          {/* City/Municipality seal — real if uploaded, otherwise icon placeholder */}
          {barangay?.municipality_logo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={resolvePhotoUrl(barangay.municipality_logo_url)!}
              alt={`${barangay.city_municipality ?? "City"} seal`}
              className="w-12 h-12 rounded-full object-cover ring-1 ring-border/60 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.25)] bg-card"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center ring-1 ring-dashed ring-muted-foreground/30 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.20)]"
              style={{
                background:
                  "color-mix(in srgb, var(--muted-foreground) 5%, transparent)",
              }}
              title={`${barangay?.city_municipality ?? "City / Municipality"} — upload logo in Settings → Logo & Seal`}
            >
              <Landmark className="w-5 h-5 text-muted-foreground/50" strokeWidth={1.5} />
            </div>
          )}

          {/* Barangay logo — real if uploaded, otherwise icon placeholder
              (legacy seal_url fallback for barangays that uploaded via pre-2026-05 schema) */}
          {(barangay?.logo_url || barangay?.seal_url) ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={resolvePhotoUrl(barangay.logo_url || barangay.seal_url)!}
              alt={`Brgy. ${barangayName} logo`}
              className="w-12 h-12 rounded-full object-cover ring-1 ring-border/60 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.25)] bg-card"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center ring-1 ring-dashed ring-muted-foreground/30 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.20)]"
              style={{
                background:
                  "color-mix(in srgb, var(--muted-foreground) 5%, transparent)",
              }}
              title={`Brgy. ${barangayName} — upload seal in Settings → Logo & Seal`}
            >
              <Shield className="w-5 h-5 text-muted-foreground/50" strokeWidth={1.5} />
            </div>
          )}
        </div>

        {/* REPUBLIKA NG PILIPINAS — tiny formal caption (country level) */}
        <p className="mt-3 text-[8.5px] font-semibold tracking-[0.22em] uppercase text-muted-foreground/55 leading-none">
          Republika ng Pilipinas
        </p>

        {/* City/Municipality — comes BEFORE barangay per LGU letterhead hierarchy */}
        {barangay?.city_municipality && (
          <p className="mt-1.5 text-[11px] text-muted-foreground/80 tracking-tight truncate max-w-full">
            {barangay.city_municipality}
          </p>
        )}

        {/* Barangay name — most specific, largest visual anchor (Playfair) */}
        <p
          className="mt-1 text-[17px] leading-tight text-foreground tracking-[-0.01em] truncate max-w-full px-1"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Brgy. {barangayName}
        </p>

        {/* Divider */}
        <div className="mt-4 h-px w-10 bg-border/50" />
      </div>

      {/* Navigation — fills remaining space, scrolls when content overflows */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-2 mt-2 pb-3">
        {navGroupDefs.map((group) => {
          const hasAccess = (item: NavItemDef) => {
            if (user?.is_super_admin || user?.roles?.includes("kapitan")) {
              return true;
            }
            if (!item.permission) {
              return true;
            }
            return user?.permissions?.includes(item.permission) || false;
          };

          const accessibleItems = group.items.filter(hasAccess);
          if (accessibleItems.length === 0) return null;

          const groupTitle = group.titleKey ? navLabel(group.titleKey) : "";

          return (
            <div key={group.titleKey} className="mb-2 last:mb-0">
              {groupTitle && (
                <p className="px-2.5 py-1 mb-1 text-[10px] font-semibold text-muted-foreground/50 tracking-[0.18em] uppercase">
                  {groupTitle}
                </p>
              )}
              <div className="space-y-px">
                {accessibleItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    const label = navLabel(item.labelKey);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "group relative flex items-center gap-2.5 rounded-md pl-3 pr-2.5 py-[7px] text-[13px] transition-all duration-150",
                          active
                            ? "font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-sidebar-hover"
                        )}
                        style={active ? { color: "var(--accent-primary)", background: "var(--accent-bg)" } : undefined}
                      >
                        {/* Active strip — Linear-style 2px accent on the left */}
                        {active && (
                          <span
                            className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r"
                            style={{ background: "var(--accent-primary)" }}
                          />
                        )}
                        <Icon className={cn("w-4 h-4 shrink-0 transition-opacity", !active && "opacity-80 group-hover:opacity-100")} />
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
            </div>
          );
        })}
      </nav>

      {/* Bottom — Updates, Support, Settings, Help pinned */}
      <div className="px-2 pt-2 border-t border-border/40 shrink-0">
        <div className="space-y-px">
          {bottomNavItems.filter((item) => {
            if (item.labelKey === "settings" || item.labelKey === "staff") {
              return user?.is_super_admin || user?.roles?.includes("kapitan") || user?.permissions?.includes("settings.manage");
            }
            return true;
          }).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const label = navLabel(item.labelKey);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-md pl-3 pr-2.5 py-[7px] text-[13px] transition-all duration-150",
                  active
                    ? "font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-hover"
                )}
                style={active ? { color: "var(--accent-primary)", background: "var(--accent-bg)" } : undefined}
              >
                {active && (
                  <span
                    className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r"
                    style={{ background: "var(--accent-primary)" }}
                  />
                )}
                <Icon className={cn("w-4 h-4 shrink-0 transition-opacity", !active && "opacity-80 group-hover:opacity-100")} />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Sidebar footer — tiny powered-by wordmark + version pill */}
        <div className="mt-2 mb-2.5 px-1.5 flex items-center justify-between opacity-55 hover:opacity-90 transition-opacity">
          <div className="flex items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/kapitanph_logo.png" alt="" className="w-3 h-3 rounded shrink-0" />
            <span className="text-[9px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
              kapitan.ph
            </span>
          </div>
          <span className="flex items-center gap-1 text-[9px] font-medium text-muted-foreground">
            <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
            v5.0
          </span>
        </div>
      </div>
    </aside>
  );
}
