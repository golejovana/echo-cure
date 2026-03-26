import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mic, MicOff, Sparkles, Send, FileText,
  Clock, User, ChevronRight, Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/LanguageContext";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function DoctorDashboard() {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [hasAnamnesis, setHasAnamnesis] = useState(false);

  const RECENT_PATIENTS = [
    { name: "Marko Petrović", date: "25.03.2026.", status: t("doctor.statusDone") },
    { name: "Ana Jovanović", date: "24.03.2026.", status: t("doctor.statusWaiting") },
    { name: "Stefan Nikolić", date: "23.03.2026.", status: t("doctor.statusDone") },
    { name: "Milica Đorđević", date: "22.03.2026.", status: t("doctor.statusFollowUp") },
    { name: "Nikola Stojanović", date: "20.03.2026.", status: t("doctor.statusDone") },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-6xl mx-auto">
      <motion.div variants={item}>
        <h2 className="text-xl font-semibold text-foreground">{t("doctor.welcome")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("doctor.subtitle")}</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} className="lg:col-span-2 glass-card-elevated p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Stethoscope size={18} strokeWidth={1.5} className="text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">{t("doctor.newExam")}</h3>
          </div>

          <div className="flex flex-col items-center gap-4 py-4">
            <button
              onClick={() => { setIsRecording(!isRecording); if (!isRecording) setTimeout(() => setHasAnamnesis(true), 2000); }}
              className="relative group active:scale-[0.95] transition-transform duration-150"
            >
              {isRecording && (
                <>
                  <span className="absolute inset-0 rounded-full bg-destructive/30" style={{ animation: "pulse-ring 1.5s ease-out infinite" }} />
                  <span className="absolute inset-0 rounded-full bg-destructive/20" style={{ animation: "pulse-ring 1.5s ease-out infinite 0.4s" }} />
                </>
              )}
              <div className={cn(
                "relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300",
                isRecording
                  ? "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20"
                  : "bg-primary text-primary-foreground shadow-md shadow-primary/15 group-hover:shadow-lg group-hover:shadow-primary/25"
              )}>
                {isRecording ? <MicOff size={28} strokeWidth={1.8} /> : <Mic size={28} strokeWidth={1.8} />}
              </div>
            </button>
            <p className="text-xs text-muted-foreground">
              {isRecording ? t("doctor.recording") : t("doctor.startRecording")}
            </p>
          </div>

          <div className="bg-muted/30 rounded-2xl p-4 min-h-[100px]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t("doctor.liveTranscript")}</p>
            <p className={cn("text-sm leading-relaxed", isRecording ? "text-foreground" : "text-muted-foreground/50 italic")}>
              {isRecording ? t("doctor.sampleTranscript") : t("doctor.listening")}
            </p>
          </div>

          <div className={cn("glass-card p-4 transition-all duration-500", hasAnamnesis ? "opacity-100" : "opacity-40")}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} strokeWidth={1.5} className="text-primary" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">{t("doctor.aiAnamnesis")}</h4>
            </div>
            {hasAnamnesis ? (
              <div className="space-y-2 text-sm text-foreground/80">
                <p><span className="font-medium text-foreground">{t("doctor.chiefComplaints")}</span> Bol u grudima, kratak dah</p>
                <p><span className="font-medium text-foreground">{t("doctor.diagnosis")}</span> I20.0 — Nestabilna angina pektoris</p>
                <p><span className="font-medium text-foreground">{t("doctor.recommendation")}</span> EKG, troponin, hospitalizacija</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">{t("doctor.anamnesisWaiting")}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button disabled={!hasAnamnesis} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground shadow-md shadow-primary/15 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-200">
              <FileText size={15} strokeWidth={1.8} />
              {t("doctor.downloadPdf")}
            </button>
            <button disabled={!hasAnamnesis} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold bg-accent text-accent-foreground shadow-md shadow-accent/15 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-200">
              <Send size={15} strokeWidth={1.8} />
              {t("doctor.sendToPatient")}
            </button>
          </div>
        </motion.div>

        <motion.div variants={item} className="glass-card-elevated p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} strokeWidth={1.5} className="text-muted-foreground" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{t("doctor.recentPatients")}</h3>
          </div>
          <div className="space-y-1">
            {RECENT_PATIENTS.map((patient) => (
              <button key={patient.name} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors duration-200 group text-left">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User size={14} strokeWidth={1.5} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{patient.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-muted-foreground">{patient.date}</p>
                    <span className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                      patient.status === t("doctor.statusDone") && "bg-accent/10 text-accent",
                      patient.status === t("doctor.statusWaiting") && "bg-destructive/10 text-destructive",
                      patient.status === t("doctor.statusFollowUp") && "bg-primary/10 text-primary",
                    )}>
                      {patient.status}
                    </span>
                  </div>
                </div>
                <ChevronRight size={14} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
