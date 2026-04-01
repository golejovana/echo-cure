import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText, Sparkles, Loader2, HeartPulse, Calendar,
  Clock, Activity, ClipboardList, Shield, Pill, AlertTriangle,
  User, Heart, Stethoscope, Droplets, Brain, Thermometer, Home, Download, TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/LanguageContext";
import { generateAnamnezaPdf } from "@/lib/generateAnamnezaPdf";
import TherapyProgressPanel from "@/components/TherapyProgressPanel";
import { useExamContentTranslation } from "@/hooks/useExamContentTranslation";
import { Skeleton } from "@/components/ui/skeleton";

interface Examination {
  id: string;
  diagnosis_codes: string | null;
  chief_complaints: string | null;
  present_illness: string | null;
  clinical_timeline: string | null;
  patient_name: string | null;
  patient_email: string;
  form_data: Record<string, any>;
  simplified_explanation: string | null;
  is_read: boolean;
  created_at: string;
  doctor_id: string;
}

interface Appointment {
  id: string;
  title: string;
  appointment_date: string;
  priority: string;
}

/* ---- field definitions matching SmartFormPanel ---- */
const SYSTEM_CATEGORIES = [
  {
    id: "cardiovascular", labelKey: "form.cardiovascular", icon: Heart,
    fields: [
      { key: "chestPain", labelKey: "form.chestPain" },
      { key: "swelling", labelKey: "form.swelling" },
      { key: "pressure", labelKey: "form.pressure" },
      { key: "veins", labelKey: "form.veins" },
    ],
  },
  {
    id: "gastrointestinal", labelKey: "form.gastrointestinal", icon: Stethoscope,
    fields: [
      { key: "appetite", labelKey: "form.appetite" },
      { key: "nausea", labelKey: "form.nausea" },
      { key: "swallowing", labelKey: "form.swallowing" },
      { key: "bloating", labelKey: "form.bloating" },
      { key: "stool", labelKey: "form.stool" },
    ],
  },
  {
    id: "urogenital", labelKey: "form.urogenital", icon: Droplets,
    fields: [
      { key: "urination", labelKey: "form.urination" },
      { key: "flankPain", labelKey: "form.flankPain" },
    ],
  },
  {
    id: "locomotor", labelKey: "form.locomotor", icon: Brain,
    fields: [
      { key: "jointPain", labelKey: "form.jointPain" },
      { key: "visionHearing", labelKey: "form.visionHearing" },
      { key: "dizziness", labelKey: "form.dizziness" },
      { key: "headaches", labelKey: "form.headaches" },
    ],
  },
];

const OBJECTIVE_FIELDS = [
  { key: "bloodPressure", labelKey: "form.bloodPressure" },
  { key: "pulse", labelKey: "form.pulse" },
  { key: "temperature", labelKey: "form.temperature" },
  { key: "respiration", labelKey: "form.respiration" },
  { key: "lungSounds", labelKey: "form.lungSounds" },
  { key: "heartSounds", labelKey: "form.heartSounds" },
  { key: "abdominalExam", labelKey: "form.abdominalExam" },
  { key: "skinExam", labelKey: "form.skinExam" },
  { key: "meningealSigns", labelKey: "form.meningealSigns" },
  { key: "otherFindings", labelKey: "form.otherFindings" },
];

const PERSONAL_HISTORY_FIELDS = [
  { key: "allergies", labelKey: "examDetail.allergies" },
  { key: "chronicDiseases", labelKey: "examDetail.chronicDiseases" },
  { key: "surgeries", labelKey: "form.surgeries" },
  { key: "medications", labelKey: "examDetail.therapy" },
  { key: "familyHistory", labelKey: "form.familyHistory" },
];

const SOCIAL_FIELDS = [
  { key: "livingConditions", labelKey: "form.livingConditions" },
  { key: "smokingAlcohol", labelKey: "form.smokingAlcohol" },
  { key: "epidemiological", labelKey: "form.epidemiological" },
];

const isEmpty = (val: string | undefined | null) =>
  !val || val === "Nije pomenuto" || val === "Nije pomenuto." || val === "Nije određeno" || val.startsWith("Nije pomenuto");

