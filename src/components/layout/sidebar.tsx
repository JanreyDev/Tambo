"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  Scale,
  Shield,
  Building2,
  Map,
  ChevronUp,
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
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
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
      { label: "Residents", href: "/dashboard/residents", icon: Users, badge: 17 },
      { label: "Establishments", href: "/dashboard/establishments", icon: Building2 },
      { label: "Lots & Buildings", href: "/dashboard/lots-buildings", icon: MapPin },
      { label: "Voters", href: "/dashboard/voters", icon: ClipboardList },
    ],
  },
  {
    title: "JUDICIAL",
    items: [
      { label: "Case Records", href: "/dashboard/judicial/kp-cases", icon: Scale },
      { label: "Blotter Records", href: "/dashboard/judicial/blotter", icon: Gavel, badge: 3 },
      { label: "VAWC Records", href: "/dashboard/vawc", icon: Shield },
    ],
  },
  {
    title: "SERVICES",
    items: [
      { label: "Documents", href: "/dashboard/documents", icon: FileText },
      { label: "Requests", href: "/dashboard/requests", icon: Receipt, badge: 2 },
      { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
    ],
  },
  {
    title: "TOOLS",
    items: [
      { label: "AI Assistant", href: "/dashboard/ai", icon: Bot },
      { label: "Drive", href: "/dashboard/drive", icon: HardDrive },
      { label: "Public Portal", href: "/dashboard/public-portal", icon: Globe },
      { label: "Support Tickets", href: "/dashboard/support", icon: MessageCircle },
    ],
  },
  {
    title: "OPERATIONS",
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

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <aside className="flex flex-col w-[240px] border-r border-sidebar-border bg-sidebar-bg h-screen sticky top-0 shrink-0">
      {/* Logo */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            K
          </div>
          <span className="text-base font-semibold text-foreground">
            kapitan<span className="text-blue-600">.ph</span>
          </span>
        </div>
      </div>

      {/* Barangay Info */}
      <div className="mx-4 mb-3 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-muted/50">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
          BT
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">Brgy. Tambo</p>
          <p className="text-[11px] text-muted-foreground truncate">Paranaque, NCR</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.title && (
              <p className="px-3 mb-1.5 text-[11px] font-semibold text-muted-foreground tracking-wider">
                {group.title}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors",
                      active
                        ? "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400 font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-sidebar-hover"
                    )}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className={cn(
                          "min-w-[20px] h-5 flex items-center justify-center rounded-full text-[11px] font-semibold px-1.5",
                          active
                            ? "bg-blue-600 text-white"
                            : "bg-red-500 text-white"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
