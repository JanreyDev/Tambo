"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Users,
  Bell,
  Settings,
  BarChart3,
  MessageCircle,
  Shield,
  Server,
  LogOut,
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
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      { label: "Barangay Tenants", href: "/admin/tenants", icon: Building2 },
      { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
      { label: "Admin Users", href: "/admin/users", icon: Users },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { label: "Platform Updates", href: "/admin/platform-updates", icon: Bell },
      { label: "Support Tickets", href: "/admin/support", icon: MessageCircle, badge: 5 },
      { label: "Infrastructure", href: "/admin/infrastructure", icon: Server },
    ],
  },
  {
    title: "",
    items: [
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(href));

  return (
    <aside className="hidden lg:flex flex-col w-[260px] border-r border-sidebar-border bg-sidebar-bg h-screen sticky top-0 shrink-0">
      {/* Logo */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-sm">
            P
          </div>
          <div>
            <span className="text-base font-semibold text-foreground">
              PrimeX <span className="text-blue-600">Admin</span>
            </span>
            <p className="text-[10px] text-muted-foreground -mt-0.5">Superadmin Panel</p>
          </div>
        </div>
      </div>

      {/* Admin Info */}
      <div className="mx-4 mb-3 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-500/5 to-indigo-500/5 border border-blue-500/10">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
          JM
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">Jeager Manalo</p>
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-blue-500" />
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Super Admin</p>
          </div>
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
                        ? "font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30"
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
                            : "bg-muted-foreground/20 text-muted-foreground"
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

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <Link
          href="/login"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Sign Out</span>
        </Link>
      </div>
    </aside>
  );
}
