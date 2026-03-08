"use client";

import { Bell, Search, Moon, Sun, Menu, LogOut, ChevronDown, UserCog, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { persistThemePreference } from "@/hooks/use-theme-store";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

function getInitials(firstName?: string, lastName?: string): string {
  const f = firstName?.charAt(0)?.toUpperCase() || "";
  const l = lastName?.charAt(0)?.toUpperCase() || "";
  return `${f}${l}` || "??";
}

function formatRole(roles?: string[]): string {
  if (!roles || roles.length === 0) return "Staff";
  return roles[0].replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatPHTime(): string {
  const now = new Date();
  const ph = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  const hours = ph.getHours();
  const minutes = ph.getMinutes();
  const seconds = ph.getSeconds();
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  return `${h12}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")} ${ampm}`;
}

function usePhilippineTime() {
  const [time, setTime] = useState<string>(() =>
    typeof window === "undefined" ? "" : formatPHTime()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(formatPHTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return time;
}

function usePhilippineDate() {
  const [date] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return new Date().toLocaleDateString("en-PH", {
      timeZone: "Asia/Manila",
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  });
  return date;
}

interface HeaderProps {
  onToggleSidebar?: () => void;
  onToggleAI?: () => void;
}

export function Header({ onToggleSidebar, onToggleAI }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const time = usePhilippineTime();
  const date = usePhilippineDate();

  const displayName = user ? `${user.first_name} ${user.last_name}` : "Loading...";
  const initials = getInitials(user?.first_name, user?.last_name);
  const roleName = formatRole(user?.roles);

  // Hardcoded notification count for now (will be API-driven later)
  const notifCount = 3;

  return (
    <header className="sticky top-0 z-30 flex items-center h-14 px-3 md:px-5 border-b border-border bg-card/95 backdrop-blur-md">
      {/* Mobile menu button */}
      <button
        onClick={onToggleSidebar}
        className="lg:hidden p-2 -ml-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mr-2"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className={cn(
        "relative flex items-center transition-all duration-200",
        searchFocused ? "flex-1 max-w-2xl" : "w-64 md:w-80 lg:w-96"
      )}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search residents, documents, cases..."
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="w-full pl-9 pr-16 py-1.5 rounded-lg border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-accent-ring focus:border-accent-ring focus:bg-card transition-all"
          aria-label="Search"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border/60 bg-muted/60 px-1.5 text-[10px] font-mono text-muted-foreground/70">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Date & Time (UTC+8) */}
      {mounted && (
        <div className="hidden md:flex items-center gap-2 mr-3 select-none">
          <div className="text-right">
            <p className="text-[11px] font-medium text-foreground leading-tight tabular-nums">{time}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{date}</p>
          </div>
          <span className="text-[9px] font-medium text-muted-foreground/60 bg-muted/50 px-1 py-0.5 rounded">
            PHT
          </span>
        </div>
      )}

      {/* Right side actions */}
      <div className="flex items-center gap-0.5">
        {/* AI Quick Access */}
        <button
          onClick={onToggleAI}
          className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors group"
          aria-label="Quick AI Query"
          title="Ask AI anything"
        >
          <Sparkles className="w-[18px] h-[18px]" />
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-card" />
        </button>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={`Notifications (${notifCount} unread)`}
          title="Notifications"
        >
          <Bell className="w-[18px] h-[18px]" />
          {notifCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full text-[10px] font-bold text-white px-1 ring-2 ring-card" style={{ background: "var(--accent-primary)" }}>
              {notifCount > 99 ? "99+" : notifCount}
            </span>
          )}
        </button>

        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => { const next = theme === "dark" ? "light" : "dark"; setTheme(next); persistThemePreference(next); }}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? (
              <Sun className="w-[18px] h-[18px]" />
            ) : (
              <Moon className="w-[18px] h-[18px]" />
            )}
          </button>
        )}

        {/* Divider */}
        <div className="w-px h-7 bg-border mx-1.5 hidden sm:block" />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-muted transition-colors"
            aria-label="User menu"
          >
            {user?.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photo_url} alt="" className="w-7 h-7 rounded-full object-cover ring-2 ring-border" />
            ) : (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold ring-2 ring-border" style={{ background: "var(--accent-primary)" }}>
                {initials}
              </div>
            )}
            <div className="hidden lg:block text-left max-w-[120px]">
              <p className="text-xs font-medium text-foreground leading-none truncate">
                {displayName}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                {roleName}
              </p>
            </div>
            <ChevronDown className="hidden lg:block w-3.5 h-3.5 text-muted-foreground" />
          </button>
          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-64 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden">
                <div className="px-3.5 py-3 bg-muted/30">
                  <div className="flex items-center gap-2.5">
                    {user?.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.photo_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-border" />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ring-2 ring-border" style={{ background: "var(--accent-primary)" }}>
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                      <p className="text-[11px] text-muted-foreground truncate">@{user?.username}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: "var(--accent-bg)", color: "var(--accent-text)" }}>
                      {roleName}
                    </span>
                  </div>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      router.push("/dashboard/account");
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <UserCog className="w-4 h-4 text-muted-foreground" /> My Account
                  </button>
                </div>
                <div className="border-t border-border py-1">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
