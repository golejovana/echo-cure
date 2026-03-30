import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, FileText, AlertTriangle, Clock,
  Loader2, TrendingUp, Zap, Activity, Sparkles, ArrowUpRight, Plus, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
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
  examinationId: string;
}

interface DiagCount {
  name: string;
  count: number;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-accent/12 text-accent border-accent/20",
  waiting: "bg-primary/10 text-primary border-primary/20",
  priority: "bg-destructive/10 text-destructive border-destructive/20",
};
const STATUS_LABELS: Record<string, string> = {
  completed: "Završeno",
  waiting: "Čeka",
  priority: "Prioritet",
};

const STAT_CONFIGS = [
  {
    key: "patients",
    label: "Pacijenata danas",
    icon: Users,
    gradient: "from-blue-500/15 to-blue-500/5",
    iconBg: "bg-blue-500/12",
    iconColor: "text-blue-500",
    borderAccent: "border-l-blue-500",
    cardBorder: "border-blue-500/20",
  },
  {
    key: "reports",
    label: "Generisanih nalaza",
    icon: FileText,
    gradient: "from-emerald-500/15 to-emerald-500/5",
    iconBg: "bg-emerald-500/12",
    iconColor: "text-emerald-500",
    borderAccent: "border-l-emerald-500",
    cardBorder: "border-emerald-500/20",
  },
  {
    key: "alerts",
    label: "Upozorenja",
    icon: AlertTriangle,
    gradient: "from-amber-500/15 to-amber-500/5",
    iconBg: "bg-amber-500/12",
    iconColor: "text-amber-500",
    borderAccent: "border-l-amber-500",
    cardBorder: "border-amber-500/20",
  },
];

const DEMO_APPOINTMENTS = [
  { name: "Marko Petrović", time: "09:00", reason: "Sumnja na upalu pluća", priority: "completed" },
  { name: "Jana Šumonja", time: "11:30", reason: "Kontrola nakon terapije", priority: "normal" },
  { name: "Milan Jovanović", time: "14:00", reason: "Glavobolja i vrtoglavica", priority: "completed" },
];

