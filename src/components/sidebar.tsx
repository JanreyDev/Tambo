"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PrimeXLogo } from "./primex-logo";
import { useFounderAuth } from "@/contexts/founder-auth-context";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  BarChart3,
  Landmark,
  Vote,
  Users,
  MessageCircle,
  Bell,
  Server,
  Settings,
  HelpCircle,
  LogOut,
  Shield,
  ChevronDown,
  KeyRound,
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
  collapsible?: boolean;
  items: NavItem[];
  color?: string;
  defaultOpen?: boolean;
}

const navGroups: NavGroup[] = [
  {
    title: "OVERVIEW",
    items: [
      { label: "Monitoring", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "BCMP",
    collapsible: true,
    defaultOpen: true,
    color: "#3b82f6",
    items: [
      { label: "Barangay Tenants", href: "/dashboard/bcmp/tenants", icon: Building2, badge: 52 },
      { label: "Subscriptions", href: "/dashboard/bcmp/subscriptions", icon: CreditCard },
      { label: "Analytics", href: "/dashboard/bcmp/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "LGMP",
    collapsible: true,
    defaultOpen: false,
    color: "#22c55e",
    items: [
      { label: "Departments", href: "/dashboard/lgmp", icon: Landmark },
    ],
  },
  {
    title: "PDMP",
    collapsible: true,
    defaultOpen: false,
    color: "#f59e0b",
    items: [
      { label: "Campaigns", href: "/dashboard/pdmp", icon: Vote },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { label: "Admin Users", href: "/dashboard/users", icon: Users },
      { label: "Support Tickets", href: "/dashboard/support", icon: MessageCircle, badge: 5 },
      { label: "Platform Updates", href: "/dashboard/updates", icon: Bell, badge: 18 },
      { label: "Infrastructure", href: "/dashboard/infrastructure", icon: Server },
    ],
  },
  {
    title: "",
    items: [
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
      { label: "Help", href: "/dashboard/help", icon: HelpCircle },
    ],
  },
];

function CollapsibleGroup({ group, pathname }: { group: NavGroup; pathname: string }) {
  const [open, setOpen] = useState(group.defaultOpen ?? true);
  const hasActive = group.items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 mb-1 group"
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: group.color }} />
          <span
            className={cn(
              "text-[11px] font-semibold tracking-wider",
              hasActive ? "text-sidebar-text-active" : "text-sidebar-text/60",
            )}
          >
            {group.title}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "w-3 h-3 text-sidebar-text/40 transition-transform",
            !open && "-rotate-90",
          )}
        />
      </button>
      {open && (
        <div className="space-y-0.5">
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors ml-1",
                  active
                    ? "font-medium text-sidebar-text-active bg-white/10"
                    : "text-sidebar-text hover:text-sidebar-text-active hover:bg-white/5",
                )}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      "min-w-[20px] h-5 flex items-center justify-center rounded-full text-[11px] font-semibold px-1.5",
                      active ? "bg-white/20 text-white" : "bg-white/10 text-sidebar-text",
                    )}
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
}

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useFounderAuth();

  return (
    <aside className="hidden lg:flex flex-col w-[260px] bg-sidebar-bg h-screen sticky top-0 shrink-0">
      {/* Logo */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
            <PrimeXLogo className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base font-semibold text-white">
              PrimeX<span className="text-orange-400"> Founder</span>
            </span>
            <p className="text-[10px] text-sidebar-text/50 -mt-0.5">Command Center</p>
          </div>
        </div>
      </div>

      {/* Admin Info */}
      <div className="mx-4 mb-3 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
          JM
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">Jeager Manalo</p>
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-orange-400" />
            <p className="text-[11px] text-orange-400 font-medium">Founder</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
        {navGroups.map((group, gi) => {
          if (group.collapsible) {
            return <CollapsibleGroup key={gi} group={group} pathname={pathname} />;
          }

          return (
            <div key={gi}>
              {group.title && (
                <p className="px-3 mb-1.5 text-[11px] font-semibold text-sidebar-text/50 tracking-wider">
                  {group.title}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors",
                        active
                          ? "font-medium text-sidebar-text-active bg-white/10"
                          : "text-sidebar-text hover:text-sidebar-text-active hover:bg-white/5",
                      )}
                    >
                      <Icon className="w-[18px] h-[18px] shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge !== undefined && (
                        <span
                          className={cn(
                            "min-w-[20px] h-5 flex items-center justify-center rounded-full text-[11px] font-semibold px-1.5",
                            active ? "bg-white/20 text-white" : "bg-white/10 text-sidebar-text",
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
          );
        })}
      </nav>

      {/* Family Vault Button */}
      <div className="px-3 pb-2">
        <Link
          href="/vault"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-colors bg-amber-950/30 border border-amber-800/30 text-amber-400 hover:bg-amber-950/50 hover:border-amber-700/40"
        >
          <KeyRound className="w-[18px] h-[18px] shrink-0" />
          <span className="font-medium">Family Vault</span>
        </Link>
      </div>

      {/* Sign Out */}
      <div className="border-t border-white/10 p-3">
        <button
          onClick={() => {
            toast.info("Signing out...");
            logout();
          }}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-sidebar-text hover:text-red-400 hover:bg-red-950/20 transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
