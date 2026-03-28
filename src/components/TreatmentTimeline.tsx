import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, Clock, CircleDot, Stethoscope, TestTube2,
  CalendarCheck, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/LanguageContext";

interface TimelineStep {
  id: string;
  label: string;
  date: string; // YYYY-MM-DD
  time: string | null;
  status: "completed" | "active" | "pending";
  priority: string;
  type: "exam" | "appointment";
}

interface TreatmentTimelineProps {
  examDate: string; // ISO date of the initial examination
  appointments: {
    id: string;
    title: string;
    appointment_date: string;
    appointment_time: string | null;
    priority: string;
  }[];
}

function getIcon(label: string, type: "exam" | "appointment") {
  if (type === "exam") return Stethoscope;
  const lower = label.toLowerCase();
  if (lower.includes("lab") || lower.includes("krv") || lower.includes("analiz")) return TestTube2;
  if (lower.includes("kontrol") || lower.includes("check")) return CalendarCheck;
  if (lower.includes("ekg") || lower.includes("eho") || lower.includes("ultra") || lower.includes("mri") || lower.includes("ct") || lower.includes("snim")) return Activity;
  return CalendarCheck;
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.`;
}

export default function TreatmentTimeline({ examDate, appointments }: TreatmentTimelineProps) {
  const { t } = useTranslation();

  const steps = useMemo<TimelineStep[]>(() => {
    const todayStr = new Date().toISOString().split("T")[0];

    const examStep: TimelineStep = {
      id: "initial-exam",
      label: t("timeline.initialExam"),
      date: examDate.split("T")[0],
      time: null,
      status: examDate.split("T")[0] <= todayStr ? "completed" : "pending",
      priority: "normal",
      type: "exam",
    };

    const aptSteps: TimelineStep[] = appointments.map((a) => ({
      id: a.id,
      label: a.title,
      date: a.appointment_date,
      time: a.appointment_time,
      status: a.appointment_date < todayStr ? "completed" : a.appointment_date === todayStr ? "active" : "pending",
      priority: a.priority,
      type: "appointment" as const,
    }));

    const all = [examStep, ...aptSteps].sort((a, b) => a.date.localeCompare(b.date));

    // If no step is active yet, mark the first pending one as active
    const hasActive = all.some((s) => s.status === "active");
    if (!hasActive) {
      const firstPending = all.find((s) => s.status === "pending");
      if (firstPending) firstPending.status = "active";
    }

    return all;
  }, [examDate, appointments, t]);

  if (steps.length === 0) return null;

  return (
    <div className="glass-card-elevated p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Activity size={18} strokeWidth={1.5} className="text-primary" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
          {t("timeline.title")}
        </h3>
      </div>

      <div className="relative flex items-start gap-0 overflow-x-auto pb-2">
        {steps.map((step, i) => {
          const Icon = getIcon(step.label, step.type);
          const isLast = i === steps.length - 1;

          return (
            <div key={step.id} className="flex items-start flex-shrink-0" style={{ minWidth: 120 }}>
              {/* Node + label column */}
              <div className="flex flex-col items-center">
                {/* Node */}
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.08, duration: 0.35 }}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative z-10",
                    step.status === "completed" && "bg-accent/15 border-accent text-accent",
                    step.status === "active" && "bg-primary/15 border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.35)]",
                    step.status === "pending" && "bg-muted/30 border-border/50 text-muted-foreground/50",
                    step.priority === "high" && step.status !== "completed" && "border-destructive text-destructive bg-destructive/10"
                  )}
                >
                  {step.status === "completed" ? (
                    <CheckCircle2 size={18} strokeWidth={2} />
                  ) : step.status === "active" ? (
                    <Icon size={16} strokeWidth={1.8} />
                  ) : (
                    <Icon size={14} strokeWidth={1.5} />
                  )}

                  {step.status === "active" && (
                    <span className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
                  )}
                </motion.div>

                {/* Label */}
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 + 0.1, duration: 0.3 }}
                  className="mt-2.5 text-center max-w-[110px]"
                >
                  <p className={cn(
                    "text-[11px] font-semibold leading-tight",
                    step.status === "completed" && "text-accent",
                    step.status === "active" && "text-primary",
                    step.status === "pending" && "text-muted-foreground/60",
                    step.priority === "high" && step.status !== "completed" && "text-destructive"
                  )}>
                    {step.label}
                  </p>
                  <p className={cn(
                    "text-[9px] mt-0.5",
                    step.status === "completed" ? "text-accent/70" :
                    step.status === "active" ? "text-primary/70" : "text-muted-foreground/40"
                  )}>
                    {formatShortDate(step.date)}
                    {step.time ? ` · ${step.time}` : ""}
                  </p>
                </motion.div>
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div className="flex items-center pt-5 flex-1" style={{ minWidth: 24 }}>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: i * 0.08 + 0.05, duration: 0.3 }}
                    className={cn(
                      "h-[2px] w-full origin-left",
                      step.status === "completed" ? "bg-accent/40" : "bg-border/40"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
