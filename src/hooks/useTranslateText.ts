import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/i18n/LanguageContext";

// Global in-memory cache: sourceText -> { lang -> translatedText }
const translationCache = new Map<string, Map<string, string>>();

function getCached(text: string, lang: string): string | undefined {
  return translationCache.get(text)?.get(lang);
}

function setCache(text: string, lang: string, translated: string) {
  if (!translationCache.has(text)) translationCache.set(text, new Map());
  translationCache.get(text)!.set(lang, translated);
}

/**
 * Hook to translate an array of dynamic strings based on current language.
 * Returns a map: original -> translated.
 * Only calls API for non-Serbian languages, caches results.
 */
export function useTranslateText(texts: string[]): Record<string, string> {
  const { language } = useTranslation();
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const pendingRef = useRef(false);

  const translate = useCallback(async () => {
    // Serbian is the source language — no translation needed
    if (language === "sr" || texts.length === 0) {
      const identity: Record<string, string> = {};
      texts.forEach((t) => (identity[t] = t));
      setTranslations(identity);
      return;
    }

    const result: Record<string, string> = {};
    const uncached: string[] = [];

    for (const t of texts) {
      const cached = getCached(t, language);
      if (cached) {
        result[t] = cached;
      } else {
        uncached.push(t);
      }
    }

    if (uncached.length === 0) {
      setTranslations(result);
      return;
    }

    // Set partial results immediately (cached ones)
    setTranslations({ ...result, ...Object.fromEntries(uncached.map((t) => [t, t])) });

    if (pendingRef.current) return;
    pendingRef.current = true;

    try {
      const { data, error } = await supabase.functions.invoke("translate-text", {
        body: { texts: uncached, targetLang: language },
      });

      if (!error && data?.translations) {
        const translated = data.translations as string[];
        uncached.forEach((original, i) => {
          const tr = translated[i] || original;
          setCache(original, language, tr);
          result[original] = tr;
        });
      } else {
        // On error, use originals
        uncached.forEach((t) => (result[t] = t));
      }
    } catch {
      uncached.forEach((t) => (result[t] = t));
    } finally {
      pendingRef.current = false;
    }

    setTranslations(result);
  }, [language, texts.join("||")]);

  useEffect(() => {
    translate();
  }, [translate]);

  return translations;
}
