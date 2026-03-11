"use client";

import { Bell, Search, Moon, Sun, Menu, LogOut, ChevronDown, UserCog, Bot, Maximize, Minimize, MapPin, Clock, Globe, Crown, FileText, UserPlus, AlertTriangle, CheckCircle, X, HelpCircle, Languages } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
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
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<string | null>(null);

  const { language, toggleLanguage, t } = useLanguage();

  // Get GPS location on mount
  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=16`);
          const data = await res.json();
          const addr = data.address;
          // Build a short location string: suburb/village, city, country
          const parts = [addr.suburb || addr.village || addr.neighbourhood || addr.town, addr.city || addr.municipality, addr.country].filter(Boolean);
          setGpsLocation(parts.join(", "));
        } catch {
          setGpsLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
      },
      () => { /* permission denied or error — leave null */ }
    );
  }, []);

  useEffect(() => { fetchLocation(); }, [fetchLocation]);

  // Mock notifications (will be API-driven later)
  const notifications = [
    { id: "1", type: "request" as const, title: t.notifications.newRequest, desc: "Valderrama, Nida requested a Barangay Clearance", time: "2 hours ago", read: false },
    { id: "2", type: "resident" as const, title: t.notifications.newResident, desc: "Garcia, Ana L. was added to Purok 3", time: "5 hours ago", read: false },
    { id: "3", type: "alert" as const, title: t.notifications.blotterFiled, desc: "New blotter record #BLT-2026-0047 needs review", time: "1 day ago", read: false },
    { id: "4", type: "system" as const, title: t.notifications.systemUpdate, desc: "BCMP v5.0.1 patch applied successfully", time: "2 days ago", read: true },
  ];
  const unreadCount = notifications.filter(n => !n.read).length;

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

  const time = usePhilippineTime();
  const date = usePhilippineDate();

  const displayName = user ? `${user.first_name} ${user.last_name}` : "Loading...";
  const initials = getInitials(user?.first_name, user?.last_name);
  const roleName = formatRole(user?.roles);

  const notifCount = unreadCount;

  return (
    <header className="sticky top-0 z-30 flex items-center h-14 px-3 md:px-5 glass-header">
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
          placeholder={t.header.search}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="w-full pl-9 pr-16 py-1.5 rounded-lg border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-accent-ring focus:border-accent-ring focus:bg-card transition-all"
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
      <div className="flex items-center gap-0.5">
        {/* Language switcher */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={`Switch language to ${language === "en" ? "Filipino" : "English"}`}
          title={`${t.header.language} — ${language === "en" ? "Switch to Filipino" : "Switch to English"}`}
        >
          <Languages className="w-[18px] h-[18px]" />
          <span className="text-[11px] font-semibold uppercase tracking-wide hidden sm:inline">
            {language === "en" ? "EN" : "FIL"}
          </span>
        </button>

        {/* Help */}
        <button
          onClick={() => router.push("/dashboard/help")}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={t.header.help}
          title={t.header.help}
        >
          <HelpCircle className="w-[18px] h-[18px]" />
        </button>

        {/* Mabini AI */}
        <button
          onClick={() => router.push("/dashboard/ai")}
          className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors group"
          aria-label={t.header.mabiniAi}
          title={t.header.mabiniAi}
        >
          <Bot className="w-[18px] h-[18px]" />
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-card" />
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
              <div className="absolute right-0 top-full mt-1.5 w-80 sm:w-96 rounded-2xl glass shadow-2xl z-50 overflow-hidden">
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
                  {notifications.map((n) => (
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
                  ))}
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
              <div className="absolute right-0 top-full mt-1.5 w-72 rounded-2xl glass shadow-2xl z-50 overflow-hidden">
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
                {/* Info grid */}
                <div className="px-3 pb-2 pt-1">
                  <div className="rounded-lg bg-muted/40 divide-y divide-border/50">
                    <div className="flex items-center gap-2.5 px-3 py-2">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                      <span className="text-[11px] text-foreground/80 truncate">{gpsLocation || t.header.locating}</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-3 py-2">
                      <Globe className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                      <span className="text-[11px] text-foreground/80 truncate">{user?.last_login_ip || "Unknown"}</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-3 py-2">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                      <span className="text-[11px] text-foreground/80 truncate">{t.header.lastLogin}: {t.header.today}, {time}</span>
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
    </header>
  );
}
