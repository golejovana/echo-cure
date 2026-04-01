import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import sr from "./translations/sr";
import en from "./translations/en";
import fr from "./translations/fr";

export type Language = "sr" | "en" | "fr";

const translations: Record<Language, Record<string, string | string[]>> = { sr, en, fr };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  tArray: (key: string) => string[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "echocure-language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && (stored === "sr" || stored === "en" || stored === "fr")) return stored;
    } catch {}
    return "sr";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
  };

  const t = (key: string): string => {
    const val = translations[language]?.[key] ?? translations.en[key] ?? translations.sr[key];
    return typeof val === "string" ? val : (Array.isArray(val) ? val.join(", ") : key);
  };

  const tArray = (key: string): string[] => {
    const val = translations[language]?.[key] ?? translations.en[key] ?? translations.sr[key];
    return Array.isArray(val) ? val : [];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tArray }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useTranslation must be used within LanguageProvider");
  return ctx;
}
