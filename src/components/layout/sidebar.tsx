"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
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
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
  collapsible?: boolean;
}

const navGroups: NavGroup[] = [
  {
    title: "OVERVIEW",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Map", href: "/dashboard/map", icon: Map },
    ],
  },
  {
    title: "RECORDS",
    items: [
      { label: "Residents", href: "/dashboard/residents", icon: Users },
      { label: "Establishments", href: "/dashboard/establishments", icon: Building2 },
      { label: "Lots & Buildings", href: "/dashboard/lots-buildings", icon: MapPin },
      { label: "Voters", href: "/dashboard/voters", icon: ClipboardList },
    ],
  },
  {
    title: "JUDICIAL",
    items: [
      { label: "Case Records", href: "/dashboard/judicial/kp-cases", icon: Scale },
      { label: "Blotter Records", href: "/dashboard/judicial/blotter", icon: Gavel },
      { label: "VAWC Records", href: "/dashboard/vawc", icon: Shield },
    ],
  },
  {
    title: "SERVICES",
    items: [
      { label: "Documents", href: "/dashboard/documents", icon: FileText },
      { label: "Requests", href: "/dashboard/requests", icon: Receipt },
      { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
    ],
  },
  {
    title: "TOOLS",
    items: [
      { label: "Mabini AI", href: "/dashboard/ai", icon: Bot },
      { label: "Drive", href: "/dashboard/drive", icon: HardDrive },
      { label: "Public Portal", href: "/dashboard/public-portal", icon: Globe },
      { label: "Support Tickets", href: "/dashboard/support", icon: MessageCircle },
    ],
  },
  {
    title: "OPERATIONS",
    collapsible: true,
    items: [
      { label: "Tanod", href: "/dashboard/tanod", icon: Shield },
      { label: "Finance", href: "/dashboard/finance", icon: Receipt },
      { label: "Inventory", href: "/dashboard/inventory", icon: Package },
      { label: "Disaster/DRRM", href: "/dashboard/disaster", icon: AlertTriangle },
      { label: "GAD", href: "/dashboard/gad", icon: Heart },
      { label: "HRIS", href: "/dashboard/hris", icon: UserCog },
    ],
  },
  {
    title: "",
    items: [
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const barangay = user?.barangay;
  const barangayName = barangay?.name || "Loading...";
  const subscriptionLabel = barangay?.subscription_plan
    ? barangay.subscription_plan.charAt(0).toUpperCase() + barangay.subscription_plan.slice(1) + " Plan"
    : "Free Plan";

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  const toggleGroup = (title: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside className="hidden lg:flex flex-col w-[232px] border-r border-sidebar-border bg-sidebar-bg h-screen sticky top-0 shrink-0">
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

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 pb-3 mt-1">
        {navGroups.map((group, gi) => {
          const isCollapsed = group.collapsible && collapsedGroups[group.title];

          return (
            <div key={gi} className="mb-1">
              {group.title && (
                <button
                  onClick={group.collapsible ? () => toggleGroup(group.title) : undefined}
                  className={cn(
                    "flex items-center justify-between w-full px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground/70 tracking-widest uppercase",
                    group.collapsible && "hover:text-muted-foreground cursor-pointer transition-colors"
                  )}
                >
                  <span>{group.title}</span>
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
                        <span className="flex-1 truncate">{item.label}</span>
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
    </aside>
  );
}
