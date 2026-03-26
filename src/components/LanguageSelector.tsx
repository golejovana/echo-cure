import { Globe } from "lucide-react";
import { useTranslation, Language } from "@/i18n/LanguageContext";

const LANGUAGES: { code: Language; label: string }[] = [
  { code: "sr", label: "Srpski" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
];

interface LanguageSelectorProps {
  variant?: "minimal" | "compact";
}

export default function LanguageSelector({ variant = "compact" }: LanguageSelectorProps) {
  const { language, setLanguage } = useTranslation();

  if (variant === "minimal") {
    return (
      <div className="flex items-center gap-1 bg-card/80 backdrop-blur-sm rounded-full border border-border/40 p-0.5">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200 ${
              language === lang.code
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {lang.code.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Globe size={13} strokeWidth={1.8} className="text-muted-foreground shrink-0" />
      <div className="flex bg-muted/40 rounded-xl p-0.5">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
              language === lang.code
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}
