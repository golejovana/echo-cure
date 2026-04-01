import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { History, Search, Eye, Calendar, FileText, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { useTranslation } from "@/i18n/LanguageContext";
import { useTranslateText } from "@/hooks/useTranslateText";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ExamRow {
  id: string;
  date: string;
  name: string;
  diagnosis: string;
  status: string;
}

export default function HistoryPage() {
  const { t, language } = useTranslation();
  const [role, setRole] = useState<AppRole>("doctor");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<ExamRow[]>([]);
  const navigate = useNavigate();

  const statusDone = t("doctor.statusDone");
  const statusNew = t("patient.new");

  const statusColor = (status: string) => {
    if (status === statusDone) return "bg-accent/10 text-accent";
    if (status === statusNew) return "bg-primary/10 text-primary";
    return "bg-destructive/10 text-destructive";
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
      const userRole = profile?.role || "doctor";
      setRole(userRole);

      const { data: exams } = await supabase
        .from("examinations").select("*").order("created_at", { ascending: false });

      if (exams) {
        let doctorNames: Record<string, string> = {};
        if (userRole === "patient") {
          const doctorIds = [...new Set(exams.map((e: any) => e.doctor_id))];
          if (doctorIds.length > 0) {
            const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", doctorIds);
            if (profiles) profiles.forEach((p: any) => { doctorNames[p.user_id] = p.full_name || ""; });
          }
        }

        const dateLocale = language === "en" ? "en-US" : language === "fr" ? "fr-FR" : "sr-Latn";
        setRows(exams.map((e: any) => ({
          id: e.id,
          date: new Date(e.created_at).toLocaleDateString(dateLocale, { day: "2-digit", month: "2-digit", year: "numeric" }) + ".",
          name: userRole === "doctor" ? (e.patient_name || e.patient_email) : (`Dr. ${doctorNames[e.doctor_id] || ""}`),
          diagnosis: e.diagnosis_codes || t("patient.notSpecified"),
          status: e.is_read ? statusDone : statusNew,
        })));
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  const isDoctor = role === "doctor";
  const diagnosisTexts = rows.map((r) => r.diagnosis);
  const diagTranslations = useTranslateText(diagnosisTexts);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const filtered = rows.filter((row) =>
    `${row.name} ${row.diagnosis}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role={role}>
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        className="max-w-5xl mx-auto space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <History size={22} strokeWidth={1.5} className="text-primary" />
              {t("history.title")}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isDoctor ? t("history.doctorSubtitle") : t("history.patientSubtitle")}
            </p>
          </div>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("history.search")}
              className="pl-9 pr-4 py-2.5 rounded-2xl bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-64 transition-shadow duration-200 shadow-sm focus:shadow-md"
            />
          </div>
        </div>

        <div className="led-card overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3.5">
                    <div className="flex items-center gap-1.5"><Calendar size={12} /> {t("history.date")}</div>
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3.5">
                    {isDoctor ? t("history.patient") : t("history.doctorCol")}
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3.5">
                    <div className="flex items-center gap-1.5"><FileText size={12} /> {t("history.diagnosisCol")}</div>
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3.5">
                    <div className="flex items-center gap-1.5"><Filter size={12} /> {t("history.status")}</div>
                  </th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors duration-150 group">
                    <td className="px-5 py-4 text-sm text-foreground font-medium">{row.date}</td>
                    <td className="px-5 py-4 text-sm text-foreground">{row.name}</td>
                    <td className="px-5 py-4 text-sm text-foreground/80 max-w-xs truncate">{diagTranslations[row.diagnosis] || row.diagnosis}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${statusColor(row.status)}`}>{row.status}</span>
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => navigate(`/examination/${row.id}`)}
                        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 opacity-0 group-hover:opacity-100 transition-all duration-200 px-3 py-1.5 rounded-full bg-primary/5 hover:bg-primary/10">
                        <Eye size={13} strokeWidth={1.8} />
                        {t("history.open")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-border/20">
            {filtered.map((row) => (
              <button key={row.id} onClick={() => navigate(`/examination/${row.id}`)} className="w-full p-4 space-y-2 text-left hover:bg-muted/20 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{row.name}</span>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${statusColor(row.status)}`}>{row.status}</span>
                </div>
                <p className="text-xs text-foreground/70 truncate">{diagTranslations[row.diagnosis] || row.diagnosis}</p>
                <span className="text-[10px] text-muted-foreground">{row.date}</span>
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {rows.length === 0 ? t("history.empty") : `${t("history.noResults")} „${search}"`}
            </div>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
