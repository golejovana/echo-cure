import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User, Settings, Globe, Bell, LogOut,
  Stethoscope, Building2, Hash, Camera, HeartPulse, Mail, Pencil, Phone, Calendar, IdCard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { useTranslation } from "@/i18n/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import InstitutionBranding from "@/components/InstitutionBranding";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ProfileData {
  full_name: string;
  specialization: string;
  doctor_id_number: string;
  jmbg: string;
  birth_date: string;
  phone: string;
}

const EMPTY: ProfileData = {
  full_name: "",
  specialization: "",
  doctor_id_number: "",
  jmbg: "",
  birth_date: "",
  phone: "",
};

export default function ProfilePage() {
  const { t } = useTranslation();
  const [role, setRole] = useState<AppRole>("doctor");
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [data, setData] = useState<ProfileData>(EMPTY);
  const [draft, setDraft] = useState<ProfileData>(EMPTY);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name, specialization, doctor_id_number, jmbg, birth_date, phone")
          .eq("user_id", user.id)
          .single();
        if (profile) {
          if (profile.role) setRole(profile.role);
          const next: ProfileData = {
            full_name: profile.full_name || "",
            specialization: (profile as any).specialization || "",
            doctor_id_number: (profile as any).doctor_id_number || "",
            jmbg: (profile as any).jmbg || "",
            birth_date: (profile as any).birth_date || "",
            phone: (profile as any).phone || "",
          };
          setData(next);
          setDraft(next);
        }
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const startEdit = () => {
    setDraft({ ...data });
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft({ ...data });
    setEditing(false);
  };

  const handleSave = async () => {
    if (!draft.full_name.trim()) {
      toast.error(t("profile.saveError"));
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: draft.full_name.trim(),
          specialization: draft.specialization.trim() || null,
          doctor_id_number: draft.doctor_id_number.trim() || null,
          jmbg: draft.jmbg.trim() || null,
          birth_date: draft.birth_date || null,
          phone: draft.phone.trim() || null,
        } as any)
        .eq("user_id", user.id);
      if (error) {
        toast.error(t("profile.saveError"));
      } else {
        setData({ ...draft });
        toast.success(t("profile.saveSuccess"));
        setEditing(false);
      }
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const isDoctor = role === "doctor";
  const displayName = data.full_name || (isDoctor ? t("profile.doctorDefault") : t("profile.patientRole"));

  // Field config per role
  const doctorFields: Array<{ key: keyof ProfileData; label: string; icon: any; placeholder?: string; type?: string }> = [
    { key: "full_name", label: t("profile.name"), icon: User, placeholder: "Dr. Marko Marković" },
    { key: "specialization", label: t("profile.specialization"), icon: Stethoscope, placeholder: t("profile.internalMedicine") },
    { key: "doctor_id_number", label: t("profile.doctorId"), icon: Hash, placeholder: "RS-2026-04521" },
  ];

  const patientFields: Array<{ key: keyof ProfileData; label: string; icon: any; placeholder?: string; type?: string }> = [
    { key: "full_name", label: t("profile.name"), icon: User, placeholder: "Ime i prezime" },
    { key: "jmbg", label: t("profile.jmbg"), icon: IdCard, placeholder: "1234567890123" },
    { key: "birth_date", label: t("profile.birthDate"), icon: Calendar, type: "date" },
    { key: "phone", label: t("profile.phone"), icon: Phone, placeholder: "+381 6x xxx xxxx" },
  ];

  const fields = isDoctor ? doctorFields : patientFields;
  const sectionTitle = isDoctor ? t("profile.professionalData") : t("profile.personalData");
  const sectionIconColor = isDoctor ? "text-primary" : "text-accent";

  const formatDate = (iso: string) => {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}.`;
  };

  return (
    <DashboardLayout role={role}>
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        className="max-w-3xl mx-auto space-y-6"
      >
        {/* Profile Header */}
        <div className="led-card p-6">
          <div className="flex items-start gap-5">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center shrink-0 shadow-inner">
                {isDoctor ? <Stethoscope size={32} strokeWidth={1.2} className="text-primary" /> : <HeartPulse size={32} strokeWidth={1.2} className="text-accent" />}
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-card border border-border/50 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow opacity-0 group-hover:opacity-100 duration-200">
                <Camera size={12} strokeWidth={1.8} className="text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-foreground truncate">
                {displayName}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isDoctor ? t("profile.specialist") : t("profile.patientRole")}
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <Mail size={12} />
                <span>{email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Personal / Professional Info */}
        <div className="led-card p-6 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <User size={16} strokeWidth={1.5} className={sectionIconColor} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{sectionTitle}</h3>
            </div>
            {!editing && (
              <button onClick={startEdit} className="text-xs text-primary/70 hover:text-primary flex items-center gap-1 transition-colors">
                <Pencil size={11} />
                {t("profile.edit")}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((f) => {
              const value = draft[f.key] || "";
              const displayValue = f.type === "date" ? formatDate(data[f.key]) : (data[f.key] || "—");
              return (
                <div key={f.key} className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <f.icon size={11} />
                    {f.label}
                  </label>
                  {editing ? (
                    <input
                      type={f.type || "text"}
                      value={value}
                      placeholder={f.placeholder}
                      onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                      className="bg-muted/30 rounded-xl px-3.5 py-2.5 text-sm text-foreground w-full border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/40"
                    />
                  ) : (
                    <div className="bg-muted/30 rounded-xl px-3.5 py-2.5 text-sm text-foreground">{displayValue}</div>
                  )}
                </div>
              );
            })}

            {/* Institution shown read-only for doctor here (full edit in branding section) */}
            {isDoctor && (
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Building2 size={11} />
                  {t("profile.institution")}
                </label>
                <div className="bg-muted/30 rounded-xl px-3.5 py-2.5 text-sm text-muted-foreground/70 italic">
                  ↓ {t("profile.institutionBranding")}
                </div>
              </div>
            )}
          </div>

          {editing && (
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={cancelEdit} className="px-4 py-2 text-xs font-medium rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground transition-colors">
                {t("profile.cancel")}
              </button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-xs font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                {saving ? t("profile.saving") : t("profile.save")}
              </button>
            </div>
          )}
        </div>

        {/* Institution Branding (Doctor only) */}
        {isDoctor && <InstitutionBranding />}

        {/* Settings */}
        <div className="led-card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Settings size={16} strokeWidth={1.5} className="text-muted-foreground" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{t("profile.settings")}</h3>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between py-3 border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Globe size={16} strokeWidth={1.5} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{t("profile.language")}</p>
                <p className="text-[10px] text-muted-foreground">{t("profile.languageDesc")}</p>
              </div>
            </div>
            <LanguageSelector variant="compact" />
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                <Bell size={16} strokeWidth={1.5} className="text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{t("profile.notifications")}</p>
                <p className="text-[10px] text-muted-foreground">{t("profile.notificationsDesc")}</p>
              </div>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${notifications ? "bg-accent" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-card shadow-sm transition-transform duration-200 ${notifications ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl text-sm font-semibold text-destructive bg-destructive/5 border border-destructive/15 hover:bg-destructive/10 active:scale-[0.98] transition-all duration-200"
        >
          <LogOut size={16} strokeWidth={1.8} />
          {t("profile.logout")}
        </button>
      </motion.div>
    </DashboardLayout>
  );
}
