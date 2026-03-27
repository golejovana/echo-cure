import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pill, CheckCircle2, Bell, Clock, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/LanguageContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MedicationData {
  name: string;
  dose: string;
  frequency: string; // "1x", "2x", "3x", "pp"
  note: string;
}

interface DrugTrackerProps {
  medications: MedicationData[];
}

const LS_KEY = "echocure_med_tracker";

interface TakenRecord {
  [medKey: string]: string; // medKey → ISO timestamp when taken
}

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function loadTaken(): { date: string; records: TakenRecord } {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { date: getTodayKey(), records: {} };
    const parsed = JSON.parse(raw);
    // Reset if not today
    if (parsed.date !== getTodayKey()) {
      return { date: getTodayKey(), records: {} };
    }
    return parsed;
  } catch {
    return { date: getTodayKey(), records: {} };
  }
}

function saveTaken(data: { date: string; records: TakenRecord }) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

function formatFrequency(freq: string, t: (key: string) => string): string {
  if (freq === "pp") return t("therapy.asNeeded");
  return `${freq}${t("therapy.timesDaily")}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function DrugTracker({ medications }: DrugTrackerProps) {
  const { t } = useTranslation();
  const [takenData, setTakenData] = useState(loadTaken);

  // Reset daily
  useEffect(() => {
    const today = getTodayKey();
    if (takenData.date !== today) {
      const fresh = { date: today, records: {} };
      setTakenData(fresh);
      saveTaken(fresh);
    }
  }, [takenData.date]);

  const handleMarkTaken = (medKey: string) => {
    setTakenData((prev) => {
      const next = {
        ...prev,
        records: { ...prev.records, [medKey]: new Date().toISOString() },
      };
      saveTaken(next);
      return next;
    });
  };

  const takenCount = useMemo(() => {
    return medications.filter((_, i) => takenData.records[`med-${i}`]).length;
  }, [medications, takenData.records]);

  if (medications.length === 0) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="glass-card-elevated p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill size={18} strokeWidth={1.5} className="text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              {t("drugTracker.title")}
            </h3>
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-full">
            {takenCount}/{medications.length} {t("drugTracker.taken")}
          </span>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {medications.map((med, i) => {
              const medKey = `med-${i}`;
              const isTaken = !!takenData.records[medKey];
              const takenAt = takenData.records[medKey];

              return (
                <motion.div
                  key={medKey}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className={cn(
                    "relative rounded-2xl border p-4 transition-all duration-300",
                    isTaken
                      ? "bg-accent/5 border-accent/20 opacity-70"
                      : "bg-background border-border/30 shadow-sm hover:shadow-md hover:border-primary/20"
                  )}
                >
                  {/* Pulse indicator for not-taken */}
                  {!isTaken && (
                    <span className="absolute top-3 right-3">
                      <Bell size={14} strokeWidth={1.5} className="text-primary animate-pulse" />
                    </span>
                  )}

                  {/* Taken checkmark */}
                  {isTaken && (
                    <span className="absolute top-3 right-3">
                      <CheckCircle2 size={16} strokeWidth={2} className="text-accent" />
                    </span>
                  )}

                  {/* Drug info */}
                  <div className="space-y-2 pr-6">
                    <div>
                      <p className={cn(
                        "text-sm font-semibold",
                        isTaken ? "text-accent" : "text-foreground"
                      )}>
                        {med.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {med.dose} · {formatFrequency(med.frequency, t)}
                      </p>
                    </div>

                    {/* Note tooltip / subtext */}
                    {med.note && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 cursor-help">
                            <Info size={10} strokeWidth={1.5} />
                            <span className="italic">{med.note}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="text-xs">{t("drugTracker.instruction")}: {med.note}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Taken status or button */}
                    {isTaken ? (
                      <div className="flex items-center gap-1.5 text-[10px] text-accent font-medium">
                        <Clock size={10} strokeWidth={1.5} />
                        {t("drugTracker.takenAt")} {formatTime(takenAt)}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleMarkTaken(medKey)}
                        className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-primary bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-full transition-all duration-200 active:scale-[0.96]"
                      >
                        <CheckCircle2 size={12} strokeWidth={2} />
                        {t("drugTracker.markTaken")}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </TooltipProvider>
  );
}
