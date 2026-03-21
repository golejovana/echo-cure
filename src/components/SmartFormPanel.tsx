import { useState, useCallback } from "react";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface FormData {
  chiefComplaint: string;
  duration: string;
  patientHistory: string;
  vitalSigns: string;
}

const EMPTY: FormData = { chiefComplaint: "", duration: "", patientHistory: "", vitalSigns: "" };

const PARSED: FormData = {
  chiefComplaint: "Persistent chest pain radiating to the left arm. Patient denies shortness of breath but reports mild dizziness.",
  duration: "Approximately 3 days",
  patientHistory: "52-year-old male. History of hypertension and type 2 diabetes. Current medications: Metformin 500mg BID, Lisinopril 10mg daily.",
  vitalSigns: "BP 145/92 mmHg · HR 88 bpm · Temp 98.6°F · SpO₂ 97%",
};

interface SmartFormPanelProps {
  transcript: string;
}

const sections: { key: keyof FormData; label: string }[] = [
  { key: "chiefComplaint", label: "Chief Complaint" },
  { key: "duration", label: "Duration of Symptoms" },
  { key: "patientHistory", label: "Patient History" },
  { key: "vitalSigns", label: "Vital Signs" },
];

const SmartFormPanel = ({ transcript }: SmartFormPanelProps) => {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [filling, setFilling] = useState(false);

  const handleAutoFill = useCallback(() => {
    if (!transcript.trim() || filling) return;
    setFilling(true);

    // Stagger fill each field
    sections.forEach((section, i) => {
      setTimeout(() => {
        setForm((prev) => ({ ...prev, [section.key]: PARSED[section.key] }));
        if (i === sections.length - 1) setFilling(false);
      }, 300 + i * 350);
    });
  }, [transcript, filling]);

  const handleChange = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Smart Intake Form
        </h2>
        <button
          onClick={handleAutoFill}
          disabled={!transcript.trim() || filling}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.96] transition-all duration-200"
        >
          <Sparkles size={15} strokeWidth={1.8} />
          Magic Auto-Fill
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {sections.map((section, i) => (
          <motion.div
            key={section.key}
            initial={false}
            animate={form[section.key] ? { scale: [1, 1.008, 1] } : {}}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="glass-card p-5"
          >
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
              {section.label}
            </label>
            <textarea
              value={form[section.key]}
              onChange={(e) => handleChange(section.key, e.target.value)}
              rows={section.key === "vitalSigns" ? 2 : 3}
              placeholder={`Enter ${section.label.toLowerCase()}…`}
              className="w-full bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none overflow-wrap-break-word"
              style={{ overflowWrap: "break-word" }}
            />
            {filling && !form[section.key] && (
              <div
                className="h-1 mt-2 rounded-full bg-gradient-to-r from-primary/30 via-primary/60 to-primary/30"
                style={{
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.2s linear infinite",
                }}
              />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SmartFormPanel;
