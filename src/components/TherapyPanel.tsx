import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Plus, Trash2, Pill, CalendarPlus, AlertTriangle, Clock, ShieldAlert, CheckCircle2, Activity } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";

export interface Medication {
  name: string;
  dose: string;
  frequency: string;
  note: string;
}

export interface PlannedAppointment {
  title: string;
  date: Date | undefined;
  time: string;
  priority: "normal" | "high";
}

interface TherapyPanelProps {
  medications: Medication[];
  onMedicationsChange: (meds: Medication[]) => void;
  appointments: PlannedAppointment[];
  onAppointmentsChange: (apts: PlannedAppointment[]) => void;
  allergies?: string;
  chronicDiseases?: string;
}

interface AIWarning {
  type: "allergy" | "contraindication";
  severity: "high" | "medium";
  title: string;
  explanation: string;
}

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
  allergies = "", chronicDiseases = "",
}: TherapyPanelProps) {
  const { t, language } = useTranslation();

  /* ---- New medication input state ---- */
  const [newName, setNewName] = useState("");
  const [newDose, setNewDose] = useState("");
  const [newFreq, setNewFreq] = useState("1x");
  const [newNote, setNewNote] = useState("");
  const [aiWarnings, setAiWarnings] = useState<AIWarning[]>([]);
  const [checkingDrug, setCheckingDrug] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---- Warnings for existing medications (cached per medication list) ---- */
  const [existingMedWarnings, setExistingMedWarnings] = useState<Map<string, AIWarning[]>>(new Map());
  const existingCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---- AI clinical decision support check ---- */
  const checkDrugSafety = useCallback(async (drugName: string) => {
    if (!drugName.trim()) {
      setAiWarnings([]);
      return;
    }

    const hasAllergies = !!allergies.trim();
    const hasChronic = !!chronicDiseases.trim();

    if (!hasAllergies && !hasChronic) {
      setAiWarnings([]);
      return;
    }

    setCheckingDrug(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-allergy", {
        body: { drugName, allergies, chronicDiseases, language },
      });
      if (error) throw error;
      if (data?.warnings && Array.isArray(data.warnings)) {
        setAiWarnings(data.warnings);
      } else {
        setAiWarnings([]);
      }
    } catch (err) {
      console.error("Clinical decision support error:", err);
      setAiWarnings([]);
    } finally {
      setCheckingDrug(false);
    }
  }, [allergies, chronicDiseases, language]);

  /* ---- Debounced check on drug name input ---- */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!newName.trim()) {
      setAiWarnings([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      checkDrugSafety(newName);
    }, 700);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [newName, checkDrugSafety]);

  /* ---- Re-check existing medications when allergies/chronicDiseases change ---- */
  useEffect(() => {
    if (existingCheckRef.current) clearTimeout(existingCheckRef.current);
    if (medications.length === 0) {
      setExistingMedWarnings(new Map());
      return;
    }
    existingCheckRef.current = setTimeout(async () => {
      const hasContext = !!allergies.trim() || !!chronicDiseases.trim();
      if (!hasContext) {
        setExistingMedWarnings(new Map());
        return;
      }
      const newWarnings = new Map<string, AIWarning[]>();
      for (const med of medications) {
        if (!med.name.trim()) continue;
        try {
          const { data } = await supabase.functions.invoke("check-allergy", {
            body: { drugName: med.name, allergies, chronicDiseases, language },
          });
          if (data?.warnings?.length) {
            newWarnings.set(med.name, data.warnings);
          }
        } catch {
          // Silent fail for existing med checks
        }
      }
      setExistingMedWarnings(newWarnings);
    }, 1000);
    return () => { if (existingCheckRef.current) clearTimeout(existingCheckRef.current); };
  }, [medications, allergies, chronicDiseases, language]);

  const handleAddMed = () => {
    if (!newName.trim()) return;
    onMedicationsChange([...medications, { name: newName.trim(), dose: newDose.trim(), frequency: newFreq, note: newNote.trim() }]);
    setNewName("");
    setNewDose("");
    setNewFreq("1x");
    setNewNote("");
    setAiWarnings([]);
  };

  const removeMed = (i: number) => onMedicationsChange(medications.filter((_, idx) => idx !== i));

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

  const hasHighRisk = aiWarnings.some(w => w.severity === "high");
  const hasAnyRisk = aiWarnings.length > 0;

  // Collect all existing med warnings into a flat list for the top banner
  const allExistingWarnings = useMemo(() => {
    const result: { medName: string; warning: AIWarning }[] = [];
    existingMedWarnings.forEach((warnings, medName) => {
      warnings.forEach(w => result.push({ medName, warning: w }));
    });
    return result;
  }, [existingMedWarnings]);

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div className="text-center py-2">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground">{t("therapy.title")}</h2>
        <p className="text-[10px] text-muted-foreground mt-0.5">{t("therapy.subtitle")}</p>
      </div>

      {/* AI Safety Warnings for existing medications */}
      {allExistingWarnings.length > 0 && (
        <div className="space-y-2">
          {allExistingWarnings.map((item, i) => (
            <div
              key={`existing-${item.medName}-${i}`}
              className={cn(
                "flex items-start gap-3 px-4 py-3 rounded-2xl border backdrop-blur-sm",
                item.warning.severity === "high"
                  ? "border-red-500/30 bg-red-950/15"
                  : "border-yellow-600/20 bg-yellow-900/10"
              )}
            >
              {item.warning.type === "allergy" ? (
                <AlertTriangle size={16} strokeWidth={1.5} className={cn("shrink-0 mt-0.5", item.warning.severity === "high" ? "text-red-400" : "text-yellow-500")} />
              ) : (
                <ShieldAlert size={16} strokeWidth={1.5} className={cn("shrink-0 mt-0.5", item.warning.severity === "high" ? "text-red-400" : "text-yellow-500")} />
              )}
              <div className="flex-1 min-w-0">
                <p className={cn("text-xs font-semibold", item.warning.severity === "high" ? "text-red-400" : "text-yellow-500")}>
                  {item.warning.type === "allergy" ? "⚠️" : "🛡️"} {item.medName}: {item.warning.title}
                </p>
                <p className="text-xs leading-relaxed text-foreground/80 mt-0.5">
                  {item.warning.explanation}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Medications */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Pill size={16} strokeWidth={1.5} className="text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{t("therapy.medications")}</h3>
        </div>

        {/* ---- AI Warning Banner for new drug input ---- */}
        {hasAnyRisk && (
          <div className="space-y-2 animate-in fade-in duration-300">
            {aiWarnings.map((warning, i) => (
              <div
                key={`new-warn-${i}`}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 rounded-2xl border backdrop-blur-sm",
                  warning.severity === "high"
                    ? "border-red-500/40 bg-red-950/15"
                    : "border-orange-500/40 bg-orange-900/15"
                )}
              >
                {warning.type === "allergy" ? (
                  <AlertTriangle size={18} strokeWidth={2} className={cn("shrink-0 mt-0.5 animate-pulse", warning.severity === "high" ? "text-red-400" : "text-orange-400")} />
                ) : (
                  <Activity size={18} strokeWidth={2} className={cn("shrink-0 mt-0.5", warning.severity === "high" ? "text-red-400" : "text-orange-400")} />
                )}
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-semibold", warning.severity === "high" ? "text-red-400" : "text-orange-400")}>
                    {warning.type === "allergy" ? "⚠️" : "🛡️"} {warning.title}
                  </p>
                  <p className="text-xs leading-relaxed text-foreground/80 mt-1">
                    {warning.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ---- Add medication form ---- */}
        <div className={cn(
          "rounded-2xl p-4 space-y-3 border transition-all duration-300",
          hasHighRisk
            ? "border-red-500/50 bg-red-950/10 shadow-[0_0_20px_-5px_hsl(0_70%_50%/0.15)]"
            : hasAnyRisk
              ? "border-orange-500/50 bg-orange-950/10 shadow-[0_0_20px_-5px_hsl(25_95%_53%/0.15)]"
              : "border-border/20 bg-muted/10"
        )}>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {t("therapy.newMedication")}
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("therapy.drugName")}</label>
              <div className="relative">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t("therapy.drugNamePlaceholder")}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none transition-all duration-300",
                    hasHighRisk
                      ? "bg-red-950/20 border border-red-500/60 ring-1 ring-red-500/30 focus:ring-red-500/50"
                      : hasAnyRisk
                        ? "bg-orange-950/20 border border-orange-500/60 ring-1 ring-orange-500/30 focus:ring-orange-500/50"
                        : "bg-muted/30 focus:ring-1 focus:ring-primary/30"
                  )}
                />
                {checkingDrug && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <div className="w-3.5 h-3.5 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                  </div>
                )}
                {!checkingDrug && newName.trim() && !hasAnyRisk && (allergies.trim() || chronicDiseases.trim()) && (
                  <CheckCircle2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500/60" />
                )}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("therapy.dose")}</label>
              <input
                value={newDose}
                onChange={(e) => setNewDose(e.target.value)}
                placeholder="75mg"
                className="w-full bg-muted/30 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("therapy.frequency")}</label>
              <select
                value={newFreq}
                onChange={(e) => setNewFreq(e.target.value)}
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
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder={t("therapy.notePlaceholder")}
                className="w-full bg-muted/30 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          <Button
            onClick={handleAddMed}
            disabled={!newName.trim()}
            className={cn(
              "w-full gap-2 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all duration-300",
              "bg-primary hover:bg-primary/90 text-primary-foreground",
              "hover:shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.4)]",
              "active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
            )}
            size="sm"
          >
            <Plus size={14} strokeWidth={2.5} />
            {t("therapy.addMedicationBtn")}
          </Button>
        </div>

        {/* ---- Existing medications list ---- */}
        {medications.length === 0 && (
          <p className="text-xs text-muted-foreground italic py-2">{t("therapy.noMedications")}</p>
        )}

        <div className="space-y-2">
          {medications.map((med, i) => {
            const medWarnings = existingMedWarnings.get(med.name) || [];
            const medHasRisk = medWarnings.length > 0;
            const medHighRisk = medWarnings.some(w => w.severity === "high");
            return (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 border group transition-all duration-300",
                  medHighRisk
                    ? "bg-red-950/10 border-red-500/20"
                    : medHasRisk
                      ? "bg-orange-950/10 border-orange-500/20"
                      : "bg-muted/15 border-border/10"
                )}
              >
                <Pill size={14} strokeWidth={1.5} className={cn(
                  "shrink-0",
                  medHighRisk ? "text-red-400" : medHasRisk ? "text-orange-400" : "text-primary/60"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{med.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {[med.dose, frequencyOptions.find((f) => f.value === med.frequency)?.label, med.note].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {medHasRisk && (
                  <AlertTriangle size={14} className={cn("shrink-0", medHighRisk ? "text-red-400" : "text-orange-400")} />
                )}
                <button
                  onClick={() => removeMed(i)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-destructive transition-all p-1.5 rounded-lg hover:bg-destructive/5"
                >
                  <Trash2 size={13} strokeWidth={1.8} />
                </button>
              </div>
            );
          })}
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
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t("therapy.appointment")} {i + 1}</span>
                <button onClick={() => removeApt(i)} className="text-muted-foreground/50 hover:text-destructive transition-colors p-1">
                  <Trash2 size={12} strokeWidth={1.8} />
                </button>
              </div>

              <input
                value={apt.title}
                onChange={(e) => updateApt(i, "title", e.target.value)}
                placeholder={t("therapy.appointmentPlaceholder")}
                className="w-full bg-muted/30 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
              />

              <div className="flex gap-2.5">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex-1 flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2 text-sm text-left hover:bg-muted/40 transition-all">
                      <Clock size={13} strokeWidth={1.5} className="text-muted-foreground/60" />
                      <span className={apt.date ? "text-foreground" : "text-muted-foreground/40"}>
                        {apt.date ? format(apt.date, "dd.MM.yyyy") : t("therapy.selectDate")}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background border-border/30" align="start">
                    <Calendar
                      mode="single"
                      selected={apt.date}
                      onSelect={(d) => updateApt(i, "date", d)}
                      disabled={(d) => d < new Date()}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                <select
                  value={apt.time}
                  onChange={(e) => updateApt(i, "time", e.target.value)}
                  className="flex-1 bg-muted/30 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled>{t("therapy.selectTime")}</option>
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={apt.priority === "high"}
                  onChange={(e) => updateApt(i, "priority", e.target.checked ? "high" : "normal")}
                  className="w-3.5 h-3.5 rounded border-border accent-primary"
                />
                <span className="text-[11px] text-muted-foreground">{t("therapy.highPriority")}</span>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
