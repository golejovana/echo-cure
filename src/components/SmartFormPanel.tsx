import { useState, useCallback, useEffect } from "react";
import {
  Sparkles, Heart, Stethoscope, Droplets, Brain,
  ChevronDown, Send, Loader2, FileText, ClipboardList, Activity,
  User, Clock, Thermometer, Shield, Home, Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { generateAnamnezaPdf } from "@/lib/generateAnamnezaPdf";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppointments } from "@/contexts/AppointmentsContext";
import TherapyPanel, { Medication, PlannedAppointment } from "@/components/TherapyPanel";

/* ---------- types ---------- */
interface CategoryField { key: string; labelKey: string }
interface MedicalCategory { id: string; labelKey: string; icon: React.ElementType; fields: CategoryField[] }

/* ---------- ANAMNEZA PO SISTEMIMA ---------- */
const SYSTEM_CATEGORIES: MedicalCategory[] = [
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

const OBJECTIVE_FIELDS: CategoryField[] = [
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

type FormData = Record<string, string>;
interface SmartFormPanelProps { transcript: string; lang: string }

const today = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}.`;
};

/* ================================================================ */
const SmartFormPanel = ({ transcript, lang }: SmartFormPanelProps) => {
  const { t } = useTranslation();
  const { addLocalAppointments, clearLocalAppointments, refreshFromDb } = useAppointments();
  const [form, setForm] = useState<FormData>({});
  const [filling, setFilling] = useState(false);
  const [sending, setSending] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [objectiveOpen, setObjectiveOpen] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [plannedAppointments, setPlannedAppointments] = useState<PlannedAppointment[]>([]);
  const [institutionInfo, setInstitutionInfo] = useState<{
    institution_name?: string;
    institution_address?: string;
    institution_city?: string;
    institution_logo_url?: string;
    doctor_name?: string;
  }>({});

  // Load institution branding
  useEffect(() => {
    const loadInstitution = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("institution_name, institution_address, institution_city, institution_logo_url, full_name")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setInstitutionInfo({
          institution_name: data.institution_name || undefined,
          institution_address: data.institution_address || undefined,
          institution_city: data.institution_city || undefined,
          institution_logo_url: data.institution_logo_url || undefined,
          doctor_name: data.full_name || undefined,
        });
      }
    };
    loadInstitution();
  }, []);

  // Sync planned appointments to shared context as doctor adds them
  useEffect(() => {
    clearLocalAppointments();
    const valid = plannedAppointments.filter((a) => a.title.trim() && a.date);
    if (valid.length > 0) {
      addLocalAppointments(
        valid.map((a) => ({
          title: a.title,
          appointment_date: a.date!.toISOString().split("T")[0],
          appointment_time: a.time || null,
          priority: a.priority,
        }))
      );
    }
  }, [plannedAppointments, addLocalAppointments, clearLocalAppointments]);

  const toggle = (id: string) =>
    setOpenSections((p) => (p.includes(id) ? p.filter((s) => s !== id) : [...p, id]));

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  /* ---- auto-fill ---- */
  const handleAutoFill = useCallback(async () => {
    if (!transcript.trim() || filling) return;
    setFilling(true);
    setForm({});
    try {
      const { data, error } = await supabase.functions.invoke("parse-transcript", { body: { transcript, lang } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const fd = data.formData as FormData;

      setOpenSections(SYSTEM_CATEGORIES.map((c) => c.id));
      setObjectiveOpen(true);

      const allKeys = [
        "patientName", "patientAge", "patientOccupation", "patientSocialStatus",
        "chiefComplaints", "presentIllness", "clinicalTimeline", "diagnosisCodes",
        ...SYSTEM_CATEGORIES.flatMap((c) => c.fields.map((f) => f.key)),
        "allergies", "chronicDiseases", "surgeries", "medications",
        "familyHistory",
        "livingConditions", "smokingAlcohol", "epidemiological",
        ...OBJECTIVE_FIELDS.map((f) => f.key),
      ];
      allKeys.forEach((key, i) => {
        setTimeout(() => {
          setForm((prev) => ({ ...prev, [key]: fd[key] || t("form.notMentioned") }));
          if (i === allKeys.length - 1) setFilling(false);
        }, 50 + i * 40);
      });
    } catch (e) {
      console.error("Auto-fill error:", e);
      toast({ title: t("form.extractError"), description: e instanceof Error ? e.message : t("form.extractErrorDesc"), variant: "destructive" });
      setFilling(false);
    }
  }, [transcript, filling, lang, t]);

  /* ---- send to patient ---- */
  const handleSendToPatient = useCallback(async () => {
    const patientEmail = window.prompt(t("form.sendPrompt"));
    if (!patientEmail?.trim()) return;

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("form.notLoggedIn"));

      // Include medications in form_data
      const enrichedFormData = {
        ...form,
        _medications: medications.filter((m) => m.name.trim()),
      };

      const { data: exam, error: examError } = await supabase
        .from("examinations")
        .insert({
          doctor_id: user.id,
          patient_email: patientEmail.trim().toLowerCase(),
          patient_name: form.patientName || null,
          diagnosis_codes: form.diagnosisCodes || null,
          chief_complaints: form.chiefComplaints || null,
          present_illness: form.presentIllness || null,
          clinical_timeline: form.clinicalTimeline || null,
          form_data: enrichedFormData as any,
        } as any)
        .select("id")
        .single();

      if (examError) throw examError;

      // Create appointments from doctor-specified dates
      const validAppointments = plannedAppointments.filter((a) => a.title.trim() && a.date);
      if (validAppointments.length > 0) {
        for (const apt of validAppointments) {
          await supabase.from("appointments").insert({
            examination_id: exam.id,
            title: apt.title,
            appointment_date: apt.date!.toISOString().split("T")[0],
            appointment_time: apt.time || null,
            priority: apt.priority,
          } as any);
        }
      } else {
        // Fallback default appointments if none specified
        const now = new Date();
        const defaults = [
          { title: t("form.followUp"), appointment_date: new Date(now.getTime() + 7 * 86400000).toISOString().split("T")[0], priority: "normal" },
          { title: t("form.labResult"), appointment_date: new Date(now.getTime() + 5 * 86400000).toISOString().split("T")[0], priority: "normal" },
        ];
        for (const apt of defaults) {
          await supabase.from("appointments").insert({
            examination_id: exam.id,
            title: apt.title,
            appointment_date: apt.appointment_date,
            priority: apt.priority,
          });
        }
      }

      // Link patient AFTER appointments are created so patient_id gets set on all records
      await supabase.rpc("link_patient_by_email", {
        p_exam_id: exam.id,
        p_email: patientEmail.trim().toLowerCase(),
      });

      // Refresh shared context from DB and clear local preview
      clearLocalAppointments();
      await refreshFromDb();

      toast({ title: t("form.sendSuccess"), description: `${t("form.sendSuccessDesc")} ${patientEmail}.` });
    } catch (e) {
      console.error("Send error:", e);
      toast({ title: t("form.sendError"), description: e instanceof Error ? e.message : t("form.sendErrorDesc"), variant: "destructive" });
    } finally {
      setSending(false);
    }
  }, [form, medications, plannedAppointments, t]);

  const filledCount = (cat: MedicalCategory) =>
    cat.fields.filter((f) => form[f.key] && !form[f.key].startsWith("Nije pomenuto") && !form[f.key].startsWith("Not mentioned") && !form[f.key].startsWith("Non mentionné")).length;

  const hasAnyData = Object.values(form).some((v) => v && !v.startsWith("Nije pomenuto") && !v.startsWith("Not mentioned") && !v.startsWith("Non mentionné"));

  return (
    <div className="flex flex-col h-full">
      {/* top bar */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t("form.title")}</h2>
        <button
          onClick={handleAutoFill}
          disabled={!transcript.trim() || filling}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.96] transition-all duration-200"
        >
          {filling ? <Loader2 size={15} strokeWidth={1.8} className="animate-spin" /> : <Sparkles size={15} strokeWidth={1.8} />}
          {filling ? t("form.extracting") : t("form.extractBtn")}
        </button>
      </div>

      {/* scrollable body */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">

        {/* ===== HEADER ===== */}
        <div className="glass-card p-5 space-y-3">
          <div className="text-center space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("form.country")}</p>
            <p className="text-xs font-bold text-foreground">{t("form.hospital")}</p>
            <p className="text-[11px] text-muted-foreground">{t("form.address")}</p>
          </div>
          <div className="border-t border-border/50 pt-3 flex justify-between items-center">
            <span className="text-[11px] text-muted-foreground">{t("form.historyNo")} ___________</span>
            <span className="text-[11px] text-muted-foreground">{t("form.date")} {today()}</span>
          </div>
        </div>

        {/* ===== PATIENT IDENTITY ===== */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <User size={16} strokeWidth={1.5} className="text-muted-foreground" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{t("form.patientSection")}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "patientName", labelKey: "form.patientName" },
              { key: "patientAge", labelKey: "form.patientAge" },
              { key: "patientOccupation", labelKey: "form.patientOccupation" },
              { key: "patientSocialStatus", labelKey: "form.patientSocial" },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t(f.labelKey)}</label>
                <input
                  value={form[f.key] || ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  placeholder={t("form.fromTranscript")}
                  className={cn(
                    "w-full bg-muted/30 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all duration-200",
                    form[f.key]?.startsWith("Nije pomenuto") && "text-muted-foreground/60 italic"
                  )}
                />
                {filling && !form[f.key] && <Shimmer />}
              </div>
            ))}
          </div>
        </div>

        {/* ===== ANAMNEZA title ===== */}
        <div className="text-center py-2">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground">{t("form.anamnesis")}</h2>
        </div>

        {/* ===== RADNE DIJAGNOZE / ICD-10 ===== */}
        <SectionBlock icon={Activity} title={t("form.workingDiagnosis")} fieldKey="diagnosisCodes" value={form.diagnosisCodes || ""} onChange={set} filling={filling} rows={3} placeholder={t("form.diagnosisPlaceholder")} fromTranscript={t("form.fromTranscript")} />

        {/* ===== GLAVNE TEGOBE ===== */}
        <SectionBlock icon={ClipboardList} title={t("form.chiefComplaints")} fieldKey="chiefComplaints" value={form.chiefComplaints || ""} onChange={set} filling={filling} rows={3} fromTranscript={t("form.fromTranscript")} />

        {/* ===== SADAŠNJA BOLEST ===== */}
        <SectionBlock icon={FileText} title={t("form.presentIllness")} fieldKey="presentIllness" value={form.presentIllness || ""} onChange={set} filling={filling} rows={5} placeholder={t("form.presentIllnessPlaceholder")} fromTranscript={t("form.fromTranscript")} />

        {/* ===== KLINIČKA HRONOLOGIJA ===== */}
        <SectionBlock icon={Clock} title={t("form.clinicalTimeline")} fieldKey="clinicalTimeline" value={form.clinicalTimeline || ""} onChange={set} filling={filling} rows={3} placeholder={t("form.timelinePlaceholder")} fromTranscript={t("form.fromTranscript")} />

        {/* ===== ANAMNEZA PO SISTEMIMA ===== */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">{t("form.systemAnamnesis")}</p>
          {SYSTEM_CATEGORIES.map((cat) => {
            const isOpen = openSections.includes(cat.id);
            const Icon = cat.icon;
            const filled = filledCount(cat);
            return (
              <div key={cat.id} className="glass-card overflow-hidden">
                <button onClick={() => toggle(cat.id)} className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/30 transition-colors duration-200 active:scale-[0.995]">
                  <Icon size={17} strokeWidth={1.5} className="text-muted-foreground shrink-0" />
                  <span className="flex-1 text-sm font-semibold text-foreground tracking-wide">{t(cat.labelKey)}</span>
                  {filled > 0 && <span className="text-[10px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">{filled}/{cat.fields.length}</span>}
                  <ChevronDown size={15} strokeWidth={1.8} className={cn("text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} />
                </button>
                <AnimatePresence mode="wait" initial={false}>
                  {isOpen && (
                    <motion.div key={cat.id + "-content"} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
                      <div className="px-5 pb-4 space-y-3 border-t border-border/50 pt-3">
                        {cat.fields.map((field) => (
                          <FieldRow key={field.key} field={field} value={form[field.key] || ""} onChange={set} filling={filling} fromTranscript={t("form.fromTranscript")} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* ===== LIČNA ANAMNEZA ===== */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={16} strokeWidth={1.5} className="text-muted-foreground" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{t("form.personalHistory")}</h3>
          </div>
          <div className="space-y-3">
            {[
              { key: "allergies", labelKey: "form.allergies" },
              { key: "chronicDiseases", labelKey: "form.chronicDiseases" },
              { key: "surgeries", labelKey: "form.surgeries" },
              { key: "medications", labelKey: "form.medications" },
            ].map((f) => (
              <FieldRow key={f.key} field={f} value={form[f.key] || ""} onChange={set} filling={filling} fromTranscript={t("form.fromTranscript")} />
            ))}
          </div>
        </div>

        {/* ===== PORODIČNA ANAMNEZA ===== */}
        <SectionBlock icon={User} title={t("form.familyHistory")} fieldKey="familyHistory" value={form.familyHistory || ""} onChange={set} filling={filling} rows={2} placeholder={t("form.familyHistoryPlaceholder")} fromTranscript={t("form.fromTranscript")} />

        {/* ===== SOCIO-EPIDEMIOLOŠKA ANAMNEZA ===== */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Home size={16} strokeWidth={1.5} className="text-muted-foreground" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{t("form.socioEpidemiological")}</h3>
          </div>
          <div className="space-y-3">
            {[
              { key: "livingConditions", labelKey: "form.livingConditions" },
              { key: "smokingAlcohol", labelKey: "form.smokingAlcohol" },
              { key: "epidemiological", labelKey: "form.epidemiological" },
            ].map((f) => (
              <FieldRow key={f.key} field={f} value={form[f.key] || ""} onChange={set} filling={filling} fromTranscript={t("form.fromTranscript")} />
            ))}
          </div>
        </div>

        {/* ===== STATUS PRAESENS ===== */}
        <div className="text-center py-2">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground">{t("form.statusPraesens")}</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">{t("form.statusSubtitle")}</p>
        </div>

        <div className="glass-card overflow-hidden">
          <button onClick={() => setObjectiveOpen((o) => !o)} className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/30 transition-colors duration-200 active:scale-[0.995]">
            <Thermometer size={17} strokeWidth={1.5} className="text-muted-foreground shrink-0" />
            <span className="flex-1 text-sm font-semibold text-foreground tracking-wide">{t("form.objectiveFindings")}</span>
            <ChevronDown size={15} strokeWidth={1.8} className={cn("text-muted-foreground transition-transform duration-300", objectiveOpen && "rotate-180")} />
          </button>
          <AnimatePresence mode="wait" initial={false}>
            {objectiveOpen && (
              <motion.div key="obj-content" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
                <div className="px-5 pb-4 space-y-3 border-t border-border/50 pt-3">
                  {OBJECTIVE_FIELDS.map((field) => (
                    <FieldRow key={field.key} field={field} value={form[field.key] || ""} onChange={set} filling={filling} fromTranscript={t("form.fromTranscript")} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ===== THERAPY & FOLLOW-UP ===== */}
        <TherapyPanel
          medications={medications}
          onMedicationsChange={setMedications}
          appointments={plannedAppointments}
          onAppointmentsChange={setPlannedAppointments}
          allergies={form.allergies || ""}
          chronicDiseases={form.chronicDiseases || ""}
        />

        {/* ===== FOOTER ===== */}
        <div className="glass-card p-5">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("form.institutionStamp")}</p>
              <div className="w-24 h-24 border border-dashed border-border/60 rounded-lg flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground/40 italic">Stamp</span>
              </div>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("form.doctorSignature")}</p>
              <div className="w-48 border-b border-border/60 pb-1">
                <span className="text-[10px] text-muted-foreground/40 italic">Dr. ___________________________</span>
              </div>
              <p className="text-[10px] text-muted-foreground/50">{t("form.facsimile")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* submit */}
      <div className="pt-4 mt-2 border-t border-border/40 flex gap-3">
        <button onClick={async () => { try { await generateAnamnezaPdf(form, lang, institutionInfo); } catch(e) { console.error("PDF generation error:", e); } }} disabled={!hasAnyData} className="flex-1 flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-all duration-200">
          <Download size={15} strokeWidth={1.8} />
          {t("form.downloadPdf")}
        </button>
        <button onClick={handleSendToPatient} disabled={!hasAnyData || sending} className="flex-1 flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold bg-accent text-accent-foreground shadow-md shadow-accent/15 hover:shadow-lg hover:shadow-accent/25 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-all duration-200">
          {sending ? <Loader2 size={15} strokeWidth={1.8} className="animate-spin" /> : <Send size={15} strokeWidth={1.8} />}
          {sending ? t("form.sending") : t("form.sendToPatient")}
        </button>
      </div>
    </div>
  );
};

/* ---- small helpers ---- */
function FieldRow({ field, value, onChange, filling, fromTranscript }: { field: { key: string; labelKey: string }; value: string; onChange: (k: string, v: string) => void; filling: boolean; fromTranscript: string }) {
  const { t } = useTranslation();
  const isFaded = value === "Nije pomenuto u transkriptu" || value === "Not mentioned in transcript" || value === "Non mentionné dans la transcription" || value === "Negativno / Negira" || value === "Negative / Denied" || value === "Nije pregledano" || value === "Not examined / Not mentioned";
  return (
    <motion.div initial={false} animate={value ? { scale: [1, 1.004, 1] } : {}} transition={{ duration: 0.3, ease: "easeOut" }}>
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t(field.labelKey)}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(field.key, e.target.value)}
        rows={2}
        placeholder={fromTranscript}
        className={cn(
          "w-full bg-muted/30 rounded-xl px-3.5 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all duration-200",
          isFaded && "text-muted-foreground/60 italic"
        )}
        style={{ overflowWrap: "break-word" }}
      />
      {filling && !value && <Shimmer />}
    </motion.div>
  );
}

function SectionBlock({ icon: Icon, title, fieldKey, value, onChange, filling, rows = 2, placeholder, fromTranscript }: {
  icon: React.ElementType; title: string; fieldKey: string; value: string; onChange: (k: string, v: string) => void; filling: boolean; rows?: number; placeholder?: string; fromTranscript: string;
}) {
  const isFaded = value?.startsWith("Nije pomenuto") || value?.startsWith("Not mentioned") || value?.startsWith("Non mentionné");
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
        placeholder={placeholder || fromTranscript}
        className={cn(
          "w-full bg-muted/30 rounded-xl px-3.5 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all duration-200",
          isFaded && "text-muted-foreground/60 italic"
        )}
        style={{ overflowWrap: "break-word" }}
      />
      {filling && !value && <Shimmer />}
    </div>
  );
}

function Shimmer() {
  return (
    <div className="h-0.5 mt-1 rounded-full bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20" style={{ backgroundSize: "200% 100%", animation: "shimmer 1.2s linear infinite" }} />
  );
}

export default SmartFormPanel;
