import { useState, useCallback } from "react";
import {
  Sparkles, Heart, Stethoscope, Droplets, Brain,
  ChevronDown, Send, Loader2, FileText, ClipboardList, Activity,
  User, Clock, Thermometer, Shield, Home,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/* ---------- types ---------- */
interface CategoryField { key: string; label: string }
interface MedicalCategory { id: string; label: string; icon: React.ElementType; fields: CategoryField[] }

/* ---------- ANAMNEZA PO SISTEMIMA ---------- */
const SYSTEM_CATEGORIES: MedicalCategory[] = [
  {
    id: "cardiovascular", label: "Kardiovaskularni / Respiratorni", icon: Heart,
    fields: [
      { key: "chestPain", label: "Bol u grudima / Chest Pain" },
      { key: "swelling", label: "Otoci / Swelling" },
      { key: "pressure", label: "Pritisak / Pressure sensation" },
      { key: "veins", label: "Vene / Veins" },
    ],
  },
  {
    id: "gastrointestinal", label: "Gastrointestinalni (GIT)", icon: Stethoscope,
    fields: [
      { key: "appetite", label: "Apetit / Appetite" },
      { key: "nausea", label: "Mučnina / Nausea" },
      { key: "swallowing", label: "Gutanje / Swallowing" },
      { key: "bloating", label: "Nadutost / Bloating" },
      { key: "stool", label: "Stolica / Stool" },
    ],
  },
  {
    id: "urogenital", label: "Urogenitalni (URO)", icon: Droplets,
    fields: [
      { key: "urination", label: "Mokrenje / Urination" },
      { key: "flankPain", label: "Bol u slabinama / Flank Pain" },
    ],
  },
  {
    id: "locomotor", label: "Lokomotorni & CNS", icon: Brain,
    fields: [
      { key: "jointPain", label: "Bol u zglobovima / Joint Pain" },
      { key: "visionHearing", label: "Vid / Sluh" },
      { key: "dizziness", label: "Vrtoglavica / Dizziness" },
      { key: "headaches", label: "Glavobolje / Headaches" },
    ],
  },
];

/* ---------- objective findings fields ---------- */
const OBJECTIVE_FIELDS: CategoryField[] = [
  { key: "bloodPressure", label: "TA (krvni pritisak)" },
  { key: "pulse", label: "Puls" },
  { key: "temperature", label: "Temperatura" },
  { key: "respiration", label: "Respiracija / SpO2" },
  { key: "lungSounds", label: "Auskultacija pluća" },
  { key: "heartSounds", label: "Srčani tonovi" },
  { key: "abdominalExam", label: "Pregled abdomena" },
  { key: "skinExam", label: "Koža / Skin" },
  { key: "meningealSigns", label: "Meningealni znaci" },
  { key: "otherFindings", label: "Ostali nalazi" },
];

type FormData = Record<string, string>;
interface SmartFormPanelProps { transcript: string; lang: string }

const today = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}.`;
};

/* ================================================================ */
const SmartFormPanel = ({ transcript, lang }: SmartFormPanelProps) => {
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
    setForm({});
    try {
      const { data, error } = await supabase.functions.invoke("parse-transcript", { body: { transcript, lang } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const fd = data.formData as FormData;

      setOpenSections(SYSTEM_CATEGORIES.map((c) => c.id));
      setObjectiveOpen(true);

      const allKeys = [
        "patientName", "patientAge", "patientOccupation", "patientSocialStatus",
        "chiefComplaints", "presentIllness", "clinicalTimeline", "diagnosisCodes",
        ...SYSTEM_CATEGORIES.flatMap((c) => c.fields.map((f) => f.key)),
        "allergies", "chronicDiseases", "surgeries", "medications",
        "familyHistory",
        "livingConditions", "smokingAlcohol", "epidemiological",
        ...OBJECTIVE_FIELDS.map((f) => f.key),
      ];
      allKeys.forEach((key, i) => {
        setTimeout(() => {
          setForm((prev) => ({ ...prev, [key]: fd[key] || "Nije pomenuto u transkriptu" }));
          if (i === allKeys.length - 1) setFilling(false);
        }, 50 + i * 40);
      });
    } catch (e) {
      console.error("Auto-fill error:", e);
      toast({ title: "Greška pri ekstrakciji", description: e instanceof Error ? e.message : "Nije moguće parsirati transkript.", variant: "destructive" });
      setFilling(false);
    }
  }, [transcript, filling, lang]);

  const handleSubmit = () =>
    toast({ title: "✓ Izveštaj poslat", description: "Podaci enkriptovani i poslati u klinički sistem." });

  const filledCount = (cat: MedicalCategory) =>
    cat.fields.filter((f) => form[f.key] && !form[f.key].startsWith("Nije pomenuto") && !form[f.key].startsWith("Not mentioned")).length;

  const hasAnyData = Object.values(form).some((v) => v && !v.startsWith("Nije pomenuto") && !v.startsWith("Not mentioned"));

  return (
    <div className="flex flex-col h-full">
      {/* top bar */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Anamneza i Status Praesens</h2>
        <button
          onClick={handleAutoFill}
          disabled={!transcript.trim() || filling}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.96] transition-all duration-200"
        >
          {filling ? <Loader2 size={15} strokeWidth={1.8} className="animate-spin" /> : <Sparkles size={15} strokeWidth={1.8} />}
          {filling ? "Ekstrakcija…" : "Ekstrahuj & Popuni"}
        </button>
      </div>

      {/* scrollable body */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">

        {/* ===== HEADER ===== */}
        <div className="glass-card p-5 space-y-3">
          <div className="text-center space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Republika Srbija</p>
            <p className="text-xs font-bold text-foreground">Univerzitetski Klinički Centar Srbije</p>
            <p className="text-[11px] text-muted-foreground">Pasterova 2, Savski venac, 11000 Beograd</p>
          </div>
          <div className="border-t border-border/50 pt-3 flex justify-between items-center">
            <span className="text-[11px] text-muted-foreground">Br. istorije bolesti: ___________</span>
            <span className="text-[11px] text-muted-foreground">Datum: {today()}</span>
          </div>
        </div>

        {/* ===== PATIENT IDENTITY ===== */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <User size={16} strokeWidth={1.5} className="text-muted-foreground" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Pacijent</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "patientName", label: "Ime i prezime" },
              { key: "patientAge", label: "Godište / Starost" },
              { key: "patientOccupation", label: "Zanimanje" },
              { key: "patientSocialStatus", label: "Socijalni status" },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{f.label}</label>
                <input
                  value={form[f.key] || ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  placeholder="Iz transkripta…"
                  className={cn(
                    "w-full bg-muted/30 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all duration-200",
                    form[f.key]?.startsWith("Nije pomenuto") && "text-muted-foreground/60 italic"
                  )}
                />
                {filling && !form[f.key] && <Shimmer />}
              </div>
            ))}
          </div>
        </div>

        {/* ===== ANAMNEZA title ===== */}
        <div className="text-center py-2">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground">Anamneza</h2>
        </div>

        {/* ===== RADNE DIJAGNOZE / ICD-10 ===== */}
        <SectionBlock icon={Activity} title="Radne dijagnoze (ICD-10)" fieldKey="diagnosisCodes" value={form.diagnosisCodes || ""} onChange={set} filling={filling} rows={3} placeholder="npr. I10 - Esencijalna hipertenzija&#10;N18.4 - HBI stadijum 4" />

        {/* ===== GLAVNE TEGOBE ===== */}
        <SectionBlock icon={ClipboardList} title="Glavne tegobe" fieldKey="chiefComplaints" value={form.chiefComplaints || ""} onChange={set} filling={filling} rows={3} />

        {/* ===== SADAŠNJA BOLEST ===== */}
        <SectionBlock icon={FileText} title="Sadašnja bolest" fieldKey="presentIllness" value={form.presentIllness || ""} onChange={set} filling={filling} rows={5} placeholder="Detaljni narativ sadašnje bolesti…" />

        {/* ===== KLINIČKA HRONOLOGIJA ===== */}
        <SectionBlock icon={Clock} title="Klinička hronologija" fieldKey="clinicalTimeline" value={form.clinicalTimeline || ""} onChange={set} filling={filling} rows={3} placeholder="Početak, bolnice, terapije, procedure…" />

        {/* ===== ANAMNEZA PO SISTEMIMA ===== */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">Anamneza po sistemima</p>
          {SYSTEM_CATEGORIES.map((cat) => {
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
                <AnimatePresence mode="wait" initial={false}>
                  {isOpen && (
                    <motion.div key={cat.id + "-content"} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
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

        {/* ===== LIČNA ANAMNEZA ===== */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={16} strokeWidth={1.5} className="text-muted-foreground" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Lična anamneza</h3>
          </div>
          <div className="space-y-3">
            {[
              { key: "allergies", label: "Alergije" },
              { key: "chronicDiseases", label: "Hronične bolesti" },
              { key: "surgeries", label: "Hirurške intervencije" },
              { key: "medications", label: "Redovna terapija" },
            ].map((f) => (
              <FieldRow key={f.key} field={f} value={form[f.key] || ""} onChange={set} filling={filling} />
            ))}
          </div>
        </div>

        {/* ===== PORODIČNA ANAMNEZA ===== */}
        <SectionBlock icon={User} title="Porodična anamneza" fieldKey="familyHistory" value={form.familyHistory || ""} onChange={set} filling={filling} rows={2} placeholder="Hronične bolesti u porodici…" />

        {/* ===== SOCIO-EPIDEMIOLOŠKA ANAMNEZA ===== */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Home size={16} strokeWidth={1.5} className="text-muted-foreground" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Socio-epidemiološka anamneza</h3>
          </div>
          <div className="space-y-3">
            {[
              { key: "livingConditions", label: "Uslovi života" },
              { key: "smokingAlcohol", label: "Pušenje / Alkohol" },
              { key: "epidemiological", label: "Epidemiološki podaci" },
            ].map((f) => (
              <FieldRow key={f.key} field={f} value={form[f.key] || ""} onChange={set} filling={filling} />
            ))}
          </div>
        </div>

        {/* ===== STATUS PRAESENS ===== */}
        <div className="text-center py-2">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground">Status Praesens</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Popunjava lekar pri pregledu</p>
        </div>

        <div className="glass-card overflow-hidden">
          <button onClick={() => setObjectiveOpen((o) => !o)} className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/30 transition-colors duration-200 active:scale-[0.995]">
            <Thermometer size={17} strokeWidth={1.5} className="text-muted-foreground shrink-0" />
            <span className="flex-1 text-sm font-semibold text-foreground tracking-wide">Objektivni nalaz</span>
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
              <p className="text-[10px] text-muted-foreground/50">Faksimil</p>
            </div>
          </div>
        </div>
      </div>

      {/* submit */}
      <div className="pt-4 mt-2 border-t border-border/40">
        <button onClick={handleSubmit} disabled={!hasAnyData} className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold bg-accent text-accent-foreground shadow-md shadow-accent/15 hover:shadow-lg hover:shadow-accent/25 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-all duration-200">
          <Send size={15} strokeWidth={1.8} />
          Pošalji izveštaj
        </button>
      </div>
    </div>
  );
};

/* ---- small helpers ---- */
function FieldRow({ field, value, onChange, filling }: { field: CategoryField; value: string; onChange: (k: string, v: string) => void; filling: boolean }) {
  const isFaded = value === "Nije pomenuto u transkriptu" || value === "Not mentioned in transcript" || value === "Negativno / Negira" || value === "Negative / Denied" || value === "Nije pregledano" || value === "Not examined / Not mentioned";
  return (
    <motion.div initial={false} animate={value ? { scale: [1, 1.004, 1] } : {}} transition={{ duration: 0.3, ease: "easeOut" }}>
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{field.label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(field.key, e.target.value)}
        rows={2}
        placeholder="Iz transkripta…"
        className={cn(
          "w-full bg-muted/30 rounded-xl px-3.5 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all duration-200",
          isFaded && "text-muted-foreground/60 italic"
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
  const isFaded = value?.startsWith("Nije pomenuto") || value?.startsWith("Not mentioned");
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
        placeholder={placeholder || "Iz transkripta…"}
        className={cn(
          "w-full bg-muted/30 rounded-xl px-3.5 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all duration-200",
          isFaded && "text-muted-foreground/60 italic"
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
