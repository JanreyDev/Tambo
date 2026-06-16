"use client";

import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react";
import { en } from "@/lib/translations/en";
import { fil } from "@/lib/translations/fil";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import type { Translations } from "@/lib/translations/en";
import type { Language } from "@/lib/translations";

interface LanguageContextValue {
  language: Language;
  t: Translations;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const translations: Record<Language, Translations> = { en, fil };
const STORAGE_KEY = "bcmp_language";

function readStoredLanguage(): Language {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "fil" ? "fil" : "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Pre-login + per-device fallback. Account preference overrides this once logged in.
  const [language, setLang] = useState<Language>(() => readStoredLanguage());

  // useAuth is mounted in the parent provider — safe to read here
  const { user } = useAuth();

  // Track the last user id we synced for, to detect login / user switch
  const lastSyncedUserIdRef = useRef<string | null>(null);

  // Sync from user.preferred_language whenever user logs in or changes
  useEffect(() => {
    if (!user) {
      lastSyncedUserIdRef.current = null;
      return;
    }
    if (lastSyncedUserIdRef.current === user.id) return;

    // User just logged in (or a different user took over) — adopt their preference
    const userLang = (user.preferred_language ?? "en") as Language;
    lastSyncedUserIdRef.current = user.id;
    setLang(userLang);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, userLang);
    }
  }, [user]);

  // Persist to localStorage (every change) + backend (when logged in)
  const writeLanguage = useCallback((next: Language) => {
    setLang(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
    // Best-effort backend persist — never blocks UI or surfaces errors to user
    if (user) {
      api.auth.updatePreferences({ preferred_language: next }).catch(() => {
        // Silent: user keeps the UI change locally even if save fails (e.g. offline)
      });
    }
  }, [user]);

  const setLanguage = useCallback((lang: Language) => writeLanguage(lang), [writeLanguage]);

  const toggleLanguage = useCallback(() => {
    writeLanguage(language === "en" ? "fil" : "en");
  }, [language, writeLanguage]);

  const value = useMemo(
    () => ({
      language,
      t: translations[language],
      setLanguage,
      toggleLanguage,
    }),
    [language, setLanguage, toggleLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
