"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { api } from "@/lib/api";

export type AccentColor =
  | "blue"
  | "emerald"
  | "violet"
  | "rose"
  | "amber"
  | "cyan"
  | "orange"
  | "indigo";

const ACCENT_COLORS: Record<AccentColor, { primary: string; hover: string; ring: string; bg: string; text: string }> = {
  blue: { primary: "#2563eb", hover: "#1d4ed8", ring: "#3b82f6", bg: "#eff6ff", text: "#1e40af" },
  emerald: { primary: "#059669", hover: "#047857", ring: "#10b981", bg: "#ecfdf5", text: "#065f46" },
  violet: { primary: "#7c3aed", hover: "#6d28d9", ring: "#8b5cf6", bg: "#f5f3ff", text: "#5b21b6" },
  rose: { primary: "#e11d48", hover: "#be123c", ring: "#f43f5e", bg: "#fff1f2", text: "#9f1239" },
  amber: { primary: "#d97706", hover: "#b45309", ring: "#f59e0b", bg: "#fffbeb", text: "#92400e" },
  cyan: { primary: "#0891b2", hover: "#0e7490", ring: "#06b6d4", bg: "#ecfeff", text: "#155e75" },
  orange: { primary: "#ea580c", hover: "#c2410c", ring: "#f97316", bg: "#fff7ed", text: "#9a3412" },
  indigo: { primary: "#4f46e5", hover: "#4338ca", ring: "#6366f1", bg: "#eef2ff", text: "#3730a3" },
};

const STORAGE_KEY = "bcmp-accent-color";

let listeners: Array<() => void> = [];
function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => { listeners = listeners.filter((l) => l !== listener); };
}
function getAccentSnapshot(): AccentColor {
  const stored = localStorage.getItem(STORAGE_KEY) as AccentColor | null;
  return stored && ACCENT_COLORS[stored] ? stored : "blue";
}
function getAccentServerSnapshot(): AccentColor {
  return "blue";
}

/**
 * Apply user preferences from DB (called after login or /me response).
 * Syncs DB values into localStorage so the UI matches immediately.
 */
function applyUserPreferences(preferences: Record<string, unknown> | null | undefined): void {
  if (!preferences) return;

  // Accent color
  const dbAccent = preferences.accent_color as AccentColor | undefined;
  if (dbAccent && ACCENT_COLORS[dbAccent]) {
    localStorage.setItem(STORAGE_KEY, dbAccent);
    applyAccent(dbAccent);
    listeners.forEach((l) => l());
  }

  // Theme (next-themes reads from localStorage key "theme")
  const dbTheme = preferences.theme as string | undefined;
  if (dbTheme && ["light", "dark", "system"].includes(dbTheme)) {
    localStorage.setItem("theme", dbTheme);
  }
}

/**
 * Persist theme choice to DB (fire and forget).
 * Call this alongside next-themes' setTheme() so both localStorage and DB stay in sync.
 */
function persistThemePreference(theme: string): void {
  api.account.updatePreferences({ theme }).catch(() => {
    // Silently fail — localStorage still has the value, will sync next login
  });
}

export function useAccentColor() {
  const accent = useSyncExternalStore(subscribe, getAccentSnapshot, getAccentServerSnapshot);

  useEffect(() => {
    applyAccent(accent);
  }, [accent]);

  const setAccent = useCallback((color: AccentColor) => {
    // Update localStorage immediately (fast UI response)
    localStorage.setItem(STORAGE_KEY, color);
    applyAccent(color);
    listeners.forEach((l) => l());

    // Persist to DB (fire and forget — localStorage is cache, DB is source of truth)
    api.account.updatePreferences({ accent_color: color }).catch(() => {
      // Silently fail — localStorage still has the value, will sync next login
    });
  }, []);

  return { accent, setAccent, colors: ACCENT_COLORS };
}

function applyAccent(color: AccentColor) {
  const vars = ACCENT_COLORS[color];
  const root = document.documentElement;
  root.style.setProperty("--accent-primary", vars.primary);
  root.style.setProperty("--accent-hover", vars.hover);
  root.style.setProperty("--accent-ring", vars.ring);
  root.style.setProperty("--accent-bg", vars.bg);
  root.style.setProperty("--accent-text", vars.text);
}

export { ACCENT_COLORS, applyUserPreferences, persistThemePreference };
