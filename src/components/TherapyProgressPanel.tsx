import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, Loader2, Sparkles, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/i18n/LanguageContext";
import { toast } from "@/hooks/use-toast";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

interface JournalEntry {
  id: string;
  mood: number;
  symptoms: string | null;
  medication_taken: boolean;
  is_severe: boolean;
  created_at: string;
  notes: string | null;
}

interface TherapyProgressPanelProps {
  examinationId: string;
  patientName?: string;
}

const MOOD_EMOJIS: Record<number, string> = { 1: "😞", 2: "😔", 3: "😐", 4: "🙂", 5: "😊" };

export default function TherapyProgressPanel({ examinationId, patientName }: TherapyProgressPanelProps) {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const fetchEntries = async () => {
      const { data } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("examination_id", examinationId)
        .order("created_at", { ascending: true });

      if (data) setEntries(data as unknown as JournalEntry[]);
      setLoading(false);
    };
    fetchEntries();
  }, [examinationId]);

  const handleAiAnalysis = async () => {
    if (entries.length < 2) {
      toast({ title: t("progress.needMore"), variant: "destructive" });
      return;
    }
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-therapy-progress", {
        body: {
          entries: entries.map((e) => ({
            date: new Date(e.created_at).toISOString().split("T")[0],
            mood: e.mood,
            symptoms: e.symptoms,
            medication_taken: e.medication_taken,
            is_severe: e.is_severe,
          })),
          patientName,
        },
      });
      if (error) throw error;
      setAiAnalysis(data.analysis);
    } catch (e) {
      console.error(e);
      toast({ title: t("progress.analysisError"), variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-primary" size={20} />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="glass-card-elevated p-5 text-center">
        <p className="text-sm text-muted-foreground">{t("progress.noEntries")}</p>
      </div>
    );
  }

  const chartData = entries.map((e) => ({
    date: new Date(e.created_at).toLocaleDateString("sr-Latn", { day: "2-digit", month: "2-digit" }),
    mood: e.mood,
    isSevere: e.is_severe,
  }));

  const severeEntries = entries.filter((e) => e.is_severe);
  const avgMood = (entries.reduce((sum, e) => sum + e.mood, 0) / entries.length).toFixed(1);
  const medAdherence = Math.round((entries.filter((e) => e.medication_taken).length / entries.length) * 100);

  const chartConfig = {
    mood: { label: t("progress.mood"), color: "hsl(var(--primary))" },
  };

  return (
    <div className="space-y-4">
      <div className="glass-card-elevated p-5 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} strokeWidth={1.5} className="text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{t("progress.title")}</h3>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/20 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-foreground">{avgMood}</p>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{t("progress.avgMood")}</p>
          </div>
          <div className="bg-muted/20 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-foreground">{medAdherence}%</p>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{t("progress.adherence")}</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${severeEntries.length > 0 ? "bg-destructive/10" : "bg-accent/10"}`}>
            <p className={`text-lg font-bold ${severeEntries.length > 0 ? "text-destructive" : "text-accent"}`}>
              {severeEntries.length}
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{t("progress.alerts")}</p>
          </div>
        </div>

        {/* Mood chart */}
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
            <XAxis dataKey="date" className="text-[10px]" />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} className="text-[10px]" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="mood"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    key={`dot-${payload.date}`}
                    cx={cx}
                    cy={cy}
                    r={payload.isSevere ? 6 : 4}
                    fill={payload.isSevere ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                    stroke={payload.isSevere ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                    strokeWidth={2}
                  />
                );
              }}
            />
          </LineChart>
        </ChartContainer>

        {/* Severe symptom alerts */}
        {severeEntries.length > 0 && (
          <div className="space-y-2">
            {severeEntries.map((entry) => (
              <div key={entry.id} className="flex items-start gap-2 p-3 rounded-xl bg-destructive/5 border border-destructive/20">
                <AlertTriangle size={14} className="text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-destructive">
                    {new Date(entry.created_at).toLocaleDateString("sr-Latn", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </p>
                  <p className="text-sm text-foreground/80">{entry.symptoms}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent entries timeline */}
        <div className="space-y-2 pt-2 border-t border-border/30">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("progress.recentEntries")}</p>
          {entries.slice(-7).reverse().map((entry) => (
            <div key={entry.id} className="flex items-center gap-3 py-1.5">
              <span className="text-lg">{MOOD_EMOJIS[entry.mood] || "😐"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground/80 truncate">{entry.symptoms || "—"}</p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(entry.created_at).toLocaleDateString("sr-Latn", { day: "2-digit", month: "2-digit" })}
                  {entry.medication_taken ? " · 💊" : ""}
                </p>
              </div>
              {entry.is_severe && <AlertTriangle size={12} className="text-destructive shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* AI Analysis */}
      <div className="glass-card-elevated p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} strokeWidth={1.5} className="text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{t("progress.aiTitle")}</h3>
        </div>

        {aiAnalysis ? (
          <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4">
            <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line">{aiAnalysis}</p>
          </div>
        ) : (
          <button
            onClick={handleAiAnalysis}
            disabled={analyzing || entries.length < 2}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold bg-accent text-accent-foreground shadow-md shadow-accent/15 hover:shadow-lg disabled:opacity-50 active:scale-[0.97] transition-all duration-200"
          >
            {analyzing ? (
              <><Loader2 size={15} className="animate-spin" /> {t("progress.analyzing")}</>
            ) : (
              <><BarChart3 size={15} /> {t("progress.analyzeBtn")}</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
