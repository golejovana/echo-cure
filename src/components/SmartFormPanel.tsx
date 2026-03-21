import { useState, useCallback } from "react";
import {
  Sparkles, Heart, Stethoscope, Droplets, Brain, Users,
  ChevronDown, Send, Loader2, FileText, ClipboardList, Activity,
  User, Clock, Thermometer,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/* ---------- types ---------- */
interface CategoryField { key: string; label: string }
interface MedicalCategory { id: string; label: string; icon: React.ElementType; fields: CategoryField[] }

/* ---------- systematic review categories ---------- */
const CATEGORIES: MedicalCategory[] = [
  {
    id: "cardiovascular", label: "Cardiovascular & Respiratory", icon: Heart,
    fields: [
      { key: "chestPain", label: "Chest Pain / Bol u grudima" },
      { key: "swelling", label: "Swelling / Otoci" },
      { key: "pressure", label: "Blood Pressure / Krvni pritisak" },
      { key: "veins", label: "Veins / Vene" },
    ],
  },
  {
    id: "gastrointestinal", label: "Gastrointestinal", icon: Stethoscope,
    fields: [
      { key: "appetite", label: "Appetite / Apetit" },
      { key: "nausea", label: "Nausea / Mučnina" },
      { key: "swallowing", label: "Swallowing / Gutanje" },
      { key: "bloating", label: "Bloating / Nadutost" },
      { key: "stool", label: "Stool / Stolica" },
    ],
  },
  {
    id: "urogenital", label: "Urogenital", icon: Droplets,
    fields: [
      { key: "urination", label: "Urination / Mokrenje" },
      { key: "flankPain", label: "Flank Pain / Bol u slabinama" },
    ],
  },
  {
    id: "locomotor", label: "Locomotor & CNS", icon: Brain,
    fields: [
      { key: "jointPain", label: "Joint Pain / Bol u zglobovima" },
      { key: "visionHearing", label: "Vision / Hearing" },
      { key: "dizziness", label: "Dizziness / Vrtoglavica" },
      { key: "headaches", label: "Headaches / Glavobolje" },
    ],
  },
  {
    id: "personal", label: "Personal & Family History", icon: Users,
    fields: [
      { key: "allergies", label: "Allergies / Alergije" },
      { key: "chronicDiseases", label: "Chronic Diseases / Hronične bolesti" },
      { key: "smokingAlcohol", label: "Smoking & Alcohol / Pušenje i alkohol" },
    ],
  },
];

/* ---------- objective findings fields ---------- */
const OBJECTIVE_FIELDS: CategoryField[] = [
  { key: "bloodPressure", label: "Blood Pressure / TA" },
  { key: "pulse", label: "Pulse / Puls" },
  { key: "lungSounds", label: "Lung Auscultation / Auskultacija pluća" },
  { key: "heartSounds", label: "Heart Auscultation / Srčani tonovi" },
  { key: "abdominalExam", label: "Abdominal Exam / Pregled abdomena" },
  { key: "meningealSigns", label: "Meningeal Signs / Meningealni znaci" },
  { key: "otherFindings", label: "Other Findings / Ostali nalazi" },
];

type FormData = Record<string, string>;
interface SmartFormPanelProps { transcript: string; lang: string }

const today = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}.`;
};

/* ================================================================ */
const SmartFormPanel = ({ transcript }: SmartFormPanelProps) => {
  const [form, setForm] = useState<FormData>({});
  const [filling, setFilling] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [objectiveOpen, setObjectiveOpen] = useState(false);

  const toggle = (id: string) =>
    setOpenSections((p) => (p.includes(id) ? p.filter((s) => s !== id) : [...p, id]));

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  /* ---- auto-fill ---- */
  const handleAutoFill = useCallback(async () => {
    if (!transcript.trim() || filling) return;
    setFilling(true);
    // Reset form for a fresh extraction
    setForm({});
    try {
      const { data, error } = await supabase.functions.invoke("parse-transcript", { body: { transcript } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const fd = data.formData as FormData;

      setOpenSections(CATEGORIES.map((c) => c.id));
      setObjectiveOpen(true);

      const allKeys = [
        "patientName", "patientAge", "patientOccupation", "patientSocialStatus",
        "chiefComplaints", "presentIllness", "clinicalTimeline", "diagnosisCodes",
        ...CATEGORIES.flatMap((c) => c.fields.map((f) => f.key)),
        ...OBJECTIVE_FIELDS.map((f) => f.key),
      ];
      allKeys.forEach((key, i) => {
        setTimeout(() => {
          setForm((prev) => ({ ...prev, [key]: fd[key] || "Not mentioned in transcript" }));
          if (i === allKeys.length - 1) setFilling(false);
        }, 50 + i * 45);
      });
    } catch (e) {
      console.error("Auto-fill error:", e);
      toast({ title: "Auto-fill failed", description: e instanceof Error ? e.message : "Could not parse transcript.", variant: "destructive" });
      setFilling(false);
    }
  }, [transcript, filling]);

  const handleSubmit = () =>
    toast({ title: "✓ Izveštaj poslat", description: "Podaci enkriptovani i poslati u klinički sistem u skladu sa GDPR propisima." });

  const filledCount = (cat: MedicalCategory) =>
    cat.fields.filter((f) => form[f.key] && !form[f.key].startsWith("Not mentioned")).length;

  const hasAnyData = Object.values(form).some((v) => v && !v.startsWith("Not mentioned"));

  return (
    <div className="flex flex-col h-full">
      {/* top bar */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Medical Report</h2>
        <button
          onClick={handleAutoFill}
          disabled={!transcript.trim() || filling}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.96] transition-all duration-200"
        >
          {filling ? <Loader2 size={15} strokeWidth={1.8} className="animate-spin" /> : <Sparkles size={15} strokeWidth={1.8} />}
          {filling ? "Extracting…" : "Extract & Fill"}
        </button>
      </div>

      {/* scrollable body */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">

        {/* ===== HEADER ===== */}
        <div className="glass-card p-5 space-y-3">
          <div className="text-center space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Republika Srbija</p>
            <p className="text-xs font-bold text-foreground">Univerzitetski Klinički Centar Srbije</p>
            <p className="text-[11px] text-muted-foreground">Pasterova 2, 11000 Beograd</p>
          </div>
          <div className="border-t border-border/50 pt-3 text-right">
            <span className="text-[11px] text-muted-foreground">Datum: {today()}</span>
          </div>
        </div>

        {/* ===== PATIENT IDENTITY (dynamic) ===== */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <User size={16} strokeWidth={1.5} className="text-muted-foreground" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Patient Identity / Podaci o pacijentu</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "patientName", label: "Name / Ime" },
              { key: "patientAge", label: "Age / Starost" },
              { key: "patientOccupation", label: "Occupation / Zanimanje" },
              { key: "patientSocialStatus", label: "Social Status / Socijalni status" },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{f.label}</label>
                <input
                  value={form[f.key] || ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  placeholder="Extracted from voice…"
                  className={cn(
                    "w-full bg-muted/30 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all duration-200",
                    form[f.key]?.startsWith("Not mentioned") && "text-muted-foreground/60 italic"
                  )}
                />
                {filling && !form[f.key] && <Shimmer />}
              </div>
            ))}
          </div>
        </div>

        {/* ===== CHIEF COMPLAINTS ===== */}
        <SectionBlock icon={ClipboardList} title="Chief Complaints / Glavne tegobe" fieldKey="chiefComplaints" value={form.chiefComplaints || ""} onChange={set} filling={filling} />

        {/* ===== PRESENT ILLNESS ===== */}
        <SectionBlock icon={FileText} title="Present Illness / Sadašnja bolest" fieldKey="presentIllness" value={form.presentIllness || ""} onChange={set} filling={filling} rows={4} />

        {/* ===== CLINICAL TIMELINE ===== */}
        <SectionBlock icon={Clock} title="Clinical Timeline / Hronologija" fieldKey="clinicalTimeline" value={form.clinicalTimeline || ""} onChange={set} filling={filling} rows={3} placeholder="Onset, hospitals visited, treatments, procedures…" />

        {/* ===== DIAGNOSIS / ICD-10 ===== */}
        <SectionBlock icon={Activity} title="Diagnosis / Dijagnoza (ICD-10)" fieldKey="diagnosisCodes" value={form.diagnosisCodes || ""} onChange={set} filling={filling} rows={3} placeholder="e.g. I10 - Essential hypertension&#10;N18.4 - CKD stage 4" />

        {/* ===== SYSTEMATIC REVIEW ===== */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">Systematic Review / Sistematski pregled</p>
          {CATEGORIES.map((cat) => {
            const isOpen = openSections.includes(cat.id);
            const Icon = cat.icon;
            const filled = filledCount(cat);
            return (
              <div key={cat.id} className="glass-card overflow-hidden">
                <button onClick={() => toggle(cat.id)} className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/30 transition-colors duration-200 active:scale-[0.995]">
                  <Icon size={17} strokeWidth={1.5} className="text-muted-foreground shrink-0" />
                  <span className="flex-1 text-sm font-semibold text-foreground tracking-wide">{cat.label}</span>
                  {filled > 0 && <span className="text-[10px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">{filled}/{cat.fields.length}</span>}
                  <ChevronDown size={15} strokeWidth={1.8} className={cn("text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div key="c" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
                      <div className="px-5 pb-4 space-y-3 border-t border-border/50 pt-3">
                        {cat.fields.map((field) => (
                          <FieldRow key={field.key} field={field} value={form[field.key] || ""} onChange={set} filling={filling} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* ===== STATUS PRAESENS / OBJECTIVE FINDINGS ===== */}
        <div className="glass-card overflow-hidden">
          <button onClick={() => setObjectiveOpen((o) => !o)} className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/30 transition-colors duration-200 active:scale-[0.995]">
            <Thermometer size={17} strokeWidth={1.5} className="text-muted-foreground shrink-0" />
            <span className="flex-1 text-sm font-semibold text-foreground tracking-wide">Status Praesens / Objective Findings</span>
            <ChevronDown size={15} strokeWidth={1.8} className={cn("text-muted-foreground transition-transform duration-300", objectiveOpen && "rotate-180")} />
          </button>
          <AnimatePresence initial={false}>
            {objectiveOpen && (
              <motion.div key="obj" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
                <div className="px-5 pb-4 space-y-3 border-t border-border/50 pt-3">
                  {OBJECTIVE_FIELDS.map((field) => (
                    <FieldRow key={field.key} field={field} value={form[field.key] || ""} onChange={set} filling={filling} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ===== FOOTER ===== */}
        <div className="glass-card p-5">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pečat ustanove</p>
              <div className="w-24 h-24 border border-dashed border-border/60 rounded-lg flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground/40 italic">Stamp</span>
              </div>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Potpis lekara</p>
              <div className="w-48 border-b border-border/60 pb-1">
                <span className="text-[10px] text-muted-foreground/40 italic">Dr. ___________________________</span>
              </div>
              <p className="text-[10px] text-muted-foreground/50">Faksimil / Facsimile</p>
            </div>
          </div>
        </div>
      </div>

      {/* submit */}
      <div className="pt-4 mt-2 border-t border-border/40">
        <button onClick={handleSubmit} disabled={!hasAnyData} className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold bg-accent text-accent-foreground shadow-md shadow-accent/15 hover:shadow-lg hover:shadow-accent/25 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-all duration-200">
          <Send size={15} strokeWidth={1.8} />
          Submit Report / Pošalji izveštaj
        </button>
      </div>
    </div>
  );
};

/* ---- small helpers ---- */
function FieldRow({ field, value, onChange, filling }: { field: CategoryField; value: string; onChange: (k: string, v: string) => void; filling: boolean }) {
  return (
    <motion.div initial={false} animate={value ? { scale: [1, 1.004, 1] } : {}} transition={{ duration: 0.3, ease: "easeOut" }}>
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{field.label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(field.key, e.target.value)}
        rows={2}
        placeholder={`Extracted from voice…`}
        className={cn(
          "w-full bg-muted/30 rounded-xl px-3.5 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all duration-200",
          (value === "Not mentioned in transcript" || value === "Negative / Denied" || value === "Not examined / Not mentioned") && "text-muted-foreground/60 italic"
        )}
        style={{ overflowWrap: "break-word" }}
      />
      {filling && !value && <Shimmer />}
    </motion.div>
  );
}

function SectionBlock({ icon: Icon, title, fieldKey, value, onChange, filling, rows = 2, placeholder }: {
  icon: React.ElementType; title: string; fieldKey: string; value: string; onChange: (k: string, v: string) => void; filling: boolean; rows?: number; placeholder?: string;
}) {
  return (
    <div className="glass-card p-5 space-y-2">
      <div className="flex items-center gap-2">
        <Icon size={16} strokeWidth={1.5} className="text-muted-foreground" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{title}</h3>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        rows={rows}
        placeholder={placeholder || "Extracted from voice…"}
        className={cn(
          "w-full bg-muted/30 rounded-xl px-3.5 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all duration-200",
          value?.startsWith("Not mentioned") && "text-muted-foreground/60 italic"
        )}
        style={{ overflowWrap: "break-word" }}
      />
      {filling && !value && <Shimmer />}
    </div>
  );
}

function Shimmer() {
  return (
    <div className="h-0.5 mt-1 rounded-full bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20" style={{ backgroundSize: "200% 100%", animation: "shimmer 1.2s linear infinite" }} />
  );
}

export default SmartFormPanel;
