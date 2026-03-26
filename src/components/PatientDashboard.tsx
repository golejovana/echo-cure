import { motion } from "framer-motion";
import {
  Sparkles, HeartPulse, Calendar, CheckCircle2,
  Clock, Pill, FlaskConical, Stethoscope,
} from "lucide-react";

const TREATMENT_PLAN = [
  { icon: Pill, label: "Terapija započeta", date: "25.03.2026.", done: true },
  { icon: FlaskConical, label: "Krvna slika — ponedeljak", date: "30.03.2026.", done: false },
  { icon: Stethoscope, label: "Kontrolni pregled", date: "01.04.2026.", done: false },
  { icon: HeartPulse, label: "EKG — praćenje", date: "05.04.2026.", done: false },
];

const CALENDAR_DAYS = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(2026, 2, i + 1);
  const hasEvent = [5, 10, 15, 20, 25, 30].includes(i + 1);
  return { day: i + 1, weekday: d.toLocaleDateString("sr-Latn", { weekday: "short" }), hasEvent };
});

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export default function PatientDashboard() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-5xl mx-auto">
      {/* Welcome */}
      <motion.div variants={item}>
        <h2 className="text-xl font-semibold text-foreground">Zdravo! 💙</h2>
        <p className="text-sm text-muted-foreground mt-1">Ovde možete pratiti svoju dijagnozu, plan lečenja i zakazane termine.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Diagnosis */}
        <motion.div variants={item} className="glass-card-elevated p-6 space-y-4">
          <div className="flex items-center gap-2">
            <HeartPulse size={18} strokeWidth={1.5} className="text-accent" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Moja poslednja dijagnoza</h3>
          </div>

          <div className="bg-muted/30 rounded-2xl p-4 space-y-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Dijagnoza</p>
              <p className="text-sm font-medium text-foreground">I20.0 — Nestabilna angina pektoris</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Rezime</p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                Utvrđen je bol u grudima koji se javlja pri fizičkom naporu. Preporučeni su dodatni testovi uključujući EKG i laboratorijske analize.
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Datum pregleda</p>
              <p className="text-sm text-foreground/80">25.03.2026.</p>
            </div>
          </div>

          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.97] transition-all duration-200">
            <Sparkles size={15} strokeWidth={1.8} />
            Objasni mi jednostavno ✨
          </button>
        </motion.div>

        {/* Treatment Plan */}
        <motion.div variants={item} className="glass-card-elevated p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Clock size={18} strokeWidth={1.5} className="text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Plan lečenja</h3>
          </div>

          <div className="space-y-1">
            {TREATMENT_PLAN.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex items-start gap-3 py-2.5">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      step.done
                        ? "bg-accent/15 text-accent"
                        : "bg-primary/10 text-primary"
                    }`}>
                      {step.done ? <CheckCircle2 size={16} strokeWidth={1.8} /> : <Icon size={14} strokeWidth={1.5} />}
                    </div>
                    {i < TREATMENT_PLAN.length - 1 && (
                      <div className="w-px h-6 bg-border/60 mt-1" />
                    )}
                  </div>
                  <div className="pt-1">
                    <p className={`text-sm font-medium ${step.done ? "text-accent line-through" : "text-foreground"}`}>
                      {step.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{step.date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Health Calendar */}
      <motion.div variants={item} className="glass-card-elevated p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Calendar size={18} strokeWidth={1.5} className="text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Moj zdravstveni kalendar</h3>
          <span className="text-xs text-muted-foreground ml-auto">Mart 2026</span>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"].map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground uppercase py-1">{d}</div>
          ))}
          {/* offset for March 2026 starting on Sunday */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {CALENDAR_DAYS.map(({ day, hasEvent }) => (
            <div
              key={day}
              className={`relative text-center py-2 rounded-xl text-sm transition-colors duration-200 cursor-default ${
                day === 26
                  ? "bg-primary text-primary-foreground font-semibold"
                  : hasEvent
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground/70 hover:bg-muted/40"
              }`}
            >
              {day}
              {hasEvent && day !== 26 && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 pt-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            Danas
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary/20" />
            Zakazan termin
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-accent" />
            Aktivnost
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
