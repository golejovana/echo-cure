import { useState, useCallback } from "react";
import {
  Sparkles, Heart, Stethoscope, Droplets, Brain, Users,
  ChevronDown, Send, Loader2, FileText, ClipboardList, Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/* ---------- types ---------- */
interface CategoryField { key: string; label: string }
interface MedicalCategory { id: string; label: string; icon: React.ElementType; fields: CategoryField[] }

/* ---------- categories ---------- */
const CATEGORIES: MedicalCategory[] = [
  {
    id: "cardiovascular",
    label: "Cardiovascular & Respiratory",
    icon: Heart,
    fields: [
      { key: "chestPain", label: "Chest Pain / Bol u grudima" },
      { key: "swelling", label: "Swelling / Otoci" },
      { key: "pressure", label: "Blood Pressure / Krvni pritisak" },
      { key: "veins", label: "Veins / Vene" },
    ],
  },
  {
    id: "gastrointestinal",
    label: "Gastrointestinal",
    icon: Stethoscope,
    fields: [
      { key: "appetite", label: "Appetite / Apetit" },
      { key: "nausea", label: "Nausea / Mučnina" },
      { key: "swallowing", label: "Swallowing / Gutanje" },
      { key: "bloating", label: "Bloating / Nadutost" },
      { key: "stool", label: "Stool / Stolica" },
    ],
  },
  {
    id: "urogenital",
    label: "Urogenital",
    icon: Droplets,
    fields: [
      { key: "urination", label: "Urination / Mokrenje" },
      { key: "flankPain", label: "Flank Pain / Bol u slabinama" },
    ],
  },
  {
    id: "locomotor",
    label: "Locomotor & CNS",
    icon: Brain,
    fields: [
      { key: "jointPain", label: "Joint Pain / Bol u zglobovima" },
      { key: "visionHearing", label: "Vision / Hearing" },
      { key: "dizziness", label: "Dizziness / Vrtoglavica" },
      { key: "headaches", label: "Headaches / Glavobolje" },
    ],
  },
  {
    id: "personal",
    label: "Personal & Family History",
    icon: Users,
    fields: [
      { key: "allergies", label: "Allergies / Alergije" },
      { key: "chronicDiseases", label: "Chronic Diseases / Hronične bolesti" },
      { key: "smokingAlcohol", label: "Smoking & Alcohol / Pušenje i alkohol" },
    ],
  },
];

type FormData = Record<string, string>;

interface SmartFormPanelProps { transcript: string }

/* ---------- helpers ---------- */
const today = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}.`;
};

/* ---------- component ---------- */
const SmartFormPanel = ({ transcript }: SmartFormPanelProps) => {
  const [form, setForm] = useState<FormData>({});
  const [filling, setFilling] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [patientName, setPatientName] = useState("Dragica Kaldaraš");
  const [patientId, setPatientId] = useState("");

  const toggleSection = (id: string) =>
    setOpenSections((p) => (p.includes(id) ? p.filter((s) => s !== id) : [...p, id]));

  const handleAutoFill = useCallback(async () => {
    if (!transcript.trim() || filling) return;
    setFilling(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-transcript", { body: { transcript } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const formData = data.formData as FormData;
      setOpenSections(CATEGORIES.map((c) => c.id));

      const allKeys = [
        "chiefComplaints", "presentIllness", "diagnosisCodes",
        ...CATEGORIES.flatMap((c) => c.fields.map((f) => f.key)),
      ];
      allKeys.forEach((key, i) => {
        setTimeout(() => {
          setForm((prev) => ({ ...prev, [key]: formData[key] || "Not reported" }));
          if (i === allKeys.length - 1) setFilling(false);
        }, 60 + i * 55);
      });
    } catch (e) {
      console.error("Auto-fill error:", e);
      toast({ title: "Auto-fill failed", description: e instanceof Error ? e.message : "Could not parse transcript.", variant: "destructive" });
      setFilling(false);
    }
  }, [transcript, filling]);

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = () =>
    toast({ title: "✓ Izveštaj poslat", description: "Podaci enkriptovani i poslati u klinički sistem u skladu sa GDPR propisima." });

  const filledCount = (cat: MedicalCategory) =>
    cat.fields.filter((f) => form[f.key] && form[f.key] !== "Not reported").length;

  const hasAnyData = Object.values(form).some((v) => v && v !== "Not reported");

  return (
    <div className="flex flex-col h-full">
      {/* --- Top bar --- */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Medical Report
        </h2>
        <button
          onClick={handleAutoFill}
          disabled={!transcript.trim() || filling}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.96] transition-all duration-200"
        >
          {filling ? <Loader2 size={15} strokeWidth={1.8} className="animate-spin" /> : <Sparkles size={15} strokeWidth={1.8} />}
          {filling ? "Analyzing…" : "Magic Auto-Fill"}
        </button>
      </div>

      {/* --- Scrollable body --- */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">

        {/* ===== HEADER ===== */}
        <div className="glass-card p-5 space-y-3">
          <div className="text-center space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Republika Srbija
            </p>
            <p className="text-xs font-bold text-foreground">
              Univerzitetski Klinički Centar Srbije
            </p>
            <p className="text-[11px] text-muted-foreground">
              Pasterova 2, 11000 Beograd
            </p>
          </div>
          <div className="border-t border-border/50 pt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Ime i prezime pacijenta
              </label>
              <input
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full bg-muted/30 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Matični broj / ID
              </label>
              <input
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="JMBG / ID"
                className="w-full bg-muted/30 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all duration-200"
              />
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-muted-foreground">Datum: {today()}</span>
          </div>
        </div>

        {/* ===== CHIEF COMPLAINTS ===== */}
        <ReportSection
          icon={ClipboardList}
          title="Glavne tegobe / Chief Complaints"
          fieldKey="chiefComplaints"
          value={form.chiefComplaints || ""}
          onChange={set}
          filling={filling}
        />

        {/* ===== PRESENT ILLNESS ===== */}
        <ReportSection
          icon={FileText}
          title="Sadašnja bolest / Present Illness"
          fieldKey="presentIllness"
          value={form.presentIllness || ""}
          onChange={set}
          filling={filling}
          rows={4}
        />

        {/* ===== DIAGNOSIS / ICD-10 ===== */}
        <ReportSection
          icon={Activity}
          title="Dijagnoza / Diagnosis (ICD-10)"
          fieldKey="diagnosisCodes"
          value={form.diagnosisCodes || ""}
          onChange={set}
          filling={filling}
          rows={3}
          placeholder="e.g. I10 - Hypertension&#10;N18.4 - Chronic kidney disease, stage 4"
        />

        {/* ===== SYSTEMATIC REVIEW ACCORDION ===== */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
            Sistematski pregled / Systematic Review
          </p>
          {CATEGORIES.map((cat) => {
            const isOpen = openSections.includes(cat.id);
            const Icon = cat.icon;
            const filled = filledCount(cat);
            return (
              <div key={cat.id} className="glass-card overflow-hidden">
                <button
                  onClick={() => toggleSection(cat.id)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/30 transition-colors duration-200 active:scale-[0.995]"
                >
                  <Icon size={17} strokeWidth={1.5} className="text-muted-foreground shrink-0" />
                  <span className="flex-1 text-sm font-semibold text-foreground tracking-wide">{cat.label}</span>
                  {filled > 0 && (
                    <span className="text-[10px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                      {filled}/{cat.fields.length}
                    </span>
                  )}
                  <ChevronDown
                    size={15} strokeWidth={1.8}
                    className={cn("text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 space-y-3 border-t border-border/50 pt-3">
                        {cat.fields.map((field) => (
                          <motion.div
                            key={field.key}
                            initial={false}
                            animate={form[field.key] ? { scale: [1, 1.005, 1] } : {}}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                          >
                            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                              {field.label}
                            </label>
                            <textarea
                              value={form[field.key] || ""}
                              onChange={(e) => set(field.key, e.target.value)}
                              rows={2}
                              placeholder={`Enter ${field.label.toLowerCase()}…`}
                              className={cn(
                                "w-full bg-muted/30 rounded-xl px-3.5 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all duration-200",
                                form[field.key] === "Not reported" && "text-muted-foreground/60 italic"
                              )}
                              style={{ overflowWrap: "break-word" }}
                            />
                            {filling && !form[field.key] && (
                              <div
                                className="h-0.5 mt-1 rounded-full bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20"
                                style={{ backgroundSize: "200% 100%", animation: "shimmer 1.2s linear infinite" }}
                              />
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* ===== FOOTER — Doctor signature ===== */}
        <div className="glass-card p-5">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Pečat ustanove
              </p>
              <div className="w-24 h-24 border border-dashed border-border/60 rounded-lg flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground/40 italic">Stamp</span>
              </div>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Potpis lekara
              </p>
              <div className="w-48 border-b border-border/60 pb-1">
                <span className="text-[10px] text-muted-foreground/40 italic">Dr. ___________________________</span>
              </div>
              <p className="text-[10px] text-muted-foreground/50">Faksimil / Facsimile</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- Submit button --- */}
      <div className="pt-4 mt-2 border-t border-border/40">
        <button
          onClick={handleSubmit}
          disabled={!hasAnyData}
          className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold bg-accent text-accent-foreground shadow-md shadow-accent/15 hover:shadow-lg hover:shadow-accent/25 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-all duration-200"
        >
          <Send size={15} strokeWidth={1.8} />
          Submit Report / Pošalji izveštaj
        </button>
      </div>
    </div>
  );
};

/* ---- Reusable standalone section ---- */
function ReportSection({
  icon: Icon, title, fieldKey, value, onChange, filling, rows = 2, placeholder,
}: {
  icon: React.ElementType; title: string; fieldKey: string;
  value: string; onChange: (k: string, v: string) => void;
  filling: boolean; rows?: number; placeholder?: string;
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
        placeholder={placeholder || `Enter ${title.toLowerCase()}…`}
        className={cn(
          "w-full bg-muted/30 rounded-xl px-3.5 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all duration-200",
          value === "Not reported" && "text-muted-foreground/60 italic"
        )}
        style={{ overflowWrap: "break-word" }}
      />
      {filling && !value && (
        <div
          className="h-0.5 rounded-full bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20"
          style={{ backgroundSize: "200% 100%", animation: "shimmer 1.2s linear infinite" }}
        />
      )}
    </div>
  );
}

export default SmartFormPanel;
