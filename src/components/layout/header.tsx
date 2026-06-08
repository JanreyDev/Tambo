"use client";

import { Bell, Search, Moon, Sun, Menu, LogOut, ChevronDown, UserCog, Bot, Maximize, Minimize, Clock, FileText, UserPlus, AlertTriangle, CheckCircle, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
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

function formatLastLogin(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yest.toDateString();
  const timeStr = d.toLocaleTimeString("en-US", { timeZone: "Asia/Manila", hour: "numeric", minute: "2-digit", hour12: true });
  if (sameDay) return `Today, ${timeStr}`;
  if (isYesterday) return `Yesterday, ${timeStr}`;
  return `${d.toLocaleDateString("en-US", { timeZone: "Asia/Manila", month: "short", day: "numeric" })}, ${timeStr}`;
}

interface HeaderProps {
  onToggleSidebar?: () => void;
  onToggleAI?: () => void;
}

export function Header({ onToggleSidebar, onToggleAI }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Ctrl+K (Cmd+K on Mac) — focus search input
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const { t } = useLanguage();

  // Notifications — empty until /api/v1/notifications endpoint is wired
  type Notification = {
    id: string;
    type: "request" | "resident" | "alert" | "system";
    title: string;
    desc: string;
    time: string;
    read: boolean;
  };
  const notifications: Notification[] = [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const notifIcon = (type: string) => {
    switch (type) {
      case "request": return <FileText className="w-4 h-4 text-blue-500" />;
      case "resident": return <UserPlus className="w-4 h-4 text-emerald-500" />;
      case "alert": return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "system": return <CheckCircle className="w-4 h-4 text-violet-500" />;
      default: return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };
  const { user, logout } = useAuth();
  const router = useRouter();

  const displayName = user ? `${user.first_name} ${user.last_name}` : "Loading...";
  const initials = getInitials(user?.first_name, user?.last_name);
  const roleName = formatRole(user?.roles);

  const notifCount = unreadCount;

  return (
    <header className="sticky top-0 z-30 glass-header" style={{ height: "64px", minHeight: "64px" }}>
      <div className="max-w-[1600px] mx-auto h-full flex items-center px-4 md:px-8">
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
          ref={searchInputRef}
          type="text"
          placeholder={t.header.search}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="w-full pl-9 pr-16 py-1.5 rounded-xl glass-input text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-accent-ring transition-all"
          aria-label={t.common.search}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border/60 bg-muted/60 px-1.5 text-[10px] font-mono text-muted-foreground/70">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-1">
        {/* Mabini AI */}
        <button
          onClick={() => router.push("/dashboard/ai")}
          className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors group"
          aria-label={t.header.mabiniAi}
          title={t.header.mabiniAi}
        >
          <Bot className="w-[18px] h-[18px]" />
          <span className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full bg-emerald-500/70" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
            className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label={`${t.header.notifications} (${notifCount} unread)`}
            title={t.header.notifications}
          >
            <Bell className="w-[18px] h-[18px]" />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full text-[10px] font-bold text-white px-1 ring-2 ring-card" style={{ background: "var(--accent-primary)" }}>
                {notifCount > 99 ? "99+" : notifCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-80 sm:w-96 rounded-2xl glass-popover z-50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{t.header.notifications}</h3>
                    {unreadCount > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full text-[10px] font-bold text-white px-1.5" style={{ background: "var(--accent-primary)" }}>
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <button onClick={() => setNotifOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {/* Notification list */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-10 flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center mb-2.5">
                        <Bell className="w-4 h-4 text-muted-foreground/60" />
                      </div>
                      <p className="text-[13px] font-medium text-foreground/80">You&apos;re all caught up</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">No new notifications</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        className={cn(
                          "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0",
                          !n.read && "bg-accent-bg/5"
                        )}
                        onClick={() => { setNotifOpen(false); router.push("/dashboard/requests"); }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                          {notifIcon(n.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn("text-[13px] leading-tight truncate", !n.read ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>{n.title}</p>
                            {!n.read && <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: "var(--accent-primary)" }} />}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{n.desc}</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">{n.time}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                {/* Footer */}
                <div className="border-t border-border px-4 py-2.5">
                  <button
                    onClick={() => { setNotifOpen(false); router.push("/dashboard/requests"); }}
                    className="w-full text-center text-[12px] font-medium py-1 rounded-lg hover:bg-muted transition-colors"
                    style={{ color: "var(--accent-primary)" }}
                  >
                    {t.header.viewAllNotifications}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => { const next = theme === "dark" ? "light" : "dark"; setTheme(next); persistThemePreference(next); }}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label={theme === "dark" ? t.header.lightMode : t.header.darkMode}
            title={theme === "dark" ? t.header.lightMode : t.header.darkMode}
          >
            {theme === "dark" ? (
              <Sun className="w-[18px] h-[18px]" />
            ) : (
              <Moon className="w-[18px] h-[18px]" />
            )}
          </button>
        )}

        {/* Fullscreen toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={isFullscreen ? t.header.exitFullscreen : t.header.fullscreen}
          title={isFullscreen ? t.header.exitFullscreen : t.header.fullscreen}
        >
          {isFullscreen ? (
            <Minimize className="w-[18px] h-[18px]" />
          ) : (
            <Maximize className="w-[18px] h-[18px]" />
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-7 bg-border mx-1.5 hidden sm:block" />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-muted transition-colors"
            aria-label="User menu"
          >
            {user?.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photo_url} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-border" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-border" style={{ background: "var(--accent-primary)" }}>
                {initials}
              </div>
            )}
            <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-muted-foreground" />
          </button>
          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-72 rounded-2xl glass-popover z-50 overflow-hidden">
                {/* Accent header */}
                <div className="relative px-4 pt-5 pb-4 overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.07]" style={{ background: "var(--accent-primary)" }} />
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.05] -translate-y-1/2 translate-x-1/3" style={{ background: "var(--accent-primary)" }} />
                  <div className="relative flex items-center gap-3">
                    {user?.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.photo_url} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0 ring-2 ring-white/20 shadow-sm" />
                    ) : (
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm" style={{ background: "var(--accent-primary)" }}>
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[13px] font-bold text-foreground truncate">{displayName}</p>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ring-2 ring-card" />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{roleName}</p>
                    </div>
                  </div>
                </div>
                {/* Last login — security info only */}
                <div className="px-3 pb-2 pt-1">
                  <div className="rounded-lg bg-muted/40">
                    <div className="flex items-center gap-2.5 px-3 py-2">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                      <span className="text-[11px] text-foreground/80 truncate">{t.header.lastLogin}: {formatLastLogin(user?.last_login_at)}</span>
                    </div>
                  </div>
                </div>
                {/* Actions */}
                <div className="px-3 pb-3 pt-1 space-y-0.5">
                  <button
                    onClick={() => { setUserMenuOpen(false); router.push("/dashboard/account"); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-foreground rounded-lg hover:bg-muted transition-colors"
                  >
                    <UserCog className="w-4 h-4 text-muted-foreground" /> {t.header.myAccount}
                  </button>
                  <button
                    onClick={() => { setUserMenuOpen(false); logout(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> {t.header.signOut}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      </div>
    </header>
  );
}
