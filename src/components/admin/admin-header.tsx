"use client";

import { useState } from "react";
import {
  Bell,
  Search,
  Menu,
  Moon,
  Sun,
  ChevronDown,
  Building2,
  LogOut,
  Settings,
  User,
  ExternalLink,
} from "lucide-react";
import { useTheme } from "next-themes";

export function AdminHeader() {
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-border bg-card/80 backdrop-blur-sm px-6 h-14">
      {/* Mobile menu */}
      <button className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors" aria-label="Open menu">
        <Menu className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Search */}
      <div className="flex-1 flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search barangays, users, tickets..."
            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-input-border bg-input-bg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <span className="hidden xl:block text-xs text-muted-foreground">{dateStr}</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1.5">
        {/* Quick link to barangay view */}
        <a
          href="/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground rounded-lg border border-border hover:bg-muted transition-colors"
        >
          <Building2 className="w-3.5 h-3.5" />
          Barangay View
          <ExternalLink className="w-3 h-3" />
        </a>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="w-4.5 h-4.5 text-muted-foreground" />
          ) : (
            <Moon className="w-4.5 h-4.5 text-muted-foreground" />
          )}
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Notifications">
          <Bell className="w-4.5 h-4.5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-card" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-[10px] font-bold text-white">
              JM
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-foreground leading-tight">Jeager Manalo</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Super Admin</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-border bg-card shadow-lg z-50 py-1.5">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium text-foreground">Jeager Manalo</p>
                  <p className="text-xs text-muted-foreground">jeager@primex.ventures</p>
                </div>
                <div className="py-1">
                  <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <User className="w-4 h-4" /> Profile
                  </button>
                  <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Settings className="w-4 h-4" /> Settings
                  </button>
                </div>
                <div className="border-t border-border pt-1">
                  <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
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
