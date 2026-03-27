import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles, HeartPulse, Calendar, CheckCircle2,
  Clock, Bell, FileText, Loader2, Pill, AlertTriangle,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppointments } from "@/contexts/AppointmentsContext";

interface Examination {
  id: string;
  diagnosis_codes: string | null;
  chief_complaints: string | null;
  present_illness: string | null;
  patient_name: string | null;
  form_data: Record<string, string>;
  is_read: boolean;
  created_at: string;
}

interface Appointment {
  id: string;
  title: string;
  appointment_date: string;
  appointment_time: string | null;
  examination_id: string;
  priority: string;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function PatientDashboard() {
  const { t, tArray } = useTranslation();
  const navigate = useNavigate();
  const { appointments: sharedAppointments, loading: aptsLoading } = useAppointments();
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const { data: exams } = await supabase
        .from("examinations").select("*").order("created_at", { ascending: false });
      if (exams) {
        setExaminations(exams as unknown as Examination[]);
        setUnreadCount(exams.filter((e: any) => !e.is_read).length);
      }
      setLoading(false);
    };
    fetchData();

    const channel = supabase
      .channel("patient-exams")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "examinations" }, (payload) => {
        setExaminations((prev) => [payload.new as unknown as Examination, ...prev]);
        setUnreadCount((c) => c + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Map shared appointments to the local Appointment interface
  const appointments: Appointment[] = sharedAppointments.map((a) => ({
    id: a.id,
    title: a.title,
    appointment_date: a.appointment_date,
    appointment_time: a.appointment_time || null,
    examination_id: a.examination_id || "",
    priority: a.priority,
  }));

  // Reminder notifications for upcoming appointments
  useEffect(() => {
    if (aptsLoading || appointments.length === 0) return;
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const shownKey = "echocure_reminders_shown";
    const shown: string[] = JSON.parse(localStorage.getItem(shownKey) || "[]");

    appointments.forEach((apt) => {
      const reminderId = `${apt.id}-${apt.appointment_date}`;
      if (shown.includes(reminderId)) return;

      const timeStr = apt.appointment_time ? ` ${t("patient.atTime")} ${apt.appointment_time}` : "";

      if (apt.appointment_date === tomorrowStr) {
        toast({
          title: `🔔 ${t("patient.reminderTomorrow")}`,
          description: `${apt.title}${timeStr}`,
          duration: 8000,
        });
        shown.push(reminderId);
      } else if (apt.appointment_date === todayStr) {
        toast({
          title: `⏰ ${t("patient.reminderToday")}`,
          description: `${apt.title}${timeStr}`,
          duration: 10000,
        });
        shown.push(reminderId);
      }
    });

    localStorage.setItem(shownKey, JSON.stringify(shown));
  }, [aptsLoading, appointments, t]);

  const latestExam = examinations[0];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}.`;
  };

  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;

  // Build a map: day number → list of appointment titles for the viewed month
  const appointmentMap = new Map<number, { title: string; priority: string; time: string | null }[]>();
  appointments.forEach((a) => {
    const d = new Date(a.appointment_date + "T00:00:00");
    if (d.getMonth() === calMonth && d.getFullYear() === calYear) {
      const day = d.getDate();
      if (!appointmentMap.has(day)) appointmentMap.set(day, []);
      appointmentMap.get(day)!.push({ title: a.title, priority: a.priority, time: a.appointment_time });
    }
  });

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  const MONTH_NAMES = tArray("patient.months");
  const DAY_NAMES = tArray("patient.days");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-5xl mx-auto">
      <motion.div variants={item} className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{t("patient.welcome")}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t("patient.subtitle")}</p>
        </div>
        {unreadCount > 0 && (
          <Badge className="bg-destructive text-destructive-foreground animate-pulse flex items-center gap-1.5 px-3 py-1.5">
            <Bell size={13} />
            {unreadCount} {unreadCount > 1 ? t("patient.newResults") : t("patient.newResult")}
          </Badge>
        )}
      </motion.div>

      {examinations.length === 0 ? (
        <motion.div variants={item} className="glass-card-elevated p-8 text-center space-y-3">
          <HeartPulse size={32} className="text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground">{t("patient.emptyState")}</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={item} className="glass-card-elevated p-6 space-y-4">
            <div className="flex items-center gap-2">
              <HeartPulse size={18} strokeWidth={1.5} className="text-accent" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">{t("patient.latestDiagnosis")}</h3>
              {latestExam && !latestExam.is_read && (
                <Badge variant="destructive" className="text-[10px] ml-auto">{t("patient.new")}</Badge>
              )}
            </div>

            {latestExam && (
              <div className="bg-muted/30 rounded-2xl p-4 space-y-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("patient.diagnosisLabel")}</p>
                  <p className="text-sm font-medium text-foreground">{latestExam.diagnosis_codes || t("patient.notSpecified")}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("patient.complaintsLabel")}</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {latestExam.chief_complaints || latestExam.present_illness || t("patient.notSpecified")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("patient.examDate")}</p>
                  <p className="text-sm text-foreground/80">{formatDate(latestExam.created_at)}</p>
                </div>
              </div>
            )}

            <button
              onClick={() => navigate(`/examination/${latestExam?.id}`)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.97] transition-all duration-200"
            >
              <Sparkles size={15} strokeWidth={1.8} />
              {t("patient.viewDetails")}
            </button>

            {/* Medications from latest exam */}
            {latestExam?.form_data && (latestExam.form_data as any)?._medications?.length > 0 && (
              <div className="bg-muted/30 rounded-2xl p-4 space-y-2 mt-3">
                <div className="flex items-center gap-1.5">
                  <Pill size={13} strokeWidth={1.5} className="text-primary" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("therapy.medicationsLabel")}</p>
                </div>
                {((latestExam.form_data as any)._medications as any[]).map((med: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{med.name} {med.dose}</span>
                    <span className="text-xs text-muted-foreground">
                      {med.frequency === "pp" ? t("therapy.asNeeded") : `${med.frequency}${t("therapy.timesDaily")}`}
                      {med.note ? ` · ${med.note}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div variants={item} className="glass-card-elevated p-6 space-y-4">
            <div className="flex items-center gap-2">
              <FileText size={18} strokeWidth={1.5} className="text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">{t("patient.allExams")}</h3>
            </div>

            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {examinations.map((exam) => (
                <button
                  key={exam.id}
                  onClick={() => navigate(`/examination/${exam.id}`)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors duration-200 group text-left"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${exam.is_read ? "bg-accent/10" : "bg-primary/10"}`}>
                    <FileText size={14} strokeWidth={1.5} className={exam.is_read ? "text-accent" : "text-primary"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {exam.diagnosis_codes || t("patient.exam")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{formatDate(exam.created_at)}</p>
                  </div>
                  {!exam.is_read && <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Health Calendar */}
      <TooltipProvider delayDuration={200}>
        <motion.div variants={item} className="glass-card-elevated p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} strokeWidth={1.5} className="text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">{t("patient.healthCalendar")}</h3>
            <div className="flex items-center gap-2 ml-auto">
              <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-muted/40 transition-colors"><ChevronLeft size={16} className="text-muted-foreground" /></button>
              <span className="text-xs text-muted-foreground min-w-[100px] text-center">{MONTH_NAMES[calMonth]} {calYear}</span>
              <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-muted/40 transition-colors"><ChevronRight size={16} className="text-muted-foreground" /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground uppercase py-1">{d}</div>
            ))}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const isToday = day === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear();
              const dayAppts = appointmentMap.get(day);
              const hasEvent = !!dayAppts;
              const hasHigh = dayAppts?.some((a) => a.priority === "high");

              const cell = (
                <div className={`relative text-center py-2 rounded-xl text-sm transition-colors duration-200 ${
                  isToday ? "bg-primary text-primary-foreground font-semibold" : hasEvent ? (hasHigh ? "bg-destructive/10 text-destructive font-medium" : "bg-primary/10 text-primary font-medium") : "text-foreground/70 hover:bg-muted/40"
                } ${hasEvent ? "cursor-pointer" : "cursor-default"}`}>
                  {day}
                  {hasEvent && !isToday && <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${hasHigh ? "bg-destructive" : "bg-accent"}`} />}
                </div>
              );

              if (hasEvent) {
                return (
                  <Tooltip key={day}>
                    <TooltipTrigger asChild>{cell}</TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px]">
                      <div className="space-y-1">
                        {dayAppts.map((a, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs">
                            {a.priority === "high" ? <AlertTriangle size={10} className="text-destructive shrink-0" /> : <Clock size={10} className="text-primary shrink-0" />}
                            <span>{a.title}{a.time ? ` · ${a.time}` : ""}</span>
                          </div>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              }
              return <div key={day}>{cell}</div>;
            })}
          </div>

          {appointments.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/40">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("patient.scheduledAppts")}</p>
              {appointments.filter((a) => new Date(a.appointment_date + "T00:00:00") >= new Date(now.toISOString().split("T")[0])).slice(0, 5).map((apt) => (
                <div key={apt.id} className="flex items-center gap-3 py-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${apt.priority === "high" ? "bg-destructive/10" : "bg-primary/10"}`}>
                    {apt.priority === "high" ? <AlertTriangle size={12} className="text-destructive" /> : <Clock size={12} className="text-primary" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{apt.title}</p>
                    <p className="text-[10px] text-muted-foreground">{formatDate(apt.appointment_date)}</p>
                  </div>
                  {apt.priority === "high" && (
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">{t("therapy.highPriority")}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 pt-2 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              {t("patient.today")}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary/20" />
              {t("patient.scheduledEvent")}
            </div>
          </div>
        </motion.div>
      </TooltipProvider>
    </motion.div>
  );
}