export default function ExaminationDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [exam, setExam] = useState<Examination | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [simplifying, setSimplifying] = useState(false);
  const [simplified, setSimplified] = useState<string | null>(null);
  const [role, setRole] = useState<"doctor" | "patient">("patient");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [institutionInfo, setInstitutionInfo] = useState<Record<string, string | undefined>>({});

  // Hooks must be called before any early returns
  const translatableFields = useMemo(() => {
    if (!exam) return {};
    const fd = exam.form_data || {};
    return {
      diagnosis: exam.diagnosis_codes,
      chiefComplaints: exam.chief_complaints,
      presentIllness: exam.present_illness,
      allergies: fd.allergies as string | undefined,
      chronicDiseases: fd.chronicDiseases as string | undefined,
      medications: fd.medications as string | undefined,
      simplified: simplified,
    } as Record<string, string | null | undefined>;
  }, [exam, simplified]);

  const { translated: tr, loading: trLoading, errors: trErrors } = useExamContentTranslation(exam?.id, translatableFields);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
        if (profile?.role) setRole(profile.role);
      }
      const { data: examData } = await supabase.from("examinations").select("*").eq("id", id).single();
      if (examData) {
        const e = examData as unknown as Examination;
        setExam(e);
        setSimplified(e.simplified_explanation);
        if (!e.is_read) {
          await supabase.from("examinations").update({ is_read: true } as any).eq("id", id);
        }
        const { data: docProfile } = await supabase.from("profiles")
          .select("institution_name, institution_address, institution_city, full_name")
          .eq("user_id", e.doctor_id).single();
        if (docProfile) {
          setInstitutionInfo({
            institution_name: docProfile.institution_name || undefined,
            institution_address: docProfile.institution_address || undefined,
            institution_city: docProfile.institution_city || undefined,
            doctor_name: docProfile.full_name || undefined,
          });
        }
      }
      const { data: aptsData } = await supabase.from("appointments").select("*").eq("examination_id", id).order("appointment_date", { ascending: true });
      if (aptsData) setAppointments(aptsData as unknown as Appointment[]);
      setLoading(false);
    };
    load();
  }, [id]);

  const handleSimplify = async () => {
    if (!exam) return;
    setSimplifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("simplify-diagnosis", {
        body: { diagnosis: exam.diagnosis_codes, formData: exam.form_data },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const explanation = data.explanation;
      setSimplified(explanation);
      await supabase.from("examinations").update({ simplified_explanation: explanation } as any).eq("id", id);
    } catch (e) {
      console.error("Simplify error:", e);
      toast({ title: t("examDetail.error"), description: e instanceof Error ? e.message : t("examDetail.errorDesc"), variant: "destructive" });
    } finally {
      setSimplifying(false);
    }
  };

  const handlePdf = async () => {
    if (!exam) return;
    setPdfLoading(true);
    try {
      await generateAnamnezaPdf(exam.form_data as Record<string, string>, "sr", institutionInfo);
      if (id) {
        await supabase.from("appointments").update({ priority: "completed" } as any).eq("examination_id", id);
      }
      toast({ title: t("form.pdfGenerated"), description: t("form.pdfGeneratedDesc") });
    } catch (e) {
      console.error("PDF error:", e);
      toast({ title: t("form.pdfError"), description: e instanceof Error ? e.message : t("form.pdfErrorDesc"), variant: "destructive" });
    } finally {
      setPdfLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}.`;
  };

  const tv = (key: string, original: string | null | undefined): string => {
    if (!original) return "";
    return tr[key] || original;
  };

  if (loading) {
    return (
      <DashboardLayout role={role}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      </DashboardLayout>
    );
  }

  if (!exam) {
    return (
      <DashboardLayout role={role}>
        <div className="text-center py-20 text-muted-foreground">{t("examDetail.notFound")}</div>
      </DashboardLayout>
    );
  }

  const fd = exam.form_data || {};
  const isDoctor = role === "doctor";

  /* ======================== DOCTOR VIEW ======================== */
  if (isDoctor) {
    return (
      <DashboardLayout role="doctor">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-5xl mx-auto space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <HeartPulse size={22} strokeWidth={1.5} className="text-primary" />
                {t("examDetail.detailedAnamnesis")}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t("examDetail.examFrom")} {formatDate(exam.created_at)}
              </p>
            </div>
            <button
              onClick={handlePdf}
              disabled={pdfLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground shadow-md hover:shadow-lg disabled:opacity-60 active:scale-[0.97] transition-all duration-200"
            >
              {pdfLoading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              {pdfLoading ? t("form.generating") : t("examDetail.generatePdf")}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main column */}
            <div className="lg:col-span-2 space-y-4">

              {/* Patient info */}
              {(fd.patientName || fd.patientAge || fd.patientOccupation) && (
                <Section icon={User} title={t("examDetail.patientData")}>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {fd.patientName && <Field label={t("examDetail.nameLabel")} value={fd.patientName} />}
                    {fd.patientAge && <Field label={t("examDetail.ageLabel")} value={fd.patientAge} />}
                    {fd.patientOccupation && <Field label={t("examDetail.occupationLabel")} value={fd.patientOccupation} />}
                    {fd.patientSocialStatus && <Field label={t("examDetail.socialStatusLabel")} value={fd.patientSocialStatus} />}
                    {exam.patient_email && <Field label={t("examDetail.emailLabel")} value={exam.patient_email} />}
                  </div>
                </Section>
              )}

              {/* Diagnosis */}
              <Section icon={Activity} title={t("examDetail.diagnosis")}>
                <p className="text-sm font-medium text-foreground">{exam.diagnosis_codes || t("examDetail.notSpecified")}</p>
              </Section>

              {/* Chief complaints */}
              {!isEmpty(exam.chief_complaints) && (
                <Section icon={ClipboardList} title={t("examDetail.chiefComplaints")}>
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{exam.chief_complaints}</p>
                </Section>
              )}

              {/* Present illness */}
              {!isEmpty(exam.present_illness) && (
                <Section icon={FileText} title={t("examDetail.presentIllness")}>
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{exam.present_illness}</p>
                </Section>
              )}

              {/* Clinical timeline */}
              {!isEmpty(exam.clinical_timeline) && (
                <Section icon={Clock} title={t("examDetail.clinicalTimeline")}>
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{exam.clinical_timeline}</p>
                </Section>
              )}

              {/* Personal history */}
              {PERSONAL_HISTORY_FIELDS.some(f => !isEmpty(fd[f.key])) && (
                <Section icon={Shield} title={t("examDetail.personalHistory")}>
                  <div className="space-y-2 text-sm">
                    {PERSONAL_HISTORY_FIELDS.map(f => !isEmpty(fd[f.key]) && (
                      <p key={f.key}>
                        <span className="font-medium text-foreground">{t(f.labelKey)} </span>
                        <span className="text-foreground/80">{fd[f.key]}</span>
                      </p>
                    ))}
                  </div>
                </Section>
              )}

              {/* Social history */}
              {SOCIAL_FIELDS.some(f => !isEmpty(fd[f.key])) && (
                <Section icon={Home} title={t("examDetail.socialHistory")}>
                  <div className="space-y-2 text-sm">
                    {SOCIAL_FIELDS.map(f => !isEmpty(fd[f.key]) && (
                      <p key={f.key}>
                        <span className="font-medium text-foreground">{t(f.labelKey)} </span>
                        <span className="text-foreground/80">{fd[f.key]}</span>
                      </p>
                    ))}
                  </div>
                </Section>
              )}

              {/* Systems review */}
              {SYSTEM_CATEGORIES.map(cat => {
                const filled = cat.fields.filter(f => !isEmpty(fd[f.key]));
                if (filled.length === 0) return null;
                const Icon = cat.icon;
                return (
                  <Section key={cat.id} icon={Icon} title={t(cat.labelKey)}>
                    <div className="space-y-2 text-sm">
                      {filled.map(f => (
                        <p key={f.key}>
                          <span className="font-medium text-foreground">{t(f.labelKey)}: </span>
                          <span className="text-foreground/80">{fd[f.key]}</span>
                        </p>
                      ))}
                    </div>
                  </Section>
                );
              })}

              {/* Status Praesens (Objective findings) */}
              {OBJECTIVE_FIELDS.some(f => !isEmpty(fd[f.key])) && (
                <Section icon={Thermometer} title={t("examDetail.statusPraesens")}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    {OBJECTIVE_FIELDS.map(f => !isEmpty(fd[f.key]) && (
                      <div key={f.key} className="bg-muted/20 rounded-xl px-3.5 py-2.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-0.5">{t(f.labelKey)}</span>
                        <span className="text-foreground">{fd[f.key]}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Medications */}
              {fd._medications && Array.isArray(fd._medications) && fd._medications.length > 0 && (
                <div className="glass-card-elevated p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Pill size={16} strokeWidth={1.5} className="text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{t("therapy.medicationsLabel")}</h3>
                  </div>
                  <div className="space-y-2">
                    {(fd._medications as any[]).map((med: any, i: number) => (
                      <div key={i} className="bg-muted/20 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{med.name} <span className="text-muted-foreground">{med.dose}</span></p>
                          {med.note && <p className="text-[10px] text-muted-foreground">{med.note}</p>}
                        </div>
                        <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">
                          {med.frequency === "pp" ? t("therapy.asNeeded") : `${med.frequency}${t("therapy.timesDaily")}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Appointments */}
              <div className="glass-card-elevated p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar size={16} strokeWidth={1.5} className="text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{t("examDetail.appointments")}</h3>
                </div>
                {appointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">{t("examDetail.noAppointments")}</p>
                ) : (
                  <div className="space-y-3">
                    {appointments.map((apt) => (
                      <div key={apt.id} className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${apt.priority === "high" ? "bg-destructive/10" : "bg-primary/10"}`}>
                          {apt.priority === "high" ? <AlertTriangle size={14} strokeWidth={1.5} className="text-destructive" /> : <Clock size={14} strokeWidth={1.5} className="text-primary" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{apt.title}</p>
                          <p className="text-[10px] text-muted-foreground">{formatDate(apt.appointment_date)}</p>
                        </div>
                        {apt.priority === "high" && (
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-destructive bg-destructive/10 px-2 py-0.5 rounded-full mt-1">{t("therapy.highPriority")}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Therapy Progress */}
              <TherapyProgressPanel examinationId={exam.id} patientName={exam.patient_name || undefined} />
            </div>
          </div>
        </motion.div>
      </DashboardLayout>
    );
  }

  /* ======================== PATIENT VIEW ======================== */

  return (
    <DashboardLayout role="patient">
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl mx-auto space-y-6"
      >
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <HeartPulse size={22} strokeWidth={1.5} className="text-accent" />
            {t("examDetail.title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t("examDetail.examFrom")} {formatDate(exam.created_at)}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Section icon={Activity} title={t("examDetail.diagnosis")}>
              <TranslatedContent loading={trLoading} failed={trErrors.has("diagnosis")}>
                <p className="text-sm font-medium text-foreground">{tv("diagnosis", exam.diagnosis_codes) || t("examDetail.notSpecified")}</p>
              </TranslatedContent>
            </Section>

            {!isEmpty(exam.chief_complaints) && (
              <Section icon={ClipboardList} title={t("examDetail.chiefComplaints")}>
                <TranslatedContent loading={trLoading} failed={trErrors.has("chiefComplaints")}>
                  <p className="text-sm text-foreground/80 leading-relaxed">{tv("chiefComplaints", exam.chief_complaints)}</p>
                </TranslatedContent>
              </Section>
            )}

            {!isEmpty(exam.present_illness) && (
              <Section icon={FileText} title={t("examDetail.presentIllness")}>
                <TranslatedContent loading={trLoading} failed={trErrors.has("presentIllness")}>
                  <p className="text-sm text-foreground/80 leading-relaxed">{tv("presentIllness", exam.present_illness)}</p>
                </TranslatedContent>
              </Section>
            )}

            {(fd.allergies || fd.chronicDiseases || fd.medications) && (
              <Section icon={Shield} title={t("examDetail.personalHistory")}>
                <div className="space-y-2 text-sm text-foreground/80">
                  {!isEmpty(fd.allergies) && (
                    <TranslatedContent loading={trLoading} failed={trErrors.has("allergies")} inline>
                      <p><span className="font-medium text-foreground">{t("examDetail.allergies")}</span> {tv("allergies", fd.allergies)}</p>
                    </TranslatedContent>
                  )}
                  {!isEmpty(fd.chronicDiseases) && (
                    <TranslatedContent loading={trLoading} failed={trErrors.has("chronicDiseases")} inline>
                      <p><span className="font-medium text-foreground">{t("examDetail.chronicDiseases")}</span> {tv("chronicDiseases", fd.chronicDiseases)}</p>
                    </TranslatedContent>
                  )}
                  {!isEmpty(fd.medications) && (
                    <TranslatedContent loading={trLoading} failed={trErrors.has("medications")} inline>
                      <p><span className="font-medium text-foreground">{t("examDetail.therapy")}</span> {tv("medications", fd.medications)}</p>
                    </TranslatedContent>
                  )}
                </div>
              </Section>
            )}

            {/* Simplified explanation - patient only */}
            <div className="glass-card-elevated p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} strokeWidth={1.5} className="text-accent" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{t("examDetail.simplifiedTitle")}</h3>
              </div>
              {simplified ? (
                <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4">
                  <TranslatedContent loading={trLoading} failed={trErrors.has("simplified")}>
                    <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line">{tv("simplified", simplified)}</p>
                  </TranslatedContent>
                </div>
              ) : (
                <button onClick={handleSimplify} disabled={simplifying}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold bg-accent text-accent-foreground shadow-md shadow-accent/15 hover:shadow-lg hover:shadow-accent/25 disabled:opacity-60 active:scale-[0.97] transition-all duration-200">
                  {simplifying ? (
                    <><Loader2 size={15} strokeWidth={1.8} className="animate-spin" /> {t("examDetail.simplifying")}</>
                  ) : (
                    <><Sparkles size={15} strokeWidth={1.8} /> {t("examDetail.simplifyBtn")}</>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {fd._medications && Array.isArray(fd._medications) && fd._medications.length > 0 && (
              <div className="glass-card-elevated p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Pill size={16} strokeWidth={1.5} className="text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{t("therapy.medicationsLabel")}</h3>
                </div>
                <div className="space-y-2">
                  {(fd._medications as any[]).map((med: any, i: number) => (
                    <div key={i} className="bg-muted/20 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{med.name} <span className="text-muted-foreground">{med.dose}</span></p>
                        {med.note && <p className="text-[10px] text-muted-foreground">{med.note}</p>}
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">
                        {med.frequency === "pp" ? t("therapy.asNeeded") : `${med.frequency}${t("therapy.timesDaily")}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="glass-card-elevated p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Calendar size={16} strokeWidth={1.5} className="text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{t("examDetail.appointments")}</h3>
              </div>
              {appointments.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">{t("examDetail.noAppointments")}</p>
              ) : (
                <div className="space-y-3">
                  {appointments.map((apt) => (
                    <div key={apt.id} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${apt.priority === "high" ? "bg-destructive/10" : "bg-primary/10"}`}>
                        {apt.priority === "high" ? <AlertTriangle size={14} strokeWidth={1.5} className="text-destructive" /> : <Clock size={14} strokeWidth={1.5} className="text-primary" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{apt.title}</p>
                        <p className="text-[10px] text-muted-foreground">{formatDate(apt.appointment_date)}</p>
                      </div>
                      {apt.priority === "high" && (
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-destructive bg-destructive/10 px-2 py-0.5 rounded-full mt-1">{t("therapy.highPriority")}</span>
                      )}
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

/* ---- Reusable card section ---- */
function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card-elevated p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Icon size={16} strokeWidth={1.5} className="text-primary" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="font-medium text-foreground">{label}: </span>
      <span className="text-foreground/80">{value}</span>
    </p>
  );
}
