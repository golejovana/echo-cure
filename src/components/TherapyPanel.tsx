import { useState } from "react";
import { Plus, Trash2, Pill, CalendarPlus, AlertTriangle, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface Medication {
  name: string;
  dose: string;
  frequency: string;
  note: string;
}

export interface PlannedAppointment {
  title: string;
  date: Date | undefined;
  time: string; // HH:mm format
  priority: "normal" | "high";
}

interface TherapyPanelProps {
  medications: Medication[];
  onMedicationsChange: (meds: Medication[]) => void;
  appointments: PlannedAppointment[];
  onAppointmentsChange: (apts: PlannedAppointment[]) => void;
}

const EMPTY_MED: Medication = { name: "", dose: "", frequency: "1x", note: "" };
const EMPTY_APT: PlannedAppointment = { title: "", date: undefined, time: "", priority: "normal" };

const TIME_OPTIONS = [
  "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
  "19:00", "19:30", "20:00",
];

export default function TherapyPanel({
  medications, onMedicationsChange,
  appointments, onAppointmentsChange,
}: TherapyPanelProps) {
  const { t } = useTranslation();

  const updateMed = (i: number, field: keyof Medication, value: string) => {
    const next = [...medications];
    next[i] = { ...next[i], [field]: value };
    onMedicationsChange(next);
  };

  const removeMed = (i: number) => onMedicationsChange(medications.filter((_, idx) => idx !== i));
  const addMed = () => onMedicationsChange([...medications, { ...EMPTY_MED }]);

  const updateApt = (i: number, field: keyof PlannedAppointment, value: any) => {
    const next = [...appointments];
    next[i] = { ...next[i], [field]: value };
    onAppointmentsChange(next);
  };

  const removeApt = (i: number) => onAppointmentsChange(appointments.filter((_, idx) => idx !== i));
  const addApt = () => onAppointmentsChange([...appointments, { ...EMPTY_APT }]);

  const frequencyOptions = [
    { value: "1x", label: t("therapy.freq1x") },
    { value: "2x", label: t("therapy.freq2x") },
    { value: "3x", label: t("therapy.freq3x") },
    { value: "pp", label: t("therapy.freqAsNeeded") },
  ];

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div className="text-center py-2">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground">{t("therapy.title")}</h2>
        <p className="text-[10px] text-muted-foreground mt-0.5">{t("therapy.subtitle")}</p>
      </div>

      {/* Medications */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill size={16} strokeWidth={1.5} className="text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{t("therapy.medications")}</h3>
          </div>
          <button
            onClick={addMed}
            className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 px-2.5 py-1 rounded-full bg-primary/5 hover:bg-primary/10 transition-all duration-200 active:scale-[0.96]"
          >
            <Plus size={13} strokeWidth={2} />
            {t("therapy.addMedication")}
          </button>
        </div>

        {medications.length === 0 && (
          <p className="text-xs text-muted-foreground italic py-2">{t("therapy.noMedications")}</p>
        )}

        <div className="space-y-3">
          {medications.map((med, i) => (
            <div key={i} className="bg-muted/20 rounded-2xl p-3.5 space-y-2.5 border border-border/20">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("therapy.medication")} #{i + 1}
                </span>
                <button onClick={() => removeMed(i)} className="text-muted-foreground/50 hover:text-destructive transition-colors p-1 rounded-lg hover:bg-destructive/5">
                  <Trash2 size={13} strokeWidth={1.8} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("therapy.drugName")}</label>
                  <input
                    value={med.name}
                    onChange={(e) => updateMed(i, "name", e.target.value)}
                    placeholder={t("therapy.drugNamePlaceholder")}
                    className="w-full bg-muted/30 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("therapy.dose")}</label>
                  <input
                    value={med.dose}
                    onChange={(e) => updateMed(i, "dose", e.target.value)}
                    placeholder="75mg"
                    className="w-full bg-muted/30 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("therapy.frequency")}</label>
                  <select
                    value={med.frequency}
                    onChange={(e) => updateMed(i, "frequency", e.target.value)}
                    className="w-full bg-muted/30 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all appearance-none cursor-pointer"
                  >
                    {frequencyOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("therapy.note")}</label>
                  <input
                    value={med.note}
                    onChange={(e) => updateMed(i, "note", e.target.value)}
                    placeholder={t("therapy.notePlaceholder")}
                    className="w-full bg-muted/30 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Appointments */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarPlus size={16} strokeWidth={1.5} className="text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{t("therapy.followUpAppts")}</h3>
          </div>
          <button
            onClick={addApt}
            className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 px-2.5 py-1 rounded-full bg-primary/5 hover:bg-primary/10 transition-all duration-200 active:scale-[0.96]"
          >
            <Plus size={13} strokeWidth={2} />
            {t("therapy.addAppointment")}
          </button>
        </div>

        {appointments.length === 0 && (
          <p className="text-xs text-muted-foreground italic py-2">{t("therapy.noAppointments")}</p>
        )}

        <div className="space-y-3">
          {appointments.map((apt, i) => (
            <div key={i} className="bg-muted/20 rounded-2xl p-3.5 space-y-2.5 border border-border/20">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("therapy.appointment")} #{i + 1}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateApt(i, "priority", apt.priority === "high" ? "normal" : "high")}
                    className={cn(
                      "flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full transition-all duration-200",
                      apt.priority === "high"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted/40 text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
                    )}
                  >
                    <AlertTriangle size={10} strokeWidth={2} />
                    {t("therapy.highPriority")}
                  </button>
                  <button onClick={() => removeApt(i)} className="text-muted-foreground/50 hover:text-destructive transition-colors p-1 rounded-lg hover:bg-destructive/5">
                    <Trash2 size={13} strokeWidth={1.8} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("therapy.appointmentTitle")}</label>
                  <input
                    value={apt.title}
                    onChange={(e) => updateApt(i, "title", e.target.value)}
                    placeholder={t("therapy.appointmentPlaceholder")}
                    className="w-full bg-muted/30 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("therapy.date")}</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className={cn(
                        "w-full bg-muted/30 rounded-lg px-3 py-2 text-sm text-left focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all",
                        apt.date ? "text-foreground" : "text-muted-foreground/40"
                      )}>
                        {apt.date ? format(apt.date, "dd.MM.yyyy.") : t("therapy.selectDate")}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={apt.date}
                        onSelect={(date) => updateApt(i, "date", date)}
                        disabled={(date) => date < new Date(new Date().toISOString().split("T")[0])}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("therapy.time")}</label>
                  <select
                    value={apt.time}
                    onChange={(e) => updateApt(i, "time", e.target.value)}
                    className={cn(
                      "w-full bg-muted/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all appearance-none cursor-pointer",
                      apt.time ? "text-foreground" : "text-muted-foreground/40"
                    )}
                  >
                    <option value="">{t("therapy.selectTime")}</option>
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
