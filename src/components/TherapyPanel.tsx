import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Plus, Trash2, Pill, CalendarPlus, AlertTriangle, Clock, ShieldAlert, CheckCircle2 } from "lucide-react";
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

/* ---- Contraindication rules (chronic diseases) ---- */
interface ContraindicationRule {
  drugPatterns: RegExp[];
  conditionPatterns: RegExp[];
  messageKey: string;
  context: string;
}

const CONTRAINDICATION_RULES: ContraindicationRule[] = [
  {
    drugPatterns: [/ibuprofen/i, /aspirin/i, /diklofenak/i, /diclofenac/i, /naproxen/i, /ketoprofen/i, /piroxicam/i, /indometacin/i, /nsaid/i, /brufen/i, /voltaren/i],
    conditionPatterns: [/insulin/i, /dijabet/i, /diabet/i, /gluko/i, /glucophage/i, /metformin/i, /rezisten/i],
    messageKey: "therapy.warningNsaidDiabetes",
    context: "NSAID + diabetes/insulin resistance",
  },
  {
    drugPatterns: [/ibuprofen/i, /diklofenak/i, /diclofenac/i, /naproxen/i, /ketoprofen/i, /piroxicam/i, /nsaid/i, /brufen/i, /voltaren/i, /aspirin/i],
    conditionPatterns: [/ulkus/i, /ulcer/i, /gastrit/i, /gastritis/i, /krvarenje/i, /bleeding/i, /želudac/i, /stomach/i],
    messageKey: "therapy.warningNsaidGastric",
    context: "NSAID + gastric issues",
  },
  {
    drugPatterns: [/metformin/i, /glucophage/i, /gluformin/i],
    conditionPatterns: [/bubreg/i, /renal/i, /kidney/i, /insuficijencija/i],
    messageKey: "therapy.warningMetforminRenal",
    context: "Metformin + renal insufficiency",
  },
  {
    drugPatterns: [/ace inhibitor/i, /enalapril/i, /ramipril/i, /lizinopril/i, /lisinopril/i, /captopril/i, /perindopril/i],
    conditionPatterns: [/kalijum/i, /potassium/i, /hiperkale/i, /hyperkal/i],
    messageKey: "therapy.warningAceKalium",
    context: "ACE inhibitor + hyperkalemia",
  },
  {
    drugPatterns: [/warfarin/i, /heparin/i, /antikoagul/i, /anticoag/i, /sintrom/i, /acenocoumarol/i],
    conditionPatterns: [/krvarenje/i, /bleeding/i, /hemofilija/i, /hemophilia/i],
    messageKey: "therapy.warningAnticoagBleeding",
    context: "Anticoagulant + bleeding risk",
  },
  {
    drugPatterns: [/beta.?blokator/i, /beta.?blocker/i, /propranolol/i, /atenolol/i, /bisoprolol/i, /metoprolol/i, /carvedilol/i, /nebivolol/i],
    conditionPatterns: [/astma/i, /asthma/i, /bronhospaz/i, /bronchospas/i],
    messageKey: "therapy.warningBetaBlockerAsthma",
    context: "Beta-blocker + asthma",
  },
];

