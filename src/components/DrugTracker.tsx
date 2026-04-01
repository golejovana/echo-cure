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
  examinationId: string;
}

function getLsKey(examinationId: string) {
  return `echocure_med_tracker_${examinationId}`;
}

/** Each med stores an array of ISO timestamps (one per dose taken today). */
interface DoseRecord {
  [medKey: string]: string[];
}

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function parseRequiredDoses(frequency: string): number {
  if (frequency === "pp") return Infinity; // as-needed, unlimited
  const match = frequency.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

function loadTaken(examinationId: string): { date: string; records: DoseRecord } {
  try {
    const raw = localStorage.getItem(getLsKey(examinationId));
    if (!raw) return { date: getTodayKey(), records: {} };
    const parsed = JSON.parse(raw);
    if (parsed.date !== getTodayKey()) {
      return { date: getTodayKey(), records: {} };
    }
    // Migrate old format (string → string[])
    const records: DoseRecord = {};
    for (const [k, v] of Object.entries(parsed.records)) {
      records[k] = Array.isArray(v) ? (v as string[]) : [v as string];
    }
    return { date: parsed.date, records };
  } catch {
    return { date: getTodayKey(), records: {} };
  }
}

function saveTaken(examinationId: string, data: { date: string; records: DoseRecord }) {
  localStorage.setItem(getLsKey(examinationId), JSON.stringify(data));
}

function formatFrequency(freq: string, t: (key: string) => string): string {
  if (freq === "pp") return t("therapy.asNeeded");
  return `${freq}${t("therapy.timesDaily")}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function DrugTracker({ medications, examinationId }: DrugTrackerProps) {
  const { t } = useTranslation();
  const [takenData, setTakenData] = useState(() => loadTaken(examinationId));

  // Reset daily
  useEffect(() => {
    const today = getTodayKey();
    if (takenData.date !== today) {
      const fresh = { date: today, records: {} as DoseRecord };
      setTakenData(fresh);
      saveTaken(examinationId, fresh);
    }
  }, [takenData.date]);

  const handleMarkTaken = (medKey: string, requiredDoses: number) => {
    setTakenData((prev) => {
      const existing = prev.records[medKey] || [];
      // Prevent overcounting
      if (existing.length >= requiredDoses) return prev;
      const next = {
        ...prev,
        records: {
          ...prev.records,
          [medKey]: [...existing, new Date().toISOString()],
        },
      };
      saveTaken(examinationId, next);
      return next;
    });
  };

  // Count fully completed medications
  const completedCount = useMemo(() => {
    return medications.filter((med, i) => {
      const required = parseRequiredDoses(med.frequency);
      const taken = (takenData.records[`med-${i}`] || []).length;
      return required === Infinity ? taken > 0 : taken >= required;
    }).length;
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
            {completedCount}/{medications.length} {t("drugTracker.taken")}
          </span>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {medications.map((med, i) => {
              const medKey = `med-${i}`;
              const requiredDoses = parseRequiredDoses(med.frequency);
              const doses = takenData.records[medKey] || [];
              const takenCount = doses.length;
              const isAsNeeded = requiredDoses === Infinity;
              const isCompleted = isAsNeeded ? false : takenCount >= requiredDoses;
              const isPartial = takenCount > 0 && !isCompleted;
              const lastTakenAt = doses.length > 0 ? doses[doses.length - 1] : null;

              return (
                <motion.div
                  key={medKey}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className={cn(
                    "relative rounded-2xl border p-4 transition-all duration-300",
                    isCompleted
                      ? "bg-accent/5 border-accent/20 opacity-70"
                      : isPartial
                        ? "bg-primary/5 border-primary/20 shadow-sm"
                        : "bg-background border-border/30 shadow-sm hover:shadow-md hover:border-primary/20"
                  )}
                >
                  {/* Top-right indicator */}
                  {isCompleted ? (
                    <span className="absolute top-3 right-3">
                      <CheckCircle2 size={16} strokeWidth={2} className="text-accent" />
                    </span>
                  ) : takenCount === 0 && !isAsNeeded ? (
                    <span className="absolute top-3 right-3">
                      <Bell size={14} strokeWidth={1.5} className="text-primary animate-pulse" />
                    </span>
                  ) : null}

                  {/* Drug info */}
                  <div className="space-y-2 pr-6">
                    <div>
                      <p className={cn(
                        "text-sm font-semibold",
                        isCompleted ? "text-accent" : "text-foreground"
                      )}>
                        {med.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {med.dose} · {formatFrequency(med.frequency, t)}
                      </p>
                    </div>

                    {/* Dose progress (non-pp meds with >1 dose) */}
                    {!isAsNeeded && requiredDoses > 1 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {takenCount}/{requiredDoses} {t("drugTracker.taken")}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-muted/40 overflow-hidden">
                          <motion.div
                            className={cn(
                              "h-full rounded-full",
                              isCompleted ? "bg-accent" : "bg-primary"
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((takenCount / requiredDoses) * 100, 100)}%` }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Note tooltip */}
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

                    {/* Last taken timestamp */}
                    {lastTakenAt && (
                      <div className="flex items-center gap-1.5 text-[10px] text-accent font-medium">
                        <Clock size={10} strokeWidth={1.5} />
                        {t("drugTracker.takenAt")} {formatTime(lastTakenAt)}
                      </div>
                    )}

                    {/* Action button */}
                    {!isCompleted && (
                      <button
                        onClick={() => handleMarkTaken(medKey, requiredDoses)}
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
