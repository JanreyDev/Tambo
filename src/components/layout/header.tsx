"use client";

import { Bell, Search, Moon, Sun, Bot, Menu, LogOut, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function Header() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 border-b border-border bg-card/80 backdrop-blur-sm">
      {/* Mobile menu button */}
      <button
        className="lg:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search residents, documents, cases..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-input-border bg-input-bg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent transition-colors"
            aria-label="Search"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border px-1.5 text-[10px] font-medium text-muted-foreground">
            Ctrl K
          </kbd>
        </div>
      </div>

      {/* Date - hidden on mobile */}
      <div className="hidden xl:block text-xs text-muted-foreground mx-4">
        {today}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-1 ml-4">
        {/* AI Assistant button */}
        <button
          className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="AI Assistant"
          title="AI Assistant"
        >
          <Bot className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500" />
        </button>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Notifications (3 unread)"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: "var(--accent-primary)" }}>
            3
          </span>
        </button>

        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Divider */}
        <div className="w-px h-8 bg-border mx-2" />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "var(--accent-primary)" }}>
              JM
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-foreground leading-none">
                Jeager Manalo
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Super Admin
              </p>
            </div>
            <ChevronDown className="hidden md:block w-4 h-4 text-muted-foreground" />
          </button>
          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-border bg-card shadow-lg z-50 py-1">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium text-foreground">Jeager Manalo</p>
                  <p className="text-xs text-muted-foreground">jeager@primex.ventures</p>
                </div>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