export default function DoctorDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [stats, setStats] = useState({ patients: 0, reports: 0, alerts: 0 });
  const [topDiagnoses, setTopDiagnoses] = useState<DiagCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", time: "", reason: "", status: "waiting" as "completed" | "waiting" | "priority" });
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const loadSchedule = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: appts } = await supabase
      .from("appointments")
      .select("id, appointment_time, title, priority, examination_id")
      .eq("appointment_date", today)
      .order("appointment_time", { ascending: true });

    const { data: exams } = await supabase
      .from("examinations")
      .select("id, patient_name, patient_email, diagnosis_codes, created_at, chief_complaints")
      .order("created_at", { ascending: false })
      .limit(50);

    const examMap = new Map<string, any>();
    exams?.forEach((e: any) => examMap.set(e.id, e));

    // If no appointments exist for today, seed demo data
    if (!appts || appts.length === 0) {
      await seedDemoAppointments(user.id);
      // Reload after seeding
      const { data: seededAppts } = await supabase
        .from("appointments")
        .select("id, appointment_time, title, priority, examination_id")
        .eq("appointment_date", today)
        .order("appointment_time", { ascending: true });

      const { data: seededExams } = await supabase
        .from("examinations")
        .select("id, patient_name, patient_email, diagnosis_codes, created_at, chief_complaints")
        .order("created_at", { ascending: false })
        .limit(50);

      const seededExamMap = new Map<string, any>();
      seededExams?.forEach((e: any) => seededExamMap.set(e.id, e));

      buildRows(seededAppts || [], seededExamMap, seededExams || []);
    } else {
      buildRows(appts, examMap, exams || []);
    }

    setLoading(false);
  }, [today]);

  const buildRows = (appts: any[], examMap: Map<string, any>, exams: any[]) => {
    const rows: ScheduleRow[] = appts.map((a: any) => {
      const exam = examMap.get(a.examination_id);
      const pri = a.priority;
      const status: ScheduleRow["status"] =
        pri === "completed" ? "completed" :
        pri === "high" || pri === "urgent" ? "priority" : "waiting";
      return {
        id: a.id,
        time: a.appointment_time || "—",
        patient: exam?.patient_name || a.title || "—",
        reason: exam?.chief_complaints?.split(",")[0]?.trim() || a.title || "Pregled",
        status,
        examinationId: a.examination_id,
      };
    });
    setSchedule(rows);

    // "Pacijenata danas" = total scheduled appointments
    // "Generisanih nalaza" = only appointments with priority="completed" (PDF was generated)
    const completedCount = rows.filter(r => r.status === "completed").length;
    setStats({
      patients: rows.length,
      reports: completedCount,
      alerts: rows.filter(r => r.status === "priority").length,
    });

    const diagMap = new Map<string, number>();
    const EXCLUDED_DIAG = ["unspecified", "nije određeno iz transkripta", "nije odredjeno iz transkripta", "nije pomenuto"];
    exams.forEach((e: any) => {
      if (e.diagnosis_codes) {
        e.diagnosis_codes.split(",").forEach((d: string) => {
          const name = d.trim();
          if (name && !EXCLUDED_DIAG.some(ex => name.toLowerCase().includes(ex))) {
            diagMap.set(name, (diagMap.get(name) || 0) + 1);
          }
        });
      }
    });
    const sorted = [...diagMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));
    setTopDiagnoses(sorted);
  };

  const seedDemoAppointments = async (doctorId: string) => {
    for (const demo of DEMO_APPOINTMENTS) {
      const { data: exam } = await supabase
        .from("examinations")
        .insert({
          doctor_id: doctorId,
          patient_email: `${demo.name.toLowerCase().replace(/\s+/g, ".")}@demo.rs`,
          patient_name: demo.name,
          chief_complaints: demo.reason,
          form_data: {},
        })
        .select("id")
        .single();

      if (exam) {
        await supabase.from("appointments").insert({
          examination_id: exam.id,
          appointment_date: today,
          appointment_time: demo.time,
          title: demo.reason,
          priority: demo.priority,
        });
      }
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const handleAddAppointment = async () => {
    if (!formData.name.trim() || !formData.time.trim() || !formData.reason.trim()) return;
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }

    // Create examination record
    const { data: exam } = await supabase
      .from("examinations")
      .insert({
        doctor_id: user.id,
        patient_email: `${formData.name.toLowerCase().replace(/\s+/g, ".")}@manual.rs`,
        patient_name: formData.name,
        chief_complaints: formData.reason,
        form_data: {},
      })
      .select("id")
      .single();

    if (exam) {
      const priorityMap: Record<string, string> = { completed: "completed", waiting: "normal", priority: "high" };
      await supabase.from("appointments").insert({
        examination_id: exam.id,
        appointment_date: today,
        appointment_time: formData.time,
        title: formData.reason,
        priority: priorityMap[formData.status] || "normal",
      });
    }

    setFormData({ name: "", time: "", reason: "", status: "waiting" });
    setDialogOpen(false);
    setSubmitting(false);
    await loadSchedule();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={22} />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-primary/5 animate-ping" />
          </div>
          <p className="text-xs text-muted-foreground font-medium">Učitavanje...</p>
        </div>
      </div>
    );
  }

  const maxDiag = topDiagnoses.length ? Math.max(...topDiagnoses.map(d => d.count)) : 1;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-7xl mx-auto relative">
      {/* Decorative background elements */}
      <div className="floating-dot w-32 h-32 bg-primary/30 -top-10 -right-10 blur-3xl" />
      <div className="floating-dot w-24 h-24 bg-accent/25 top-40 -left-8 blur-2xl" style={{ animationDelay: "2s" }} />

      {/* Header */}
      <motion.div variants={item} className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <Sparkles size={14} className="text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Clinical Intelligence Hub</h2>
          </div>
          <p className="text-sm text-muted-foreground ml-10">Pregled aktivnosti i kliničkih podataka</p>
        </div>
        <div className="text-xs text-foreground font-bold bg-muted/50 px-3 py-1.5 rounded-full">
          {new Date().toLocaleDateString("sr-RS", { weekday: "long", day: "numeric", month: "long" })}
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STAT_CONFIGS.map((s, i) => (
          <motion.div key={i} variants={item}>
            <div className={cn("stat-card border-l-[3px] border", s.borderAccent, s.cardBorder)}>
              <div className={cn("absolute inset-0 rounded-2xl bg-gradient-to-br opacity-50", s.gradient)} />
              <div className="relative flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", s.iconBg)}>
                  <s.icon size={20} strokeWidth={1.6} className={s.iconColor} />
                </div>
                <div className="flex-1">
                  <p className="text-3xl font-extrabold text-foreground tracking-tight">
                    {stats[s.key as keyof typeof stats]}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-semibold tracking-wide">{s.label}</p>
                </div>
                <ArrowUpRight size={16} className="text-muted-foreground/30" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Daily Schedule — 60% */}
        <motion.div variants={item} className="lg:col-span-3">
          <Card className="led-card border-border/30 overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Clock size={15} strokeWidth={1.8} className="text-primary" />
                  </div>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider">Dnevni raspored</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-semibold bg-primary/5 border-primary/15 text-primary">
                    {schedule.length} zakazano
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => setDialogOpen(true)}
                    className="h-7 px-2.5 text-xs gap-1 rounded-lg"
                  >
                    <Plus size={13} />
                    Novo zakazivanje
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {schedule.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <Activity size={24} className="text-muted-foreground/30" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Nema zakazanih pacijenata za danas.</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Kliknite "Novo zakazivanje" da dodate pregled</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/20">
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Vreme</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Pacijent</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 hidden sm:table-cell">Razlog</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedule.map((row) => (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer group hover:bg-primary/3 transition-colors duration-200 border-border/15"
                        onClick={() => navigate(`/examination/${row.examinationId}`)}
                      >
                        <TableCell className="font-bold text-foreground whitespace-nowrap text-sm">{row.time}</TableCell>
                        <TableCell className="text-foreground font-medium">{row.patient}</TableCell>
                        <TableCell className="text-muted-foreground hidden sm:table-cell text-sm max-w-[200px] truncate">
                          {row.reason.length > 60 ? row.reason.slice(0, 60) + "…" : row.reason}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={cn("text-[10px] font-bold border px-2.5 py-0.5", STATUS_STYLES[row.status])}>
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
          <Card className="led-card border-border/30 overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center">
                  <TrendingUp size={15} strokeWidth={1.8} className="text-accent" />
                </div>
                <CardTitle className="text-sm font-bold uppercase tracking-wider">Top dijagnoze</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              {topDiagnoses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nema podataka</p>
              ) : (
                topDiagnoses.map((d, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground font-semibold truncate pr-2">{d.name}</span>
                      <span className="text-xs text-muted-foreground font-bold shrink-0 bg-muted/50 px-2 py-0.5 rounded-full">{d.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary-glow/70"
                        initial={{ width: 0 }}
                        animate={{ width: `${(d.count / maxDiag) * 100}%` }}
                        transition={{ duration: 0.7, delay: 0.3 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* System Efficiency */}
          <Card className="led-card border-border/30 overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center">
                  <Zap size={15} strokeWidth={1.8} className="text-primary" />
                </div>
                <CardTitle className="text-sm font-bold uppercase tracking-wider">AI efikasnost</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-extrabold gradient-text tracking-tight">
                  {stats.reports * 17}
                </span>
                <span className="text-sm text-muted-foreground font-medium">min uštede</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                AI asistent je ubrzao dokumentaciju za{" "}
                <span className="font-bold text-accent">{stats.reports}</span> pregled{stats.reports !== 1 ? "a" : ""} danas, štedeći {stats.reports * 17} minuta.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-xl bg-gradient-to-br from-primary/8 to-primary/3 border border-primary/10 p-3 text-center">
                  <p className="text-xl font-extrabold text-foreground">{stats.reports}</p>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">AI nalaza</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-accent/8 to-accent/3 border border-accent/10 p-3 text-center">
                  <p className="text-xl font-extrabold text-foreground">{stats.alerts}</p>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Upozorenja</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* New Appointment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Novo zakazivanje</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="apt-name">Ime pacijenta</Label>
              <Input
                id="apt-name"
                placeholder="npr. Marko Petrović"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apt-time">Vreme</Label>
              <Input
                id="apt-time"
                type="time"
                placeholder="npr. 10:30"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apt-reason">Razlog</Label>
              <Input
                id="apt-reason"
                placeholder="npr. Kontrola pritiska"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="waiting">Čeka</SelectItem>
                  <SelectItem value="completed">Završeno</SelectItem>
                  <SelectItem value="priority">Prioritet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Otkaži</Button>
            <Button
              onClick={handleAddAppointment}
              disabled={submitting || !formData.name.trim() || !formData.time.trim() || !formData.reason.trim()}
            >
              {submitting ? <Loader2 className="animate-spin mr-2" size={14} /> : <Plus size={14} className="mr-1" />}
              Zakaži
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
