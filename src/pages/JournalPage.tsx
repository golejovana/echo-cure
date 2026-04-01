import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Loader2, Send, Smile, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { useTranslation } from "@/i18n/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const MOOD_EMOJIS = [
  { value: 1, emoji: "😞", labelKey: "journal.mood1" },
  { value: 2, emoji: "😔", labelKey: "journal.mood2" },
  { value: 3, emoji: "😐", labelKey: "journal.mood3" },
  { value: 4, emoji: "🙂", labelKey: "journal.mood4" },
  { value: 5, emoji: "😊", labelKey: "journal.mood5" },
];

interface JournalEntry {
  id: string;
  mood: number;
  symptoms: string | null;
  medication_taken: boolean;
  notes: string | null;
  is_severe: boolean;
  created_at: string;
}

export default function JournalPage() {
  const { t } = useTranslation();
  const [mood, setMood] = useState<number>(0);
  const [symptoms, setSymptoms] = useState("");
  const [medTaken, setMedTaken] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [examId, setExamId] = useState<string | null>(null);
  const [todaySubmitted, setTodaySubmitted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Get the patient's latest examination
      const { data: exams } = await supabase
        .from("examinations")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1);
      if (exams && exams.length > 0) {
        setExamId(exams[0].id);
      }

      // Get recent journal entries
      const { data: journalData } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(14);

      if (journalData) {
        setEntries(journalData as unknown as JournalEntry[]);
        // Check if already submitted today
        const today = new Date().toISOString().split("T")[0];
        const hasToday = journalData.some((e: any) =>
          new Date(e.created_at).toISOString().split("T")[0] === today
        );
        setTodaySubmitted(hasToday);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const SEVERE_KEYWORDS = ["jaka", "jako", "nepodnošljiv", "krv", "povraćanje", "nesvestica", "gušenje", "severe", "unbearable"];

  const handleSubmit = async () => {
    if (mood === 0) {
      toast({ title: t("journal.selectMood"), variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const isSevere = SEVERE_KEYWORDS.some((kw) =>
        symptoms.toLowerCase().includes(kw)
      );

      const { error } = await supabase.from("journal_entries").insert({
        patient_id: user.id,
        examination_id: examId,
        mood,
        symptoms: symptoms.trim() || null,
        medication_taken: medTaken,
        notes: notes.trim() || null,
        is_severe: isSevere,
      } as any);

      if (error) throw error;

      toast({ title: t("journal.saved"), description: t("journal.savedDesc") });
      setTodaySubmitted(true);
      setMood(0);
      setSymptoms("");
      setMedTaken(false);
      setNotes("");

      // Refresh entries
      const { data: updated } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(14);
      if (updated) setEntries(updated as unknown as JournalEntry[]);
    } catch (e) {
      console.error(e);
      toast({ title: t("journal.error"), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}.`;
  };

  if (loading) {
    return (
      <DashboardLayout role="patient">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="patient">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-2xl mx-auto space-y-6"
      >
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <BookOpen size={22} strokeWidth={1.5} className="text-accent" />
            {t("journal.title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t("journal.subtitle")}</p>
        </div>

        {/* Daily Check-in Form */}
        {!todaySubmitted ? (
          <div className="glass-card-elevated p-6 space-y-6">
            {/* Mood selector */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">{t("journal.howFeeling")}</label>
              <div className="flex items-center justify-center gap-3">
                {MOOD_EMOJIS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setMood(opt.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-200 ${
                      mood === opt.value
                        ? "bg-primary/15 ring-2 ring-primary scale-110 shadow-md"
                        : "bg-muted/30 hover:bg-muted/50 hover:scale-105"
                    }`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="text-[9px] font-medium text-muted-foreground">{t(opt.labelKey)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Symptoms */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">{t("journal.symptoms")}</label>
              <Textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder={t("journal.symptomsPlaceholder")}
                className="rounded-2xl border-border/50 bg-muted/20 resize-none"
                rows={3}
              />
            </div>

            {/* Medication check */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/20 border border-border/30">
              <Checkbox
                checked={medTaken}
                onCheckedChange={(v) => setMedTaken(v === true)}
                className="h-5 w-5"
              />
              <label className="text-sm font-medium text-foreground cursor-pointer" onClick={() => setMedTaken(!medTaken)}>
                {t("journal.medQuestion")}
              </label>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">{t("journal.additionalNotes")}</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("journal.notesPlaceholder")}
                className="rounded-2xl border-border/50 bg-muted/20 resize-none"
                rows={2}
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting || mood === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground shadow-md shadow-primary/15 hover:shadow-lg disabled:opacity-50 active:scale-[0.97] transition-all duration-200"
            >
              {submitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
              {t("journal.submit")}
            </button>
          </div>
        ) : (
          <div className="glass-card-elevated p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
              <Check size={24} className="text-accent" />
            </div>
            <p className="text-sm font-medium text-foreground">{t("journal.alreadySubmitted")}</p>
            <p className="text-xs text-muted-foreground">{t("journal.comeBackTomorrow")}</p>
          </div>
        )}

        {/* Recent Entries */}
        {entries.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Smile size={16} className="text-primary" />
              {t("journal.recentEntries")}
            </h3>
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className={`glass-card-elevated p-4 flex items-start gap-4 ${
                    entry.is_severe ? "border-l-4 border-l-destructive" : ""
                  }`}
                >
                  <span className="text-2xl">{MOOD_EMOJIS.find((m) => m.value === entry.mood)?.emoji || "😐"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">{formatDate(entry.created_at)}</span>
                      {entry.medication_taken && (
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                          💊 {t("journal.medTaken")}
                        </span>
                      )}
                      {entry.is_severe && (
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                          ⚠️ {t("journal.severe")}
                        </span>
                      )}
                    </div>
                    {entry.symptoms && (
                      <p className="text-sm text-foreground/80 leading-relaxed">{entry.symptoms}</p>
                    )}
                    {entry.notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">{entry.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
