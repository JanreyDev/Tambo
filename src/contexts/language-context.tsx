"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { en } from "@/lib/translations/en";
import { fil } from "@/lib/translations/fil";
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

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLang] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("bcmp_language") as Language) || "en";
    }
    return "en";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLang(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("bcmp_language", lang);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLang((prev) => {
      const next = prev === "en" ? "fil" : "en";
      if (typeof window !== "undefined") {
        localStorage.setItem("bcmp_language", next);
      }
      return next;
    });
  }, []);

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
