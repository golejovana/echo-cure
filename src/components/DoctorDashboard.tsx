import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, FileText, AlertTriangle, Clock, ChevronRight,
  Loader2, TrendingUp, Zap, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";

interface ScheduleRow {
  id: string;
  time: string;
  patient: string;
  reason: string;
  status: "completed" | "waiting" | "priority";
}

interface DiagCount {
  name: string;
  count: number;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-accent/15 text-accent border-accent/20",
  waiting: "bg-primary/10 text-primary border-primary/20",
  priority: "bg-destructive/10 text-destructive border-destructive/20",
};
const STATUS_LABELS: Record<string, string> = {
  completed: "Završeno",
  waiting: "Čeka",
  priority: "Prioritet",
};

export default function DoctorDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [stats, setStats] = useState({ patients: 0, reports: 0, alerts: 0 });
  const [topDiagnoses, setTopDiagnoses] = useState<DiagCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split("T")[0];

      // Fetch today's appointments
      const { data: appts } = await supabase
        .from("appointments")
        .select("id, appointment_time, title, priority, examination_id")
        .eq("appointment_date", today)
        .order("appointment_time", { ascending: true });

      // Fetch recent examinations for stats & diagnoses
      const { data: exams } = await supabase
        .from("examinations")
        .select("id, patient_name, patient_email, diagnosis_codes, created_at, chief_complaints")
        .order("created_at", { ascending: false })
        .limit(50);

      // Build schedule from appointments + exam data
      const examMap = new Map<string, any>();
      exams?.forEach((e: any) => examMap.set(e.id, e));

      const rows: ScheduleRow[] = (appts || []).map((a: any) => {
        const exam = examMap.get(a.examination_id);
        const status: ScheduleRow["status"] =
          a.priority === "high" || a.priority === "urgent" ? "priority" :
          exam ? "completed" : "waiting";
        return {
          id: a.id,
          time: a.appointment_time || "—",
          patient: exam?.patient_name || exam?.patient_email || "—",
          reason: exam?.chief_complaints?.split(",")[0]?.trim() || a.title || "Pregled",
          status,
        };
      });
      setSchedule(rows);

      // Stats
      const todayExams = exams?.filter((e: any) =>
        e.created_at?.startsWith(today)
      ) || [];
      setStats({
        patients: rows.length || todayExams.length,
        reports: todayExams.length,
        alerts: rows.filter(r => r.status === "priority").length,
      });

      // Top diagnoses
      const diagMap = new Map<string, number>();
      exams?.forEach((e: any) => {
        if (e.diagnosis_codes) {
          e.diagnosis_codes.split(",").forEach((d: string) => {
            const name = d.trim();
            if (name) diagMap.set(name, (diagMap.get(name) || 0) + 1);
          });
        }
      });
      const sorted = [...diagMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));
      setTopDiagnoses(sorted);

      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  const maxDiag = topDiagnoses.length ? Math.max(...topDiagnoses.map(d => d.count)) : 1;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div variants={item}>
        <h2 className="text-xl font-semibold text-foreground">Clinical Intelligence Hub</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Pregled aktivnosti i kliničkih podataka</p>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Pacijenata danas",
            value: stats.patients,
            icon: Users,
            accent: "text-primary",
            bg: "bg-primary/8",
          },
          {
            label: "Generisanih nalaza",
            value: stats.reports,
            icon: FileText,
            accent: "text-accent",
            bg: "bg-accent/8",
          },
          {
            label: "Bezbednosna upozorenja",
            value: stats.alerts,
            icon: AlertTriangle,
            accent: "text-amber-600",
            bg: "bg-amber-500/10",
          },
        ].map((s, i) => (
          <motion.div key={i} variants={item}>
            <Card className="border-border/40 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center", s.bg)}>
                  <s.icon size={20} strokeWidth={1.6} className={s.accent} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground tracking-tight">{s.value}</p>
                  <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Daily Schedule — 60% */}
        <motion.div variants={item} className="lg:col-span-3">
          <Card className="border-border/40 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock size={16} strokeWidth={1.5} className="text-primary" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider">Dnevni raspored</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {schedule.length === 0 ? (
                <div className="py-12 text-center">
                  <Activity size={32} className="mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Nema zakazanih pregleda za danas</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">Vreme</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">Pacijent</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider hidden sm:table-cell">Razlog</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedule.map((row) => (
                      <TableRow key={row.id} className="cursor-pointer group" onClick={() => navigate("/history")}>
                        <TableCell className="font-medium text-foreground whitespace-nowrap">{row.time}</TableCell>
                        <TableCell className="text-foreground">{row.patient}</TableCell>
                        <TableCell className="text-muted-foreground hidden sm:table-cell">{row.reason}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={cn("text-[10px] font-semibold border", STATUS_STYLES[row.status])}>
                            {STATUS_LABELS[row.status]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Insights — 40% */}
        <motion.div variants={item} className="lg:col-span-2 space-y-4">
          {/* Top Diagnoses */}
          <Card className="border-border/40 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} strokeWidth={1.5} className="text-primary" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider">Top dijagnoze nedeljno</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {topDiagnoses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nema podataka</p>
              ) : (
                topDiagnoses.map((d, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground font-medium truncate pr-2">{d.name}</span>
                      <span className="text-xs text-muted-foreground font-semibold shrink-0">{d.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-primary/60"
                        initial={{ width: 0 }}
                        animate={{ width: `${(d.count / maxDiag) * 100}%` }}
                        transition={{ duration: 0.6, delay: 0.2 + i * 0.08 }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* System Efficiency */}
          <Card className="border-border/40 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Zap size={16} strokeWidth={1.5} className="text-accent" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider">Efikasnost sistema</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground tracking-tight">
                  {stats.reports * 5 + 12}
                </span>
                <span className="text-sm text-muted-foreground">min uštede danas</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                AI anamneza i klinička podrška ubrzali su dokumentaciju za <span className="font-semibold text-accent">{stats.reports}</span> pregleda.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-muted/40 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-foreground">{stats.reports}</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">AI nalaza</p>
                </div>
                <div className="bg-muted/40 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-foreground">{stats.alerts}</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Upozorenja</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