function checkContraindications(
  medications: Medication[],
  allergies: string,
  chronicDiseases: string,
): { messageKey: string; drugName: string; condition: string }[] {
  const warnings: { messageKey: string; drugName: string; condition: string }[] = [];
  const combined = `${allergies} ${chronicDiseases}`.toLowerCase();
  if (!combined.trim()) return warnings;

  for (const med of medications) {
    if (!med.name.trim()) continue;
    const nameLC = med.name.toLowerCase();
    for (const rule of CONTRAINDICATION_RULES) {
      const drugMatch = rule.drugPatterns.some((p) => p.test(nameLC));
      const condMatch = rule.conditionPatterns.some((p) => p.test(combined));
      if (drugMatch && condMatch) {
        warnings.push({ messageKey: rule.messageKey, drugName: med.name, condition: rule.context });
      }
    }
  }

  const allergyWords = allergies.toLowerCase().split(/[,;.\s]+/).filter(Boolean);
  for (const med of medications) {
    if (!med.name.trim()) continue;
    const nameLC = med.name.toLowerCase();
    if (allergyWords.some((a) => a.length > 2 && nameLC.includes(a))) {
      warnings.push({ messageKey: "therapy.warningAllergy", drugName: med.name, condition: "allergy" });
    }
  }

  const seen = new Set<string>();
  return warnings.filter((w) => {
    const key = `${w.messageKey}-${w.drugName}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

interface AllergyWarning {
  risk: boolean;
  allergen: string;
  reason: string;
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
  const { t } = useTranslation();

  /* ---- New medication input state ---- */
  const [newName, setNewName] = useState("");
  const [newDose, setNewDose] = useState("");
  const [newFreq, setNewFreq] = useState("1x");
  const [newNote, setNewNote] = useState("");
  const [allergyWarning, setAllergyWarning] = useState<AllergyWarning | null>(null);
  const [checkingAllergy, setCheckingAllergy] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---- AI allergy check with debounce ---- */
  const checkAllergyAI = useCallback(async (drugName: string) => {
    if (!drugName.trim() || !allergies.trim()) {
      setAllergyWarning(null);
      return;
    }

    // Quick local check first
    const allergyWords = allergies.toLowerCase().split(/[,;.\s]+/).filter((w) => w.length > 2);
    const nameLC = drugName.toLowerCase();
    const localMatch = allergyWords.find((a) => nameLC.includes(a) || a.includes(nameLC));
    if (localMatch) {
      setAllergyWarning({ risk: true, allergen: localMatch, reason: "Direktno poklapanje sa alergijom" });
      return;
    }

    // AI check for cross-reactions
    setCheckingAllergy(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-allergy", {
        body: { drugName, allergies },
      });
      if (error) throw error;
      if (data?.risk) {
        setAllergyWarning({ risk: true, allergen: data.allergen || allergies, reason: data.reason || "" });
      } else {
        setAllergyWarning(null);
      }
    } catch (err) {
      console.error("Allergy check error:", err);
      // Don't block the flow on AI failure
      setAllergyWarning(null);
    } finally {
      setCheckingAllergy(false);
    }
  }, [allergies]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!newName.trim()) {
      setAllergyWarning(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      checkAllergyAI(newName);
    }, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [newName, checkAllergyAI]);

  const handleAddMed = () => {
    if (!newName.trim()) return;
    onMedicationsChange([...medications, { name: newName.trim(), dose: newDose.trim(), frequency: newFreq, note: newNote.trim() }]);
    setNewName("");
    setNewDose("");
    setNewFreq("1x");
    setNewNote("");
    setAllergyWarning(null);
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

  const hasAllergyRisk = allergyWarning?.risk === true;

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div className="text-center py-2">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground">{t("therapy.title")}</h2>
        <p className="text-[10px] text-muted-foreground mt-0.5">{t("therapy.subtitle")}</p>
      </div>

      {/* Safety Warnings for existing medications */}
      {(() => {
        const warnings = checkContraindications(medications, allergies, chronicDiseases);
        if (warnings.length === 0) return null;
        return (
          <div className="space-y-2">
            {warnings.map((w, i) => (
              <div
                key={`${w.messageKey}-${w.drugName}-${i}`}
                className="flex items-start gap-3 px-4 py-3 rounded-2xl border border-yellow-600/20 bg-yellow-900/10 backdrop-blur-sm"
              >
                <ShieldAlert size={16} strokeWidth={1.5} className="text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-foreground/80">
                  <span className="font-semibold text-yellow-500">{t("therapy.safetyNote")}</span>{" "}
                  {t(w.messageKey).replace("{drug}", w.drugName)}
                </p>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Medications */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Pill size={16} strokeWidth={1.5} className="text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{t("therapy.medications")}</h3>
        </div>

        {/* ---- AI Allergy Warning Banner ---- */}
        {hasAllergyRisk && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-2xl border border-orange-500/40 bg-orange-900/15 backdrop-blur-sm animate-in fade-in duration-300">
            <AlertTriangle size={18} strokeWidth={2} className="text-orange-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-orange-400">
                ⚠️ {t("therapy.allergyBannerTitle")}
              </p>
              <p className="text-xs leading-relaxed text-foreground/80 mt-1">
                {t("therapy.allergyBannerBody").replace("{allergen}", allergyWarning?.allergen || "")}
              </p>
              {allergyWarning?.reason && (
                <p className="text-[10px] text-muted-foreground mt-1 italic">{allergyWarning.reason}</p>
              )}
            </div>
          </div>
        )}

        {/* ---- Add medication form ---- */}
        <div className={cn(
          "rounded-2xl p-4 space-y-3 border transition-all duration-300",
          hasAllergyRisk
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
                    hasAllergyRisk
                      ? "bg-orange-950/20 border border-orange-500/60 ring-1 ring-orange-500/30 focus:ring-orange-500/50"
                      : "bg-muted/30 focus:ring-1 focus:ring-primary/30"
                  )}
                />
                {checkingAllergy && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <div className="w-3.5 h-3.5 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                  </div>
                )}
                {!checkingAllergy && newName.trim() && !hasAllergyRisk && allergies.trim() && (
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
          {medications.map((med, i) => (
            <div key={i} className="flex items-center gap-3 bg-muted/15 rounded-xl px-4 py-3 border border-border/10 group">
              <Pill size={14} strokeWidth={1.5} className="text-primary/60 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{med.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {[med.dose, frequencyOptions.find((f) => f.value === med.frequency)?.label, med.note].filter(Boolean).join(" · ")}
                </p>
              </div>
              <button
                onClick={() => removeMed(i)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-destructive transition-all p-1.5 rounded-lg hover:bg-destructive/5"
              >
                <Trash2 size={13} strokeWidth={1.8} />
              </button>
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
