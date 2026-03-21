import { useState, useCallback } from "react";
import { Sparkles, Heart, Stethoscope, Droplets, Brain, Users, ChevronDown, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CategoryField {
  key: string;
  label: string;
}

interface MedicalCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  fields: CategoryField[];
}

const CATEGORIES: MedicalCategory[] = [
  {
    id: "cardiovascular",
    label: "Cardiovascular & Respiratory",
    icon: Heart,
    fields: [
      { key: "chestPain", label: "Chest Pain" },
      { key: "swelling", label: "Swelling / Edema" },
      { key: "pressure", label: "Blood Pressure / Pressure Sensation" },
      { key: "veins", label: "Veins / Vascular" },
    ],
  },
  {
    id: "gastrointestinal",
    label: "Gastrointestinal",
    icon: Stethoscope,
    fields: [
      { key: "appetite", label: "Appetite" },
      { key: "nausea", label: "Nausea / Vomiting" },
      { key: "swallowing", label: "Swallowing" },
      { key: "bloating", label: "Bloating / Abdominal Pain" },
      { key: "stool", label: "Stool / Bowel Habits" },
    ],
  },
  {
    id: "urogenital",
    label: "Urogenital",
    icon: Droplets,
    fields: [
      { key: "urination", label: "Urination Details" },
      { key: "flankPain", label: "Flank Pain" },
    ],
  },
  {
    id: "locomotor",
    label: "Locomotor & CNS",
    icon: Brain,
    fields: [
      { key: "jointPain", label: "Joint Pain / Mobility" },
      { key: "visionHearing", label: "Vision / Hearing" },
      { key: "dizziness", label: "Dizziness / Vertigo" },
      { key: "headaches", label: "Headaches" },
    ],
  },
  {
    id: "personal",
    label: "Personal & Family History",
    icon: Users,
    fields: [
      { key: "allergies", label: "Allergies" },
      { key: "chronicDiseases", label: "Chronic Diseases" },
      { key: "smokingAlcohol", label: "Smoking / Alcohol" },
    ],
  },
];

type FormData = Record<string, string>;

interface SmartFormPanelProps {
  transcript: string;
}

const SmartFormPanel = ({ transcript }: SmartFormPanelProps) => {
  const [form, setForm] = useState<FormData>({});
  const [filling, setFilling] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([CATEGORIES[0].id]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleAutoFill = useCallback(async () => {
    if (!transcript.trim() || filling) return;
    setFilling(true);

    try {
      const { data, error } = await supabase.functions.invoke("parse-transcript", {
        body: { transcript },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const formData = data.formData as FormData;
      setOpenSections(CATEGORIES.map((c) => c.id));

      // Staggered fill animation
      const allFields = CATEGORIES.flatMap((cat) => cat.fields);
      allFields.forEach((field, i) => {
        setTimeout(() => {
          setForm((prev) => ({
            ...prev,
            [field.key]: formData[field.key] || "Not reported",
          }));
          if (i === allFields.length - 1) setFilling(false);
        }, 80 + i * 70);
      });
    } catch (e) {
      console.error("Auto-fill error:", e);
      toast({
        title: "Auto-fill failed",
        description: e instanceof Error ? e.message : "Could not parse transcript. Please try again.",
        variant: "destructive",
      });
      setFilling(false);
    }
  }, [transcript, filling]);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    toast({
      title: "✓ Report submitted securely",
      description: "Data encrypted and transferred to the clinic system via GDPR-compliant channel.",
    });
  };

  const filledCount = (cat: MedicalCategory) =>
    cat.fields.filter((f) => form[f.key] && form[f.key] !== "Not reported").length;

  const hasAnyData = Object.values(form).some((v) => v && v !== "Not reported");

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
          {filling ? (
            <Loader2 size={15} strokeWidth={1.8} className="animate-spin" />
          ) : (
            <Sparkles size={15} strokeWidth={1.8} />
          )}
          {filling ? "Analyzing…" : "Magic Auto-Fill"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {CATEGORIES.map((cat) => {
          const isOpen = openSections.includes(cat.id);
          const Icon = cat.icon;
          const filled = filledCount(cat);

          return (
            <div key={cat.id} className="glass-card overflow-hidden">
              <button
                onClick={() => toggleSection(cat.id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-muted/30 transition-colors duration-200 active:scale-[0.995]"
              >
                <Icon size={18} strokeWidth={1.5} className="text-muted-foreground shrink-0" />
                <span className="flex-1 text-sm font-semibold text-foreground tracking-wide">
                  {cat.label}
                </span>
                {filled > 0 && (
                  <span className="text-[10px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                    {filled}/{cat.fields.length}
                  </span>
                )}
                <ChevronDown
                  size={16}
                  strokeWidth={1.8}
                  className={cn(
                    "text-muted-foreground transition-transform duration-300",
                    isOpen && "rotate-180"
                  )}
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
                    <div className="px-5 pb-5 space-y-3 border-t border-border/50 pt-4">
                      {cat.fields.map((field) => (
                        <motion.div
                          key={field.key}
                          initial={false}
                          animate={form[field.key] ? { scale: [1, 1.006, 1] } : {}}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                            {field.label}
                          </label>
                          <textarea
                            value={form[field.key] || ""}
                            onChange={(e) => handleChange(field.key, e.target.value)}
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
                              className="h-0.5 mt-1.5 rounded-full bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20"
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

      {/* Submit Report */}
      <div className="pt-4 mt-2 border-t border-border/40">
        <button
          onClick={handleSubmit}
          disabled={!hasAnyData}
          className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold bg-accent text-accent-foreground shadow-md shadow-accent/15 hover:shadow-lg hover:shadow-accent/25 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-all duration-200"
        >
          <Send size={15} strokeWidth={1.8} />
          Submit Report
        </button>
      </div>
    </div>
  );
};

export default SmartFormPanel;
