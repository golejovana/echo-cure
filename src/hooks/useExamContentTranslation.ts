import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/i18n/LanguageContext";

interface TranslationState {
  translated: Record<string, string>;
  loading: boolean;
  errors: Set<string>; // keys that failed translation
}

const CACHE_PREFIX = "exam-tr-";

function getCacheKey(examId: string, lang: string) {
  return `${CACHE_PREFIX}${examId}-${lang}`;
}

function loadCache(examId: string, lang: string): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(getCacheKey(examId, lang));
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveCache(examId: string, lang: string, data: Record<string, string>) {
  try {
    localStorage.setItem(getCacheKey(examId, lang), JSON.stringify(data));
  } catch {}
}

/**
 * Translates dynamic exam content fields when UI language differs from source (Serbian).
 * Caches per exam+language in localStorage. Shows loading state and error fallback.
 */
export function useExamContentTranslation(
  examId: string | undefined,
  fields: Record<string, string | null | undefined>
): TranslationState {
  const { language } = useTranslation();
  const [state, setState] = useState<TranslationState>({
    translated: {},
    loading: false,
    errors: new Set(),
  });
  const abortRef = useRef(false);

  useEffect(() => {
    abortRef.current = false;

    // Serbian is source language — no translation needed
    if (language === "sr" || !examId) {
      const identity: Record<string, string> = {};
      for (const [k, v] of Object.entries(fields)) {
        if (v) identity[k] = v;
      }
      setState({ translated: identity, loading: false, errors: new Set() });
      return;
    }

    // Check localStorage cache first
    const cached = loadCache(examId, language);
    if (cached) {
      // Verify cached keys cover current fields
      const allCovered = Object.entries(fields).every(
        ([k, v]) => !v || cached[k] !== undefined
      );
      if (allCovered) {
        setState({ translated: cached, loading: false, errors: new Set() });
        return;
      }
    }

    // Collect non-empty texts to translate
    const toTranslate: { key: string; text: string }[] = [];
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(fields)) {
      if (!value) continue;
      if (cached?.[key]) {
        result[key] = cached[key];
      } else {
        toTranslate.push({ key, text: value });
        result[key] = value; // show original while loading
      }
    }

    if (toTranslate.length === 0) {
      setState({ translated: result, loading: false, errors: new Set() });
      return;
    }

    setState({ translated: result, loading: true, errors: new Set() });

    // Batch translate (max 20 per call, split if needed)
    const translateBatch = async () => {
      const errors = new Set<string>();
      const finalResult = { ...result };

      // Process in batches of 20
      for (let i = 0; i < toTranslate.length; i += 20) {
        if (abortRef.current) return;
        const batch = toTranslate.slice(i, i + 20);
        const texts = batch.map((b) => b.text);

        try {
          const { data, error } = await supabase.functions.invoke("translate-text", {
            body: { texts, targetLang: language },
          });

          if (abortRef.current) return;

          if (!error && data?.translations) {
            const translated = data.translations as string[];
            batch.forEach((item, idx) => {
              finalResult[item.key] = translated[idx] || item.text;
            });
          } else {
            batch.forEach((item) => errors.add(item.key));
          }
        } catch {
          if (abortRef.current) return;
          batch.forEach((item) => errors.add(item.key));
        }
      }

      if (abortRef.current) return;

      // Save to localStorage
      saveCache(examId, language, finalResult);

      setState({ translated: finalResult, loading: false, errors });
    };

    translateBatch();

    return () => {
      abortRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, language, JSON.stringify(fields)]);

  return state;
}
