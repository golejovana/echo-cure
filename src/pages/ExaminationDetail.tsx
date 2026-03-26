import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText, Sparkles, Loader2, HeartPulse, Calendar,
  Clock, Activity, ClipboardList, Shield,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "@/hooks/use-toast";

interface Examination {
  id: string;
  diagnosis_codes: string | null;
  chief_complaints: string | null;
  present_illness: string | null;
  clinical_timeline: string | null;
  patient_name: string | null;
  form_data: Record<string, string>;
  simplified_explanation: string | null;
  is_read: boolean;
  created_at: string;
}

interface Appointment {
  id: string;
  title: string;
  appointment_date: string;
}

export default function ExaminationDetail() {
  const { id } = useParams<{ id: string }>();
  const [exam, setExam] = useState<Examination | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [simplifying, setSimplifying] = useState(false);
  const [simplified, setSimplified] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const { data: examData } = await supabase
        .from("examinations")
        .select("*")
        .eq("id", id)
        .single();

      if (examData) {
        const e = examData as unknown as Examination;
        setExam(e);
        setSimplified(e.simplified_explanation);

        // Mark as read
        if (!e.is_read) {
          await supabase.from("examinations").update({ is_read: true } as any).eq("id", id);
        }
      }

      const { data: aptsData } = await supabase
        .from("appointments")
        .select("*")
        .eq("examination_id", id)
        .order("appointment_date", { ascending: true });

      if (aptsData) setAppointments(aptsData as unknown as Appointment[]);
      setLoading(false);
    };
    fetch();
  }, [id]);

  const handleSimplify = async () => {
    if (!exam) return;
    setSimplifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("simplify-diagnosis", {
        body: {
          diagnosis: exam.diagnosis_codes,
          formData: exam.form_data,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const explanation = data.explanation;
      setSimplified(explanation);

      // Save to DB
      await supabase.from("examinations").update({ simplified_explanation: explanation } as any).eq("id", id);
    } catch (e) {
      console.error("Simplify error:", e);
      toast({
        title: "Greška",
        description: e instanceof Error ? e.message : "Nije moguće generisati objašnjenje.",
        variant: "destructive",
      });
    } finally {
      setSimplifying(false);
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

  if (!exam) {
    return (
      <DashboardLayout role="patient">
        <div className="text-center py-20 text-muted-foreground">Nalaz nije pronađen.</div>
      </DashboardLayout>
    );
  }

  const fd = exam.form_data || {};

  return (
    <DashboardLayout role="patient">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <HeartPulse size={22} strokeWidth={1.5} className="text-accent" />
            Detalji pregleda
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Pregled od {formatDate(exam.created_at)}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Diagnosis */}
            <div className="glass-card-elevated p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Activity size={16} strokeWidth={1.5} className="text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Dijagnoza (ICD-10)</h3>
              </div>
              <p className="text-sm font-medium text-foreground">{exam.diagnosis_codes || "Nije navedeno"}</p>
            </div>

            {/* Chief Complaints */}
            {exam.chief_complaints && (
              <div className="glass-card-elevated p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <ClipboardList size={16} strokeWidth={1.5} className="text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Glavne tegobe</h3>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{exam.chief_complaints}</p>
              </div>
            )}

            {/* Present Illness */}
            {exam.present_illness && (
              <div className="glass-card-elevated p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <FileText size={16} strokeWidth={1.5} className="text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Sadašnja bolest</h3>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{exam.present_illness}</p>
              </div>
            )}

            {/* Personal History from form_data */}
            {(fd.allergies || fd.chronicDiseases || fd.medications) && (
              <div className="glass-card-elevated p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield size={16} strokeWidth={1.5} className="text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Lična anamneza</h3>
                </div>
                <div className="space-y-2 text-sm text-foreground/80">
                  {fd.allergies && !fd.allergies.startsWith("Nije pomenuto") && (
                    <p><span className="font-medium text-foreground">Alergije:</span> {fd.allergies}</p>
                  )}
                  {fd.chronicDiseases && !fd.chronicDiseases.startsWith("Nije pomenuto") && (
                    <p><span className="font-medium text-foreground">Hronične bolesti:</span> {fd.chronicDiseases}</p>
                  )}
                  {fd.medications && !fd.medications.startsWith("Nije pomenuto") && (
                    <p><span className="font-medium text-foreground">Terapija:</span> {fd.medications}</p>
                  )}
                </div>
              </div>
            )}

            {/* AI Simplified Explanation */}
            <div className="glass-card-elevated p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} strokeWidth={1.5} className="text-accent" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Objašnjenje na razumljivom jeziku</h3>
              </div>

              {simplified ? (
                <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4">
                  <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line">{simplified}</p>
                </div>
              ) : (
                <button
                  onClick={handleSimplify}
                  disabled={simplifying}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold bg-accent text-accent-foreground shadow-md shadow-accent/15 hover:shadow-lg hover:shadow-accent/25 disabled:opacity-60 active:scale-[0.97] transition-all duration-200"
                >
                  {simplifying ? (
                    <>
                      <Loader2 size={15} strokeWidth={1.8} className="animate-spin" />
                      Generišem objašnjenje…
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} strokeWidth={1.8} />
                      Prevedi na razumljiv jezik ✨
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Sidebar: Appointments */}
          <div className="space-y-4">
            <div className="glass-card-elevated p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Calendar size={16} strokeWidth={1.5} className="text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Zakazani termini</h3>
              </div>

              {appointments.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Nema zakazanih termina za ovaj pregled.</p>
              ) : (
                <div className="space-y-3">
                  {appointments.map((apt) => (
                    <div key={apt.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock size={14} strokeWidth={1.5} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{apt.title}</p>
                        <p className="text-[10px] text-muted-foreground">{formatDate(apt.appointment_date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
