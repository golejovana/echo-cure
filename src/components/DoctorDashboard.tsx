import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mic, MicOff, Sparkles, Send, FileText,
  Clock, User, ChevronRight, Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";

const RECENT_PATIENTS = [
  { name: "Marko Petrović", date: "25.03.2026.", status: "Završen" },
  { name: "Ana Jovanović", date: "24.03.2026.", status: "Čeka nalaze" },
  { name: "Stefan Nikolić", date: "23.03.2026.", status: "Završen" },
  { name: "Milica Đorđević", date: "22.03.2026.", status: "Kontrola" },
  { name: "Nikola Stojanović", date: "20.03.2026.", status: "Završen" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function DoctorDashboard() {
  const [isRecording, setIsRecording] = useState(false);
  const [hasAnamnesis, setHasAnamnesis] = useState(false);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome */}
      <motion.div variants={item}>
        <h2 className="text-xl font-semibold text-foreground">Dobro došli, doktore 👋</h2>
        <p className="text-sm text-muted-foreground mt-1">Počnite novi pregled ili pregledajte skorašnje pacijente.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Start Examination */}
        <motion.div variants={item} className="lg:col-span-2 glass-card-elevated p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Stethoscope size={18} strokeWidth={1.5} className="text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Novi pregled</h3>
          </div>

          {/* Record Button */}
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
              {isRecording ? "Snimanje u toku… kliknite da zaustavite" : "Kliknite da započnete snimanje"}
            </p>
          </div>

          {/* Transcript Preview */}
          <div className="bg-muted/30 rounded-2xl p-4 min-h-[100px]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Transkript uživo</p>
            <p className={cn(
              "text-sm leading-relaxed",
              isRecording ? "text-foreground" : "text-muted-foreground/50 italic"
            )}>
              {isRecording
                ? "Pacijent se žali na bolove u grudima koji se javljaju pri fizičkom naporu, praćene kratkim dahom. Simptomi traju oko 2 nedelje…"
                : "Slušam pacijenta…"}
            </p>
          </div>

          {/* AI Anamnesis Card */}
          <div className={cn(
            "glass-card p-4 transition-all duration-500",
            hasAnamnesis ? "opacity-100" : "opacity-40"
          )}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} strokeWidth={1.5} className="text-primary" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">AI Anamneza</h4>
            </div>
            {hasAnamnesis ? (
              <div className="space-y-2 text-sm text-foreground/80">
                <p><span className="font-medium text-foreground">Glavne tegobe:</span> Bol u grudima, kratak dah</p>
                <p><span className="font-medium text-foreground">Dijagnoza:</span> I20.0 — Nestabilna angina pektoris</p>
                <p><span className="font-medium text-foreground">Preporuka:</span> EKG, troponin, hospitalizacija</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Anamneza će biti generisana nakon snimanja…</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button disabled={!hasAnamnesis} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground shadow-md shadow-primary/15 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-200">
              <FileText size={15} strokeWidth={1.8} />
              Preuzmi PDF
            </button>
            <button disabled={!hasAnamnesis} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold bg-accent text-accent-foreground shadow-md shadow-accent/15 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-200">
              <Send size={15} strokeWidth={1.8} />
              Pošalji pacijentu
            </button>
          </div>
        </motion.div>

        {/* Recent Patients */}
        <motion.div variants={item} className="glass-card-elevated p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} strokeWidth={1.5} className="text-muted-foreground" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Skorašnji pacijenti</h3>
          </div>
          <div className="space-y-1">
            {RECENT_PATIENTS.map((patient) => (
              <button
                key={patient.name}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors duration-200 group text-left"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User size={14} strokeWidth={1.5} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{patient.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-muted-foreground">{patient.date}</p>
                    <span className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                      patient.status === "Završen" && "bg-accent/10 text-accent",
                      patient.status === "Čeka nalaze" && "bg-yellow-500/10 text-yellow-600",
                      patient.status === "Kontrola" && "bg-primary/10 text-primary",
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
